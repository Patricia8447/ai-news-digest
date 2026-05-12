import type { Article } from "./fetch.js";
import type { Section, Category } from "./feeds.js";

const SECTIONS: Section[] = ["国际", "中文"];
const CATEGORIES: Category[] = ["金融", "政治", "社会", "娱乐"];
const SECTION_ID: Record<Section, string> = { 国际: "intl", 中文: "cn" };
const SECTION_LABEL: Record<Section, string> = { 国际: "🌍 国际", 中文: "🇨🇳 国内" };
const CAT_ICON: Record<Category, string> = {
  金融: "📈",
  政治: "🏛️",
  社会: "🌐",
  娱乐: "🎬",
};
const CAT_ID: Record<Category, string> = {
  金融: "finance",
  政治: "politics",
  社会: "social",
  娱乐: "entertainment",
};

const CARDS_PER_PAGE = 3;
const MAX_FINANCE = 10;
const MAX_OTHER = 8;

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

function cardHtml(a: Article): string {
  const title = escapeHtml(a.titleZh || a.title);
  const summary = escapeHtml(a.summary ?? a.titleZh ?? a.title);
  return `<div class="card">
            <h3><a href="${escapeHtml(a.link)}" target="_blank" rel="noopener">${title}</a></h3>
            <p class="summary">${summary}</p>
            <div class="meta-row">
              <span class="source">${escapeHtml(a.source)}</span>
              <span class="time">${relativeTime(a.publishedAt)}</span>
            </div>
          </div>`;
}

function categoryHtml(section: Section, cat: Category, articles: Article[]): string {
  const max = cat === "金融" ? MAX_FINANCE : MAX_OTHER;
  const limited = articles.slice(0, max);
  if (limited.length === 0) return "";

  const catId = `${SECTION_ID[section]}-${CAT_ID[cat]}`;

  const pages: Article[][] = [];
  for (let i = 0; i < limited.length; i += CARDS_PER_PAGE) {
    pages.push(limited.slice(i, i + CARDS_PER_PAGE));
  }
  const totalPages = pages.length;

  const pagesHtml = pages
    .map(
      (page, idx) =>
        `<div class="card-page${idx === 0 ? " active" : ""}">${page.map(cardHtml).join("")}</div>`
    )
    .join("");

  const pgHtml =
    totalPages > 1
      ? `<div class="pagination">
            <button class="pg-btn" data-catid="${catId}" data-dir="-1" disabled aria-label="上一页">‹</button>
            <span class="pg-info" id="${catId}-pi">第 1 / ${totalPages} 页</span>
            <button class="pg-btn" data-catid="${catId}" data-dir="1" aria-label="下一页">›</button>
          </div>`
      : `<div class="pagination"><span class="pg-info">第 1 / 1 页</span></div>`;

  return `
    <div class="category" id="${catId}">
      <div class="cat-header">
        <span class="cat-title">${CAT_ICON[cat]} ${cat} <span class="count">${limited.length} 篇</span></span>
        ${pgHtml}
      </div>
      <div class="card-pages">${pagesHtml}</div>
    </div>`;
}

