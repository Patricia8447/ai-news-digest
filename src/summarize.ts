import Anthropic from "@anthropic-ai/sdk";
import type { Article } from "./fetch.js";

const MODEL = "claude-haiku-4-5-20251001";
/** 每次 API 调用之间的最小间隔，保持在 30 RPM 以下 */
const INTERVAL_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSummary(
  client: Anthropic,
  a: Article
): Promise<string | undefined> {
  const context = [
    `标题：${a.title}`,
    a.description ? `原文摘要：${a.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: `用一句话（不超过60字）概括以下新闻的核心内容，只输出摘要本身：\n\n${context}`,
          },
        ],
      });
      const text = msg.content[0];
      return text.type === "text" ? text.text.trim() : undefined;
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        (err?.status === 401 &&
          String(err?.message ?? "").toLowerCase().includes("limit"));
      if (isRateLimit && attempt < 3) {
        const wait = (attempt + 1) * 30_000; // 30s → 60s → 90s
        console.error(
          `  [限速] "${a.title.slice(0, 30)}…" — 等待 ${wait / 1000}s 重试 (${attempt + 1}/3)...`
        );
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  return undefined;
}

export async function addSummaries(articles: Article[]): Promise<Article[]> {
  const client = new Anthropic();
  const results: Article[] = [];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    // 第一条不需要等待，之后每条间隔 INTERVAL_MS
    if (i > 0) await sleep(INTERVAL_MS);

    try {
      const summary = await getSummary(client, a);
      results.push({ ...a, summary });
    } catch (err) {
      console.error(`  [摘要失败] "${a.title}": ${err}`);
      results.push(a);
    }
  }

  return results;
}
