/**
 * SwaCord — script.js
 * Serverless P2P Messenger powered by PeerJS
 *
 * Architecture:
 *  - Signalling via PeerJS public cloud (no own backend)
 *  - Voice via MediaConnection (getUserMedia)
 *  - Screen share via replaceTrack on RTCRtpSender
 *  - Text chat + profile sync via DataConnection (DataChannel)
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   I18N — TRANSLATIONS
   ══════════════════════════════════════════════════════════ */
const TRANSLATIONS = {
  uk: {
    greeting:           'Привіт! Хто ти?',
    chooseAvatar:       'Обери аватарку та введи нікнейм',
    nickname:           'Нікнейм',
    nicknamePlaceholder:'наприклад: Nazar',
    createRoom:         'Створити кімнату',
    or:                 'або',
    joiningRoom:        'Вступаєш у кімнату',
    joinRoom:           'Приєднатись до кімнати',
    connecting:         'Підключаємось…',
    waitingCloud:       'Очікування PeerJS хмари…',
    creatingRoom:       'Створюємо кімнату…',
    connectingCloud:    'Підключаємось до PeerJS хмари…',
    joiningRoomConn:    'Приєднуємось до кімнати…',
    connectingToHost:   'Підключаємось до хоста…',
    micConnected:       'Мікрофон підключено 🎙️',
    micUnavailable:     'Мікрофон недоступний — тільки чат',
    roomCreated:        'Кімната створена! Ти хост 👑',
    connectedToRoom:    'Підключено до кімнати 🌀',
    connError:          'Помилка підключення: ',
    hostUnavailable:    'Хост недоступний. Перевір посилання.',
    disconnected:       'З\'єднання розірвано. Спроба відновлення…',
    onlineBadge:        'Онлайн',
    offlineBadge:       'Відключено',
    connectingBadge:    'Підключення…',
    micMuted:           'Мікрофон вимкнено 🔇',
    micUnmuted:         'Мікрофон увімкнено 🎙️',
    screenStarted:      'Демонстрацію екрану розпочато 🖥️',
    screenStopped:      'Демонстрацію зупинено',
    screenError:        'Помилка демонстрації: ',
    linkCopied:         'Посилання скопійовано! 📋',
    leaveConfirm:       'Покинути кімнату?',
    emptyChat:          'Чат порожній',
    emptyChatSub:       'Запроси друга за посиланням і почніть спілкуватись!',
    joinedRoom:         'приєднався до кімнати',
    leftRoom:           'покинув кімнату',
    screenShareStart:   'розпочав демонстрацію екрану',
    screenShareStop:    'зупинив демонстрацію',
    unknownUser:        'Невідомий',
    myProfile:          'Мій профіль',
    members:            'УЧАСНИКИ',
    host:               'Хост',
    member:             'Учасник',
    muted:              'Мовчить',
    you:                '(ти)',
    screenDemo:         'Демонстрація екрану',
    generalChat:        'Загальний чат',
    invite:             'Запросити',
    mic:                'Мік',
    demo:               'Демка',
    leave:              'Вийти',
    room:               'Кімната:',
    msgPlaceholder:     'Напиши повідомлення…',
    screenPresenter:    'невідомо',
    youPresenter:       '(ти)',
  },
  en: {
    greeting:           'Hello! Who are you?',
    chooseAvatar:       'Pick an avatar and enter your nickname',
    nickname:           'Nickname',
    nicknamePlaceholder:'e.g. Nazar',
    createRoom:         'Create Room',
    or:                 'or',
    joiningRoom:        'Joining room',
    joinRoom:           'Join Room',
    connecting:         'Connecting…',
    waitingCloud:       'Waiting for PeerJS cloud…',
    creatingRoom:       'Creating room…',
    connectingCloud:    'Connecting to PeerJS cloud…',
    joiningRoomConn:    'Joining room…',
    connectingToHost:   'Connecting to host…',
    micConnected:       'Microphone connected 🎙️',
    micUnavailable:     'Mic unavailable — text chat only',
    roomCreated:        'Room created! You are the host 👑',
    connectedToRoom:    'Connected to room 🌀',
    connError:          'Connection error: ',
    hostUnavailable:    'Host unavailable. Check the link.',
    disconnected:       'Connection lost. Reconnecting…',
    onlineBadge:        'Online',
    offlineBadge:       'Offline',
    connectingBadge:    'Connecting…',
    micMuted:           'Microphone muted 🔇',
    micUnmuted:         'Microphone on 🎙️',
    screenStarted:      'Screen share started 🖥️',
    screenStopped:      'Screen share stopped',
    screenError:        'Screen share error: ',
    linkCopied:         'Link copied! 📋',
    leaveConfirm:       'Leave the room?',
    emptyChat:          'No messages yet',
    emptyChatSub:       'Invite a friend via the link and start chatting!',
    joinedRoom:         'joined the room',
    leftRoom:           'left the room',
    screenShareStart:   'started screen share',
    screenShareStop:    'stopped screen share',
    unknownUser:        'Unknown',
    myProfile:          'My Profile',
    members:            'MEMBERS',
    host:               'Host',
    member:             'Member',
    muted:              'Muted',
    you:                '(you)',
    screenDemo:         'Screen Share',
    generalChat:        'General Chat',
    invite:             'Invite',
    mic:                'Mic',
    demo:               'Screen',
    leave:              'Leave',
    room:               'Room:',
    msgPlaceholder:     'Write a message…',
    screenPresenter:    'unknown',
    youPresenter:       '(you)',
  },
  ru: {
    greeting:           'Привет! Кто ты?',
    chooseAvatar:       'Выбери аватарку и введи никнейм',
    nickname:           'Никнейм',
    nicknamePlaceholder:'например: Nazar',
    createRoom:         'Создать комнату',
    or:                 'или',
    joiningRoom:        'Вступаешь в комнату',
    joinRoom:           'Войти в комнату',
    connecting:         'Подключаемся…',
    waitingCloud:       'Ожидание PeerJS облака…',
    creatingRoom:       'Создаём комнату…',
    connectingCloud:    'Подключаемся к PeerJS облаку…',
    joiningRoomConn:    'Входим в комнату…',
    connectingToHost:   'Подключаемся к хосту…',
    micConnected:       'Микрофон подключён 🎙️',
    micUnavailable:     'Микрофон недоступен — только чат',
    roomCreated:        'Комната создана! Ты хост 👑',
    connectedToRoom:    'Подключён к комнате 🌀',
    connError:          'Ошибка подключения: ',
    hostUnavailable:    'Хост недоступен. Проверь ссылку.',
    disconnected:       'Соединение потеряно. Переподключение…',
    onlineBadge:        'Онлайн',
    offlineBadge:       'Отключён',
    connectingBadge:    'Подключение…',
    micMuted:           'Микрофон выключен 🔇',
    micUnmuted:         'Микрофон включён 🎙️',
    screenStarted:      'Демонстрация экрана начата 🖥️',
    screenStopped:      'Демонстрация остановлена',
    screenError:        'Ошибка демонстрации: ',
    linkCopied:         'Ссылка скопирована! 📋',
    leaveConfirm:       'Покинуть комнату?',
    emptyChat:          'Чат пустой',
    emptyChatSub:       'Пригласи друга по ссылке и начните общаться!',
    joinedRoom:         'присоединился к комнате',
    leftRoom:           'покинул комнату',
    screenShareStart:   'начал демонстрацию экрана',
    screenShareStop:    'остановил демонстрацию',
    unknownUser:        'Неизвестный',
    myProfile:          'Мой профиль',
    members:            'УЧАСТНИКИ',
    host:               'Хост',
    member:             'Участник',
    muted:              'Молчит',
    you:                '(ты)',
    screenDemo:         'Демонстрация экрана',
    generalChat:        'Общий чат',
    invite:             'Пригласить',
    mic:                'Мик',
    demo:               'Демо',
    leave:              'Выйти',
    room:               'Комната:',
    msgPlaceholder:     'Напиши сообщение…',
    screenPresenter:    'неизвестно',
    youPresenter:       '(ты)',
  },
};

