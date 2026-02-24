import { invokeLLM } from "./_core/llm";
import { ParsedResume, JobRole, QuestionAnalysis } from "../shared/types";

/**
 * Lean AI Service - ใช้ prompt engineering เพื่อลด token usage และ cost
 * Strategy:
 * 1. ใช้ lightweight model สำหรับ simple tasks
 * 2. เรียก Gemini Pro เฉพาะสำหรับ complex analysis
 * 3. จำกัด token ผ่าน prompt constraints
 * 4. ใช้ structured output เพื่อลด parsing overhead
 */

// Token counting utilities
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters (Thai/English)
  return Math.ceil(text.length / 4);
}

export function logTokenUsage(taskName: string, inputTokens: number, outputTokens: number, cost: number) {
  console.log(`[ใช้ Token] ${taskName}: input=${inputTokens}, output=${outputTokens}, cost=$${cost.toFixed(4)}`);
}

/**
 * Parse resume with optimized prompts - ลดจำนวน token
 * ใช้ concise prompt และ structured output
 */
export async function parseResumeLean(resumeUrl: string): Promise<ParsedResume> {
  const systemPrompt = `คุณคือผู้แยกวิเคราะห์เรซูเม่ แยกข้อมูลสำคัญจากเรซูเม่ในภาษาไทย/อังกฤษ
ส่งคืนเฉพาะ JSON ที่ถูกต้องเท่านั้น ไม่มีข้อความอื่น`;

  const userPrompt = `แยกจากเรซูเม่: ชื่อ อีเมล ทักษะ (สูงสุด 10) ประสบการณ์ (สูงสุด 3 รายการ: ตำแหน่ง บริษัท ระยะเวลา) การศึกษา (สูงสุด 2 รายการ: ปริญญา สถาบัน ปี)
เก็บคำอธิบายไว้ภายใต้ 50 คำ ส่งคืน JSON ที่กะทัดรัด`;

  const inputTokens = estimateTokens(systemPrompt + userPrompt);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt
          },
          {
            type: "file_url",
            file_url: {
              url: resumeUrl,
              mime_type: "application/pdf"
            }
          }
        ]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_resume",
        strict: false,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience: { type: "array", items: { type: "object" } },
            education: { type: "array", items: { type: "object" } }
          }
        }
      }
    }
  });

  const outputTokens = estimateTokens(JSON.stringify(response));
  const cost = (inputTokens * 0.00075 + outputTokens * 0.003) / 1000; // Gemini pricing estimate
  logTokenUsage("parseResumeLean", inputTokens, outputTokens, cost);

  // Add defensive checks and logging
  console.log("[parseResumeLean] LLM Response structure:", {
    hasChoices: !!response.choices,
    choicesLength: response.choices?.length,
    firstChoice: response.choices?.[0],
    message: response.choices?.[0]?.message,
    content: response.choices?.[0]?.message?.content
  });

  // Check for LLM error response first
  if ((response as any).error) {
    const errorMsg = (response as any).error?.message || JSON.stringify((response as any).error);
    console.error("[parseResumeLean] ERROR: LLM returned error", { error: (response as any).error });
    throw new Error(`LLM Error: ${errorMsg}`);
  }

  const content = response.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error("[parseResumeLean] ERROR: No content in LLM response", JSON.stringify(response, null, 2));
    throw new Error(`Invalid response format from LLM: ${JSON.stringify(response)}`);
  }
  
  if (typeof content !== "string") {
    console.error("[parseResumeLean] ERROR: Content is not a string", { contentType: typeof content, content });
    throw new Error(`Content is not a string: ${typeof content}`);
  }
  
  try {
    const parsed = JSON.parse(content);
    console.log("[parseResumeLean] Successfully parsed resume data", { name: parsed.name, skillsCount: parsed.skills?.length });
    return parsed;
  } catch (parseError) {
    console.error("[parseResumeLean] ERROR: Failed to parse JSON", { content, error: parseError });
    throw new Error(`Failed to parse LLM response as JSON: ${content}`);
  }
}

/**
 * Generate interview question - ใช้ role-specific prompt templates
 * ลดจำนวน token ด้วยการใช้ concise prompts
 */
