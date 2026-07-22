/**
 * This patch replaces PeerJS transport in script.js with native WebRTC
 * + custom signaling via /api/signal (Upstash Redis polling)
 */

const fs = require('fs');
let code = fs.readFileSync('./script.js', 'utf8');

// 1. Fix the file header comment
code = code.replace(
  `/**
 * SwaCord — script.js
 * Serverless P2P Messenger powered by PeerJS
 *
 * Architecture:
 *  - Signalling via PeerJS public cloud (no own backend)
 *  - Voice via MediaConnection (getUserMedia)
 *  - Screen share via replaceTrack on RTCRtpSender
 *  - Text chat + profile sync via DataConnection (DataChannel)
 */`,
  `/**
 * SwaCord — script.js
 * Serverless P2P Messenger powered by Native WebRTC
 *
 * Architecture:
 *  - Signalling via /api/signal (Upstash Redis polling) — no peerjs.com!
 *  - Voice via RTCPeerConnection audio tracks (getUserMedia)
 *  - Screen share via RTCPeerConnection video track renegotiation
 *  - Text chat via RTCDataChannel
 */`
);

// 2. Remove peer, activeCalls, cameraCalls, screenCalls from state
code = code.replace(
`const state = {
  peer:            null,
  myId:            null,
  roomId:          null,   // host's peer ID
  isHost:          false,
  serverMode:      false,  // whether chat is saved on Vercel
  launched:        false,`,
`const state = {
  myId:            null,
  roomId:          null,
  isHost:          false,
  serverMode:      false,
  launched:        false,`
);

code = code.replace(
`  // Calls: peerId -> MediaConnection (audio/video)
  activeCalls:     new Map(),

  // Camera calls: peerId -> MediaConnection (video only)
  cameraCalls:     new Map(),

  // Screen share calls: peerId -> MediaConnection (video only)
  screenCalls:     new Map(),

  // Data connections: peerId -> DataConnection
  dataConns:       new Map(),`,
`  // Data connections: peerId -> { open, send(), close() }
  dataConns:       new Map(),`
);

// 3. Replace createPeer block + the two old connect functions + launchApp duplicate
// Find start and end markers
const peerCreationStart = `/* ══════════════════════════════════════════════════════════
   PEER CREATION
   ══════════════════════════════════════════════════════════ */
function createPeer(customId) {`;

const oldLaunchApp = `/* ══════════════════════════════════════════════════════════
   HOST: LAUNCH APP
   ══════════════════════════════════════════════════════════ */
async function launchApp() {`;

const startIdx = code.indexOf(peerCreationStart);
const launchIdx = code.indexOf(oldLaunchApp);

if (startIdx === -1) { console.error('Could not find PEER CREATION'); process.exit(1); }
if (launchIdx === -1) { console.error('Could not find launchApp'); process.exit(1); }

// Find end of the old playRemoteAudio function right before handleDataMessage
const handleDataMessageMarker = `/* ══════════════════════════════════════════════════════════
   HANDLE INCOMING DATA MESSAGES
   ══════════════════════════════════════════════════════════ */
function handleDataMessage(peerId, data) {`;

const handleDataIdx = code.indexOf(handleDataMessageMarker, startIdx);
if (handleDataIdx === -1) { console.error('Could not find handleDataMessage'); process.exit(1); }

