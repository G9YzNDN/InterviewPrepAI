import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import * as aiService from "./aiService";
import * as storage from "./storage";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("interview.uploadResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload resume, parse it, and create interview session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock storage
    vi.spyOn(storage, "storagePut").mockResolvedValue({
      url: "https://example.com/resume.pdf",
      key: "resumes/1/test-resume.pdf"
    });

    // Mock AI parsing
    const mockParsedResume = {
      name: "John Doe",
      email: "john@example.com",
      skills: ["JavaScript", "React", "Node.js"],
      experience: [
        {
          title: "Software Engineer",
          company: "Tech Corp",
          duration: "2020-2023",
          description: "Built web applications"
        }
      ],
      education: [
        {
          degree: "BS Computer Science",
          institution: "University",
          year: "2020"
        }
      ]
    };

    vi.spyOn(aiService, "parseResume").mockResolvedValue(mockParsedResume);

    // Mock database
    vi.spyOn(db, "createInterviewSession").mockResolvedValue(1);

    const result = await caller.interview.uploadResume({
      fileName: "resume.pdf",
      fileData: Buffer.from("fake pdf content").toString("base64"),
      jobDescription: "Looking for a senior software engineer with React experience",
      jobRole: "programmer"
    });

    expect(result.sessionId).toBe(1);
    expect(result.parsedData).toEqual(mockParsedResume);
    expect(storage.storagePut).toHaveBeenCalled();
    expect(aiService.parseResume).toHaveBeenCalledWith("https://example.com/resume.pdf");
    expect(db.createInterviewSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        jobRole: "programmer",
        resumeParsedData: mockParsedResume
      })
    );
  });
});

describe("interview.startInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start interview and generate first question", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 1,
      resumeUrl: "https://example.com/resume.pdf",
      resumeKey: "resumes/1/test.pdf",
      jobDescription: "Software engineer position",
      jobRole: "programmer" as const,
      resumeParsedData: {
        skills: ["JavaScript"],
        experience: [],
        education: []
      },
      status: "setup" as const,
      overallScore: null,
      generalScore: null,
      roleSpecificScore: null,
      createdAt: new Date(),
      completedAt: null
    };

    vi.spyOn(db, "getInterviewSession").mockResolvedValue(mockSession);
    vi.spyOn(db, "updateInterviewSession").mockResolvedValue(undefined);
    vi.spyOn(db, "createInterviewQuestion").mockResolvedValue(1);

    const mockQuestion = {
      question: "Tell me about your experience with JavaScript?",
      context: "Testing technical knowledge based on resume skills"
    };

    vi.spyOn(aiService, "generateInterviewQuestion").mockResolvedValue(mockQuestion);

    const result = await caller.interview.startInterview({ sessionId: 1 });

    expect(result.questionId).toBe(1);
    expect(result.questionText).toBe(mockQuestion.question);
    expect(result.questionNumber).toBe(1);
    expect(db.updateInterviewSession).toHaveBeenCalledWith(1, { status: "in_progress" });
    expect(aiService.generateInterviewQuestion).toHaveBeenCalled();
  });

  it("should throw error if session not found", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    vi.spyOn(db, "getInterviewSession").mockResolvedValue(undefined);

    await expect(
      caller.interview.startInterview({ sessionId: 999 })
    ).rejects.toThrow("Session not found or unauthorized");
  });

  it("should throw error if session belongs to different user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 999, // Different user
      resumeUrl: "https://example.com/resume.pdf",
      resumeKey: "resumes/999/test.pdf",
      jobDescription: "Test job",
      jobRole: "programmer" as const,
      resumeParsedData: {},
      status: "setup" as const,
      overallScore: null,
      generalScore: null,
      roleSpecificScore: null,
      createdAt: new Date(),
      completedAt: null
    };

    vi.spyOn(db, "getInterviewSession").mockResolvedValue(mockSession);

    await expect(
      caller.interview.startInterview({ sessionId: 1 })
    ).rejects.toThrow("Session not found or unauthorized");
  });
});

describe("interview.getHistory", () => {
  it("should return user's interview sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockSessions = [
      {
        id: 1,
        userId: 1,
        resumeUrl: "https://example.com/resume1.pdf",
        resumeKey: "resumes/1/test1.pdf",
        jobDescription: "Job 1",
        jobRole: "programmer" as const,
        resumeParsedData: {},
        status: "completed" as const,
        overallScore: 8.5,
        generalScore: 8.0,
        roleSpecificScore: 8.7,
        createdAt: new Date(),
        completedAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        resumeUrl: "https://example.com/resume2.pdf",
        resumeKey: "resumes/1/test2.pdf",
        jobDescription: "Job 2",
        jobRole: "sales" as const,
        resumeParsedData: {},
        status: "in_progress" as const,
        overallScore: null,
        generalScore: null,
        roleSpecificScore: null,
        createdAt: new Date(),
        completedAt: null
      }
    ];

    vi.spyOn(db, "getUserInterviewSessions").mockResolvedValue(mockSessions);

    const result = await caller.interview.getHistory();

    expect(result).toEqual(mockSessions);
    expect(result).toHaveLength(2);
    expect(result[0]?.status).toBe("completed");
    expect(result[1]?.status).toBe("in_progress");
  });
});