let currentLang = localStorage.getItem('swacord_lang') || 'en';

/** Get translation string */
function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.uk)[key] || key;
}

/** Apply current language to all [data-i18n] elements */
function applyLang() {
  document.getElementById('htmlRoot').lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update live app strings if app is already running
  const msgInput = document.getElementById('msgInput');
  if (msgInput) msgInput.placeholder = t('msgPlaceholder');

  const memberCountEl = document.getElementById('memberCount');
  const memberLabelEl = document.querySelector('.sidebar-section-label');
  if (memberLabelEl && memberCountEl) {
    memberLabelEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
      ${t('members')} — <span id="memberCount">${memberCountEl.textContent}</span>
    `;
  }

  // Update lang button active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });

  localStorage.setItem('swacord_lang', currentLang);
}

/** Init language switcher buttons */
function initLangSwitcher() {
  document.getElementById('langSwitcher').addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.getAttribute('data-lang');
    if (lang === currentLang) return;
    currentLang = lang;
    applyLang();
    toast(
      lang === 'uk' ? '🇺🇦 Українська' : lang === 'en' ? '🇬🇧 English' : '🇷🇺 Русский',
      'info', 1800
    );
  });
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
   ══════════════════════════════════════════════════════════ */
const AVATARS = [
  '😎','🦊','🐉','🌊','🌙','⚡','🔥','🌈',
  '🎮','🦄','🐺','🌸','🍕','🦋','🎭','🚀',
  '🐸','🎵','💎','🌿','🦅','🐙','🎯','🧊',
  '🐻','🌺','💜','🎸','🦁','🐧','🧙','🌟',
];

const MSG_TYPES = {
  INIT:          'init',
  CHAT:          'chat',
  SYSTEM:        'system',
  MIC:           'mic_state',
  SCREEN:        'screen_state',
  // Moderation (host → peer)
  KICK:          'kick',
  BAN:           'ban',
  MUTE_FORCE:    'mute_force',
  STOP_SCREEN:   'stop_screen',
  TRANSFER_HOST: 'transfer_host',
};

/* Banned peer IDs for this session */
const bannedPeers = new Set(
  JSON.parse(localStorage.getItem('swacord_banned') || '[]')
);
function persistBanned() {
  localStorage.setItem('swacord_banned', JSON.stringify([...bannedPeers]));
}

/* ══════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════ */
const state = {
  peer:            null,
  myId:            null,
  roomId:          null,   // host's peer ID
  isHost:          false,
  serverMode:      false,  // whether chat is saved on Vercel
  launched:        false,

  // Profile
  myName:          '',
  myAvatar:        AVATARS[0],

  // Peers map: peerId -> { name, avatar, conn (data), call, micMuted, sharing }
  peers:           new Map(),

  // Media
  localStream:     null,   // mic audio
  screenStream:    null,   // screen video
  isMicMuted:      false,
  isSharingScreen: false,

  // Calls: peerId -> MediaConnection (audio)
  activeCalls:     new Map(),

  // Screen share calls: peerId -> MediaConnection (video only)
  screenCalls:     new Map(),

  // Data connections: peerId -> DataConnection
  dataConns:       new Map(),

  // Chat
  lastMsgAuthor:   null,
  lastMsgTime:     null,

  // Screen quality settings (persisted)
  screenQuality: JSON.parse(localStorage.getItem('swacord_screen_quality') || 'null') || {
    width: 1920, height: 1080, fps: 60,
  },
};

/* ══════════════════════════════════════════════════════════
   DOM REFS
   ══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const DOM = {
  overlay:          $('overlay'),
  stepProfile:      $('step-profile'),
  stepConnecting:   $('step-connecting'),
  connectingTitle:  $('connectingTitle'),
  connectingSub:    $('connectingSubtitle'),

  avatarGrid:       $('avatarGrid'),
  avatarPreview:    $('avatarPreview'),
  nicknameInput:    $('nicknameInput'),
  btnCreate:        $('btnCreateRoom'),
  btnJoin:          $('btnJoinRoom'),
  joinHint:         $('joinHint'),
  joinRoomId:       $('joinRoomId'),

  app:              $('app'),
  sidebar:          $('sidebar'),
  memberList:       $('memberList'),
  memberCount:      $('memberCount'),
  myProfile:        $('myProfile'),
  connectionBadge:  $('connectionBadge'),

    videoArea:        $('videoArea'),
  videoPresenter:   $('videoPresenter'),
  remoteVideo:      $('remoteVideo'),
  localVideo:       $('localVideo'),

  chatArea:         $('chatArea'),
  messagesWrap:     $('messagesWrap'),
  msgInput:         $('msgInput'),
  btnSend:          $('btnSend'),
  btnCopyLink:      $('btnCopyLink'),

  controlBar:       $('controlBar'),
  roomIdDisplay:    $('roomIdDisplay'),
  btnMic:           $('btnMic'),
  iconMicOn:        $('iconMicOn'),
  iconMicOff:       $('iconMicOff'),
  btnScreen:        $('btnScreen'),
  iconScreenOff:    $('iconScreenOff'),
  iconScreenOn:     $('iconScreenOn'),
  btnCopyLinkBar:   $('btnCopyLinkBar'),
  btnLeave:         $('btnLeave'),
  toastContainer:   $('toastContainer'),
};

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
function init() {
  applyLang();
  initLangSwitcher();
  buildAvatarGrid();
  checkRoomInUrl();
  bindOnboardingEvents();
}

/** Build emoji avatar picker */
function buildAvatarGrid() {
  AVATARS.forEach((emoji, i) => {
    const btn = document.createElement('button');
    btn.className = 'avatar-opt' + (i === 0 ? ' selected' : '');
    btn.textContent = emoji;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-label', emoji);
    btn.addEventListener('click', () => selectAvatar(emoji, btn));
    DOM.avatarGrid.appendChild(btn);
  });
}

function selectAvatar(emoji, btn) {
  document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.myAvatar = emoji;
  DOM.avatarPreview.textContent = emoji;
  DOM.avatarPreview.style.transform = 'scale(1.2)';
  setTimeout(() => DOM.avatarPreview.style.transform = '', 200);
}

/** Check ?room= param in URL to decide host vs. guest */
function checkRoomInUrl() {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    state.roomId = roomParam;
    state.serverMode = roomParam.startsWith('v_');
    
    // Hide create UI
    const modeSwitch = document.getElementById('modeSwitchContainer');
    const divider = document.getElementById('onboardingDivider');
    if (modeSwitch) modeSwitch.style.display = 'none';
    if (divider) divider.style.display = 'none';
    DOM.btnCreate.style.display = 'none';

    // Show join UI
    DOM.joinHint.style.display = 'flex';
    DOM.joinRoomId.textContent = roomParam.substring(0, 12) + '…';
    DOM.btnJoin.style.display = 'flex';
  }
}

/* ══════════════════════════════════════════════════════════
   ONBOARDING EVENTS
   ══════════════════════════════════════════════════════════ */
function bindOnboardingEvents() {
  DOM.nicknameInput.addEventListener('input', () => {
    const val = DOM.nicknameInput.value.trim();
    const valid = val.length >= 1 && val.length <= 24;
    DOM.btnCreate.disabled = !valid;
    DOM.btnJoin.disabled   = !valid;
  });

  DOM.nicknameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (state.roomId) DOM.btnJoin.click();
      else DOM.btnCreate.click();
    }
  });

  DOM.btnCreate.addEventListener('click', onCreateRoom);
  DOM.btnJoin.addEventListener('click', onJoinRoom);
}

async function onCreateRoom() {
  const name = DOM.nicknameInput.value.trim();
  if (!name) return;
  state.myName   = name;
  
  const modeSwitch = document.getElementById('modeSwitch');
  state.serverMode = modeSwitch ? modeSwitch.checked : false;
  
  if (state.serverMode) {
    state.roomId = 'v_' + Math.random().toString(36).substr(2, 9);
    state.isHost = true;
  } else {
    state.roomId = null; 
    state.isHost = true;
  }

  showConnecting(t('creatingRoom'), t('connectingCloud'));
  await initMedia();
  createPeer(null); 
}

async function onJoinRoom() {
  const name = DOM.nicknameInput.value.trim();
  if (!name) return;
  state.myName = name;
  state.isHost  = false;

  showConnecting(t('joiningRoomConn'), t('connectingCloud'));
  await initMedia();
  createPeer(null);
}

function showConnecting(title, sub) {
  DOM.stepProfile.classList.remove('active');
  DOM.stepConnecting.classList.add('active');
  DOM.connectingTitle.textContent = title;
  DOM.connectingSub.textContent   = sub;
}

/* ══════════════════════════════════════════════════════════
   MICROPHONE
   ══════════════════════════════════════════════════════════ */
async function initMedia() {
  if (!state.localStream) {
    state.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
      },
      video: false 
    });
  }
}

/* ══════════════════════════════════════════════════════════
   PEER CREATION
   ══════════════════════════════════════════════════════════ */
function createPeer(customId) {
  const options = {
    debug: 0,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    },
  };

  state.peer = customId ? new Peer(customId, options) : new Peer(options);

  state.peer.on('open', peerId => {
    state.myId = peerId;
    console.log('[SwaCord] My PeerID:', peerId);

    if (state.serverMode) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', state.roomId);
      window.history.replaceState({}, '', url.toString());
      
      startVercelHeartbeat();
      launchApp();
    } else {
      if (state.isHost) {
        state.roomId = peerId;
        const url = new URL(window.location.href);
        url.searchParams.set('room', peerId);
        window.history.replaceState({}, '', url.toString());
        launchApp();
      } else {
        DOM.connectingSub.textContent = t('connectingToHost');
        connectToPeer(state.roomId);
      }
    }
  });

  state.peer.on('call', call => {
    // Screen share calls come with metadata {type:'screen'}
    if (call.metadata?.type === 'screen') {
      call.answer(new MediaStream());
      call.on('stream', stream => showRemoteVideo(stream, call.peer));
      call.on('close', () => {
        state.screenCalls.delete(call.peer);
        hideRemoteVideo();
      });
      state.screenCalls.set(call.peer, call);
    } else {
      handleIncomingCall(call);
    }
  });
  state.peer.on('connection', handleIncomingData);
  state.peer.on('error', err => {
    console.error('[PeerJS Error]', err);
    toast('PeerJS: ' + err.type, 'error');
    if (err.type === 'peer-unavailable') {
      toast(t('hostUnavailable'), 'error');
    }
  });
  state.peer.on('disconnected', () => {
    setBadge('offline', t('offlineBadge'));
    toast(t('disconnected'), 'error');
    state.peer.reconnect();
  });
  state.peer.on('close', () => setBadge('offline', t('offlineBadge')));
}

/* ══════════════════════════════════════════════════════════
   HOST: LAUNCH APP
   ══════════════════════════════════════════════════════════ */
async function launchApp() {
  if (state.launched) return;
  state.launched = true;

  DOM.overlay.classList.remove('active');
  setTimeout(() => DOM.overlay.style.display = 'none', 400);

  DOM.app.style.display        = '';
  DOM.controlBar.style.display = '';

  DOM.roomIdDisplay.textContent = state.roomId.substring(0, 14) + '…';

  setBadge('online', t('onlineBadge'));
  renderMyProfile();
  addMyselfToList();

  bindAppEvents();

  // Load chat history depending on mode
  if (state.serverMode) {
    await fetchVercelChatHistory();
  } else {
    loadChatHistory();
  }

  toast(state.isHost ? t('roomCreated') : t('connectedToRoom'), 'success');
}

/* ══════════════════════════════════════════════════════════
   GUEST: CONNECT TO HOST
   ══════════════════════════════════════════════════════════ */
function connectToPeer(peerId) {
  // 1. Data connection
  const dataConn = state.peer.connect(peerId, { reliable: true, serialization: 'json' });
  setupDataConnection(dataConn);

  // 2. Voice call
  if (state.localStream) {
    const call = state.peer.call(peerId, state.localStream);
    setupCall(call, peerId);
  }

  dataConn.on('open', () => {
    // App launches after data channel opens
    launchApp();
    sendInit(dataConn);
  });

  dataConn.on('error', err => {
    console.error('DataConn error:', err);
    toast(t('connError') + err.message, 'error');
  });
}

/* ══════════════════════════════════════════════════════════
   INCOMING CONNECTIONS (HOST SIDE)
   ══════════════════════════════════════════════════════════ */
function handleIncomingCall(call) {
  console.log('[SwaCord] Incoming call from', call.peer);
  call.answer(state.localStream);
  setupCall(call, call.peer);
}

function handleIncomingData(conn) {
  console.log('[SwaCord] Incoming data conn from', conn.peer);
  // Reject banned peers immediately
  if (bannedPeers.has(conn.peer)) {
    console.warn('[SwaCord] Rejected banned peer:', conn.peer);
    conn.close();
    return;
  }
  setupDataConnection(conn);
  conn.on('open', () => sendInit(conn));
}

/* ══════════════════════════════════════════════════════════
   DATA CONNECTION SETUP
   ══════════════════════════════════════════════════════════ */
function setupDataConnection(conn) {
  state.dataConns.set(conn.peer, conn);

  if (!state.peers.has(conn.peer)) {
    state.peers.set(conn.peer, { name: t('unknownUser'), avatar: '❓', micMuted: false, sharing: false });
  }

  conn.on('data', data => handleDataMessage(conn.peer, data));

  conn.on('close', () => {
    const peer = state.peers.get(conn.peer);
    const name = peer?.name || conn.peer;
    addSystemMessage(`${peer?.avatar || ''} ${name} ${t('leftRoom')}`);
    removePeer(conn.peer);
  });

  conn.on('error', err => console.error('DataConn error:', err));
}

/* ══════════════════════════════════════════════════════════
   CALL SETUP (VOICE + VIDEO STREAM)
   ══════════════════════════════════════════════════════════ */
function setupCall(call, peerId) {
  state.activeCalls.set(peerId, call);

  call.on('stream', remoteStream => {
    console.log('[SwaCord] Got remote stream from', peerId);
    playRemoteAudio(remoteStream, peerId);

    // If stream has video track → show video area
    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 0) {
      showRemoteVideo(remoteStream, peerId);
    }

    // Listen for track addition (dynamic screen share)
    remoteStream.addEventListener('addtrack', () => {
      const vt = remoteStream.getVideoTracks();
      if (vt.length > 0) showRemoteVideo(remoteStream, peerId);
    });
  });

  call.on('close', () => {
    console.log('[SwaCord] Call closed from', peerId);
    state.activeCalls.delete(peerId);
    // Remove remote audio element
    const el = document.getElementById('audio-' + peerId);
    if (el) el.remove();
  });

  call.on('error', err => console.error('Call error:', err));
}

/* Play remote audio in a hidden <audio> element */
function playRemoteAudio(stream, peerId) {
  let el = document.getElementById('audio-' + peerId);
  if (!el) {
    el = document.createElement('audio');
    el.id = 'audio-' + peerId;
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  // Only set audio (filter out video for dedicated video element)
  const audioStream = new MediaStream(stream.getAudioTracks());
  el.srcObject = audioStream;
}

/* ══════════════════════════════════════════════════════════
   HANDLE INCOMING DATA MESSAGES
   ══════════════════════════════════════════════════════════ */
function handleDataMessage(peerId, data) {
  console.log('[SwaCord] Message from', peerId, data);

  switch (data.type) {
    case MSG_TYPES.INIT:          onPeerInit(peerId, data); break;
    case MSG_TYPES.CHAT:          onChatMessage(peerId, data); break;
    case MSG_TYPES.MIC:           onMicStateChange(peerId, data); break;
    case MSG_TYPES.SCREEN:        onScreenStateChange(peerId, data); break;
    case MSG_TYPES.KICK:          onKicked(); break;
    case MSG_TYPES.BAN:           onBanned(); break;
    case MSG_TYPES.MUTE_FORCE:    onForceMuted(); break;
    case MSG_TYPES.STOP_SCREEN:   onStopScreenCmd(); break;
    case MSG_TYPES.TRANSFER_HOST: onTransferHost(data); break;
    case 'server_mode':
      const changed = (state.serverMode !== data.enabled);
      state.serverMode = data.enabled; 
      if (changed && !state.isHost) {
        DOM.messagesWrap.innerHTML = '';
        if (state.serverMode) {
          fetchVercelChatHistory();
        } else {
          loadChatHistory();
        }
      }
      break;
    default: console.warn('Unknown message type:', data.type);
  }
}

function onPeerInit(peerId, data) {
  const isFirstTime = !state.peers.has(peerId) || !state.peers.get(peerId)?.name;
  const existing = state.peers.get(peerId) || {};
  state.peers.set(peerId, {
    ...existing,
    name:   data.name,
    avatar: data.avatar,
  });
  refreshMemberList();

  // Show join message only once per peer (not on every init re-send)
  if (isFirstTime) {
    addSystemMessage(`${data.avatar} <strong>${escHtml(data.name)}</strong> ${t('joinedRoom')}`);
  }
  // NOTE: We do NOT send init back here — that caused an infinite ping-pong loop.
  // Both sides already send init once when the DataChannel opens.
}


function onChatMessage(peerId, data) {
  const peer = state.peers.get(peerId);
  appendMessage({
    authorId:  peerId,
    authorName: peer?.name || t('unknownUser'),
    avatar:    peer?.avatar || '❓',
    text:      data.text,
    time:      data.time || Date.now(),
    isSelf:    false,
  });
}

function onMicStateChange(peerId, data) {
  const peer = state.peers.get(peerId);
  if (peer) {
    peer.micMuted = data.muted;
    refreshMemberList();
  }
}

function onScreenStateChange(peerId, data) {
  const peer = state.peers.get(peerId);
  if (peer) {
    peer.sharing = data.sharing;
    if (!data.sharing) hideRemoteVideo();
    refreshMemberList();
  }
}

/* ══════════════════════════════════════════════════════════
   SEND HELPERS
   ══════════════════════════════════════════════════════════ */
function sendInit(conn) {
  conn.send({ 
    type: MSG_TYPES.INIT, 
    name: state.myName, 
    avatar: state.myAvatar,
    micMuted: state.isMicMuted,
    sharing: state.isSharingScreen
  });
}

function broadcastData(data) {
  state.dataConns.forEach(conn => {
    if (conn.open) conn.send(data);
  });
}

function sendToPeer(peerId, data) {
  const conn = state.dataConns.get(peerId);
  if (conn?.open) conn.send(data);
}

/* ══════════════════════════════════════════════════════════
   MODERATION (host actions)
   ══════════════════════════════════════════════════════════ */
function modKick(peerId) {
  sendToPeer(peerId, { type: MSG_TYPES.KICK });
  const conn = state.dataConns.get(peerId);
  setTimeout(() => conn?.close(), 500);
  toast(`🥾 Kicked`, 'info');
}

function modBan(peerId) {
  sendToPeer(peerId, { type: MSG_TYPES.BAN });
  bannedPeers.add(peerId);
  persistBanned();
  const conn = state.dataConns.get(peerId);
  setTimeout(() => conn?.close(), 500);
  toast(`🚫 Banned`, 'info');
}

function modMute(peerId) {
  sendToPeer(peerId, { type: MSG_TYPES.MUTE_FORCE });
  toast(`🔇 Muted`, 'info');
}

function modStopScreen(peerId) {
  sendToPeer(peerId, { type: MSG_TYPES.STOP_SCREEN });
  toast(`🛑 Screen stopped`, 'info');
}

function modTransferHost(peerId) {
  if (!confirm(`Transfer host to ${state.peers.get(peerId)?.name}?`)) return;
  
  if (state.serverMode) {
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: state.roomId, peerId: state.myId, targetPeerId: peerId, action: 'transfer' })
    });
  } else {
    broadcastData({ type: MSG_TYPES.TRANSFER_HOST, newHostId: peerId });
  }

  state.isHost = false;
  renderMyProfile();
  refreshMemberList();
  toast('👑 Host transferred', 'info');
}

/* Received by kicked peer */
function onKicked() {
  alert('You have been kicked from the room.');
  leaveRoomSilent();
}

/* Received by banned peer */
function onBanned() {
  alert('You have been banned from the room.');
  leaveRoomSilent();
}

/* Received by muted peer */
function onForceMuted() {
  if (!state.isMicMuted) toggleMic();
  toast('🔇 Host muted you', 'error', 4000);
}

/* Received by peer sharing screen */
function onStopScreenCmd() {
  if (state.isSharingScreen) stopScreenShare();
  toast('🛑 Host stopped your screen share', 'error', 4000);
}

/* Received by new host */
function onTransferHost(data) {
  if (data.newHostId === state.myId) {
    state.isHost = true;
    state.roomId = state.myId;
    renderMyProfile();
    refreshMemberList();
    toast('👑 You are now the host!', 'success', 5000);
  }
}

/* ══════════════════════════════════════════════════════════
   APP UI EVENTS
   ══════════════════════════════════════════════════════════ */
function bindAppEvents() {
  // Send message
  DOM.btnSend.addEventListener('click', sendChatMessage);
  DOM.msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Mic toggle
  DOM.btnMic.addEventListener('click', toggleMic);

  // Screen share
  DOM.btnScreen.addEventListener('click', toggleScreenShare);
  const btnScreenSettings = document.getElementById('btnScreenSettings');
  if (btnScreenSettings) btnScreenSettings.addEventListener('click', openQualityModal);

  // Fullscreen button
  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const videoWrapper = document.getElementById('videoWrapper');
      if (!document.fullscreenElement) {
        videoWrapper.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Copy link
  [DOM.btnCopyLink, DOM.btnCopyLinkBar].forEach(btn => {
    if (btn) btn.addEventListener('click', copyInviteLink);
  });

  // Leave
  DOM.btnLeave.addEventListener('click', leaveRoom);
}

/* ══════════════════════════════════════════════════════════
   CHAT
   ══════════════════════════════════════════════════════════ */
function sendChatMessage() {
  const text = DOM.msgInput.value.trim();
  if (!text) return;

  const now = Date.now();

  // Show locally
  appendMessage({
    authorId:   state.myId,
    authorName: state.myName,
    avatar:     state.myAvatar,
    text,
    time:       now,
    isSelf:     true,
  });

  // Broadcast
  broadcastData({ type: MSG_TYPES.CHAT, text, time: now });

  DOM.msgInput.value = '';
  DOM.msgInput.focus();
}

function appendMessage({ authorId, authorName, avatar, text, time, isSelf, isHistory }) {
  // Remove empty state placeholder
  const empty = DOM.messagesWrap.querySelector('.empty-chat');
  if (empty) empty.remove();

  const now = new Date(time);
  const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  // Check if this is a continued message (same author within 3 min)
  const isContinued =
    state.lastMsgAuthor === authorId &&
    state.lastMsgTime   &&
    (time - state.lastMsgTime) < 3 * 60 * 1000;

  const div = document.createElement('div');
  div.className = 'msg fade-in' + (isContinued ? ' continued' : '') + (isHistory ? ' msg-history' : '');

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-author${isSelf ? ' self' : ''}">${escHtml(authorName)}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-text">${linkify(escHtml(text))}</div>
    </div>
  `;

  DOM.messagesWrap.appendChild(div);
  scrollToBottom();

  state.lastMsgAuthor = authorId;
  state.lastMsgTime   = time;

  // Persist to localStorage (only live messages, not history replays)
  if (!isHistory) saveMsgToHistory({ authorId, authorName, avatar, text, time, isSelf });
}

/* ══════════════════════════════════════════════════════════
   CHAT HISTORY (localStorage)
   ══════════════════════════════════════════════════════════ */
const CHAT_KEY = 'swacord_chat_history';
const CHAT_MAX = 200;

function saveMsgToHistory(msg) {
  try {
    const history = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    history.push({ authorId: msg.authorId, authorName: msg.authorName, avatar: msg.avatar, text: msg.text, time: msg.time, isSelf: msg.isSelf });
    if (history.length > CHAT_MAX) history.splice(0, history.length - CHAT_MAX);
    localStorage.setItem(CHAT_KEY, JSON.stringify(history));
  } catch(e) { console.warn('Chat save error:', e); }
}

function loadChatHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    if (!history.length) { renderEmptyChat(); return; }

    // Show history header
    const sep = document.createElement('div');
    sep.className = 'msg-system';
    sep.innerHTML = `<span>📜 P2P Local History</span>`;
    DOM.messagesWrap.appendChild(sep);

    // Replay messages dimmed
    history.forEach(msg => appendMessage({ ...msg, isHistory: true }));

    // New session separator
    const sep2 = document.createElement('div');
    sep2.className = 'msg-system';
    sep2.innerHTML = `<span>✨ New session</span>`;
    DOM.messagesWrap.appendChild(sep2);
    state.lastMsgAuthor = null;
    state.lastMsgTime   = null;
  } catch(e) { console.warn('Chat load error:', e); renderEmptyChat(); }
}

