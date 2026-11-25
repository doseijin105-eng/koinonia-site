// モフ博士のうさぎクイズ「みんなのランキング」
// Netlify Blobs にボードごとのスコアを保存します(外部サービス不要)。
import { getStore } from "@netlify/blobs";

const BOARDS = new Set(["trivia", "photo", "peek", "survival", "exam-basic", "exam-mid", "exam-adv"]);
const RANK_MAX = 1000;
const KEEP = 300;
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HDR });
const cleanNick = s => String(s || "").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").trim().slice(0, 12);

export default async (req, context) => {
  const store = getStore({ name: "usagi-ranking", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const board = url.searchParams.get("board");
    if (!BOARDS.has(board)) return json({ error: "board" }, 400);
    const rows = (await store.get("b:" + board, { type: "json" })) || [];
    return json(rows.slice(0, 100));
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "body" }, 400); }
    const board = body && body.board;
    const name = cleanNick(body && body.name);
    const score = Math.round(Number(body && body.score));
    if (!BOARDS.has(board) || !name || !Number.isFinite(score) || score < 1 || score > RANK_MAX) return json({ error: "invalid" }, 400);

    // 同じ人の連続送信をふせぐ(3秒に1回)
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
      if (rows[i].score >= score) return json({ ok: true, improved: false });
      rows.splice(i, 1);
    }
    rows.push({ name, score, created_at: new Date(now).toISOString() });
    rows.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
    await store.setJSON(key, rows.slice(0, KEEP));
    return json({ ok: true, improved: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/usagi-scores" };
