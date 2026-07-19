import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const HEARTBEAT_TTL_SECONDS = 30; // Peer expires after 30 seconds of no heartbeat

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const room = req.query.room || (req.body && req.body.room);
  if (!room) return res.status(400).json({ error: 'Room ID required' });

  try {
    // GET: Returns list of active peers and the current host
    if (req.method === 'GET') {
      const peerIds = await redis.smembers(`room:${room}:peers`);
      
      let activePeers = [];
      let maxAge = Infinity;
      let oldestPeer = null;
      
      const creator = await redis.get(`room:${room}:creator`);

      // Check which peers are still alive and find the oldest one
      for (const pid of peerIds) {
        const timestampStr = await redis.get(`room:${room}:peer:${pid}`);
        if (timestampStr) {
          const joinedAt = parseInt(timestampStr, 10);
          activePeers.push({ id: pid, joinedAt });
          if (joinedAt < maxAge) {
            maxAge = joinedAt;
            oldestPeer = pid;
          }
        } else {
          // Peer expired, clean up
          await redis.srem(`room:${room}:peers`, pid);
        }
      }

      // If creator is present, they are host. Otherwise, oldest peer is host.
      const currentHost = (creator && activePeers.some(p => p.id === creator)) ? creator : oldestPeer;

      // If active peers is empty, room is empty
      return res.status(200).json({
        peers: activePeers.map(p => p.id),
        host: currentHost,
        creator: creator || oldestPeer
      });
    }

    // POST: Heartbeat / Join or Leave
    if (req.method === 'POST') {
      const { peerId, joinedAt, action, targetPeerId } = req.body;
      if (!peerId) return res.status(400).json({ error: 'Peer ID required' });

      if (action === 'leave') {
        await redis.srem(`room:${room}:peers`, peerId);
        await redis.del(`room:${room}:peer:${peerId}`);
        return res.status(200).json({ success: true });
      }

      if (action === 'transfer' && targetPeerId) {
        // To transfer host, we make the target the oldest peer by setting timestamp to 0
        await redis.set(`room:${room}:peer:${targetPeerId}`, 0, { ex: HEARTBEAT_TTL_SECONDS });
        return res.status(200).json({ success: true });
      }

      // Add to set of peers
      await redis.sadd(`room:${room}:peers`, peerId);
      
      const existingJoin = await redis.get(`room:${room}:peer:${peerId}`);
      const timestamp = existingJoin || joinedAt || Date.now();
      
      await redis.set(`room:${room}:peer:${peerId}`, timestamp, { ex: HEARTBEAT_TTL_SECONDS });
      
      // Set creator if not exists
      const hasCreator = await redis.exists(`room:${room}:creator`);
      if (!hasCreator) {
        await redis.set(`room:${room}:creator`, peerId, { ex: 2592000 });
      }
      
      await redis.expire(`room:${room}:peers`, 2592000);

      return res.status(200).json({ success: true, timestamp });
    }

    // DELETE: Leave room
    if (req.method === 'DELETE') {
      const { peerId } = req.body;
      if (!peerId) return res.status(400).json({ error: 'Peer ID required' });

      await redis.srem(`room:${room}:peers`, peerId);
      await redis.del(`room:${room}:peer:${peerId}`);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Room API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