async function fetchVercelChatHistory() {
  try {
    const res = await fetch(`/api/chat?room=${state.roomId}`);
    if (!res.ok) throw new Error('Vercel API error');
    const history = await res.json();
    
    if (!history || !history.length) { renderEmptyChat(); return; }

    const sep = document.createElement('div');
    sep.className = 'msg-system';
    sep.innerHTML = `<span>☁️ Server History (Vercel)</span>`;
    DOM.messagesWrap.appendChild(sep);

    history.forEach(msg => {
      const parsed = typeof msg === 'string' ? JSON.parse(msg) : msg;
      appendMessage({ ...parsed, isSelf: parsed.authorId === state.myId, isHistory: true });
    });

    const sep2 = document.createElement('div');
    sep2.className = 'msg-system';
    sep2.innerHTML = `<span>✨ New session</span>`;
    DOM.messagesWrap.appendChild(sep2);
    state.lastMsgAuthor = null;
    state.lastMsgTime   = null;
  } catch(e) {
    console.warn('Vercel chat fetch error:', e);
    renderEmptyChat();
  }
}

async function postVercelChat(msg) {
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: state.roomId, msg })
    });
  } catch(e) {
    console.warn('Vercel chat post error:', e);
  }
}

function addSystemMessage(html) {
  const div = document.createElement('div');
  div.className = 'msg-system fade-in';
  div.innerHTML = `<span>${html}</span>`;
  DOM.messagesWrap.appendChild(div);
  scrollToBottom();
  // Reset grouping after system msg
  state.lastMsgAuthor = null;
  state.lastMsgTime   = null;
}

