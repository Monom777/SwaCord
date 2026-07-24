import { Redis } from '@upstash/redis';

// Redis.fromEnv() automatically uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

/**
 * Updates the `reactions` field of a single stored chat message in-place.
 * Chat history is a flat Redis list (room:<id>:chat, see ../chat.js), so
 * there's no direct "update by id" — we scan the list, find the message by
 * id, and overwrite that slot with lset.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { room, msgId, reactions } = req.body;
    if (!room || !msgId || !reactions) {
      return res.status(400).json({ error: 'room, msgId and reactions are required' });
    }

    const key = `room:${room}:chat`;
    const messages = await redis.lrange(key, 0, -1);

    let updated = false;
    for (let i = 0; i < messages.length; i++) {
      const raw = messages[i];
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && parsed.id === msgId) {
        parsed.reactions = reactions;
        await redis.lset(key, i, JSON.stringify(parsed));
        updated = true;
        break;
      }
    }

    // Not finding the message (e.g. it aged out of the last-200 window) isn't
    // an error worth failing loudly over — the reaction still worked live via
    // the P2P data channel, it just won't show up after a reload.
    return res.status(200).json({ success: true, updated });
  } catch (error) {
    console.error('Redis API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
