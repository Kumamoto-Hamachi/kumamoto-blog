import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Footer from "../src/components/Footer.astro";

describe("Footer コンポーネント", () => {
  it("著作権表示に現在の年が含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);
    const currentYear = new Date().getFullYear().toString();
    expect(result).toContain(currentYear);
    expect(result).toContain("kumamoto blog");
  });

  it("RSSリンクが含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);
    expect(result).toContain("/rss.xml");
  });
});