function renderEmptyChat() {
  DOM.messagesWrap.innerHTML = `
    <div class="empty-chat">
      <div class="empty-chat-icon">💬</div>
      <div class="empty-chat-title">${t('emptyChat')}</div>
      <div class="empty-chat-sub">${t('emptyChatSub')}</div>
    </div>
  `;
}

function scrollToBottom() {
  DOM.messagesWrap.scrollTop = DOM.messagesWrap.scrollHeight;
}

/* ══════════════════════════════════════════════════════════
   MIC TOGGLE
   ══════════════════════════════════════════════════════════ */
function toggleMic() {
  state.isMicMuted = !state.isMicMuted;

  if (state.localStream) {
    state.localStream.getAudioTracks().forEach(t => t.enabled = !state.isMicMuted);
  }

  // Update UI
  if (state.isMicMuted) {
    DOM.btnMic.classList.remove('active');
    DOM.iconMicOn.style.display  = 'none';
    DOM.iconMicOff.style.display = '';
    DOM.btnMic.style.color       = 'var(--red)';
  } else {
    DOM.btnMic.classList.add('active');
    DOM.iconMicOn.style.display  = '';
    DOM.iconMicOff.style.display = 'none';
    DOM.btnMic.style.color       = '';
  }

  // Notify peers
  broadcastData({ type: MSG_TYPES.MIC, muted: state.isMicMuted });
  refreshMemberList();

  toast(state.isMicMuted ? t('micMuted') : t('micUnmuted'), 'info');
}

