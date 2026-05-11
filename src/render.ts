import type { Article } from "./fetch.js";
import type { Section, Category } from "./feeds.js";

const SECTIONS: Section[] = ["国际", "中文"];
const CATEGORIES: Category[] = ["金融", "政治", "社会", "娱乐"];

export function renderMarkdown(articles: Article[], dateStr: string): string {
  // Build nested map: section → category → articles[]
  const map = new Map<Section, Map<Category, Article[]>>();
  for (const section of SECTIONS) {
    const catMap = new Map<Category, Article[]>();
    for (const cat of CATEGORIES) catMap.set(cat, []);
    map.set(section, catMap);
  }
  for (const a of articles) {
    map.get(a.section)?.get(a.category)?.push(a);
  }
  // Sort each bucket by time descending
  for (const catMap of map.values()) {
    for (const list of catMap.values()) {
      list.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    }
  }

  const lines: string[] = [
    `# 每日新闻 · ${dateStr}`,
    "",
    `> 共 ${articles.length} 篇 ｜ 生成时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    "",
  ];

  for (const section of SECTIONS) {
    const catMap = map.get(section)!;
    const sectionTotal = [...catMap.values()].reduce((s, l) => s + l.length, 0);
    if (sectionTotal === 0) continue;

    lines.push(`## ${section}`, "");

    for (const cat of CATEGORIES) {
      const list = catMap.get(cat)!;
      if (list.length === 0) continue;

      lines.push(`### ${cat}`, "");

      for (const a of list) {
        lines.push(`**[${a.title}](${a.link})**`);
        lines.push(a.summary ?? a.description ?? "（暂无摘要）");
        lines.push(`来源：${a.source}`);
        lines.push("");
      }
    }
  }

  lines.push("---", `*由 Claude AI 自动生成 · ai-news-digest*`);
  return lines.join("\n");
}
