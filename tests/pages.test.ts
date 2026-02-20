import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import About from "../src/pages/about.astro";

describe("About ページ", () => {
  it("'About' という見出しが含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(About);
    expect(result).toContain("<h1");
    expect(result).toContain("About");
  });

  it("技術スタックの記述が含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(About);
    expect(result).toContain("技術スタック");
    expect(result).toContain("Astro v5");
    expect(result).toContain("Tailwind CSS v4");
    expect(result).toContain("Cloudflare Pages");
  });
});
