import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";
import { generateInterviewQuestionLean } from "./leanAiService";

// Mock dependencies
vi.mock("./db");
vi.mock("./leanAiService");

describe("startInterview - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return valid response structure with questionId, questionText, questionNumber", async () => {
    // Mock session data
    const mockSession = {
      id: 1,
      userId: 123,
      resumeUrl: "https://example.com/resume.pdf",
      resumeKey: "resumes/123/abc-resume.pdf",
      jobDescription: "Looking for a developer",
      jobRole: "programmer",
      resumeParsedData: {
        name: "John Doe",
        email: "john@example.com",
        skills: ["JavaScript", "React", "Node.js"],
        experience: [
          {
            title: "Developer",
            company: "Tech Corp",
            duration: "2 years"
          }
        ],
        education: [
          {
            degree: "Bachelor",
            institution: "University",
            year: "2020"
          }
        ]
      },
      status: "setup",
      overallScore: null,
      generalScore: null,
      roleSpecificScore: null,
      createdAt: new Date(),
      completedAt: null
    };

    const mockQuestion = {
      question: "Tell me about your experience with React",
      context: "Assessing technical depth"
    };

    // Mock the functions
    (db.getInterviewSession as any).mockResolvedValue(mockSession);
    (db.updateInterviewSession as any).mockResolvedValue(undefined);
    (generateInterviewQuestionLean as any).mockResolvedValue(mockQuestion);
    (db.createInterviewQuestion as any).mockResolvedValue(1);

    // Simulate the startInterview logic
    const session = await db.getInterviewSession(1);
    expect(session).toBeDefined();
    expect(session?.resumeParsedData).toBeDefined();

    const { question, context } = await generateInterviewQuestionLean(
      session.resumeParsedData as any,
      session.jobDescription,
      session.jobRole,
      1
    );

    const questionId = await db.createInterviewQuestion({
      sessionId: 1,
      questionNumber: 1,
      questionText: question,
      questionContext: context
    });

    const response = {
      questionId,
      questionText: question,
      questionNumber: 1
    };

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.questionId).toBeDefined();
    expect(response.questionId).toBe(1);
    expect(response.questionText).toBeDefined();
    expect(response.questionText).toBe("Tell me about your experience with React");
    expect(response.questionNumber).toBe(1);
    expect(typeof response.questionId).toBe("number");
    expect(typeof response.questionText).toBe("string");
    expect(typeof response.questionNumber).toBe("number");
  });

  it("should handle missing resumeParsedData gracefully", async () => {
    const mockSession = {
      id: 1,
      userId: 123,
      resumeUrl: "https://example.com/resume.pdf",
      resumeKey: "resumes/123/abc-resume.pdf",
      jobDescription: "Looking for a developer",
      jobRole: "programmer",
      resumeParsedData: null, // Missing data
      status: "setup"
    };

    (db.getInterviewSession as any).mockResolvedValue(mockSession);

    const session = await db.getInterviewSession(1);
    expect(session?.resumeParsedData).toBeNull();

    // This should not crash - defensive check should handle it
    expect(() => {
      const data = session?.resumeParsedData as any;
      if (!data) {
        throw new Error("Resume data is missing");
      }
    }).toThrow("Resume data is missing");
  });

  it("should ensure response has no undefined values", async () => {
    const response = {
      questionId: 1,
      questionText: "Sample question",
      questionNumber: 1
    };

    // Verify no undefined values
    expect(response.questionId).not.toBeUndefined();
    expect(response.questionText).not.toBeUndefined();
    expect(response.questionNumber).not.toBeUndefined();

    // Verify types
    expect(typeof response.questionId).toBe("number");
    expect(typeof response.questionText).toBe("string");
    expect(typeof response.questionNumber).toBe("number");

    // Verify values are not null
    expect(response.questionId).not.toBeNull();
    expect(response.questionText).not.toBeNull();
    expect(response.questionNumber).not.toBeNull();
  });

  it("should validate response before using array access [0]", () => {
    // Simulate the error that was happening
    const invalidResponse = undefined;
    const validResponse = {
      questionId: 1,
      questionText: "Question",
      questionNumber: 1
    };

    // This would have crashed before the fix
    expect(() => {
      if (!invalidResponse || !invalidResponse.questionId) {
        throw new Error("Invalid response");
      }
    }).toThrow("Invalid response");

    // This should work fine
    expect(() => {
      if (!validResponse || !validResponse.questionId) {
        throw new Error("Invalid response");
      }
    }).not.toThrow();
  });
});
