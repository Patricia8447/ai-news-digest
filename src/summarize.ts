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
): Promise<{ titleZh?: string; summary?: string }> {
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
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `请完成两件事：\n1. 将标题翻译成中文（若已是中文则原样输出）\n2. 用一句话（不超过50字）概括核心内容\n\n只输出如下JSON，不输出其他内容：\n{"t":"中文标题","s":"中文摘要"}\n\n${context}`,
          },
        ],
      });
      const block = msg.content[0];
      if (block.type !== "text") return {};
      const raw = block.text.trim();
      try {
        const json = JSON.parse(raw);
        return {
          titleZh: json.t ? String(json.t) : undefined,
          summary: json.s ? String(json.s) : undefined,
        };
      } catch {
        return { summary: raw };
      }
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        (err?.status === 401 &&
          String(err?.message ?? "").toLowerCase().includes("limit"));
      if (attempt < 3) {
        const wait = isRateLimit ? (attempt + 1) * 30_000 : (attempt + 1) * 5_000;
        const tag = isRateLimit ? "限速" : "重试";
        console.error(
          `  [${tag}] "${a.title.slice(0, 30)}…" — 等待 ${wait / 1000}s (${attempt + 1}/3)...`
        );
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  return {};
}

export async function addSummaries(articles: Article[]): Promise<Article[]> {
  const client = new Anthropic();
  const results: Article[] = [];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (i > 0) await sleep(INTERVAL_MS);

    try {
      const result = await getSummary(client, a);
      results.push({ ...a, ...result });
    } catch (err) {
      console.error(`  [摘要失败] "${a.title}": ${err}`);
      // 兜底：仅用标题再试一次
      try {
        await sleep(INTERVAL_MS);
        const fallback = await getSummary(client, { ...a, description: undefined });
        results.push({ ...a, ...fallback });
      } catch {
        results.push(a);
      }
    }
  }

  return results;
}
