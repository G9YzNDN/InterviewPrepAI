/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type JobRole = "programmer" | "sales" | "data_analyst";

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  summary?: string;
}

export interface QuestionAnalysis {
  contentScore: number;
  toneScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailedFeedback: string;
}

export interface FeedbackSummary {
  overallScore: number;
  generalScore: number;
  roleSpecificScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questionBreakdown: Array<{
    questionNumber: number;
    questionText: string;
    score: number;
    feedback: string;
  }>;
}

export interface ScoringCriteria {
  general: {
    communicationFlow: number;
    professionalTone: number;
    structuredAnswer: number;
  };
  roleSpecific: Record<string, number>;
}