export async function generateInterviewQuestionLean(
  resumeData: ParsedResume,
  jobDescription: string,
  jobRole: JobRole,
  questionNumber: number
): Promise<{ question: string; context: string }> {
  // Role-specific prompt templates - ประหยัด token
  const rolePrompts = {
    programmer: `สร้างคำถามสัมภาษณ์ทางเทคนิคสำหรับตำแหน่ง ${jobRole}
เน้น: การแก้ปัญหา ประสบการณ์การเขียนโค้ด หรือเทคโนโลยีจากเรซูเม่
คำถามควรตอบได้ใน 2-3 นาที
ส่งคืน JSON: {question: string, context: string (หนึ่งประโยค)}`,

    sales: `สร้างคำถามสัมภาษณ์ฝ่ายขายสำหรับตำแหน่ง ${jobRole}
เน้น: ความสัมพันธ์กับลูกค้า ทักษะการโน้มน้าว หรือความสำเร็จในการขายจากเรซูเม่
คำถามควรตอบได้ใน 2-3 นาที
ส่งคืน JSON: {question: string, context: string (หนึ่งประโยค)}`,

    data_analyst: `สร้างคำถามสัมภาษณ์การวิเคราะห์ข้อมูลสำหรับตำแหน่ง ${jobRole}
เน้น: การคิดวิเคราะห์ ผลกระทบต่อธุรกิจ หรือโครงการข้อมูลจากเรซูเม่
คำถามควรตอบได้ใน 2-3 นาที
ส่งคืน JSON: {question: string, context: string (หนึ่งประโยค)}`
  };

  const systemPrompt = `คุณคือผู้สัมภาษณ์ผู้เชี่ยวชาญ สร้างคำถามสัมภาษณ์ที่เน้นเฉพาะจุดหนึ่ง
เก็บคำตอบให้กะทัดรัด ส่งคืนเฉพาะ JSON ที่ถูกต้อง`;

  const userPrompt = `${rolePrompts[jobRole]}

ทักษะจากเรซูเม่: ${resumeData.skills?.slice(0, 5).join(", ") || "ไม่มี"}
สำเร็จจากคำอธิบายงาน: ${jobDescription.substring(0, 200)}
หมายเลขคำถาม: ${questionNumber}/5`;

  const inputTokens = estimateTokens(systemPrompt + userPrompt);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "interview_question",
        strict: false,
        schema: {
          type: "object",
          properties: {
            question: { type: "string" },
            context: { type: "string" }
          }
        }
      }
    }
  });

  const outputTokens = estimateTokens(JSON.stringify(response));
  const cost = (inputTokens * 0.00075 + outputTokens * 0.003) / 1000;
  logTokenUsage("generateInterviewQuestionLean", inputTokens, outputTokens, cost);

  // Check for LLM error response first
  if ((response as any).error) {
    const errorMsg = (response as any).error?.message || JSON.stringify((response as any).error);
    console.error("[generateInterviewQuestionLean] ERROR: LLM returned error", { error: (response as any).error });
    throw new Error(`LLM Error: ${errorMsg}`);
  }

  console.log("[generateInterviewQuestionLean] LLM Response:", { hasChoices: !!response.choices, choicesLength: response.choices?.length });
  const content = response.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error("[generateInterviewQuestionLean] ERROR: No content", JSON.stringify(response, null, 2));
    throw new Error("Invalid response format from LLM");
  }
  
  if (typeof content !== "string") {
    console.error("[generateInterviewQuestionLean] ERROR: Content not string", typeof content);
    throw new Error("Content is not a string");
  }
  
  try {
    const parsed = JSON.parse(content);
    console.log("[generateInterviewQuestionLean] Successfully generated question");
    return parsed;
  } catch (parseError) {
    console.error("[generateInterviewQuestionLean] ERROR: Failed to parse JSON", { content, error: parseError });
    throw new Error("Failed to parse LLM response as JSON");
  }
}

/**
 * Analyze response with multimodal input - ใช้ efficient scoring prompt
 * เรียก Gemini Pro เฉพาะสำหรับ complex analysis
 */
