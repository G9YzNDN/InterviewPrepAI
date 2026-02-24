import { invokeLLM } from "./_core/llm";
import { ParsedResume, JobRole, QuestionAnalysis } from "../shared/types";

/**
 * Parse resume PDF using Gemini 1.5 Pro multimodal capabilities
 */
export async function parseResume(resumeUrl: string): Promise<ParsedResume> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert resume parser. Extract structured information from resumes in both Thai and English. Handle complex layouts and formats."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Parse this resume and extract: name, email, phone, skills (array), experience (array with title, company, duration, description), education (array with degree, institution, year), projects (array with name, description, technologies), and a brief summary. Return valid JSON only."
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
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            skills: {
              type: "array",
              items: { type: "string" }
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  duration: { type: "string" },
                  description: { type: "string" }
                },
                required: ["title", "company", "duration", "description"],
                additionalProperties: false
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  institution: { type: "string" },
                  year: { type: "string" }
                },
                required: ["degree", "institution", "year"],
                additionalProperties: false
              }
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  technologies: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name", "description", "technologies"],
                additionalProperties: false
              }
            },
            summary: { type: "string" }
          },
          required: ["skills", "experience", "education"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to parse resume: no response from AI");
  }

  return JSON.parse(content) as ParsedResume;
}

/**
 * Generate personalized interview question based on resume and job description
 */
export async function generateInterviewQuestion(
  parsedResume: ParsedResume,
  jobDescription: string,
  jobRole: JobRole,
  questionNumber: number,
  previousQuestions: string[]
): Promise<{ question: string; context: string }> {
  const rolePrompts = {
    programmer: "Focus on technical problem-solving, coding experience, learning ability, and handling technical challenges. Ask about specific projects, technologies, and debugging scenarios.",
    sales: "Focus on persuasion skills, client relationships, closing deals, handling objections, and achieving targets. Ask about sales experiences and customer interactions.",
    data_analyst: "Focus on analytical thinking, data interpretation, business impact, attention to detail, and statistical methods. Ask about data projects and insights derived."
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an experienced interviewer for ${jobRole} positions. ${rolePrompts[jobRole]} Generate personalized questions based on the candidate's resume and the job requirements. Questions should be specific, relevant, and progressively challenging.`
      },
      {
        role: "user",
        content: `Generate interview question #${questionNumber} for this candidate.

Resume Summary:
- Skills: ${parsedResume.skills.join(", ")}
- Experience: ${parsedResume.experience.map(e => `${e.title} at ${e.company}`).join("; ")}
- Education: ${parsedResume.education.map(e => `${e.degree} from ${e.institution}`).join("; ")}
${parsedResume.projects ? `- Projects: ${parsedResume.projects.map(p => p.name).join(", ")}` : ""}

Job Description:
${jobDescription}

Previous Questions Asked:
${previousQuestions.length > 0 ? previousQuestions.join("\n") : "None"}

Generate a new question that:
1. Is personalized to their background
2. Relates to the job requirements
3. Is different from previous questions
4. Tests both technical/role-specific skills and soft skills

Return JSON with "question" and "context" (why you're asking this).`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "interview_question",
        strict: true,
        schema: {
          type: "object",
          properties: {
            question: { type: "string" },
            context: { type: "string" }
          },
          required: ["question", "context"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to generate question: no response from AI");
  }

  return JSON.parse(content);
}

/**
 * Analyze interview response using multimodal AI (content + tone/confidence)
 */
export async function analyzeResponse(
  questionText: string,
  audioUrl: string,
  transcription: string,
  jobRole: JobRole,
  parsedResume: ParsedResume,
  jobDescription: string
): Promise<QuestionAnalysis> {
  const roleSpecificCriteria = {
    programmer: "Problem-solving approach, technical depth, learning mindset, honesty about limitations",
    sales: "Persuasiveness, energy, closing ability, objection handling, results orientation",
    data_analyst: "Analytical thinking, business connection, attention to detail, methodical approach"
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert interview evaluator for ${jobRole} positions. Analyze both content quality and delivery (tone, confidence, pace) from the audio.

Scoring Criteria (1-10):
- General (30%): Communication flow, professional tone, structured answer (STAR method)
- Role-Specific (70%): ${roleSpecificCriteria[jobRole]}

Evaluate the transcribed answer and audio delivery together.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Question: ${questionText}

Transcription: ${transcription}

Candidate Background:
- Skills: ${parsedResume.skills.join(", ")}
- Experience: ${parsedResume.experience.map(e => e.title).join(", ")}

Job Requirements:
${jobDescription.substring(0, 500)}...

Analyze this response considering:
1. Content quality and relevance
2. Tone, confidence, and delivery from audio
3. Structure and clarity
4. Role-specific criteria

Provide scores (1-10), strengths, weaknesses, and actionable suggestions.`
          },
          {
            type: "file_url",
            file_url: {
              url: audioUrl,
              mime_type: "audio/mpeg"
            }
          }
        ]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "response_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            contentScore: { type: "number" },
            toneScore: { type: "number" },
            overallScore: { type: "number" },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            },
            detailedFeedback: { type: "string" }
          },
          required: ["contentScore", "toneScore", "overallScore", "strengths", "weaknesses", "suggestions", "detailedFeedback"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to analyze response: no response from AI");
  }

  return JSON.parse(content);
}

/**
 * Generate comprehensive interview feedback
 */
export async function generateFinalFeedback(
  sessionData: {
    parsedResume: ParsedResume;
    jobDescription: string;
    jobRole: JobRole;
    responses: Array<{
      questionText: string;
      transcription: string;
      score: number;
      analysis: QuestionAnalysis;
    }>;
  }
): Promise<{
  overallScore: number;
  generalScore: number;
  roleSpecificScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert career coach providing comprehensive interview feedback. Synthesize individual question analyses into overall assessment with actionable guidance.`
      },
      {
        role: "user",
        content: `Provide comprehensive feedback for this ${sessionData.jobRole} interview.

Candidate: ${sessionData.parsedResume.name || "Candidate"}
Role: ${sessionData.jobRole}

Individual Question Scores:
${sessionData.responses.map((r, i) => `Q${i + 1}: ${r.score}/10 - ${r.questionText.substring(0, 100)}...`).join("\n")}

Calculate:
- Overall score (weighted average)
- General score (30%): communication, professionalism, structure
- Role-specific score (70%): technical/domain skills

Provide:
- Top 3-5 strengths across all responses
- Top 3-5 weaknesses to improve
- 3-5 specific, actionable suggestions for improvement

Be encouraging but honest. Focus on growth opportunities.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "final_feedback",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            generalScore: { type: "number" },
            roleSpecificScore: { type: "number" },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["overallScore", "generalScore", "roleSpecificScore", "strengths", "weaknesses", "suggestions"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to generate final feedback: no response from AI");
  }

  return JSON.parse(content);
}