const nativeWebRTC = `
/* ══════════════════════════════════════════════════════════
   NATIVE WebRTC ENGINE — replaces PeerJS entirely
   Signalling via /api/signal (Upstash Redis polling)
   ══════════════════════════════════════════════════════════ */

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
      username: 'peerjs',
      credential: 'peerjsp',
    },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
};

// Map peerId -> { pc: RTCPeerConnection, dc: RTCDataChannel, initiator: bool }
const rtcConns = new Map();
let sigPollInterval = null;

function generateId() {
  return 'sw' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

async function sendSignal(to, type, data) {
  try {
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: state.roomId, id: state.myId, to, type, data }),
    });
  } catch (e) { console.warn('[Signal] send error:', e); }
}

async function pollSignals() {
  if (!state.myId || !state.roomId) return;
  try {
    const res = await fetch(\`/api/signal?room=\${encodeURIComponent(state.roomId)}&id=\${state.myId}\`);
    if (!res.ok) return;
    const { signals } = await res.json();
    for (const sig of (signals || [])) {
      await handleIncomingSignal(sig).catch(e => console.warn('[Signal] handle error:', e));
    }
  } catch (e) { /* ignore */ }
}

async function handleIncomingSignal(sig) {
  const { from, type, data } = sig;
  console.log('[Signal] recv', type, 'from', from);

  if (type === 'offer') {
    let entry = rtcConns.get(from);
    if (entry && entry.pc.connectionState !== 'connected') {
      try { entry.pc.close(); } catch {}
      rtcConns.delete(from);
      entry = null;
    }
    if (!entry) entry = createRTCConnection(from, false);
    await entry.pc.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await entry.pc.createAnswer();
    await entry.pc.setLocalDescription(answer);
    await sendSignal(from, 'answer', answer);

  } else if (type === 'answer') {
    const entry = rtcConns.get(from);
    if (entry && entry.pc.signalingState !== 'stable') {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(data));
    }

  } else if (type === 'ice') {
    const entry = rtcConns.get(from);
    if (entry && data) {
      try { await entry.pc.addIceCandidate(new RTCIceCandidate(data)); } catch {}
    }
  }
}

function createRTCConnection(peerId, isInitiator) {
  const pc = new RTCPeerConnection(ICE_CONFIG);
  const entry = { pc, dc: null, initiator: isInitiator, peerId };
  rtcConns.set(peerId, entry);

  if (state.localStream) {
    state.localStream.getTracks().forEach(track => pc.addTrack(track, state.localStream));
  }

  pc.onicecandidate = async e => {
    if (e.candidate) await sendSignal(peerId, 'ice', e.candidate.toJSON());
  };

  pc.ontrack = e => {
    const stream = e.streams[0];
    if (!stream) return;
    if (stream.getVideoTracks().length > 0) {
      showRemoteVideo(stream, peerId);
    } else {
      playRemoteAudio(stream, peerId);
    }
    stream.onaddtrack = () => {
      if (stream.getVideoTracks().length > 0) showRemoteVideo(stream, peerId);
    };
  };

  pc.ondatachannel = e => {
    entry.dc = e.channel;
    setupDataChannelNative(e.channel, peerId);
  };

  pc.onnegotiationneeded = async () => {
    if (!isInitiator || pc.signalingState !== 'stable') return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(peerId, 'offer', offer);
    } catch (e) { console.warn('[Renegotiation]', e); }
  };

  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    console.log(\`[WebRTC] \${peerId} → \${s}\`);
    if (s === 'failed') {
      toast('🔄 Перепідключення через relay...', 'info', 4000);
      retryWithRelay(peerId, isInitiator);
    } else if (s === 'disconnected' || s === 'closed') {
      onPeerGone(peerId);
    }
  };

  if (isInitiator) {
    const dc = pc.createDataChannel('swacord', { ordered: true });
    entry.dc = dc;
    setupDataChannelNative(dc, peerId);
  }

  return entry;
}

async function retryWithRelay(peerId, isInitiator) {
  const old = rtcConns.get(peerId);
  if (old) { try { old.pc.close(); } catch {} }
  rtcConns.delete(peerId);

  const pc = new RTCPeerConnection({ ...ICE_CONFIG, iceTransportPolicy: 'relay' });
  const entry = { pc, dc: null, initiator: isInitiator, peerId };
  rtcConns.set(peerId, entry);

  if (state.localStream) {
    state.localStream.getTracks().forEach(t => pc.addTrack(t, state.localStream));
  }
  pc.onicecandidate = async e => { if (e.candidate) await sendSignal(peerId, 'ice', e.candidate.toJSON()); };
  pc.ontrack = e => {
    const stream = e.streams[0];
    if (!stream) return;
    if (stream.getVideoTracks().length > 0) showRemoteVideo(stream, peerId);
    else playRemoteAudio(stream, peerId);
  };
  pc.ondatachannel = e => { entry.dc = e.channel; setupDataChannelNative(e.channel, peerId); };
  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if (s === 'connected') toast('✅ Підключено через relay!', 'success', 3000);
    else if (s === 'failed') { toast('❌ Не вдалося підключитися.', 'error', 6000); onPeerGone(peerId); }
    else if (s === 'disconnected' || s === 'closed') onPeerGone(peerId);
  };

  if (isInitiator) {
    const dc = pc.createDataChannel('swacord', { ordered: true });
    entry.dc = dc;
    setupDataChannelNative(dc, peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal(peerId, 'offer', offer);
  }
}

async function connectToPeerNative(peerId) {
  const existing = rtcConns.get(peerId);
  if (existing?.pc.connectionState === 'connected' || existing?.pc.connectionState === 'connecting') return;
  console.log('[WebRTC] Connecting to', peerId);
  const entry = createRTCConnection(peerId, true);
  const offer = await entry.pc.createOffer();
  await entry.pc.setLocalDescription(offer);
  await sendSignal(peerId, 'offer', offer);
}

function setupDataChannelNative(dc, peerId) {
  const wrapper = {
    open: dc.readyState === 'open',
    peer: peerId,
    send: data => { if (dc.readyState === 'open') dc.send(JSON.stringify(data)); },
    close: () => { try { rtcConns.get(peerId)?.pc.close(); } catch {} },
  };

  dc.onopen = () => {
    wrapper.open = true;
    state.dataConns.set(peerId, wrapper);
    if (!state.peers.has(peerId)) {
      state.peers.set(peerId, { name: t('unknownUser'), avatar: '❓', micMuted: false, sharing: false });
    }
    launchApp();
    sendInit(wrapper);
  };

  dc.onmessage = e => {
    try { handleDataMessage(peerId, JSON.parse(e.data)); }
    catch (err) { console.warn('[DC] Bad message', err); }
  };

  dc.onclose = () => {
    wrapper.open = false;
    onPeerGone(peerId);
    state.dataConns.delete(peerId);
    rtcConns.delete(peerId);
  };

  dc.onerror = err => console.error('[DC] Error:', err);
}

function onPeerGone(peerId) {
  if (state.peers.has(peerId)) return; // Already removed
  const peer = state.peers.get(peerId);
  if (peer) {
    addSystemMessage(\`\${peer.avatar || ''} <strong>\${escHtml(peer.name)}</strong> \${t('leftRoom')}\`);
    playSound('leave');
  }
  removePeer(peerId);
  const audio = document.getElementById('audio-' + peerId);
  if (audio) { audio.srcObject = null; audio.remove(); }
}

function startSignalPolling() {
  if (sigPollInterval) clearInterval(sigPollInterval);
  pollSignals();
  sigPollInterval = setInterval(pollSignals, 1000);
}

function stopSignalPolling() {
  if (sigPollInterval) { clearInterval(sigPollInterval); sigPollInterval = null; }
}

async function initMyPeer() {
  state.myId = generateId();
  console.log('[SwaCord] My ID:', state.myId);
  startSignalPolling();

  if (state.serverMode) {
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomId);
    window.history.replaceState({}, '', url.toString());
    startVercelHeartbeat();
    launchApp();
  } else {
    if (state.isHost) {
      state.roomId = state.myId;
      const url = new URL(window.location.href);
      url.searchParams.set('room', state.myId);
      window.history.replaceState({}, '', url.toString());
      launchApp();
    } else {
      DOM.connectingSub.textContent = t('connectingToHost');
      await connectToPeerNative(state.roomId);
      setTimeout(() => {
        if (!state.launched) {
          toast('❌ ' + t('hostUnavailable'), 'error', 7000);
          DOM.overlay.classList.remove('active');
          setTimeout(() => DOM.overlay.style.display = 'none', 400);
        }
      }, 30000);
    }
  }
}

/* Play remote audio in a hidden <audio> element */
function playRemoteAudio(stream, peerId) {
  let el = document.getElementById('audio-' + peerId);
  if (!el) {
    el = document.createElement('audio');
    el.id = 'audio-' + peerId;
    el.autoplay = true;
    el.playsInline = true;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  const audioStream = new MediaStream(stream.getAudioTracks());
  el.srcObject = audioStream;
}

`;

