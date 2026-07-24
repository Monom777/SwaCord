import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { room } = req.query;
      if (!room) return res.status(400).json({ error: 'Room ID is required' });
      const messages = await redis.lrange(`room:${room}:chat`, 0, -1);
      return res.status(200).json(messages || []);
    }

    if (req.method === 'POST') {
      const { room, msg } = req.body;
      if (!room || !msg) return res.status(400).json({ error: 'Room and msg required' });
      await redis.rpush(`room:${room}:chat`, msg);
      await redis.ltrim(`room:${room}:chat`, -200, -1);
      await redis.expire(`room:${room}:chat`, 2592000);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
