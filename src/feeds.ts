export type Section = "国际" | "中文";
export type Category = "金融" | "政治" | "社会" | "娱乐";

export type FeedConfig = {
  section: Section;
  category: Category;
  source: string;
  url: string;
};

export const FEEDS: FeedConfig[] = [
  // ── 国际 · 金融 ──────────────────────────────────────────
  {
    section: "国际",
    category: "金融",
    source: "CNBC",
    url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
  },
  {
    section: "国际",
    category: "金融",
    source: "CNBC Markets",
    url: "https://www.cnbc.com/id/20910258/device/rss/rss.html",
  },
  {
    section: "国际",
    category: "金融",
    source: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
  },
  {
    section: "国际",
    category: "金融",
    source: "Investing.com",
    url: "https://www.investing.com/rss/news.rss",
  },

  // ── 国际 · 政治 ──────────────────────────────────────────
  {
    section: "国际",
    category: "政治",
    source: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    section: "国际",
    category: "政治",
    source: "NPR World",
    url: "https://feeds.npr.org/1004/rss.xml",
  },
  {
    section: "国际",
    category: "政治",
    source: "Politico",
    url: "https://rss.politico.com/politics-news.xml",
  },

  // ── 国际 · 社会 ──────────────────────────────────────────
  {
    section: "国际",
    category: "社会",
    source: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    section: "国际",
    category: "社会",
    source: "Wired",
    url: "https://www.wired.com/feed/rss",
  },
  {
    section: "国际",
    category: "社会",
    source: "The Atlantic",
    url: "https://www.theatlantic.com/feed/all/",
  },

  // ── 国际 · 娱乐 ──────────────────────────────────────────
  {
    section: "国际",
    category: "娱乐",
    source: "Variety",
    url: "https://variety.com/feed/",
  },
  {
    section: "国际",
    category: "娱乐",
    source: "Hollywood Reporter",
    url: "https://www.hollywoodreporter.com/feed/",
  },
  {
    section: "国际",
    category: "娱乐",
    source: "Rolling Stone",
    url: "https://www.rollingstone.com/feed/",
  },

  // ── 中文 · 金融 ──────────────────────────────────────────
  {
    section: "中文",
    category: "金融",
    source: "36氪",
    url: "https://36kr.com/feed",
  },
  {
    section: "中文",
    category: "金融",
    source: "虎嗅",
    url: "https://www.huxiu.com/rss/0.xml",
  },
  {
    section: "中文",
    category: "金融",
    source: "FT中文",
    url: "https://www.ftchinese.com/rss/news",
  },
  {
    section: "中文",
    category: "金融",
    source: "财新",
    url: "https://www.caixin.com/rss/column.xml",
  },

  // ── 中文 · 政治 ──────────────────────────────────────────
  {
    section: "中文",
    category: "政治",
    source: "南华早报",
    url: "https://www.scmp.com/rss/91/feed",
  },
  {
    section: "中文",
    category: "政治",
    source: "FT中文",
    url: "https://www.ftchinese.com/rss/china",
  },

  // ── 中文 · 社会 ──────────────────────────────────────────
  {
    section: "中文",
    category: "社会",
    source: "澎湃新闻",
    url: "https://www.thepaper.cn/rss_list.jsp",
  },
  {
    section: "中文",
    category: "社会",
    source: "南华早报",
    url: "https://www.scmp.com/rss/4/feed",
  },

  // ── 中文 · 娱乐 ──────────────────────────────────────────
  {
    section: "中文",
    category: "娱乐",
    source: "腾讯娱乐",
    url: "https://feed.qq.com/news/ent/index.xml",
  },
  {
    section: "中文",
    category: "娱乐",
    source: "网易娱乐",
    url: "https://news.163.com/special/00031H0T/rss_newsfeed.xml",
  },
];
