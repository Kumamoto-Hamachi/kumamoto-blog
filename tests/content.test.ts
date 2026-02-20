import { describe, it, expect } from "vitest";
import { z } from "astro/zod";

/**
 * content.config.ts で定義するブログスキーマを再現し、
 * フロントマターのバリデーションをテストする
 */
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

describe("ブログ記事スキーマ", () => {
  it("正常なフロントマターがバリデーションを通る", () => {
    const data = {
      title: "テスト記事",
      description: "テスト記事の説明",
      pubDate: "2026-02-19",
      tags: ["astro", "test"],
    };
    const result = blogSchema.parse(data);
    expect(result.title).toBe("テスト記事");
    expect(result.description).toBe("テスト記事の説明");
    expect(result.pubDate).toBeInstanceOf(Date);
    expect(result.tags).toEqual(["astro", "test"]);
    expect(result.draft).toBe(false);
  });

  it("title が欠けた場合にエラーになる", () => {
    const data = {
      description: "説明のみ",
      pubDate: "2026-02-19",
    };
    expect(() => blogSchema.parse(data)).toThrow();
  });

  it("description が欠けた場合にエラーになる", () => {
    const data = {
      title: "タイトルのみ",
      pubDate: "2026-02-19",
    };
    expect(() => blogSchema.parse(data)).toThrow();
  });

  it("pubDate が欠けた場合にエラーになる", () => {
    const data = {
      title: "タイトル",
      description: "説明",
    };
    expect(() => blogSchema.parse(data)).toThrow();
  });

  it("tags のデフォルト値が空配列になる", () => {
    const data = {
      title: "タイトル",
      description: "説明",
      pubDate: "2026-02-19",
    };
    const result = blogSchema.parse(data);
    expect(result.tags).toEqual([]);
  });

  it("draft のデフォルト値が false になる", () => {
    const data = {
      title: "タイトル",
      description: "説明",
      pubDate: "2026-02-19",
    };
    const result = blogSchema.parse(data);
    expect(result.draft).toBe(false);
  });

  it("updatedDate はオプショナルで省略可能", () => {
    const data = {
      title: "タイトル",
      description: "説明",
      pubDate: "2026-02-19",
    };
    const result = blogSchema.parse(data);
    expect(result.updatedDate).toBeUndefined();
  });

  it("updatedDate を指定した場合 Date オブジェクトに変換される", () => {
    const data = {
      title: "タイトル",
      description: "説明",
      pubDate: "2026-02-19",
      updatedDate: "2026-02-20",
    };
    const result = blogSchema.parse(data);
    expect(result.updatedDate).toBeInstanceOf(Date);
  });

  it("pubDate の文字列が Date オブジェクトに変換される (z.coerce.date)", () => {
    const data = {
      title: "タイトル",
      description: "説明",
      pubDate: "2026-02-19",
    };
    const result = blogSchema.parse(data);
    expect(result.pubDate).toBeInstanceOf(Date);
    expect(result.pubDate.getFullYear()).toBe(2026);
  });
});