/* ══════════════════════════════════════════════════════════
   SCREEN SHARE
   ══════════════════════════════════════════════════════════ */
async function toggleScreenShare() {
  if (state.isSharingScreen) {
    stopScreenShare();
  } else {
    await startScreenShare();
  }
}

async function startScreenShare() {
  const q = state.screenQuality;
  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor:    'always',
        width:     { ideal: q.width },
        height:    { ideal: q.height },
        frameRate: { ideal: q.fps },
      },
      audio: false,
    });

    const videoTrack = state.screenStream.getVideoTracks()[0];

    // Start a SEPARATE PeerJS call for each peer (screen only, with metadata)
    state.dataConns.forEach((conn, peerId) => {
      const screenCall = state.peer.call(peerId, state.screenStream, {
        metadata: { type: 'screen' },
      });
      screenCall.on('stream', () => {}); // required listener
      screenCall.on('error', err => console.warn('Screen call error:', err));
      state.screenCalls.set(peerId, screenCall);
    });

    // FIX: Host sees own screen in main video area (was black before — remoteVideo was empty)
    DOM.remoteVideo.srcObject    = state.screenStream;
    DOM.localVideo.srcObject     = null;
    DOM.localVideo.style.display = 'none'; // hide empty PiP for sharer
    DOM.videoArea.style.display  = '';
    DOM.videoPresenter.textContent = `-- ${state.myName} ${t('youPresenter')}`;

    state.isSharingScreen = true;
    DOM.btnScreen.classList.add('sharing');
    DOM.iconScreenOff.style.display = 'none';
    DOM.iconScreenOn.style.display  = '';

    broadcastData({ type: MSG_TYPES.SCREEN, sharing: true });
    addSystemMessage(`🖥️ <strong>${state.myName}</strong> ${t('screenShareStart')}`);
    toast(`${t('screenStarted')} (${q.width}x${q.height} @ ${q.fps}fps)`, 'success');

    // Handle user stopping share via browser's native stop button
    videoTrack.addEventListener('ended', () => stopScreenShare());
  } catch (err) {
    if (err.name !== 'NotAllowedError') {
      console.error('Screen share error:', err);
      toast(t('screenError') + err.message, 'error');
    }
  }
}