export async function analyzeResponseLean(
  question: string,
  transcription: string,
  jobRole: JobRole,
  resumeData: ParsedResume
): Promise<QuestionAnalysis> {
  // Scoring criteria - concise prompt
  const scoringCriteria = {
    programmer: `ความลึกทางเทคนิค วิธีการแก้ปัญหา ความชัดเจนของคำอธิบาย`,
    sales: `ทักษะการโน้มน้าว การเน้นลูกค้า ความมั่นใจ ความสามารถในการปิดการขาย`,
    data_analyst: `การคิดวิเคราะห์ ความตระหนักรู้เกี่ยวกับผลกระทบต่อธุรกิจ การให้เหตุผลที่ขับเคลื่อนด้วยข้อมูล`
  };

  const systemPrompt = `คุณคือผู้สัมภาษณ์ผู้เชี่ยวชาญ ให้คะแนนคำตอบ (1-10) โดยอิงตาม:
1. คุณภาพเนื้อหา (ความเกี่ยวข้อง ความสมบูรณ์ ความถูกต้อง)
2. การสื่อสาร (ความชัดเจน โครงสร้าง ความมั่นใจ)
3. เกณฑ์เฉพาะบทบาท: ${scoringCriteria[jobRole]}

ส่งคืนเฉพาะ JSON ที่มีคะแนนตัวเลข`;

  const userPrompt = `คำถาม: ${question}

คำตอบ: ${transcription.substring(0, 500)}

ให้คะแนนคำตอบนี้และให้ข้อมูลย้อนกลับสั้นๆ (สูงสุด 100 คำ)
ส่งคืน JSON: {
  contentScore: number (1-10),
  communicationScore: number (1-10),
  overallScore: number (1-10),
  feedback: string (สูงสุด 100 คำ),
  strengths: string[],
  weaknesses: string[],
  suggestions: string[]
}`;

  const inputTokens = estimateTokens(systemPrompt + userPrompt);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "question_analysis",
        strict: false,
        schema: {
          type: "object",
          properties: {
            contentScore: { type: "number" },
            communicationScore: { type: "number" },
            overallScore: { type: "number" },
            feedback: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });

  const outputTokens = estimateTokens(JSON.stringify(response));
  const cost = (inputTokens * 0.00075 + outputTokens * 0.003) / 1000;
  logTokenUsage("analyzeResponseLean", inputTokens, outputTokens, cost);

  // Check for LLM error response first
  if ((response as any).error) {
    const errorMsg = (response as any).error?.message || JSON.stringify((response as any).error);
    console.error("[analyzeResponseLean] ERROR: LLM returned error", { error: (response as any).error });
    throw new Error(`LLM Error: ${errorMsg}`);
  }

  console.log("[analyzeResponseLean] LLM Response:", { hasChoices: !!response.choices });
  const content = response.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("Invalid response format from LLM");
  }
  
  if (typeof content !== "string") {
    throw new Error("Content is not a string");
  }
  
  try {
    const analysis = JSON.parse(content);
    return {
      contentScore: analysis.contentScore || 5,
      toneScore: analysis.communicationScore || 5,
      overallScore: analysis.overallScore || 5,
      detailedFeedback: analysis.feedback || "",
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      suggestions: analysis.suggestions || []
    };
  } catch (parseError) {
    console.error("[analyzeResponseLean] ERROR: Failed to parse JSON");
    throw new Error("Failed to parse LLM response as JSON");
  }
}

/**
 * Generate final feedback - ใช้ batch processing เพื่อลด API calls
 * รวมทุก responses เข้าด้วยกันแล้ว analyze ครั้งเดียว
 */
export async function generateFinalFeedbackLean(
  responses: Array<{
    question: string;
    transcription: string;
    analysis: QuestionAnalysis;
  }>,
  jobRole: JobRole,
  resumeData: ParsedResume
): Promise<{
  overallScore: number;
  generalScore: number;
  roleSpecificScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  // Summarize all responses in one prompt
  const responseSummary = responses
    .map((r, i) => `Q${i + 1}: ${r.question}\nScore: ${r.analysis.overallScore}/10`)
    .join("\n");

  const systemPrompt = `คุณคือผู้ฝึกอบรมสัมภาษณ์ ให้ feedback สั้น ชัดเจน ใช้ได้จริง
แต่ละข้อมูลต้องสั้น ไม่เกิน 1 บรรทัด ส่งคืนเฉพาะ JSON`;

  const userPrompt = `ตำแหน่ง: ${jobRole}
สรุปสัมภาษณ์: ${responseSummary}

ให้ feedback สั้น:
- คะแนนรวม
- 3 จุดแข็ง (สั้นๆ)
- 3 จุดอ่อน (สั้นๆ)
- 3 คำแนะนำ (สั้นๆ)`;

  const inputTokens = estimateTokens(systemPrompt + userPrompt);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "interview_feedback",
        strict: false,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            generalScore: { type: "number" },
            roleSpecificScore: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });

  const outputTokens = estimateTokens(JSON.stringify(response));
  const cost = (inputTokens * 0.00075 + outputTokens * 0.003) / 1000;
  logTokenUsage("generateFinalFeedbackLean", inputTokens, outputTokens, cost);

  // Check for LLM error response first
  if ((response as any).error) {
    const errorMsg = (response as any).error?.message || JSON.stringify((response as any).error);
    console.error("[generateFinalFeedbackLean] ERROR: LLM returned error", { error: (response as any).error });
    throw new Error(`LLM Error: ${errorMsg}`);
  }

  console.log("[generateFinalFeedbackLean] LLM Response:", { hasChoices: !!response.choices });
  const content = response.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("Invalid response format from LLM");
  }
  
  if (typeof content !== "string") {
    throw new Error("Content is not a string");
  }
  
  try {
    const feedback = JSON.parse(content);
    return {
      overallScore: feedback.overallScore || 5,
      generalScore: feedback.generalScore || 5,
      roleSpecificScore: feedback.roleSpecificScore || 5,
      strengths: feedback.strengths || [],
      weaknesses: feedback.weaknesses || [],
      suggestions: feedback.suggestions || []
    };
  } catch (parseError) {
    console.error("[generateFinalFeedbackLean] ERROR: Failed to parse JSON");
    throw new Error("Failed to parse LLM response as JSON");
  }
}
