import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";

// Mock database functions
vi.mock("./db", () => ({
  getInterviewSession: vi.fn(),
  updateInterviewSession: vi.fn(),
  clearSessionResponses: vi.fn(),
  clearSessionQuestions: vi.fn(),
  clearSessionFeedback: vi.fn(),
}));

describe("interview.restartInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear all responses and questions for a session", async () => {
    const mockSession = {
      id: 1,
      userId: 1,
      resumeUrl: "http://example.com/resume.pdf",
      resumeKey: "key",
      jobDescription: "Test job",
      jobRole: "programmer" as const,
      status: "completed",
      overallScore: 7,
      generalScore: 6,
      roleSpecificScore: 8,
      resumeParsedData: { name: "Test", skills: [] },
      createdAt: new Date(),
      completedAt: new Date(),
    };

    vi.mocked(db.getInterviewSession).mockResolvedValueOnce(mockSession);
    vi.mocked(db.clearSessionResponses).mockResolvedValueOnce(undefined);
    vi.mocked(db.clearSessionQuestions).mockResolvedValueOnce(undefined);
    vi.mocked(db.clearSessionFeedback).mockResolvedValueOnce(undefined);
    vi.mocked(db.updateInterviewSession).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", role: "user" as const },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.interview.restartInterview({ sessionId: 1 });

    expect(result).toEqual({ success: true });
    expect(db.clearSessionResponses).toHaveBeenCalledWith(1);
    expect(db.clearSessionQuestions).toHaveBeenCalledWith(1);
    expect(db.clearSessionFeedback).toHaveBeenCalledWith(1);
    expect(db.updateInterviewSession).toHaveBeenCalledWith(1, {
      status: "setup",
      overallScore: null,
      generalScore: null,
      roleSpecificScore: null,
      completedAt: null,
    });
  });

  it("should throw error if session not found", async () => {
    vi.mocked(db.getInterviewSession).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", role: "user" as const },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.interview.restartInterview({ sessionId: 1 })
    ).rejects.toThrow("Session not found or unauthorized");
  });

  it("should throw error if user is not authorized", async () => {
    const mockSession = {
      id: 1,
      userId: 999, // Different user
      resumeUrl: "http://example.com/resume.pdf",
      resumeKey: "key",
      jobDescription: "Test job",
      jobRole: "programmer" as const,
      status: "completed",
      overallScore: 7,
      generalScore: 6,
      roleSpecificScore: 8,
      resumeParsedData: { name: "Test", skills: [] },
      createdAt: new Date(),
      completedAt: new Date(),
    };

    vi.mocked(db.getInterviewSession).mockResolvedValueOnce(mockSession);

    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", role: "user" as const },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.interview.restartInterview({ sessionId: 1 })
    ).rejects.toThrow("Session not found or unauthorized");
  });
});
