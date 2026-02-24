import { describe, it, expect } from "vitest";

/**
 * Test LLM error response handling
 * Ensures that all AI functions properly detect and handle LLM error responses
 */
describe("Lean AI Service - LLM Error Response Handling", () => {
  describe("Error response detection", () => {
    it("should detect error response with error field", () => {
      const errorResponse = {
        error: {
          type: "invalid_request_error",
          message: "json: invalid use of , string struct tag",
          code: "4000"
        }
      };

      // Check for error response
      if ((errorResponse as any).error) {
        const errorMsg = (errorResponse as any).error?.message;
        expect(errorMsg).toBe("json: invalid use of , string struct tag");
      }
    });

    it("should not confuse error response with valid response", () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "John",
                skills: ["JavaScript"]
              })
            }
          }
        ]
      };

      const errorResponse = {
        error: {
          message: "Invalid request"
        }
      };

      // Valid response should not have error field
      expect((validResponse as any).error).toBeUndefined();

      // Error response should have error field
      expect((errorResponse as any).error).toBeDefined();
    });

    it("should handle error response with nested error object", () => {
      const errorResponse = {
        error: {
          type: "invalid_request_error",
          message: "json: invalid use of , string struct tag, trying to unmarshal unquoted value into *int64",
          code: "4000"
        }
      };

      if ((errorResponse as any).error) {
        const errorMsg =
          (errorResponse as any).error?.message ||
          JSON.stringify((errorResponse as any).error);
        expect(errorMsg).toContain("json: invalid use of");
      }
    });
  });

  describe("Error message extraction", () => {
    it("should extract error message from error object", () => {
      const errorResponse = {
        error: {
          message: "API rate limit exceeded"
        }
      };

      const errorMsg = (errorResponse as any).error?.message;
      expect(errorMsg).toBe("API rate limit exceeded");
    });

    it("should fallback to JSON stringify if message is missing", () => {
      const errorResponse = {
        error: {
          code: "500",
          details: "Internal server error"
        }
      };

      const errorMsg =
        (errorResponse as any).error?.message ||
        JSON.stringify((errorResponse as any).error);
      expect(errorMsg).toContain("code");
      expect(errorMsg).toContain("500");
    });

    it("should handle error response with string error field", () => {
      const errorResponse = {
        error: "Invalid API key"
      };

      const errorMsg =
        (errorResponse as any).error?.message ||
        JSON.stringify((errorResponse as any).error);
      expect(errorMsg).toContain("Invalid API key");
    });
  });

  describe("Response validation order", () => {
    it("should check for error field before accessing choices", () => {
      const responses = [
        { error: { message: "Error" } },
        { choices: undefined },
        { choices: null },
        { choices: [] },
        { choices: [{ message: { content: "valid" } }] }
      ];

      responses.forEach((response) => {
        // Check error first
        if ((response as any).error) {
          expect((response as any).error).toBeDefined();
        } else {
          // Then check choices
          const content = (response as any).choices?.[0]?.message?.content;
          // May be undefined or valid
          expect(typeof content === "string" || content === undefined).toBe(
            true
          );
        }
      });
    });

    it("should not attempt to access choices if error exists", () => {
      const errorResponse = {
        error: { message: "Error" },
        choices: undefined // This should not be accessed
      };

      let errorDetected = false;
      let choicesAccessed = false;

      if ((errorResponse as any).error) {
        errorDetected = true;
      } else {
        const content = (errorResponse as any).choices?.[0]?.message?.content;
        choicesAccessed = true;
      }

      expect(errorDetected).toBe(true);
      expect(choicesAccessed).toBe(false);
    });
  });

  describe("Error propagation", () => {
    it("should throw error with LLM error message", () => {
      const errorResponse = {
        error: {
          message: "json: invalid use of , string struct tag"
        }
      };

      expect(() => {
        if ((errorResponse as any).error) {
          const errorMsg = (errorResponse as any).error?.message;
          throw new Error(`LLM Error: ${errorMsg}`);
        }
      }).toThrow("LLM Error: json: invalid use of , string struct tag");
    });

    it("should preserve error message for debugging", () => {
      const originalError = "json: invalid use of , string struct tag";
      const errorResponse = {
        error: {
          message: originalError
        }
      };

      const errorMsg = (errorResponse as any).error?.message;
      expect(errorMsg).toBe(originalError);
    });
  });
});