// Replace from PEER CREATION start to handleDataMessage start
code = code.slice(0, startIdx) + nativeWebRTC + code.slice(handleDataIdx);

// 4. Replace createPeer(null) calls with initMyPeer()
code = code.replace(/createPeer\(null\);/g, 'initMyPeer();');

// 5. Update onCreateRoom to use initMyPeer (async)
code = code.replace(
  `  showConnecting(t('creatingRoom'), t('connectingCloud'));
  await initMedia();
  initMyPeer(); `,
  `  showConnecting(t('creatingRoom'), t('connectingCloud'));
  await initMedia();
  await initMyPeer();`
);

// 6. Update onJoinRoom to use initMyPeer (async)
code = code.replace(
  `  showConnecting(t('joiningRoomConn'), t('connectingCloud'));
  await initMedia();
  initMyPeer();`,
  `  showConnecting(t('joiningRoomConn'), t('connectingCloud'));
  await initMedia();
  await initMyPeer();`
);

// 7. Update room history click to use initMyPeer
code = code.replace(
  `      showConnecting(t('joiningRoomConn'), t('connectingCloud'));
      initMedia().then(() => createPeer(null));`,
  `      showConnecting(t('joiningRoomConn'), t('connectingCloud'));
      initMedia().then(() => initMyPeer());`
);

