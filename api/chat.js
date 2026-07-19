import { Redis } from '@upstash/redis';

// Redis.fromEnv() automatically uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// which Vercel Upstash integration automatically adds to the environment variables.
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // CORS headers for allowing cross-origin if needed
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
      
      // Get all messages from the list
      const messages = await redis.lrange(`room:${room}:chat`, 0, -1);
      return res.status(200).json(messages || []);
    }

    if (req.method === 'POST') {
      const { room, msg } = req.body;
      if (!room || !msg) return res.status(400).json({ error: 'Room and msg required' });
      
      // Add message to the list
      await redis.rpush(`room:${room}:chat`, msg);
      
      // Keep only last 200 items (LTRIM keeps from -200 to -1)
      await redis.ltrim(`room:${room}:chat`, -200, -1);
      
      // Set expiration for the room chat (e.g. 7 days)
      await redis.expire(`room:${room}:chat`, 604800);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
