import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { FEEDS } from "./feeds.js";
import { fetchAllFeeds } from "./fetch.js";
import { addSummaries } from "./summarize.js";
import { renderMarkdown } from "./render.js";
import { renderHtml } from "./renderHtml.js";

const dateStr = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Shanghai",
}); // YYYY-MM-DD

async function main() {
  console.log(`[每日新闻] ${dateStr} — 抓取 ${FEEDS.length} 个来源...`);

  const articles = await fetchAllFeeds(FEEDS);
  console.log(`  → 24 小时内文章: ${articles.length} 篇`);

  if (articles.length === 0) {
    console.log("  没有找到文章，退出。");
    process.exit(0);
  }

  console.log(`  → 生成摘要（Claude Haiku，顺序处理，共 ${articles.length} 篇）...`);
  const withSummaries = await addSummaries(articles);

  const md = renderMarkdown(withSummaries, dateStr);
  const outDir = path.resolve("output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${dateStr}.md`);
  fs.writeFileSync(outFile, md, "utf-8");
  console.log(`\n✓ 日报已生成: ${outFile}`);

  const html = renderHtml(withSummaries, dateStr);
  const docsDir = path.resolve("docs");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
  console.log(`✓ 网页已生成: docs/index.html`);
}

main().catch((err) => {
  console.error("[错误]", err);
  process.exit(1);
});