// 8. Update Vercel heartbeat to use connectToPeerNative instead of connectToPeer
code = code.replace(
  `            connectToPeer(pid);`,
  `            connectToPeerNative(pid);`
);

// 9. Update screen share to use native WebRTC tracks instead of peer.call()
const oldScreenShare = `    // Start a SEPARATE PeerJS call for each peer (screen only, with metadata)
    state.dataConns.forEach((conn, peerId) => {
      const screenCall = state.peer.call(peerId, state.screenStream, {
        metadata: { type: 'screen' },
      });
      screenCall.on('stream', () => {}); // required listener
      screenCall.on('error', err => console.warn('Screen call error:', err));
      state.screenCalls.set(peerId, screenCall);
    });`;

const newScreenShare = `    // Add screen video track to all existing WebRTC connections
    const videoTrack = state.screenStream.getVideoTracks()[0];
    for (const [peerId, entry] of rtcConns) {
      if (entry.pc.connectionState === 'connected') {
        entry._screenSender = entry.pc.addTrack(videoTrack, state.screenStream);
      }
    }`;

code = code.replace(oldScreenShare, newScreenShare);

// 10. Update stopScreenShare to remove video track instead of closing peer calls
const oldStopScreen = `  // Close dedicated screen MediaConnections
  state.screenCalls.forEach(call => call.close());
  state.screenCalls.clear();`;

const newStopScreen = `  // Remove screen video track from all WebRTC connections
  for (const [peerId, entry] of rtcConns) {
    if (entry._screenSender) {
      try { entry.pc.removeTrack(entry._screenSender); } catch {}
      entry._screenSender = null;
    }
  }`;

code = code.replace(oldStopScreen, newStopScreen);

// 11. Update hideRemoteVideo to not check cameraCalls/screenCalls
code = code.replace(
  `  if (!state.isSharingScreen && state.cameraCalls.size === 0) {`,
  `  if (!state.isSharingScreen) {`
);

// 12. Fix sendToPeer to work with native wrapper
// (already compatible since wrapper has .open and .send())

// 13. Remove modKick close (conn.close() is fine on wrapper)

// Write result
fs.writeFileSync('./script.js', code, 'utf8');
console.log('Patch applied! Lines:', code.split('\n').length);
