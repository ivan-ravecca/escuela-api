import { describe, expect, it } from "vitest";
import { chatSchema } from "../../../schemas";

describe("chatSchema", () => {
  it("accepts message of 2000 chars", () => {
    const message = "a".repeat(2000);
    const result = chatSchema.safeParse({ message, conversation_history: [] });

    expect(result.success).toBe(true);
  });

  it("rejects message over 2000 chars", () => {
    const message = "a".repeat(2001);
    const result = chatSchema.safeParse({ message, conversation_history: [] });

    expect(result.success).toBe(false);
  });

  it("rejects conversation history longer than 20", () => {
    const history = Array.from({ length: 21 }, () => ({
      role: "user",
      content: "hola",
    }));

    const result = chatSchema.safeParse({
      message: "ok",
      conversation_history: history,
    });

    expect(result.success).toBe(false);
  });
});