export function renderHtml(articles: Article[], dateStr: string): string {
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
      categoryHtml(section, cat, catMap.get(cat)!)
    ).join("");
    return `<section id="${SECTION_ID[section]}"${i > 0 ? " hidden" : ""}>${catsHtml}
  </section>`;
  }).join("");

  const tabsHtml = SECTIONS.map((section, i) => {
    const id = SECTION_ID[section];
    return `<button class="tab${i === 0 ? " active" : ""}" data-target="${id}">${SECTION_LABEL[section]}</button>`;
  }).join("");

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

    /* ── Sticky Nav ── */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .navbar-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 0;
    }
    .nav-brand {
      font-size: 1rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-right: 24px;
      white-space: nowrap;
    }
    .nav-brand .date-badge {
      background: #1a73e8;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      vertical-align: middle;
    }
    .tab {
      cursor: pointer;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.95rem;
      font-family: inherit;
      padding: 14px 18px;
      color: #666;
      font-weight: 500;
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .tab:hover { color: #1a73e8; }
    .tab.active { color: #1a73e8; border-bottom-color: #1a73e8; font-weight: 600; }

    /* ── Page body ── */
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }
    .header-meta {
      font-size: 0.82rem;
      color: #888;
      margin-bottom: 20px;
    }

    /* ── Category block ── */
    .category {
      background: #fff;
      border-radius: 10px;
      padding: 18px 20px 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .cat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .cat-title {
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .count {
      font-size: 0.75rem;
      font-weight: 400;
      color: #888;
      background: #f0f2f5;
      padding: 1px 8px;
      border-radius: 10px;
    }

    /* ── Pagination controls ── */
    .pagination {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .pg-btn {
      cursor: pointer;
      background: #f0f2f5;
      border: none;
      border-radius: 6px;
      width: 30px;
      height: 30px;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      transition: background 0.12s;
    }
    .pg-btn:hover:not(:disabled) { background: #dde1ea; }
    .pg-btn:disabled { opacity: 0.35; cursor: default; }
    .pg-info {
      font-size: 0.78rem;
      color: #666;
      white-space: nowrap;
    }

    /* ── Card pages ── */
    .card-pages { overflow: hidden; }
    .card-page {
      display: none;
      gap: 14px;
    }
    .card-page.active { display: flex; }

    /* ── Card ── */
    .card {
      flex: 1;
      min-width: 0;
      background: #f8f9fc;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card h3 {
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.45;
    }
    .card h3 a {
      color: #1a1a2e;
      text-decoration: none;
    }
    .card h3 a:hover { color: #1a73e8; text-decoration: underline; }
    .summary {
      font-size: 0.83rem;
      color: #555;
      line-height: 1.55;
      flex: 1;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      flex-wrap: wrap;
    }
    .source {
      background: #eef2ff;
      color: #3b5bdb;
      padding: 1px 7px;
      border-radius: 4px;
      font-weight: 500;
    }
    .time { color: #aaa; }

    /* ── Footer ── */
    footer {
      text-align: center;
      font-size: 0.78rem;
      color: #bbb;
      padding-top: 32px;
    }

    /* ── Responsive ── */
    @media (max-width: 700px) {
      .card-page { flex-wrap: wrap; }
      .card { min-width: calc(50% - 7px); flex: none; }
    }
    @media (max-width: 480px) {
      .card { min-width: 100%; }
      .navbar-inner { gap: 0; }
      .tab { padding: 12px 12px; font-size: 0.88rem; }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <span class="nav-brand">每日新闻<span class="date-badge">${dateStr}</span></span>
      ${tabsHtml}
    </div>
  </nav>

  <div class="container">
    <p class="header-meta">共 ${articles.length} 篇 &nbsp;·&nbsp; 更新于 ${now}</p>

    ${sectionsHtml}

    <footer>由 Claude AI 自动生成 · ai-news-digest</footer>
  </div>

  <script>
    (function () {
      var curPage = {};

      // Tab switching
      document.querySelectorAll('.tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
          document.querySelectorAll('section').forEach(function (s) { s.hidden = true; });
          btn.classList.add('active');
          var t = document.getElementById(btn.dataset.target);
          if (t) t.hidden = false;
        });
      });

      // Pagination
      document.querySelectorAll('.pg-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var catId = btn.dataset.catid;
          var dir = parseInt(btn.dataset.dir, 10);
          var cat = document.getElementById(catId);
          if (!cat) return;

          var pages = cat.querySelectorAll('.card-page');
          var total = pages.length;
          var cur = curPage[catId] || 0;
          var next = cur + dir;
          if (next < 0 || next >= total) return;

          pages[cur].classList.remove('active');
          pages[next].classList.add('active');
          curPage[catId] = next;

          var pi = document.getElementById(catId + '-pi');
          if (pi) pi.textContent = '第 ' + (next + 1) + ' / ' + total + ' 页';

          cat.querySelectorAll('.pg-btn').forEach(function (b) {
            var d = parseInt(b.dataset.dir, 10);
            b.disabled = (d < 0 && next === 0) || (d > 0 && next === total - 1);
          });
        });
      });
    })();
  </script>
</body>
</html>`;
}
