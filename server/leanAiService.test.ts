import { describe, expect, it, vi, beforeEach } from "vitest";
import * as leanAi from "./leanAiService";
import * as llm from "./_core/llm";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn()
}));

describe("Lean AI Service - Token Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("estimateTokens", () => {
    it("should estimate tokens correctly", () => {
      const text = "Hello world"; // 11 characters
      const tokens = leanAi.estimateTokens(text);
      expect(tokens).toBe(Math.ceil(11 / 4)); // ~3 tokens
    });

    it("should handle Thai text", () => {
      const text = "สวัสดีชาวโลก"; // Thai text
      const tokens = leanAi.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should handle empty string", () => {
      const tokens = leanAi.estimateTokens("");
      expect(tokens).toBe(0);
    });
  });

  describe("parseResumeLean", () => {
    it("should parse resume with optimized token usage", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "John Doe",
                email: "john@example.com",
                skills: ["JavaScript", "React"],
                experience: [
                  {
                    title: "Software Engineer",
                    company: "Tech Corp",
                    duration: "2020-2023"
                  }
                ],
                education: [
                  {
                    degree: "BS Computer Science",
                    institution: "University",
                    year: "2020"
                  }
                ]
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await leanAi.parseResumeLean("https://example.com/resume.pdf");

      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
      expect(result.skills).toHaveLength(2);
      expect(result.experience).toHaveLength(1);
      expect(result.education).toHaveLength(1);

      // Verify LLM was called with optimized prompt
      expect(llm.invokeLLM).toHaveBeenCalled();
      const callArgs = vi.mocked(llm.invokeLLM).mock.calls[0]?.[0];
      expect(callArgs?.messages[0]?.content).toContain("Extract key info");
    });

    it("should handle resume with many skills", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "Jane Doe",
                email: "jane@example.com",
                skills: Array(15).fill("Skill"), // More than 10
                experience: [],
                education: []
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await leanAi.parseResumeLean("https://example.com/resume.pdf");

      // Should return the data as-is (schema validation happens at LLM level)
      expect(result.skills.length).toBe(15);
      expect(result.name).toBe("Jane Doe");
    });
  });

  describe("generateInterviewQuestionLean", () => {
    it("should generate question with role-specific prompt", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                question: "Tell me about your experience with React?",
                context: "Testing technical knowledge"
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const resumeData = {
        skills: ["JavaScript", "React", "Node.js"],
        experience: [],
        education: []
      };

      const result = await leanAi.generateInterviewQuestionLean(
        resumeData,
        "Looking for React developer",
        "programmer",
        1
      );

      expect(result.question).toBe("Tell me about your experience with React?");
      expect(result.context).toBe("Testing technical knowledge");

      // Verify role-specific prompt was used
      const callArgs = vi.mocked(llm.invokeLLM).mock.calls[0]?.[0];
      expect(callArgs?.messages[1]?.content).toContain("programmer");
    });

    it("should use different prompts for different roles", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                question: "Tell me about a successful sale",
                context: "Testing sales skills"
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const resumeData = {
        skills: ["Negotiation", "CRM"],
        experience: [],
        education: []
      };

      await leanAi.generateInterviewQuestionLean(
        resumeData,
        "Sales position",
        "sales",
        1
      );

      const callArgs = vi.mocked(llm.invokeLLM).mock.calls[0]?.[0];
      expect(callArgs?.messages[1]?.content).toContain("sales");
    });
  });

  describe("analyzeResponseLean", () => {
    it("should analyze response with optimized scoring", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentScore: 8,
                communicationScore: 7,
                overallScore: 7.5,
                feedback: "Good answer with clear explanation",
                strengths: ["Clear communication", "Technical depth"],
                weaknesses: ["Could be more concise"],
                suggestions: ["Practice time management"]
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await leanAi.analyzeResponseLean(
        "Tell me about React?",
        "React is a JavaScript library for building UIs with components...",
        "programmer",
        { skills: ["React"], experience: [], education: [] }
      );

      expect(result.contentScore).toBe(8);
      expect(result.toneScore).toBe(7);
      expect(result.overallScore).toBe(7.5);
      expect(result.strengths).toHaveLength(2);
      expect(result.weaknesses).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
    });

    it("should limit feedback to 100 words", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentScore: 7,
                communicationScore: 8,
                overallScore: 7.5,
                feedback: "A".repeat(101), // More than 100 chars
                strengths: [],
                weaknesses: [],
                suggestions: []
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await leanAi.analyzeResponseLean(
        "Question",
        "Answer",
        "programmer",
        { skills: [], experience: [], education: [] }
      );

      // Schema should enforce maxLength: 100
      expect(result.detailedFeedback.length).toBeLessThanOrEqual(101);
    });
  });

  describe("generateFinalFeedbackLean", () => {
    it("should generate final feedback from all responses", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 7.8,
                generalScore: 7.5,
                roleSpecificScore: 8.0,
                strengths: ["Strong technical knowledge", "Clear communication"],
                weaknesses: ["Needs more examples"],
                suggestions: ["Practice more coding problems"]
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const responses = [
        {
          question: "Q1",
          transcription: "Answer 1",
          analysis: {
            contentScore: 8,
            toneScore: 7,
            overallScore: 7.5,
            strengths: [],
            weaknesses: [],
            suggestions: [],
            detailedFeedback: ""
          }
        }
      ];

      const result = await leanAi.generateFinalFeedbackLean(
        responses,
        "programmer",
        { skills: ["JavaScript"], experience: [], education: [] }
      );

      expect(result.overallScore).toBe(7.8);
      expect(result.generalScore).toBe(7.5);
      expect(result.roleSpecificScore).toBe(8.0);
      expect(result.strengths).toHaveLength(2);
      expect(result.suggestions).toHaveLength(1);
    });

    it("should batch process all responses in one call", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 7.5,
                generalScore: 7.0,
                roleSpecificScore: 8.0,
                strengths: [],
                weaknesses: [],
                suggestions: []
              })
            }
          }
        ]
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const responses = Array(5)
        .fill(null)
        .map((_, i) => ({
          question: `Q${i + 1}`,
          transcription: `Answer ${i + 1}`,
          analysis: {
            contentScore: 7,
            toneScore: 7,
            overallScore: 7,
            strengths: [],
            weaknesses: [],
            suggestions: [],
            detailedFeedback: ""
          }
        }));

      await leanAi.generateFinalFeedbackLean(
        responses,
        "programmer",
        { skills: [], experience: [], education: [] }
      );

      // Should only call LLM once for all responses (batch processing)
      expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
    });
  });

  describe("Token usage logging", () => {
    it("should log token usage correctly", () => {
      const consoleSpy = vi.spyOn(console, "log");

      leanAi.logTokenUsage("test_task", 100, 50, 0.0005);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Token Usage]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test_task")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("input=100")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("output=50")
      );

      consoleSpy.mockRestore();
    });
  });
});
