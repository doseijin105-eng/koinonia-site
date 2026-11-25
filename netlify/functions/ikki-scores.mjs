// 一騎当八百「みんなのランキング」(タイムアタック・サバイバル・畑を守れ)
// Netlify Blobs にボードごとの記録を保存します。
import { getStore } from "@netlify/blobs";

const KEEP = 300;
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HDR });
const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").trim().slice(0, 8);
const int = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const num1 = (v, lo, hi) => { const n = Math.round(Number(v) * 10) / 10; return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const CHARS = new Set(["yosh", "elea", "sham", "abi", "ben"]);

// 並べ方: 前に来るほど良い記録
const ORDER = {
  ta: (a, b) => a.time - b.time || b.score - a.score,
  surv: (a, b) => b.score - a.score || b.sec - a.sec,
  field: (a, b) => b.wave - a.wave || b.score - a.score,
};

export default async (req, context) => {
  const store = getStore({ name: "ikki-ranking", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const board = url.searchParams.get("board");
    if (!ORDER[board]) return json({ error: "board" }, 400);
    const rows = (await store.get("b:" + board, { type: "json" })) || [];
    return json(rows.slice(0, 100));
  }

  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "body" }, 400); }
    const board = b && b.board;
    const name = cleanName(b && b.name);
    if (!ORDER[board] || !name) return json({ error: "invalid" }, 400);
    const score = int(b.score, 0, 99999999);
    const ent = { name, score, char: CHARS.has(b.char) ? b.char : "yosh" };
    if (board === "ta") ent.time = num1(b.time, 10, 3600);
    if (board === "surv") ent.sec = int(b.sec, 1, 36000);
    if (board === "field") ent.wave = int(b.wave, 0, 999);
    if (Object.values(ent).some(v => v === null)) return json({ error: "invalid" }, 400);

    // 同じ所からの連続送信をふせぐ(3秒に1回)
    const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
    const rlKey = "rl:" + ip.replace(/[^0-9a-fA-F:.]/g, "");
    const last = await store.get(rlKey, { type: "json" });
    const now = Date.now();
    if (last && now - last.t < 3000) return json({ error: "slow down" }, 429);
    await store.setJSON(rlKey, { t: now });

    ent.created_at = new Date(now).toISOString();
    const key = "b:" + board, cmp = ORDER[board];
    const rows = (await store.get(key, { type: "json" })) || [];
    const i = rows.findIndex(r => r.name === name);
    if (i >= 0) {
      if (cmp(rows[i], ent) <= 0) {
        const rank = rows.findIndex(r => r.name === name) + 1;
        return json({ ok: true, improved: false, rank });
      }
      rows.splice(i, 1);
    }
    rows.push(ent);
    rows.sort((x, y) => cmp(x, y) || x.created_at.localeCompare(y.created_at));
    const kept = rows.slice(0, KEEP);
    await store.setJSON(key, kept);
    const rank = kept.findIndex(r => r.name === name) + 1;
    return json({ ok: true, improved: true, rank });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/ikki-scores" };
