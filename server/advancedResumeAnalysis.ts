import { invokeLLM } from "./_core/llm";

export interface SkillWithLevel {
  name: string;
  level: "beginner" | "intermediate" | "expert";
  yearsOfExperience: number;
  relevanceToRole: number; // 0-100
}

export interface ExperienceRelevance {
  position: string;
  company: string;
  relevanceScore: number; // 0-100
  relevantTasks: string[];
  gaps: string[];
}

export interface ResumeGap {
  requiredSkill: string;
  currentLevel: string;
  requiredLevel: string;
  priority: "high" | "medium" | "low";
  suggestedLearningPath: string;
}

export interface PersonalizedTip {
  category: "strength" | "gap" | "opportunity";
  tip: string;
  actionItem: string;
  estimatedTimeToComplete: string;
}

/**
 * วิเคราะห์ resume และ job description เพื่อหาจุดต่าง
 */
export async function analyzeResumeGaps(
  resumeData: {
    skills: string[];
    experience: string[];
    education: string[];
  },
  jobDescription: string,
  jobRole: string
): Promise<ResumeGap[]> {
  const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ resume และ job description
  
วิเคราะห์ความต่างระหว่าง resume ของผู้สมัครกับ job description
สำหรับตำแหน่ง ${jobRole}

ส่งคืน JSON array ของ gaps ที่ต้องปรับปรุง
แต่ละ gap ต้องมี:
- requiredSkill: ทักษะที่ต้องการ
- currentLevel: ระดับปัจจุบัน (ถ้ามี) หรือ "ไม่มี"
- requiredLevel: ระดับที่ต้องการ
- priority: high/medium/low
- suggestedLearningPath: แนวทางการเรียนรู้

เรียงลำดับตาม priority`;

  const userPrompt = `Resume Skills: ${resumeData.skills.join(", ")}
Resume Experience: ${resumeData.experience.join(", ")}

Job Description: ${jobDescription}

วิเคราะห์ gaps และส่งคืน JSON array เท่านั้น`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt as any },
      { role: "user", content: userPrompt as any },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_gaps",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requiredSkill: { type: "string" },
              currentLevel: { type: "string" },
              requiredLevel: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              suggestedLearningPath: { type: "string" },
            },
            required: [
              "requiredSkill",
              "currentLevel",
              "requiredLevel",
              "priority",
              "suggestedLearningPath",
            ],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) return [];

  try {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

/**
 * แยก skills จาก resume พร้อมระดับความสามารถ
 */
export async function extractSkillsWithLevel(
  resumeText: string,
  jobRole: string
): Promise<SkillWithLevel[]> {
  const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการแยก skills จาก resume
  
แยก skills ทั้งหมดจาก resume และประเมินระดับความสามารถ
สำหรับตำแหน่ง ${jobRole}

ส่งคืน JSON array ของ skills
แต่ละ skill ต้องมี:
- name: ชื่อ skill
- level: beginner/intermediate/expert
- yearsOfExperience: ปีของประสบการณ์
- relevanceToRole: ความเกี่ยวข้องกับตำแหน่ง (0-100)

เรียงลำดับตาม relevanceToRole จากมากไปน้อย`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt as any },
      { role: "user", content: resumeText as any },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "skills_with_level",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              level: { type: "string", enum: ["beginner", "intermediate", "expert"] },
              yearsOfExperience: { type: "number" },
              relevanceToRole: { type: "number", minimum: 0, maximum: 100 },
            },
            required: ["name", "level", "yearsOfExperience", "relevanceToRole"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) return [];

  try {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

/**
 * วิเคราะห์ความเกี่ยวข้องของประสบการณ์กับ job description
 */
export async function analyzeExperienceRelevance(
  resumeExperience: string[],
  jobDescription: string,
  jobRole: string
): Promise<ExperienceRelevance[]> {
  const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ประสบการณ์งาน

วิเคราะห์ความเกี่ยวข้องของประสบการณ์กับ job description
สำหรับตำแหน่ง ${jobRole}

ส่งคืน JSON array ของประสบการณ์ที่วิเคราะห์แล้ว
แต่ละรายการต้องมี:
- position: ตำแหน่ง
- company: บริษัท
- relevanceScore: คะแนนความเกี่ยวข้อง (0-100)
- relevantTasks: งานที่เกี่ยวข้องกับตำแหน่งใหม่
- gaps: ความต่างระหว่างประสบการณ์กับตำแหน่งใหม่

เรียงลำดับตาม relevanceScore จากมากไปน้อย`;

  const userPrompt = `Experience: ${resumeExperience.join("\n")}

Job Description: ${jobDescription}

วิเคราะห์ความเกี่ยวข้องและส่งคืน JSON array เท่านั้น`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt as any },
      { role: "user", content: userPrompt as any },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "experience_relevance",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              position: { type: "string" },
              company: { type: "string" },
              relevanceScore: { type: "number", minimum: 0, maximum: 100 },
              relevantTasks: { type: "array", items: { type: "string" } },
              gaps: { type: "array", items: { type: "string" } },
            },
            required: ["position", "company", "relevanceScore", "relevantTasks", "gaps"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) return [];

  try {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

/**
 * สร้างคำแนะนำเฉพาะตัวตามการวิเคราะห์ resume
 */
export async function generatePersonalizedTips(
  resumeData: {
    skills: SkillWithLevel[];
    experience: ExperienceRelevance[];
    gaps: ResumeGap[];
  },
  jobRole: string,
  jobDescription: string
): Promise<PersonalizedTip[]> {
  const systemPrompt = `คุณคือ career coach มืออาชีพ

สร้างคำแนะนำเฉพาะตัวสำหรับผู้สมัครตำแหน่ง ${jobRole}
โดยพิจารณาจาก:
- Skills ปัจจุบัน
- ประสบการณ์งาน
- Gaps ที่ต้องปรับปรุง

ส่งคืน JSON array ของคำแนะนำ
แต่ละรายการต้องมี:
- category: strength/gap/opportunity
- tip: คำแนะนำ
- actionItem: สิ่งที่ต้องทำ
- estimatedTimeToComplete: ระยะเวลาโดยประมาณ

ทำให้ actionable และ specific`;

  const userPrompt = `Resume Skills: ${JSON.stringify(resumeData.skills)}

Experience: ${JSON.stringify(resumeData.experience)}

Gaps: ${JSON.stringify(resumeData.gaps)}

Job Description: ${jobDescription}

สร้างคำแนะนำและส่งคืน JSON array เท่านั้น`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt as any },
      { role: "user", content: userPrompt as any },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "personalized_tips",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["strength", "gap", "opportunity"] },
              tip: { type: "string" },
              actionItem: { type: "string" },
              estimatedTimeToComplete: { type: "string" },
            },
            required: ["category", "tip", "actionItem", "estimatedTimeToComplete"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) return [];

  try {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}
