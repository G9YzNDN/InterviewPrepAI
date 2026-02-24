import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { parseResumeLean } from "./leanAiService";
import {
  analyzeResumeGaps,
  extractSkillsWithLevel,
  analyzeExperienceRelevance,
  generatePersonalizedTips,
} from "./advancedResumeAnalysis";
import * as db from "./db";

export const resumeAnalysisRouter = router({
  /**
   * วิเคราะห์ resume ทั้งหมด - รวม gaps, skills, experience, tips
   */
  analyzeResume: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        jobDescription: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Parse resume
        const parsedResume = await parseResumeLean(input.resumeUrl);

        // 2. Extract skills with levels
        const skillsWithLevel = await extractSkillsWithLevel(
          JSON.stringify(parsedResume),
          input.jobRole
        );

        // 3. Analyze experience relevance
        const experienceRelevance = await analyzeExperienceRelevance(
          (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
          input.jobDescription,
          input.jobRole
        );

        // 4. Analyze gaps
        const gaps = await analyzeResumeGaps(
          {
            skills: skillsWithLevel.map((s) => s.name),
            experience: (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
            education: (parsedResume.education || []).map((e: any) => `${e.degree} from ${e.institution}`),
          },
          input.jobDescription,
          input.jobRole
        );

        // 5. Generate personalized tips
        const tips = await generatePersonalizedTips(
          {
            skills: skillsWithLevel,
            experience: experienceRelevance,
            gaps,
          },
          input.jobRole,
          input.jobDescription
        );

        return {
          parsedResume,
          skillsWithLevel,
          experienceRelevance,
          gaps,
          tips,
          analysis: {
            totalSkills: skillsWithLevel.length,
            expertSkills: skillsWithLevel.filter((s) => s.level === "expert").length,
            intermediateSkills: skillsWithLevel.filter((s) => s.level === "intermediate").length,
            beginnerSkills: skillsWithLevel.filter((s) => s.level === "beginner").length,
            highPriorityGaps: gaps.filter((g) => g.priority === "high").length,
            averageExperienceRelevance:
              experienceRelevance.length > 0
                ? Math.round(
                    experienceRelevance.reduce((sum, exp) => sum + exp.relevanceScore, 0) /
                      experienceRelevance.length
                  )
                : 0,
            strengthTips: tips.filter((t) => t.category === "strength").length,
            improvementTips: tips.filter((t) => t.category === "gap").length,
            opportunityTips: tips.filter((t) => t.category === "opportunity").length,
          },
        };
      } catch (error) {
        console.error("[Resume Analysis] Error:", error);
        throw error;
      }
    }),

  /**
   * วิเคราะห์เฉพาะ gaps ระหว่าง resume กับ job description
   */
  analyzeGaps: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        jobDescription: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const parsedResume = await parseResumeLean(input.resumeUrl);

        const gaps = await analyzeResumeGaps(
          {
            skills: (parsedResume.skills || []).map((s: any) => typeof s === 'string' ? s : s.name),
            experience: (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
            education: (parsedResume.education || []).map((e: any) => `${e.degree} from ${e.institution}`),
          },
          input.jobDescription,
          input.jobRole
        );

        return {
          gaps,
          summary: {
            highPriority: gaps.filter((g) => g.priority === "high").length,
            mediumPriority: gaps.filter((g) => g.priority === "medium").length,
            lowPriority: gaps.filter((g) => g.priority === "low").length,
          },
        };
      } catch (error) {
        console.error("[Analyze Gaps] Error:", error);
        throw error;
      }
    }),

  /**
   * วิเคราะห์เฉพาะ skills ของผู้ใช้
   */
  analyzeSkills: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const parsedResume = await parseResumeLean(input.resumeUrl);

        const skillsWithLevel = await extractSkillsWithLevel(
          JSON.stringify(parsedResume),
          input.jobRole
        );

        return {
          skills: skillsWithLevel,
          summary: {
            total: skillsWithLevel.length,
            expert: skillsWithLevel.filter((s) => s.level === "expert").length,
            intermediate: skillsWithLevel.filter((s) => s.level === "intermediate").length,
            beginner: skillsWithLevel.filter((s) => s.level === "beginner").length,
            topSkills: skillsWithLevel.slice(0, 5),
          },
        };
      } catch (error) {
        console.error("[Analyze Skills] Error:", error);
        throw error;
      }
    }),

  /**
   * วิเคราะห์เฉพาะความเกี่ยวข้องของประสบการณ์
   */
  analyzeExperience: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        jobDescription: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const parsedResume = await parseResumeLean(input.resumeUrl);

        const experienceRelevance = await analyzeExperienceRelevance(
          (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
          input.jobDescription,
          input.jobRole
        );

        const averageRelevance =
          experienceRelevance.length > 0
            ? Math.round(
                experienceRelevance.reduce((sum, exp) => sum + exp.relevanceScore, 0) /
                  experienceRelevance.length
              )
            : 0;

        return {
          experience: experienceRelevance,
          summary: {
            total: experienceRelevance.length,
            averageRelevance,
            highRelevance: experienceRelevance.filter((e) => e.relevanceScore >= 70).length,
            mediumRelevance: experienceRelevance.filter((e) => e.relevanceScore >= 40 && e.relevanceScore < 70)
              .length,
            lowRelevance: experienceRelevance.filter((e) => e.relevanceScore < 40).length,
          },
        };
      } catch (error) {
        console.error("[Analyze Experience] Error:", error);
        throw error;
      }
    }),

  /**
   * สร้างคำแนะนำเฉพาะตัวสำหรับการปรับปรุง
   */
  generateTips: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        jobDescription: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const parsedResume = await parseResumeLean(input.resumeUrl);

        const skillsWithLevel = await extractSkillsWithLevel(
          JSON.stringify(parsedResume),
          input.jobRole
        );

        const experienceRelevance = await analyzeExperienceRelevance(
          (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
          input.jobDescription,
          input.jobRole
        );

        const gaps = await analyzeResumeGaps(
          {
            skills: skillsWithLevel.map((s) => s.name),
            experience: (parsedResume.experience || []).map((e: any) => `${e.title} at ${e.company}`),
            education: (parsedResume.education || []).map((e: any) => `${e.degree} from ${e.institution}`),
          },
          input.jobDescription,
          input.jobRole
        );

        const tips = await generatePersonalizedTips(
          {
            skills: skillsWithLevel,
            experience: experienceRelevance,
            gaps,
          },
          input.jobRole,
          input.jobDescription
        );

        return {
          tips,
          summary: {
            strengths: tips.filter((t) => t.category === "strength"),
            improvements: tips.filter((t) => t.category === "gap"),
            opportunities: tips.filter((t) => t.category === "opportunity"),
          },
        };
      } catch (error) {
        console.error("[Generate Tips] Error:", error);
        throw error;
      }
    }),
});
