"""
AI News Digest — 每日新闻摘要推送
获取国际/中国新闻（金融、政治、社会），用 Claude API 总结，发送到邮箱。

依赖：
    pip install anthropic requests python-dotenv

环境变量（.env 文件）：
    ANTHROPIC_API_KEY=sk-ant-...
    SMTP_USER=your_sender@gmail.com
    SMTP_PASSWORD=your_app_password
    RECIPIENT_EMAIL=jadezhang@futunn.com
"""

import os
import smtplib
import datetime
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import anthropic

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL", "jadezhang@futunn.com")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")  # https://newsapi.org 免费 tier

CATEGORIES = {
    "国际金融": "international finance markets economy",
    "国际政治": "international politics geopolitics diplomacy",
    "国际社会": "international society culture technology",
    "中国金融": "China finance economy markets",
    "中国政治": "China politics policy government",
    "中国社会": "China society culture tech",
}


def fetch_news(query: str, page_size: int = 5) -> list[dict]:
    """从 NewsAPI 拉取头条新闻。"""
    if not NEWS_API_KEY:
        # 无 API Key 时返回占位数据，便于本地测试
        return [{"title": f"[示例] {query} 相关新闻", "description": "请配置 NEWS_API_KEY 以获取真实新闻。", "url": ""}]

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "zh,en",
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        articles = resp.json().get("articles", [])
        return [{"title": a["title"], "description": a.get("description", ""), "url": a["url"]} for a in articles]
    except Exception as e:
        print(f"  [警告] 获取 '{query}' 新闻失败: {e}")
        return []


def summarize_with_claude(category: str, articles: list[dict]) -> str:
    """用 Claude 将原始新闻列表总结成可读摘要。"""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    raw = "\n".join(
        f"- {a['title']}: {a['description']}" for a in articles if a.get("title")
    )
    if not raw:
        return "（今日暂无相关新闻）"

    prompt = f"""你是一位专业新闻编辑。以下是今日"{category}"板块的新闻原文：

{raw}

请用中文写一段 150 字以内的简洁摘要，突出最重要的 2-3 条进展，语气客观专业，无需标题。"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


def build_email_html(summaries: dict[str, str], date_str: str) -> str:
    """构建 HTML 邮件正文。"""
    sections_html = ""
    for category, summary in summaries.items():
        sections_html += f"""
        <div style="margin-bottom:24px;">
          <h3 style="color:#1a1a2e;border-left:4px solid #4f46e5;padding-left:10px;margin:0 0 8px 0;">{category}</h3>
          <p style="color:#374151;line-height:1.7;margin:0;">{summary}</p>
        </div>"""

    return f"""
    <html><body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#f9fafb;">
      <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <h2 style="color:#1a1a2e;margin:0 0 4px 0;">📰 每日新闻摘要</h2>
        <p style="color:#6b7280;margin:0 0 28px 0;font-size:14px;">{date_str}</p>
        {sections_html}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">由 Claude AI 自动生成 · ai-news-digest</p>
      </div>
    </body></html>"""


def send_email(subject: str, html_body: str):
    """通过 SMTP 发送邮件（Gmail App Password 或其他 SMTP）。"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = RECIPIENT_EMAIL
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, RECIPIENT_EMAIL, msg.as_string())
    print(f"  ✓ 邮件已发送至 {RECIPIENT_EMAIL}")


def main():
    today = datetime.date.today().strftime("%Y年%m月%d日")
    print(f"[{today}] 开始生成新闻摘要...")

    summaries = {}
    for category, query in CATEGORIES.items():
        print(f"  → 获取「{category}」...")
        articles = fetch_news(query)
        summaries[category] = summarize_with_claude(category, articles)

    html = build_email_html(summaries, today)
    subject = f"每日新闻摘要 · {today}"
    send_email(subject, html)
    print("完成。")


if __name__ == "__main__":
    main()