function stopScreenShare() {
  if (!state.isSharingScreen) return;

  // Stop all screen tracks
  if (state.screenStream) {
    state.screenStream.getTracks().forEach(track => track.stop());
    state.screenStream = null;
  }

  // Close dedicated screen MediaConnections
  state.screenCalls.forEach(call => call.close());
  state.screenCalls.clear();

  DOM.localVideo.srcObject     = null;
  DOM.localVideo.style.display = '';   // restore PiP visibility
  DOM.remoteVideo.srcObject    = null;
  DOM.videoArea.style.display  = 'none';

  state.isSharingScreen = false;
  DOM.btnScreen.classList.remove('sharing');
  DOM.iconScreenOff.style.display = '';
  DOM.iconScreenOn.style.display  = 'none';

  broadcastData({ type: MSG_TYPES.SCREEN, sharing: false });
  addSystemMessage(`🛑 <strong>${state.myName}</strong> ${t('screenShareStop')}`);
  toast(t('screenStopped'), 'info');
}

/* Show remote video in the main video block */
function showRemoteVideo(stream, peerId) {
  const videoTracks = stream.getVideoTracks();
  if (!videoTracks.length) return;

  const videoStream = new MediaStream(videoTracks);
  DOM.remoteVideo.srcObject = videoStream;
  DOM.videoArea.style.display = '';

  const peer = state.peers.get(peerId);
  DOM.videoPresenter.textContent = `— ${peer?.name || peerId}`;
}

