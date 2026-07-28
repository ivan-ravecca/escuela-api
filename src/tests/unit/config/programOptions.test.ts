import { describe, expect, it } from "vitest";
import {
  PROGRAM_DRIVE_LINKS,
  PROGRAM_OPTIONS,
  PROGRAM_OPTION_VALUES,
} from "../../../config/programOptions";

describe("programOptions", () => {
  it("has at least one configured option", () => {
    expect(PROGRAM_OPTIONS.length).toBeGreaterThan(0);
  });

  it("keeps values aligned with options", () => {
    expect(PROGRAM_OPTION_VALUES).toEqual(PROGRAM_OPTIONS.map((opt) => opt.value));
  });

  it("all drive links are valid https urls", () => {
    const values = Object.values(PROGRAM_DRIVE_LINKS);
    expect(values.length).toBe(PROGRAM_OPTIONS.length);

    for (const url of values) {
      expect(url.startsWith("https://")).toBe(true);
    }
  });
});
