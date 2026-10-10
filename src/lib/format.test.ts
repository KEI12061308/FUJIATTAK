import { describe, expect, it } from "vitest";
import { formatYen } from "./format";

describe("formatYen", () => {
  it("3桁区切りで円記号を付ける", () => {
    expect(formatYen(1234)).toBe("¥1,234");
    expect(formatYen(0)).toBe("¥0");
    expect(formatYen(1000000)).toBe("¥1,000,000");
  });

  it("マイナスは符号を先頭に付ける", () => {
    expect(formatYen(-500)).toBe("-¥500");
  });
});
