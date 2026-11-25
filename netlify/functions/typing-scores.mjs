// みことばタイピングクエスト「みんなのランキング」(時間チャレンジ 30/60/90秒、1分で打てた文字数)
import { getStore } from "@netlify/blobs";

const BOARDS = new Set(["30", "60", "90"]);
const KEEP = 300;
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HDR });
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").trim().slice(0, n);
const cmp = (a, b) => b.wpm - a.wpm || a.created_at.localeCompare(b.created_at);

export default async (req, context) => {
  const store = getStore({ name: "typing-ranking", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const board = url.searchParams.get("board");
    if (!BOARDS.has(board)) return json({ error: "board" }, 400);
    const rows = (await store.get("b:" + board, { type: "json" })) || [];
    return json(rows.slice(0, 100));
  }

  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "body" }, 400); }
    const board = String(b && b.board);
    const name = clean(b && b.name, 12);
    const wpm = Math.round(Number(b && b.wpm));
    // 1分で打てた文字数。人の手で打てるのは多くても 1200 くらいまで
    if (!BOARDS.has(board) || !name || !Number.isFinite(wpm) || wpm < 1 || wpm > 1200) return json({ error: "invalid" }, 400);
    const title = clean(b && b.title, 20);

    const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
    const rlKey = "rl:" + ip.replace(/[^0-9a-fA-F:.]/g, "");
    const last = await store.get(rlKey, { type: "json" });
    const now = Date.now();
    if (last && now - last.t < 3000) return json({ error: "slow down" }, 429);
    await store.setJSON(rlKey, { t: now });

    const key = "b:" + board;
    const rows = (await store.get(key, { type: "json" })) || [];
    const i = rows.findIndex(r => r.name === name);
    if (i >= 0) {
      if (rows[i].wpm >= wpm) return json({ ok: true, improved: false, rank: i + 1 });
      rows.splice(i, 1);
    }
    rows.push({ name, wpm, title, created_at: new Date(now).toISOString() });
    rows.sort(cmp);
    const kept = rows.slice(0, KEEP);
    await store.setJSON(key, kept);
    return json({ ok: true, improved: true, rank: kept.findIndex(r => r.name === name) + 1 });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/typing-scores" };
