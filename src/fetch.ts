import { XMLParser } from "fast-xml-parser";
import type { FeedConfig, Section, Category } from "./feeds.js";

export type Article = {
  title: string;
  link: string;
  publishedAt: Date;
  source: string;
  section: Section;
  category: Category;
  description?: string;
  summary?: string;
  titleZh?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
});

function extractText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    return String(o["#text"] ?? o["__cdata"] ?? "");
  }
  return String(val);
}

function extractLink(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    // Atom may return multiple <link> elements; prefer rel="alternate"
    const alt = val.find(
      (v) => typeof v === "object" && (v as Record<string, unknown>)["@_rel"] === "alternate"
    );
    const item = alt ?? val[0];
    return String((item as Record<string, unknown>)["@_href"] ?? "");
  }
  if (typeof val === "object") {
    return String((val as Record<string, unknown>)["@_href"] ?? "");
  }
  return "";
}

async function fetchFeed(feed: FeedConfig): Promise<Article[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "daily-digest/1.0 (+https://github.com)" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);

  const items: unknown[] =
    doc?.rss?.channel?.item ??
    doc?.feed?.entry ??
    [];

  const hours = feed.category === "金融" ? 48 : 24;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  return (Array.isArray(items) ? items : [items]).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const obj = item as Record<string, unknown>;

    const title = extractText(obj.title).trim();
    const link = extractLink(obj.link) || extractText(obj.guid).trim();

    const rawDate = extractText(
      obj.pubDate ?? obj.updated ?? obj.published ?? ""
    );
    const publishedAt = rawDate ? new Date(rawDate) : new Date(0);

    if (!title || !link || isNaN(publishedAt.getTime())) return [];
    if (publishedAt.getTime() < cutoff) return [];

    const rawDesc = obj.description ?? obj.summary ?? obj["content:encoded"] ?? obj.content ?? "";
    const description =
      extractText(rawDesc)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400) || undefined;

    return [
      {
        title,
        link,
        publishedAt,
        source: feed.source,
        section: feed.section,
        category: feed.category,
        description,
      },
    ];
  });
}

export async function fetchAllFeeds(feeds: FeedConfig[]): Promise<Article[]> {
  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));
  const articles: Article[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      console.error(`  [跳过] ${feeds[i].source}: ${r.reason}`);
    }
  }
  return articles;
}