function hideRemoteVideo() {
  DOM.remoteVideo.srcObject = null;
  if (!state.isSharingScreen) {
    DOM.videoArea.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════════════════
   MEMBER LIST
   ══════════════════════════════════════════════════════════ */
function addMyselfToList() {
  refreshMemberList();
}

function removePeer(peerId) {
  state.peers.delete(peerId);
  state.dataConns.delete(peerId);
  refreshMemberList();
}

function refreshMemberList() {
  DOM.memberList.innerHTML = '';
  DOM.memberCount.textContent = state.peers.size + 1; // +1 for self
  // Update section label with correct language
  const sectionLabel = document.querySelector('.sidebar-section-label');
  if (sectionLabel) {
    sectionLabel.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
      ${t('members')} — <span id="memberCount">${state.peers.size + 1}</span>
    `;
  }

  // Self
  DOM.memberList.appendChild(buildMemberItem({
    id:       state.myId,
    name:     state.myName,
    avatar:   state.myAvatar,
    isHost:   state.isHost,
    micMuted: state.isMicMuted,
    isSelf:   true,
  }));

  // Others
  state.peers.forEach((peer, peerId) => {
    DOM.memberList.appendChild(buildMemberItem({
      id:       peerId,
      name:     peer.name,
      avatar:   peer.avatar,
      isHost:   peerId === state.roomId,
      micMuted: peer.micMuted,
      sharing:  peer.sharing,
      isSelf:   false,
    }));
  });
}

function buildMemberItem({ id, name, avatar, isHost, micMuted, isSelf, sharing }) {
  const li = document.createElement('li');
  li.className = 'member-item fade-in';

  // Host moderation actions (only visible to host, only on non-self members)
  const canMod = state.isHost && !isSelf;
  const modActionsHtml = canMod ? `
    <div class="mod-actions">
      <button class="mod-btn" title="Mute" data-action="mute" data-peer="${id}">🔇</button>
      ${sharing ? `<button class="mod-btn" title="Stop Screen" data-action="stopscreen" data-peer="${id}">🛑</button>` : ''}
      <button class="mod-btn" title="Transfer Host" data-action="transferhost" data-peer="${id}">👑</button>
      <button class="mod-btn mod-btn-kick" title="Kick" data-action="kick" data-peer="${id}">🥾</button>
      <button class="mod-btn mod-btn-ban" title="Ban" data-action="ban" data-peer="${id}">🚫</button>
    </div>
  ` : '';

  li.innerHTML = `
    <div class="member-avatar">
      ${avatar}
      <div class="status-dot"></div>
      ${micMuted ? '<div class="mic-muted-overlay">🔇</div>' : ''}
    </div>
    <div class="member-info">
      <div class="member-name">${escHtml(name)}${isSelf ? ` <span style="color:var(--text-muted);font-size:.72rem">${t('you')}</span>` : ''}</div>
      <div class="member-status">${isHost ? `👑 ${t('host')}` : `🎙️ ${t('member')}`}${micMuted ? ` · 🔇 ${t('muted')}` : ''}${sharing ? ' · 🖥️' : ''}</div>
    </div>
    <div class="member-badges">
      ${isHost ? '<span class="badge-host">HOST</span>' : ''}
    </div>
    ${modActionsHtml}
  `;

  // Bind moderation button events
  if (canMod) {
    li.querySelectorAll('.mod-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const peerId = btn.dataset.peer;
        if (action === 'kick')         modKick(peerId);
        else if (action === 'ban')     modBan(peerId);
        else if (action === 'mute')    modMute(peerId);
        else if (action === 'stopscreen') modStopScreen(peerId);
        else if (action === 'transferhost') modTransferHost(peerId);
      });
    });
  }

  return li;
}

function renderMyProfile() {
  DOM.myProfile.innerHTML = `
    <div class="member-avatar" style="border-color:var(--accent-500);box-shadow:0 0 10px var(--accent-glow)">
      ${state.myAvatar}
    </div>
    <div class="member-info">
      <div class="member-name">${escHtml(state.myName)}</div>
      <div class="member-status">${state.isHost ? `👑 ${t('host')}` : `🎙️ ${t('member')}`}</div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════════ */
function copyInviteLink() {
  const url = new URL(window.location.href);
  url.searchParams.set('room', state.roomId);
  navigator.clipboard.writeText(url.toString()).then(() => {
    toast(t('linkCopied'), 'success');
  }).catch(() => {
    // Fallback
    prompt('Скопіюй посилання:', url.toString());
  });
}

function leaveRoom() {
  if (!confirm(t('leaveConfirm'))) return;

  if (state.isHost && state.peers.size > 0) {
    let text = "Кому передати права хоста?\n";
    let index = 1;
    const peerArr = Array.from(state.peers.entries());
    peerArr.forEach(([id, p]) => {
      text += `${index}. ${p.name}\n`;
      index++;
    });
    text += "\nВведіть номер (або залиште пустим для авто-вибору):";
    
    const choice = prompt(text);
    if (choice) {
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < peerArr.length) {
        const targetPeerId = peerArr[idx][0];
        if (state.serverMode) {
          fetch('/api/room', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: state.roomId, peerId: state.myId, targetPeerId, action: 'transfer' })
          });
        } else {
          broadcastData({ type: MSG_TYPES.TRANSFER_HOST, newHostId: targetPeerId });
        }
      }
    } else if (!state.serverMode) {
       const [firstPeerId] = peerArr[0];
       broadcastData({ type: MSG_TYPES.TRANSFER_HOST, newHostId: firstPeerId });
    }
  }

  leaveRoomSilent();
}

