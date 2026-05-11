import type { Article } from "./fetch.js";
import type { Section, Category } from "./feeds.js";

const SECTIONS: Section[] = ["国际", "中文"];
const CATEGORIES: Category[] = ["金融", "政治", "社会", "娱乐"];
const SECTION_ID: Record<Section, string> = { 国际: "intl", 中文: "cn" };
const SECTION_ICON: Record<Section, string> = { 国际: "🌍", 中文: "🇨🇳" };
const CAT_ICON: Record<Category, string> = {
  金融: "📈",
  政治: "🏛️",
  社会: "🌐",
  娱乐: "🎬",
};
const MAX_PER_CAT = 10;

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1 小时前";
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function articleHtml(a: Article): string {
  const summary = a.summary ?? a.description ?? "（暂无摘要）";
  return `
      <article class="article">
        <h3><a href="${escapeHtml(a.link)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a></h3>
        <p class="summary">${escapeHtml(summary)}</p>
        <div class="meta-row">
          <span class="source">${escapeHtml(a.source)}</span>
          <span class="time">${relativeTime(a.publishedAt)}</span>
        </div>
      </article>`;
}

function categoryHtml(cat: Category, articles: Article[]): string {
  const limited = articles.slice(0, MAX_PER_CAT);
  if (limited.length === 0) return "";
  return `
    <div class="category">
      <h2 class="cat-title">${CAT_ICON[cat]} ${cat} <span class="count">${limited.length} 篇</span></h2>
      <div class="articles">${limited.map(articleHtml).join("")}
      </div>
    </div>`;
}

export function renderHtml(articles: Article[], dateStr: string): string {
  // Build map: section → category → Article[]
  const map = new Map<Section, Map<Category, Article[]>>();
  for (const section of SECTIONS) {
    const catMap = new Map<Category, Article[]>();
    for (const cat of CATEGORIES) catMap.set(cat, []);
    map.set(section, catMap);
  }
  for (const a of articles) {
    map.get(a.section)?.get(a.category)?.push(a);
  }
  for (const catMap of map.values()) {
    for (const list of catMap.values()) {
      list.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    }
  }

  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const sectionsHtml = SECTIONS.map((section, i) => {
    const catMap = map.get(section)!;
    const catsHtml = CATEGORIES.map((cat) =>
      categoryHtml(cat, catMap.get(cat)!)
    ).join("");
    return `
  <section id="${SECTION_ID[section]}"${i > 0 ? " hidden" : ""}>${catsHtml}
  </section>`;
  }).join("");

  const tabsHtml = SECTIONS.map((section, i) => {
    const id = SECTION_ID[section];
    return `<button class="tab${i === 0 ? " active" : ""}" data-target="${id}">${SECTION_ICON[section]} ${section}</button>`;
  }).join("\n    ");

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>每日新闻 · ${dateStr}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      font-size: 15px;
      line-height: 1.6;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 16px 48px;
    }

    /* ── Header ── */
    header {
      padding: 32px 0 20px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 20px;
    }
    .header-top {
      display: flex;
      align-items: baseline;
      gap: 16px;
      flex-wrap: wrap;
    }
    header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .date-badge {
      background: #1a73e8;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
    }
    .header-meta {
      margin-top: 6px;
      font-size: 0.83rem;
      color: #666;
    }

    /* ── Tabs ── */
    nav.tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
    }
    .tab {
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1rem;
      font-family: inherit;
      padding: 8px 20px;
      border-radius: 6px;
      color: #555;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .tab:hover { background: #e8eaed; color: #111; }
    .tab.active {
      background: #fff;
      color: #1a73e8;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }

    /* ── Category ── */
    .category {
      background: #fff;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .cat-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .count {
      font-size: 0.78rem;
      font-weight: 400;
      color: #888;
      background: #f0f2f5;
      padding: 1px 8px;
      border-radius: 10px;
    }

    /* ── Article ── */
    .article {
      padding: 14px 0;
      border-bottom: 1px solid #f0f2f5;
    }
    .article:last-child { border-bottom: none; padding-bottom: 0; }
    .article:first-child { padding-top: 0; }

    .article h3 {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.45;
      margin-bottom: 5px;
    }
    .article h3 a {
      color: #1a1a2e;
      text-decoration: none;
    }
    .article h3 a:hover { color: #1a73e8; text-decoration: underline; }

    .summary {
      font-size: 0.875rem;
      color: #444;
      line-height: 1.55;
      margin-bottom: 6px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.78rem;
    }
    .source {
      background: #eef2ff;
      color: #3b5bdb;
      padding: 1px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .time { color: #999; }

    /* ── Footer ── */
    footer {
      text-align: center;
      font-size: 0.78rem;
      color: #aaa;
      padding-top: 32px;
    }

    @media (max-width: 600px) {
      .category { padding: 16px; }
      header h1 { font-size: 1.4rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-top">
        <h1>每日新闻</h1>
        <span class="date-badge">${dateStr}</span>
      </div>
      <p class="header-meta">共 ${articles.length} 篇 &nbsp;·&nbsp; 更新于 ${now}</p>
    </header>

    <nav class="tabs">
    ${tabsHtml}
    </nav>

    ${sectionsHtml}

    <footer>由 Claude AI 自动生成 · ai-news-digest</footer>
  </div>

  <script>
    document.querySelectorAll('.tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('section').forEach(function(s) { s.hidden = true; });
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).hidden = false;
      });
    });
  </script>
</body>
</html>`;
}
