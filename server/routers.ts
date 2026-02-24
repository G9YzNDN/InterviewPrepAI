import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";
import { parseResumeLean, generateInterviewQuestionLean, analyzeResponseLean, generateFinalFeedbackLean } from "./leanAiService";
import { transcribeAudio } from "./_core/voiceTranscription";
import { resumeAnalysisRouter } from "./resumeAnalysisRouter";

export const appRouter = router({
  system: systemRouter,
  resumeAnalysis: resumeAnalysisRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  interview: router({
    // Upload resume PDF and create initial session
    uploadResume: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        jobDescription: z.string(),
        jobRole: z.enum(["programmer", "sales", "data_analyst"])
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Upload PDF to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `resumes/${userId}/${nanoid()}-${input.fileName}`;
        const { url: resumeUrl } = await storagePut(fileKey, fileBuffer, 'application/pdf');
        
        // Parse resume using AI (Lean version)
        const parsedData = await parseResumeLean(resumeUrl);
        
        // Create interview session
        const sessionId = await db.createInterviewSession({
          userId,
          resumeUrl,
          resumeKey: fileKey,
          jobDescription: input.jobDescription,
          jobRole: input.jobRole,
          resumeParsedData: parsedData as any,
          status: "setup"
        });
        
        return {
          sessionId,
          resumeUrl,
          parsedData
        };
      }),

    // Start interview and generate first question
    startInterview: protectedProcedure
      .input(z.object({
        sessionId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        console.log("[startInterview] Starting for sessionId:", input.sessionId);
        const session = await db.getInterviewSession(input.sessionId);
        console.log("[startInterview] Session:", { hasResumeParsedData: !!session?.resumeParsedData });
        
        if (!session || session.userId !== ctx.user.id) {
          console.error("[startInterview] ERROR: Session not found");
          throw new Error("Session not found or unauthorized");
        }

        // Update session status
        await db.updateInterviewSession(input.sessionId, { status: "in_progress" });

        // Generate first question (Lean version)
        try {
          const { question, context } = await generateInterviewQuestionLean(
            session.resumeParsedData as any,
            session.jobDescription,
            session.jobRole,
            1
          );
          console.log("[startInterview] Question generated successfully");

          const questionId = await db.createInterviewQuestion({
            sessionId: input.sessionId,
            questionNumber: 1,
            questionText: question,
            questionContext: context
          });

          const response = {
            questionId,
            questionText: question,
            questionNumber: 1
          };
          console.log("[startInterview] Returning response:", response);
          return response;
        } catch (error) {
          console.error("[startInterview] ERROR:", error);
          throw error;
        }
      }),

    // Submit audio response and get next question
    submitResponse: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        sessionId: z.number(),
        audioData: z.string(), // base64 encoded
        audioFormat: z.string() // e.g., "audio/webm"
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        const question = await db.getQuestionById(input.questionId);
        if (!question) {
          throw new Error("Question not found");
        }

        // Upload audio to S3
        const audioBuffer = Buffer.from(input.audioData, 'base64');
        const audioKey = `responses/${ctx.user.id}/${nanoid()}.webm`;
        const { url: audioUrl } = await storagePut(audioKey, audioBuffer, input.audioFormat);

        // Transcribe audio
        const transcriptionResult = await transcribeAudio({
          audioUrl,
          language: undefined // Auto-detect Thai/English
        });

        if ('error' in transcriptionResult) {
          throw new Error(`Transcription failed: ${transcriptionResult.error}`);
        }

        // Create response record (analysis will be done later)
        const responseId = await db.createInterviewResponse({
          questionId: input.questionId,
          sessionId: input.sessionId,
          audioUrl,
          audioKey,
          transcription: transcriptionResult.text
        });

        // Analyze response using multimodal AI (Lean version)
        const analysis = await analyzeResponseLean(
          question.questionText,
          transcriptionResult.text,
          session.jobRole,
          session.resumeParsedData as any
        );

        // Update response with analysis
        await db.updateInterviewResponse(responseId, {
          contentScore: analysis.contentScore,
          toneScore: analysis.toneScore,
          overallScore: analysis.overallScore,
          analysis: analysis as any
        });

        // Check if we should generate next question (limit to 5 questions)
        const allQuestions = await db.getSessionQuestions(input.sessionId);
        const shouldContinue = allQuestions.length < 5;

        if (shouldContinue) {
          // Generate next question (Lean version)
          const { question: nextQuestion, context } = await generateInterviewQuestionLean(
            session.resumeParsedData as any,
            session.jobDescription,
            session.jobRole,
            allQuestions.length + 1
          );

          const nextQuestionId = await db.createInterviewQuestion({
            sessionId: input.sessionId,
            questionNumber: allQuestions.length + 1,
            questionText: nextQuestion,
            questionContext: context
          });

          return {
            completed: false,
            nextQuestion: {
              questionId: nextQuestionId,
              questionText: nextQuestion,
              questionNumber: allQuestions.length + 1
            },
            currentAnalysis: analysis
          };
        } else {
          // Interview completed, generate final feedback
          const allResponses = await db.getSessionResponses(input.sessionId);
          const responsesWithQuestions = await Promise.all(
            allResponses.map(async (r) => {
              const q = await db.getQuestionById(r.questionId);
              return {
                question: q?.questionText || "",
                transcription: r.transcription || "",
                analysis: r.analysis as any
              };
            })
          );

          const finalFeedback = await generateFinalFeedbackLean(
            responsesWithQuestions,
            session.jobRole,
            session.resumeParsedData as any
          );

          // Save feedback
          await db.createInterviewFeedback({
            sessionId: input.sessionId,
            overallScore: finalFeedback.overallScore,
            generalScore: finalFeedback.generalScore,
            roleSpecificScore: finalFeedback.roleSpecificScore,
            strengths: finalFeedback.strengths as any,
            weaknesses: finalFeedback.weaknesses as any,
            suggestions: finalFeedback.suggestions as any,
            detailedAnalysis: responsesWithQuestions as any
          });

          // Update session
          await db.updateInterviewSession(input.sessionId, {
            status: "completed",
            overallScore: finalFeedback.overallScore,
            generalScore: finalFeedback.generalScore,
            roleSpecificScore: finalFeedback.roleSpecificScore,
            completedAt: new Date()
          });

          return {
            completed: true,
            currentAnalysis: analysis,
            finalFeedback
          };
        }
      }),

    // Get interview results
    getResults: protectedProcedure
      .input(z.object({
        sessionId: z.number()
      }))
      .query(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        const feedback = await db.getSessionFeedback(input.sessionId);
        const questions = await db.getSessionQuestions(input.sessionId);
        const responses = await db.getSessionResponses(input.sessionId);

        return {
          session,
          feedback,
          questions,
          responses
        };
      }),

    // Restart interview with same resume/JD (clear previous responses)
    restartInterview: protectedProcedure
      .input(z.object({
        sessionId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        // Delete all previous responses and questions for this session
        await db.clearSessionResponses(input.sessionId);
        await db.clearSessionQuestions(input.sessionId);
        
        // Delete feedback if exists
        await db.clearSessionFeedback(input.sessionId);

        // Update session status back to setup
        await db.updateInterviewSession(input.sessionId, { 
          status: "setup",
          overallScore: null,
          generalScore: null,
          roleSpecificScore: null,
          completedAt: null
        });

        return { success: true };
      }),

    // Get user's interview history
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        const sessions = await db.getUserInterviewSessions(ctx.user.id);
        return sessions;
      })
  })
});


export type AppRouter = typeof appRouter;