function leaveRoomSilent() {
  state.screenCalls.forEach(call => call.close());
  state.activeCalls.forEach(call => call.close());
  state.dataConns.forEach(conn => conn.close());
  if (state.peer) state.peer.destroy();
  if (state.localStream) state.localStream.getTracks().forEach(track => track.stop());
  if (state.screenStream) state.screenStream.getTracks().forEach(track => track.stop());

  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.location.replace(url.toString());
}

function setBadge(status, label) {
  const dot = DOM.connectionBadge?.querySelector('.badge-dot');
  const lbl = DOM.connectionBadge?.querySelector('.badge-label');
  if (!dot || !lbl) return;
  dot.className = 'badge-dot ' + status;
  lbl.textContent = label;
}

/* HTML escape */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* Convert URLs in text to clickable links */
function linkify(text) {
  const urlRe = /(https?:\/\/[^\s<>"']+)/gi;
  return text.replace(urlRe, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════ */
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', default: '🔔' };

function toast(message, type = 'default', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.default}</span>
    <span>${escHtml(message)}</span>
  `;
  DOM.toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 260);
  }, duration);
}

/* ══════════════════════════════════════════════════════════
   QUALITY SETTINGS MODAL
   ══════════════════════════════════════════════════════════ */
const qModal   = () => document.getElementById('qualityModal');
const qWInput  = () => document.getElementById('qWidth');
const qHInput  = () => document.getElementById('qHeight');
const qFInput  = () => document.getElementById('qFps');
const qCurrent = () => document.getElementById('qCurrentLabel');

function openQualityModal() {
  const q = state.screenQuality;
  const w = qWInput(); const h = qHInput(); const f = qFInput();
  if (!w) return;
  w.value = q.width; h.value = q.height; f.value = q.fps;
  _updateQLabel();
  _syncPresets();
  qModal().style.display = 'flex';
  w.focus();
}

function closeQualityModal() {
  const m = qModal();
  if (m) m.style.display = 'none';
}

function _updateQLabel() {
  const el = qCurrent();
  if (el) el.textContent = `${qWInput().value} x ${qHInput().value} @ ${qFInput().value}fps`;
}

function _syncPresets() {
  document.querySelectorAll('.q-preset').forEach(btn => {
    const match = +btn.dataset.w === +qWInput().value
               && +btn.dataset.h === +qHInput().value
               && +btn.dataset.fps === +qFInput().value;
    btn.classList.toggle('active', match);
  });
}

function saveAndStartShare() {
  state.screenQuality = {
    width:  parseInt(qWInput().value, 10) || 1920,
    height: parseInt(qHInput().value, 10) || 1080,
    fps:    parseInt(qFInput().value, 10) || 30,
  };
  localStorage.setItem('swacord_screen_quality', JSON.stringify(state.screenQuality));
  closeQualityModal();
  startScreenShare();
}

document.addEventListener('DOMContentLoaded', () => {
  // Quality modal buttons
  document.getElementById('btnSaveQuality')?.addEventListener('click', saveAndStartShare);
  document.getElementById('btnCancelQuality')?.addEventListener('click', closeQualityModal);
  document.getElementById('btnCloseQuality')?.addEventListener('click', closeQualityModal);
  document.getElementById('qualityModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeQualityModal();
  });

  // Preset chips
  document.getElementById('qPresets')?.addEventListener('click', e => {
    const btn = e.target.closest('.q-preset');
    if (!btn) return;
    qWInput().value = btn.dataset.w;
    qHInput().value = btn.dataset.h;
    qFInput().value = btn.dataset.fps;
    _updateQLabel();
    _syncPresets();
  });

  // Live label on custom input
  ['qWidth','qHeight','qFps'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      _updateQLabel();
      _syncPresets();
    });
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeQualityModal();
  });
});

/* ══════════════════════════════════════════════════════════
   VERCEL MESH HEARTBEAT
   ══════════════════════════════════════════════════════════ */
let vercelHeartbeatInterval = null;
async function startVercelHeartbeat() {
  const ping = async () => {
    try {
      // 1. Send heartbeat
      await fetch('/api/room', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room: state.roomId, peerId: state.myId })
      });
      // 2. Get active peers
      const res = await fetch(`/api/room?room=${state.roomId}`);
      const data = await res.json();
      
      // Update Host Status
      if (data.host === state.myId && !state.isHost) {
        state.isHost = true;
        toast('Ви тепер хост кімнати!', 'info');
        refreshMemberList();
      } else if (data.host !== state.myId) {
        state.isHost = false;
        refreshMemberList();
      }

      // Connect to any new peers
      if (data.peers) {
        data.peers.forEach(pid => {
          if (pid !== state.myId && !state.peers.has(pid) && !state.dataConns.has(pid)) {
            connectToPeer(pid);
          }
        });
      }
    } catch (e) {
      console.warn('Vercel heartbeat error:', e);
    }
  };

  await ping();
  vercelHeartbeatInterval = setInterval(ping, 15000);

  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon('/api/room', JSON.stringify({
      room: state.roomId,
      peerId: state.myId,
      action: 'leave'
    }));
  });
}

/* ══════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
