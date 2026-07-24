import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const room = req.query.room || req.body?.room;
    const id   = req.query.id   || req.body?.id;

    if (!room || !id) return res.status(400).json({ error: 'room and id required' });
    if (req.method === 'POST') {
      const { to, type, data } = req.body;
      if (!to || !type) return res.status(400).json({ error: 'to and type required' });

      const key = `sig:${room}:${to}`;
      const msg = JSON.stringify({ from: id, type, data, ts: Date.now() });
      await redis.rpush(key, msg);
      await redis.expire(key, 120); // 2 minutes TTL
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'GET') {
      const key = `sig:${room}:${id}`;
      const count = await redis.llen(key);
      if (!count) return res.status(200).json({ signals: [] });

      const raw = await redis.lrange(key, 0, count - 1);
      await redis.ltrim(key, count, -1);

      const signals = raw.map(s => {
        try { return typeof s === 'string' ? JSON.parse(s) : s; }
        catch { return null; }
      }).filter(Boolean);

      return res.status(200).json({ signals });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[Signal API]', e);
    return res.status(500).json({ error: e.message });
  }
}
