// 聖書クイズ「みんなのランキング」(累計正解数)
// 端末ごとの id(ハッシュ化して保存)で1人1行。正解数は増える方向だけ受け付けます。
import { getStore } from "@netlify/blobs";

const KEEP = 500;
const HDR = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HDR });
const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, "").trim().slice(0, 12);
async function pidOf(id) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  return [...new Uint8Array(h)].slice(0, 6).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async (req, context) => {
  const store = getStore({ name: "bible-ranking", consistency: "strong" });

  if (req.method === "GET") {
    const rows = (await store.get("board", { type: "json" })) || [];
    return json(rows.slice(0, 100).map(r => ({ pid: r.pid, name: r.name, total: r.total })));
  }

  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "body" }, 400); }
    const id = String((b && b.id) || "");
    const name = cleanName(b && b.name);
    const total = Math.round(Number(b && b.total));
    if (id.length < 8 || id.length > 80 || !name || !Number.isFinite(total) || total < 0 || total > 100000) return json({ error: "invalid" }, 400);

    const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
    const rlKey = "rl:" + ip.replace(/[^0-9a-fA-F:.]/g, "");
    const last = await store.get(rlKey, { type: "json" });
    const now = Date.now();
    if (last && now - last.t < 3000) return json({ error: "slow down" }, 429);
    await store.setJSON(rlKey, { t: now });

    const pid = await pidOf(id);
    const rows = (await store.get("board", { type: "json" })) || [];
    const i = rows.findIndex(r => r.pid === pid);
    const prev = i >= 0 ? rows[i] : null;
    // 1回のクイズは10問。前回より大きく増えた記録は受け付けない(はじめての参加は 5000 問まで)
    let t = total;
    if (prev) {
      if (t < prev.total) t = prev.total;
      if (t > prev.total + 10) return json({ error: "too many" }, 400);
    } else if (t > 5000) return json({ error: "too many" }, 400);
    if (i >= 0) rows.splice(i, 1);
    rows.push({ pid, name, total: t, updated_at: new Date(now).toISOString(), since: prev ? prev.since : new Date(now).toISOString() });
    rows.sort((x, y) => y.total - x.total || x.since.localeCompare(y.since));
    const kept = rows.slice(0, KEEP);
    await store.setJSON("board", kept);
    return json({ ok: true, rank: kept.findIndex(r => r.pid === pid) + 1, total: t });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/bible-scores" };
