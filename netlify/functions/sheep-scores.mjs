// 迷子の羊をさがせ「みんなのランキング」(5ラウンドの合計タイム、少ないほど上位)
import { getStore } from "@netlify/blobs";

const KEEP = 300;
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HDR });
const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").trim().slice(0, 12);
const LANGS = new Set(["ja", "en", "es", "id", "ko", "pt", "tl", "zh-hans", "zh-hant"]);
const cmp = (a, b) => a.time - b.time || a.created_at.localeCompare(b.created_at);

export default async (req, context) => {
  const store = getStore({ name: "sheep-ranking", consistency: "strong" });

  if (req.method === "GET") {
    const rows = (await store.get("board", { type: "json" })) || [];
    return json(rows.slice(0, 100));
  }

  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "body" }, 400); }
    const name = cleanName(b && b.name);
    const time = Math.round(Number(b && b.time) * 10) / 10;
    if (!name || !Number.isFinite(time) || time < 3 || time > 900) return json({ error: "invalid" }, 400);
    const lang = LANGS.has(b.lang) ? b.lang : "ja";

    const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
    const rlKey = "rl:" + ip.replace(/[^0-9a-fA-F:.]/g, "");
    const last = await store.get(rlKey, { type: "json" });
    const now = Date.now();
    if (last && now - last.t < 3000) return json({ error: "slow down" }, 429);
    await store.setJSON(rlKey, { t: now });

    const ent = { name, time, lang, created_at: new Date(now).toISOString() };
    const rows = (await store.get("board", { type: "json" })) || [];
    const i = rows.findIndex(r => r.name === name);
    if (i >= 0) {
      if (rows[i].time <= time) return json({ ok: true, improved: false, rank: i + 1 });
      rows.splice(i, 1);
    }
    rows.push(ent);
    rows.sort(cmp);
    const kept = rows.slice(0, KEEP);
    await store.setJSON("board", kept);
    return json({ ok: true, improved: true, rank: kept.findIndex(r => r.name === name) + 1 });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/sheep-scores" };
