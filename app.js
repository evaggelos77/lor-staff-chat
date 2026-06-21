const STORAGE_KEY = 'lor_staff_chat_v5_state';
const PROFILE_KEY = 'lor_staff_chat_v5_profile';
const SOUND_KEY = 'lor_staff_chat_v5_sound_enabled';
const ACTIVE_KEY = 'lor_staff_chat_v5_active_chat';
const APP_VERSION = 'V6 ONLINE • EL/EN/SQ';

const defaultState = () => ({
  activeChatId: 'general',
  pinned: 'Ένα app — πολλοί χρήστες — ξεχωριστές συνομιλίες — ξεχωριστά δικαιώματα.',
  members: [
    { id:'m-ev', name:'Ευάγγελος', role:'Admin / Διοίκηση', phone:'', team:'Κεντρικός έλεγχος', online:true, permissions:['admin','finance','all_chats'] },
    { id:'m-anna', name:'Άννα', role:'Υπεύθυνη Event', phone:'', team:'Event Αθήνα', online:true, permissions:['event_manager'] },
    { id:'m-maria', name:'Μαρία', role:'Hostess', phone:'', team:'Υποδοχή', online:false, permissions:['staff'] },
    { id:'m-panagiotis', name:'Παναγιώτης', role:'Οικονομικά', phone:'', team:'Οικονομικά', online:true, permissions:['finance'] },
    { id:'m-nikos', name:'Νίκος', role:'Τεχνικός', phone:'', team:'Εξοπλισμός', online:true, permissions:['equipment'] },
    { id:'m-giorgos', name:'Γιώργος', role:'Stage Crew', phone:'', team:'Σκηνή', online:true, permissions:['staff'] },
    { id:'m-elena', name:'Έλενα', role:'Back Office', phone:'', team:'Γραμματεία', online:false, permissions:['staff'] }
  ],
  chats: [
    { id:'general', type:'group', name:'Γενική Ομάδα', description:'Μηνύματα που επιτρέπεται να δουν όλοι οι χρήστες', memberIds:['m-ev','m-anna','m-maria','m-panagiotis','m-nikos','m-giorgos','m-elena'], unread:1, color:'G', access:'all', locked:false },
    { id:'event-athens', type:'group', name:'Event Αθήνα', description:'Οδηγίες μόνο για το σημερινό event', memberIds:['m-ev','m-anna','m-maria','m-nikos'], unread:0, color:'A', access:'members', locked:false },
    { id:'equipment', type:'group', name:'Εξοπλισμός / Παραδόσεις', description:'Φωτογραφίες, επιστροφές και αρχεία εξοπλισμού', memberIds:['m-ev','m-anna','m-nikos','m-giorgos'], unread:1, color:'E', access:'members', locked:false },
    { id:'finance', type:'group', name:'Οικονομικά', description:'Κλειδωμένη ομάδα για τιμές, κόστη, προσφορές και πληρωμές', memberIds:['m-ev','m-panagiotis'], unread:0, color:'€', access:'locked', locked:true },
    { id:'dm-anna', type:'dm', name:'Άννα', description:'Προσωπική συνομιλία με την Άννα', memberIds:['m-ev','m-anna'], unread:0, color:'Α', access:'private', locked:true },
    { id:'dm-maria', type:'dm', name:'Μαρία', description:'Προσωπική συνομιλία με τη Μαρία', memberIds:['m-ev','m-maria'], unread:0, color:'Μ', access:'private', locked:true },
    { id:'dm-panagiotis', type:'dm', name:'Παναγιώτης', description:'Προσωπική συνομιλία με τον Παναγιώτη', memberIds:['m-ev','m-panagiotis'], unread:0, color:'Π', access:'private', locked:true }
  ],
  messages: {
    'general': [
      { id:'v4-welcome-1', senderId:'m-ev', senderName:'Ευάγγελος', text:'Καλωσήρθατε στο LOR Staff Chat V4. Η γενική ομάδα είναι ορατή σε όλους.', time: nowMinus(84), attachments:[], readBy:['m-ev'] },
      { id:'v4-welcome-2', senderId:'m-anna', senderName:'Άννα', text:'Ό,τι αφορά όλη την ομάδα γράφεται εδώ. Ιδιωτικά και οικονομικά μπαίνουν σε ξεχωριστό chat.', time: nowMinus(61), attachments:[], readBy:['m-ev','m-anna'] }
    ],
    'event-athens': [
      { id:'v4-event-1', senderId:'m-anna', senderName:'Άννα', text:'Οδηγίες event: άφιξη 17:30, τεχνικός έλεγχος 18:00.', time: nowMinus(132), attachments:[], readBy:['m-ev','m-anna'] }
    ],
    'equipment': [
      { id:'v4-eq-1', senderId:'m-nikos', senderName:'Νίκος', text:'Εδώ ανεβάζουμε μόνο φωτογραφίες και αρχεία εξοπλισμού.', time: nowMinus(95), attachments:[], readBy:['m-ev','m-nikos'] }
    ],
    'finance': [
      { id:'v4-fin-1', senderId:'m-ev', senderName:'Ευάγγελος', text:'Παναγιώτη, εδώ θα μπαίνουν οικονομικά στοιχεία, προσφορές και κόστη. Δεν εμφανίζονται στη Μαρία ή στην Άννα αν δεν τους δώσουμε πρόσβαση.', time: nowMinus(48), attachments:[], readBy:['m-ev'] }
    ],
    'dm-anna': [
      { id:'v4-dm-anna-1', senderId:'m-anna', senderName:'Άννα', text:'Αυτή είναι προσωπική συνομιλία. Δεν τη βλέπει η υπόλοιπη ομάδα.', time: nowMinus(38), attachments:[], readBy:['m-ev','m-anna'] }
    ],
    'dm-maria': [],
    'dm-panagiotis': []
  }
});

let state = loadState();
let profile = loadProfile();
let pendingAttachments = [];
let currentTab = 'chats';
let serverMode = false;
let serverRevision = 0;
let syncTimer = null;
let markReadTimer = null;
let outbox = [];
let soundEnabled = localStorage.getItem(SOUND_KEY) === '1';
let audioCtx = null;
let knownMessageIds = new Set();
let bootCompleted = false;

const $ = (id) => document.getElementById(id);
const els = {
  appShell: $('appShell'), sidebar: $('sidebar'), profileName: $('profileName'), profileRole: $('profileRole'), profileAvatar: $('profileAvatar'),
  chatList: $('chatList'), staffList: $('staffList'), fileList: $('fileList'), messages: $('messages'),
  activeChatName: $('activeChatName'), activeChatMeta: $('activeChatMeta'), activeChatAvatar: $('activeChatAvatar'), pinnedNotice: $('pinnedNotice'),
  detailChatName: $('detailChatName'), detailChatType: $('detailChatType'), detailMembers: $('detailMembers'), detailFiles: $('detailFiles'), detailAccess: $('detailAccess'), detailAllowed: $('detailAllowed'),
  messageInput: $('messageInput'), sendBtn: $('sendBtn'), fileInput: $('fileInput'), cameraInput: $('cameraInput'), attachmentPreview: $('attachmentPreview'),
  loginModal: $('loginModal'), loginName: $('loginName'), loginRole: $('loginRole'), loginBtn: $('loginBtn'), demoLoginBtn: $('demoLoginBtn'), annaLoginBtn: $('annaLoginBtn'), mariaLoginBtn: $('mariaLoginBtn'), panagiotisLoginBtn: $('panagiotisLoginBtn'),
  memberModal: $('memberModal'), memberName: $('memberName'), memberRole: $('memberRole'), memberPhone: $('memberPhone'), memberTeam: $('memberTeam'), saveMemberBtn: $('saveMemberBtn'),
  groupModal: $('groupModal'), groupName: $('groupName'), groupDescription: $('groupDescription'), groupAccess: $('groupAccess'), memberPicker: $('memberPicker'), saveGroupBtn: $('saveGroupBtn'),
  announceModal: $('announceModal'), announceText: $('announceText'), saveAnnounceBtn: $('saveAnnounceBtn'),
  searchInput: $('searchInput'), toast: $('toast'), soundBtn: $('soundBtn'), testSoundBtn: $('testSoundBtn'), syncHint: $('syncHint'),
  langSwitch: $('langSwitch'), langSwitchLogin: $('langSwitchLogin'), inviteBtn: $('inviteBtn'), controlRoomBtn: $('controlRoomBtn'),
  controlRoomModal: $('controlRoomModal'), crKpis: $('crKpis'), crConvos: $('crConvos'), crStaff: $('crStaff'), crFiles: $('crFiles')
};

const LOCALE_MAP = { el:'el-GR', en:'en-GB', sq:'sq-AL' };
function localeOf(){ return LOCALE_MAP[getLang()] || 'el-GR'; }
function uid(){ return 'id-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36); }
function nowMinus(minutes){ return new Date(Date.now() - minutes*60000).toISOString(); }
function formatTime(iso){ try{ return new Intl.DateTimeFormat(localeOf(),{hour:'2-digit',minute:'2-digit'}).format(new Date(iso)); }catch(e){ return new Intl.DateTimeFormat('el-GR',{hour:'2-digit',minute:'2-digit'}).format(new Date(iso)); } }
function initials(name){ return (name || 'LOR').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
// Distinct, dark-background-friendly colour per user/conversation so names stand out.
const NAME_COLORS = ['#ff7eb6','#ffb86b','#ffd86b','#6be4ff','#5af0c0','#9d8bff','#ff8b7a','#73c0ff','#ff9ff3','#7bed9f','#feca57','#48dbfb'];
function nameColor(key){ const s = String(key || 'x'); let h = 0; for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) >>> 0; } return NAME_COLORS[h % NAME_COLORS.length]; }
function escapeHTML(s=''){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
// Only allow well-formed base64 data: URLs into src/href — blocks attribute-breakout / script injection.
const DATA_URL_RE = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+(?:;[a-z0-9-]+=[^;,]+)*;base64,[A-Za-z0-9+/=\s]+$/i;
function safeDataUrl(s){ s = String(s || ''); return DATA_URL_RE.test(s) ? s : ''; }
function safeImg(s){ const d = safeDataUrl(s); return /^data:image\//i.test(d) ? d : ''; }
function fileSize(bytes){ if(bytes < 1024) return bytes + ' B'; if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1024/1024).toFixed(1) + ' MB'; }
function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); var s = raw ? JSON.parse(raw) : defaultState(); }
  catch(e){ var s = defaultState(); }
  // The active chat is per-device, never shared — restore the local one.
  const localActive = localStorage.getItem(ACTIVE_KEY);
  if(localActive) s.activeChatId = localActive;
  return s;
}
// Server mutations go through ops (see sendOp). saveState only caches the view locally.
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); localStorage.setItem(ACTIVE_KEY, state.activeChatId || ''); }catch(e){} }
function loadProfile(){ try{ return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch(e){ return null; } }
function saveProfile(){ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
function memberById(id){ return state.members.find(m => m.id === id); }
function currentMember(){ return profile ? memberById(profile.memberId) : null; }
function isMine(msg){ return profile && msg.senderId === profile.memberId; }
function isAdmin(){ const m = currentMember(); return !!(m && (m.id === 'm-ev' || (m.permissions || []).includes('admin') || /admin|διοίκηση|διαχειρισ/i.test(m.role || ''))); }
function hasPermission(permission){ const m = currentMember(); return !!(m && ((m.permissions || []).includes(permission) || isAdmin())); }
function canSeeChat(chat){ if(!profile) return true; if(isAdmin()) return true; return (chat.memberIds || []).includes(profile.memberId); }
function visibleChats(){ return state.chats.filter(canSeeChat); }
function activeChat(){ ensureActiveChatVisible(); return state.chats.find(c => c.id === state.activeChatId) || visibleChats()[0] || state.chats[0]; }
function activeMessages(){ const chat = activeChat(); return chat ? (state.messages[chat.id] || []) : []; }
function accessLabel(chat){ if(chat.access === 'all') return tr('access_all'); if(chat.access === 'locked') return tr('access_locked'); if(chat.type === 'dm') return tr('access_private'); return tr('access_members'); }
function chatTypeLabel(chat){ return chat.type === 'dm' ? tr('type_dm') : tr('type_group'); }
function visibleMembersForStaff(){
  if(!profile || isAdmin()) return state.members;
  const ids = new Set();
  visibleChats().forEach(c => (c.memberIds || []).forEach(id => ids.add(id)));
  return state.members.filter(m => ids.has(m.id));
}
function ensureActiveChatVisible(){
  if(!profile) return;
  const current = state.chats.find(c => c.id === state.activeChatId);
  if(!current || !canSeeChat(current)){
    const first = visibleChats()[0];
    if(first) state.activeChatId = first.id;
  }
}

async function boot(){
  await initServerMode();
  if(!profile){ els.loginModal.classList.remove('hidden'); }
  renderLangSwitch();
  applyStaticI18n();
  bindEvents();
  renderAll();
  updateSoundUI();
  updateSyncUI();
  rememberKnownMessages();
  bootCompleted = true;
  registerSW();
}
function renderLangSwitch(){
  const html = LANGS.map(l => `<button class="lang-btn ${l.code===getLang()?'active':''}" data-lang="${l.code}" title="${l.name}">${l.label}</button>`).join('');
  [els.langSwitch, els.langSwitchLogin].forEach(box => {
    if(!box) return;
    box.innerHTML = html;
    box.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => changeLang(btn.dataset.lang)));
  });
}
function changeLang(code){
  setLang(code);
  renderLangSwitch();
  applyStaticI18n();
  renderAll();
}

function bindEvents(){
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModals()));
  document.querySelectorAll('.pill-btn, .mobile-nav button').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  $('mobileMenuBtn').addEventListener('click', () => els.sidebar.classList.toggle('open'));
  $('settingsBtn').addEventListener('click', () => showToast(tr('t_change_user_hint')));
  if(els.soundBtn) els.soundBtn.addEventListener('click', toggleSound);
  if(els.testSoundBtn) els.testSoundBtn.addEventListener('click', () => { enableSound(); playNotificationSound(); showToast(tr('t_test_sound')); });
  $('newGroupBtn').addEventListener('click', () => { renderGroupMemberPicker(); openModal(els.groupModal); });
  $('addMemberBtn').addEventListener('click', () => { if(!isAdmin()) return showToast(tr('t_only_admin_member')); openModal(els.memberModal); });
  $('announceBtn').addEventListener('click', () => { if(!canSendAnnouncement()) return showToast(tr('t_announce_permission')); els.announceText.value = state.pinned || ''; openModal(els.announceModal); });
  $('infoBtn').addEventListener('click', () => showToast(tr('t_each_chat_perms')));
  $('exportBtn').addEventListener('click', exportData);
  $('demoReplyBtn').addEventListener('click', demoReply);
  $('clearDemoBtn').addEventListener('click', resetDemo);
  $('logoutBtn').addEventListener('click', logout);
  if(els.inviteBtn) els.inviteBtn.addEventListener('click', inviteShare);
  if(els.controlRoomBtn) els.controlRoomBtn.addEventListener('click', openControlRoom);
  $('crBroadcastBtn').addEventListener('click', () => { closeModals(); if(!canSendAnnouncement()) return showToast(tr('t_announce_permission')); els.announceText.value = state.pinned || ''; openModal(els.announceModal); });
  $('crExportBtn').addEventListener('click', exportData);
  $('crResetBtn').addEventListener('click', resetDemo);

  els.loginBtn.addEventListener('click', manualLogin);
  els.demoLoginBtn.addEventListener('click', () => doLogin('Ευάγγελος','Admin / Διοίκηση'));
  if(els.annaLoginBtn) els.annaLoginBtn.addEventListener('click', () => doLogin('Άννα','Υπεύθυνη Event'));
  if(els.mariaLoginBtn) els.mariaLoginBtn.addEventListener('click', () => doLogin('Μαρία','Hostess'));
  if(els.panagiotisLoginBtn) els.panagiotisLoginBtn.addEventListener('click', () => doLogin('Παναγιώτης','Οικονομικά'));
  els.saveMemberBtn.addEventListener('click', saveMember);
  els.saveGroupBtn.addEventListener('click', saveGroup);
  els.saveAnnounceBtn.addEventListener('click', saveAnnouncement);
  els.sendBtn.addEventListener('click', sendMessage);
  els.messageInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });
  els.messageInput.addEventListener('input', autoGrow);
  els.fileInput.addEventListener('change', e => handleFiles([...e.target.files]));
  els.cameraInput.addEventListener('change', e => handleFiles([...e.target.files]));
  els.searchInput.addEventListener('input', renderCurrentTab);
  window.addEventListener('keydown', e => { if(e.key === 'Escape') closeModals(); });
}

function setTab(tab){
  currentTab = tab;
  document.querySelectorAll('.pill-btn, .mobile-nav button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  $('chatListPanel').classList.toggle('hidden', tab !== 'chats');
  $('staffPanel').classList.toggle('hidden', tab !== 'staff');
  $('filesPanel').classList.toggle('hidden', tab !== 'files');
  renderCurrentTab();
  // On phones every list tab lives in the slide-over panel — open it so the list is visible.
  if(window.innerWidth < 821) els.sidebar.classList.add('open');
}
function renderCurrentTab(){ if(currentTab === 'chats') renderChatList(); if(currentTab === 'staff') renderStaffList(); if(currentTab === 'files') renderFileList(); }
function renderAll(){ ensureActiveChatVisible(); renderProfile(); updateAdminUI(); renderChatList(); renderStaffList(); renderFileList(); renderActiveChat(); renderAttachmentPreview(); updateSoundUI(); updateSyncUI(); if(els.controlRoomModal && !els.controlRoomModal.classList.contains('hidden')) renderControlRoom(); }
function updateAdminUI(){ if(els.controlRoomBtn) els.controlRoomBtn.classList.toggle('hidden', !isAdmin()); }
function renderProfile(){
  const name = profile?.name || 'Demo Admin';
  const role = profile?.role || tr('role_admin_default');
  els.profileName.textContent = name;
  els.profileRole.textContent = role;
  els.profileAvatar.textContent = initials(name);
}
function renderChatList(){
  const q = (els.searchInput.value || '').toLowerCase().trim();
  const chats = visibleChats().filter(c => !q || (c.name + ' ' + c.description + ' ' + accessLabel(c)).toLowerCase().includes(q));
  els.chatList.innerHTML = chats.map(chat => {
    const msgs = state.messages[chat.id] || [];
    const last = msgs[msgs.length-1];
    const unread = unreadCount(chat);
    return `<button class="chat-item ${chat.id===state.activeChatId?'active':''}" data-chat="${chat.id}">
      <div class="avatar">${escapeHTML(chat.color || initials(chat.name))}</div>
      <div class="chat-copy">
        <div class="chat-name" style="color:${nameColor(chat.type==='dm' ? displayChatName(chat) : chat.id)}">${chat.locked ? '🔒 ' : ''}${escapeHTML(displayChatName(chat))}</div>
        <div class="chat-last">${last ? escapeHTML(last.text || attachmentSummary(last.attachments)) : escapeHTML(chat.description || tr('new_convo'))}</div>
        <div class="scope-line">${chatTypeLabel(chat)} • ${accessLabel(chat)} • ${chat.memberIds?.length || 0} ${tr('members_word')}</div>
      </div>
      ${unread ? `<span class="badge">${unread}</span>` : `<span class="status-dot"></span>`}
    </button>`;
  }).join('') || `<div class="empty-state">${tr('empty_no_access_search')}</div>`;
  els.chatList.querySelectorAll('[data-chat]').forEach(btn => btn.addEventListener('click', () => {
    state.activeChatId = btn.dataset.chat;
    markChatRead(state.activeChatId);
    scheduleMarkRead(state.activeChatId);
    saveState(); renderAll(); els.sidebar.classList.remove('open');
  }));
}
function displayChatName(chat){
  if(!profile || chat.type !== 'dm') return chat.name;
  const other = (chat.memberIds || []).map(memberById).filter(Boolean).find(m => m.id !== profile.memberId);
  return other ? other.name : chat.name;
}
function unreadCount(chat){
  if(!profile) return chat.unread || 0;
  const msgs = state.messages[chat.id] || [];
  return msgs.filter(m => m.senderId !== profile.memberId && !(m.readBy || []).includes(profile.memberId)).length;
}
function markChatRead(chatId){
  if(!profile) return;
  (state.messages[chatId] || []).forEach(m => { m.readBy = Array.from(new Set([...(m.readBy || []), profile.memberId])); });
}
function renderStaffList(){
  const q = (els.searchInput.value || '').toLowerCase().trim();
  const members = visibleMembersForStaff().filter(m => !q || (m.name + ' ' + m.role + ' ' + m.team).toLowerCase().includes(q));
  els.staffList.innerHTML = members.map(m => `<div class="staff-item">
    <div class="avatar">${escapeHTML(initials(m.name))}</div>
    <div class="staff-copy">
      <div class="staff-name" style="color:${nameColor(m.id)}">${escapeHTML(m.name)}</div>
      <div class="staff-meta">${escapeHTML(m.role || '')} • ${escapeHTML(m.team || '')} ${m.phone ? '• ' + escapeHTML(m.phone) : ''}</div>
    </div>
    <div class="staff-actions">
      ${profile && m.id !== profile.memberId ? `<button class="mini-btn" data-dm="${m.id}">${tr('msg_btn')}</button>` : `<span class="tag">${tr('you_label')}</span>`}
      <span class="status-dot" style="opacity:${m.online ? 1 : .25}"></span>
    </div>
  </div>`).join('') || `<div class="empty-state">${tr('empty_no_names')}</div>`;
  els.staffList.querySelectorAll('[data-dm]').forEach(btn => btn.addEventListener('click', () => openPrivateChat(btn.dataset.dm)));
}
function renderFileList(){
  const q = (els.searchInput.value || '').toLowerCase().trim();
  const files = collectFiles().filter(f => !q || (f.name + ' ' + f.chatName + ' ' + f.senderName).toLowerCase().includes(q));
  els.fileList.innerHTML = files.map(f => {
    const img = (f.type||'').startsWith('image/') ? safeImg(f.data) : '';
    const dl = safeDataUrl(f.data);
    return `<div class="file-item">
    ${img ? `<img class="attachment-thumb" src="${img}" alt="${escapeHTML(f.name)}" />` : `<div class="attachment-icon">${fileIcon(f.name)}</div>`}
    <div class="file-copy">
      <div class="file-name">${escapeHTML(f.name)}</div>
      <div class="file-meta">${f.locked ? '🔒 ' : ''}${escapeHTML(f.chatName)} • ${escapeHTML(f.senderName)} • ${fileSize(f.size || 0)}</div>
    </div>
    ${dl ? `<a class="mini-btn" href="${dl}" download="${escapeHTML(f.name)}">${tr('download')}</a>` : ''}
  </div>`; }).join('') || `<div class="empty-state">${tr('empty_no_files')}</div>`;
}
function collectFiles(){
  const files = [];
  for(const chat of visibleChats()){
    const msgs = state.messages[chat.id] || [];
    msgs.forEach(msg => (msg.attachments || []).forEach(att => files.push({...att, chatName: displayChatName(chat), senderName: msg.senderName, messageTime: msg.time, locked: chat.locked})));
  }
  return files.sort((a,b) => new Date(b.messageTime) - new Date(a.messageTime));
}
function renderActiveChat(){
  const chat = activeChat();
  if(!chat) return;
  markChatRead(chat.id);
  els.activeChatName.textContent = (chat.locked ? '🔒 ' : '') + displayChatName(chat);
  els.activeChatMeta.textContent = `${chat.memberIds?.length || 0} ${tr('members_word')} • ${chatTypeLabel(chat)} • ${accessLabel(chat)} • ${serverMode ? tr('meta_online') : tr('meta_local')}`;
  els.activeChatAvatar.textContent = chat.color || initials(displayChatName(chat));
  els.pinnedNotice.textContent = state.pinned || tr('pinned_default');
  els.detailChatName.textContent = displayChatName(chat);
  els.detailChatType.textContent = chatTypeLabel(chat);
  els.detailMembers.textContent = chat.memberIds?.length || 0;
  els.detailFiles.textContent = collectFiles().filter(f => f.chatName === displayChatName(chat)).length;
  if(els.detailAccess) els.detailAccess.textContent = accessLabel(chat);
  if(els.detailAllowed) els.detailAllowed.textContent = allowedNames(chat);
  els.messageInput.placeholder = canWriteToChat(chat) ? tr('msg_ph') : tr('ph_no_permission');
  els.sendBtn.disabled = !canWriteToChat(chat);
  renderMessages();
}
function allowedNames(chat){ return (chat.memberIds || []).map(memberById).filter(Boolean).map(m => m.name).join(', '); }
function canWriteToChat(chat){ return !!(profile && canSeeChat(chat)); }
function renderMessages(){
  const chat = activeChat();
  const msgs = activeMessages();
  let lastDate = '';
  els.messages.innerHTML = msgs.map(msg => {
    const d = new Date(msg.time).toLocaleDateString(localeOf());
    const sep = d !== lastDate ? `<div class="day-separator">${d}</div>` : '';
    lastDate = d;
    const mine = isMine(msg);
    const readers = (msg.readBy || []).filter(id => id !== msg.senderId).length;
    return `${sep}<article class="message ${mine ? 'mine' : ''}">
      <div class="avatar">${escapeHTML(initials(msg.senderName))}</div>
      <div class="bubble">
        <div class="msg-sender"${mine ? '' : ` style="color:${nameColor(msg.senderId || msg.senderName)}"`}>${escapeHTML(msg.senderName)}</div>
        ${msg.text ? `<div class="msg-text">${escapeHTML(msg.text)}</div>` : ''}
        ${renderAttachments(msg.attachments || [])}
        <div class="msg-time">${formatTime(msg.time)} ${mine ? `✓✓ ${readers ? tr('read_label') : ''}` : ''}</div>
      </div>
    </article>`;
  }).join('') || `<div class="empty-state center">${tr('empty_start_convo')} ${chat?.locked ? tr('empty_locked_hint') : ''}</div>`;
  els.messages.scrollTop = els.messages.scrollHeight;
}
function renderAttachments(attachments){
  if(!attachments.length) return '';
  return attachments.map(att => {
    const img = (att.type||'').startsWith('image/') ? safeImg(att.data) : '';
    const dl = safeDataUrl(att.data);
    const thumb = img ? `<img class="attachment-thumb" src="${img}" alt="${escapeHTML(att.name)}" />` : `<div class="attachment-icon">${fileIcon(att.name)}</div>`;
    const link = dl ? `<a href="${dl}" download="${escapeHTML(att.name)}">${tr('open_download')}</a>` : '';
    return `<div class="attachment-card">${thumb}<div class="attachment-actions"><div class="attachment-title">${escapeHTML(att.name)}</div>${link}</div></div>`;
  }).join('');
}
function attachmentSummary(atts=[]){ return atts.length ? `📎 ${atts.length}` : ''; }
function fileIcon(name=''){ const ext = name.split('.').pop().toLowerCase(); if(['pdf'].includes(ext)) return 'PDF'; if(['xls','xlsx'].includes(ext)) return 'XLS'; if(['doc','docx'].includes(ext)) return 'DOC'; if(['zip'].includes(ext)) return 'ZIP'; return '📄'; }

function manualLogin(){ const name = els.loginName.value.trim(); const role = els.loginRole.value.trim() || tr('default_role'); if(!name) return showToast(tr('t_write_name_user')); doLogin(name, role); }
async function doLogin(name, role){
  let member = null;
  if(serverMode){
    // The server owns the member list, so it returns the canonical id (same on every device).
    const res = await sendOp({ type:'login', name, role });
    member = res && res.member;
    await fetchServerState();
  }
  if(!member){
    member = state.members.find(m => normalizeName(m.name) === normalizeName(name));
    if(!member){
      member = {id: uid(), name, role, phone:'', team:tr('tab_staff'), online:true, permissions:['staff']};
      state.members.push(member);
      state.chats.find(c=>c.id==='general')?.memberIds.push(member.id);
    }
  }
  member.online = true;
  profile = { memberId: member.id, name: member.name, role: member.role || role };
  saveProfile(); saveState();
  els.loginModal.classList.add('hidden');
  ensureActiveChatVisible();
  renderAll();
  // On a phone, land on the conversation list (the slide-over panel) after login.
  if(window.innerWidth < 821) els.sidebar.classList.add('open');
  showToast(tr('t_logged_in', { name: member.name }));
}
function normalizeName(s=''){ return s.toLocaleLowerCase('el-GR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function logout(){ localStorage.removeItem(PROFILE_KEY); profile = null; els.loginModal.classList.remove('hidden'); renderAll(); showToast(tr('logout_hint')); }
function saveMember(){
  if(!isAdmin()) return showToast(tr('t_only_admin_person'));
  const name = els.memberName.value.trim(); if(!name) return showToast(tr('t_write_name_staff'));
  const member = { id:uid(), name, role:els.memberRole.value.trim() || tr('default_role'), phone:els.memberPhone.value.trim(), team:els.memberTeam.value.trim() || tr('lbl_group'), online:false, permissions:['staff'] };
  state.members.push(member);
  state.chats.find(c => c.id === 'general')?.memberIds.push(member.id);
  saveState(); sendOp({ type:'member', member }); closeModals(); renderAll(); showToast(tr('t_name_saved'));
  els.memberName.value = els.memberRole.value = els.memberPhone.value = els.memberTeam.value = '';
}
function renderGroupMemberPicker(){
  if(!els.memberPicker) return;
  const members = visibleMembersForStaff();
  const me = profile?.memberId;
  els.memberPicker.innerHTML = members.map(m => `<label class="checkbox-row"><input type="checkbox" value="${m.id}" ${m.id === me ? 'checked disabled' : ''} /> <span>${escapeHTML(m.name)}</span><em>${escapeHTML(m.role || '')}</em></label>`).join('');
}
function saveGroup(){
  const name = els.groupName.value.trim(); if(!name) return showToast(tr('t_write_group_name'));
  const selected = els.memberPicker ? [...els.memberPicker.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value) : [];
  if(profile && !selected.includes(profile.memberId)) selected.push(profile.memberId);
  if(selected.length < 2) return showToast(tr('t_min2'));
  const access = els.groupAccess?.value || 'members';
  const chat = { id: uid(), type:'group', name, description: els.groupDescription.value.trim() || tr('group_modal_title'), memberIds: selected, unread:0, color: initials(name).slice(0,1), access, locked: access !== 'all' };
  const seed = { id:uid(), senderId: profile?.memberId || 'system', senderName: profile?.name || 'LOR Admin', text: tr('created_group_msg', { name }), time:new Date().toISOString(), attachments:[], readBy: profile ? [profile.memberId] : [] };
  state.chats.unshift(chat);
  state.messages[chat.id] = [seed];
  state.activeChatId = chat.id;
  saveState(); sendOpQ({ type:'group', chat, message: seed }); closeModals(); renderAll(); showToast(tr('t_group_created'));
  els.groupName.value = els.groupDescription.value = '';
}
function openPrivateChat(memberId){
  if(!profile) return showToast(tr('t_login_first'));
  if(memberId === profile.memberId) return;
  const target = memberById(memberId); if(!target) return;
  let chat = state.chats.find(c => c.type === 'dm' && c.memberIds.includes(profile.memberId) && c.memberIds.includes(memberId));
  if(!chat){
    chat = { id:'dm-' + [profile.memberId, memberId].sort().join('-'), type:'dm', name:target.name, description: tr('access_private'), memberIds:[profile.memberId, memberId], unread:0, color: initials(target.name).slice(0,1), access:'private', locked:true };
    state.chats.unshift(chat); state.messages[chat.id] = [];
    sendOp({ type:'dm', chat });
  }
  state.activeChatId = chat.id;
  saveState(); renderAll(); setTab('chats'); els.sidebar.classList.remove('open');
  showToast(tr('t_dm_opened', { name: target.name }));
}
function canSendAnnouncement(){ return isAdmin() || hasPermission('event_manager'); }
function saveAnnouncement(){
  if(!canSendAnnouncement()) return showToast(tr('t_no_announce_perm'));
  const text = els.announceText.value.trim(); if(!text) return showToast(tr('t_write_announce'));
  state.pinned = text; const msg = addMessage({ text: tr('announce_prefix') + text, attachments:[] });
  saveState(); sendOpQ({ type:'announce', chatId: state.activeChatId, pinned: text, message: msg }); closeModals(); renderAll(); showToast(tr('t_announce_pinned'));
}

async function handleFiles(files){
  if(!files.length) return;
  const chat = activeChat(); if(!canWriteToChat(chat)) return showToast(tr('t_no_upload_perm'));
  for(const file of files){
    if(file.size > 4 * 1024 * 1024){ showToast(tr('t_file_too_big', { name: file.name })); continue; }
    const data = await readFileAsDataURL(file);
    pendingAttachments.push({ id:uid(), name:file.name, type:file.type || 'application/octet-stream', size:file.size, data });
  }
  els.fileInput.value = ''; els.cameraInput.value = ''; renderAttachmentPreview();
}
function readFileAsDataURL(file){ return new Promise((resolve,reject) => { const r = new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }
function renderAttachmentPreview(){
  if(!pendingAttachments.length){ els.attachmentPreview.classList.add('hidden'); els.attachmentPreview.innerHTML=''; return; }
  els.attachmentPreview.classList.remove('hidden');
  els.attachmentPreview.innerHTML = pendingAttachments.map(att => `<span class="preview-chip">${att.type.startsWith('image/')?'🖼':'📄'} ${escapeHTML(att.name)} <button data-remove-att="${att.id}">×</button></span>`).join('');
  els.attachmentPreview.querySelectorAll('[data-remove-att]').forEach(btn => btn.addEventListener('click', () => { pendingAttachments = pendingAttachments.filter(a => a.id !== btn.dataset.removeAtt); renderAttachmentPreview(); }));
}
function sendMessage(){
  const chat = activeChat(); if(!canWriteToChat(chat)) return showToast(tr('t_no_send_perm'));
  const text = els.messageInput.value.trim(); if(!text && !pendingAttachments.length) return;
  const msg = addMessage({ text, attachments: pendingAttachments });
  pendingAttachments = []; els.messageInput.value = ''; autoGrow(); renderAttachmentPreview(); saveState(); renderAll();
  sendOpQ({ type:'message', chatId: chat.id, message: msg });
}
function addMessage({text, attachments}){
  const p = profile || { memberId:'m-ev', name:'Ευάγγελος' };
  const msg = { id:uid(), senderId:p.memberId, senderName:p.name, text, time:new Date().toISOString(), attachments: attachments || [], readBy:[p.memberId] };
  if(!state.messages[state.activeChatId]) state.messages[state.activeChatId] = [];
  state.messages[state.activeChatId].push(msg);
  return msg;
}
function demoReply(){
  const chat = activeChat(); if(!chat) return;
  const otherIds = (chat.memberIds || []).filter(id => id !== profile?.memberId);
  const member = memberById(otherIds[Math.floor(Math.random()*otherIds.length)]) || state.members.find(m => m.id !== profile?.memberId);
  if(!member) return showToast(tr('t_demo_reply_added'));
  const replies = DEMO_REPLIES[getLang()] || DEMO_REPLIES.el;
  const reply = { id:uid(), senderId:member.id, senderName:member.name, text:replies[Math.floor(Math.random()*replies.length)], time:new Date().toISOString(), attachments:[], readBy:[member.id] };
  if(!state.messages[chat.id]) state.messages[chat.id] = [];
  state.messages[chat.id].push(reply);
  saveState(); sendOpQ({ type:'message', chatId: chat.id, message: reply }); renderAll(); playNotificationSound(); showToast(tr('t_demo_reply_added'));
}
const DEMO_REPLIES = {
  el: ['Το είδα, προχωράω τώρα.','Έφτασα στον χώρο και περιμένω οδηγίες.','Ανέβασα τα στοιχεία στη σωστή συνομιλία.','Το κρατάω κλειδωμένο μόνο σε αυτή την ομάδα.','Ο εξοπλισμός είναι έτοιμος.'],
  en: ['Saw it, moving on it now.','I’ve arrived on site and I’m waiting for instructions.','Uploaded the details to the right conversation.','Keeping it locked to this group only.','The equipment is ready.'],
  sq: ['E pashë, po e bëj tani.','Mbërrita në vend dhe po pres udhëzime.','I ngarkova të dhënat në bisedën e saktë.','Po e mbaj të kyçur vetëm në këtë grup.','Pajisjet janë gati.']
};
async function resetDemo(){
  if(!confirm(tr('confirm_clear'))) return;
  if(serverMode){ await sendOp({ type:'reset' }); await fetchServerState(); }
  else { state = defaultState(); }
  pendingAttachments = []; saveState(); renderAll(); showToast(tr('t_demo_cleared'));
}
function exportData(){
  const payload = { exportedAt:new Date().toISOString(), appVersion:APP_VERSION, profile, visibleOnly: !isAdmin(), state: isAdmin() ? state : {...state, chats: visibleChats(), messages: Object.fromEntries(visibleChats().map(c => [c.id, state.messages[c.id] || []]))} };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'lor-staff-chat-export.json'; a.click(); URL.revokeObjectURL(url); showToast(tr('t_export_done'));
}
function autoGrow(){ const el = els.messageInput; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
function openModal(modal){ modal.classList.remove('hidden'); }
function closeModals(){ document.querySelectorAll('.modal').forEach(m => { if(m.id !== 'loginModal') m.classList.add('hidden'); }); }
function showToast(text){ els.toast.textContent = text; els.toast.classList.remove('hidden'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 2600); }
function registerSW(){ if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); } }

async function initServerMode(){
  if(location.protocol === 'file:') return;
  try{
    const res = await fetch('/api/state', { cache:'no-store' });
    if(!res.ok) return;
    const data = await res.json();
    if(data?.state){
      const localActive = state.activeChatId;
      state = data.state; state.activeChatId = localActive;
      serverRevision = data.revision || 0; serverMode = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Re-register an existing profile so this device's user exists server-side (e.g. after a restart).
      if(profile && profile.name) await sendOp({ type:'login', name: profile.name, role: profile.role });
      startSyncLoop(); showToast(tr('t_live_active'));
    }
  }catch(e){ serverMode = false; }
}
function updateSyncUI(){
  if(!els.syncHint) return;
  const chat = activeChat();
  if(serverMode){ els.syncHint.textContent = tr('sync_online', { access: accessLabel(chat), sound: soundEnabled ? tr('state_on') : tr('state_off') }); }
  else { els.syncHint.textContent = tr('sync_local'); }
}
function startSyncLoop(){ clearInterval(syncTimer); syncTimer = setInterval(syncTick, 1400); }
async function syncTick(){ await flushOutbox(); await fetchServerState(); }
// One mutation = one op. The server appends atomically, so two people sending at once never overwrite each other.
async function sendOp(op){
  if(!serverMode) return null;
  try{
    const res = await fetch('/api/op', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ op }) });
    if(!res.ok) throw new Error('op failed');
    return await res.json();
  }catch(e){ return null; }
}
// Reliable variant for data-bearing ops: if the send fails, keep it in an outbox and retry every tick.
async function sendOpQ(op){
  const res = await sendOp(op);
  if(!res){ queueOutbox(op); showToast(tr('t_op_failed')); }
  return res;
}
function queueOutbox(op){ if(op && op.type){ outbox.push(op); if(outbox.length > 200) outbox.shift(); } }
function msgOnServer(id){ return allMessagesFrom(state).some(m => m.id === id); }
async function flushOutbox(){
  if(!serverMode || !outbox.length) return;
  const pending = outbox; outbox = [];
  for(const op of pending){
    if(op.type === 'message' && op.message && msgOnServer(op.message.id)) continue; // already delivered
    const res = await sendOp(op);
    if(!res) outbox.push(op); // still failing — try again next tick
  }
}
function scheduleMarkRead(chatId){
  if(!serverMode || !profile || !chatId) return;
  clearTimeout(markReadTimer);
  markReadTimer = setTimeout(() => sendOp({ type:'markRead', chatId, memberId: profile.memberId }), 600);
}
async function fetchServerState(){
  if(!serverMode) return;
  try{
    // Cheap poll: only pull the (heavy) full state when the revision number actually changed.
    const rRes = await fetch('/api/revision', { cache:'no-store' });
    if(!rRes.ok) throw new Error('sync failed');
    const rData = await rRes.json();
    if((rData.revision || 0) === serverRevision) return;
    const res = await fetch('/api/state', { cache:'no-store' });
    if(!res.ok) throw new Error('sync failed');
    const data = await res.json(); if(!data?.state) return;
    const incomingState = data.state;
    const newForeignMessages = findNewForeignMessages(incomingState);
    const localActive = state.activeChatId;
    state = incomingState; state.activeChatId = localActive;
    serverRevision = data.revision || 0; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); ensureActiveChatVisible(); renderAll();
    const visibleNew = newForeignMessages.filter(m => visibleChats().some(c => (state.messages[c.id] || []).some(x => x.id === m.id)));
    if(bootCompleted && visibleNew.length){ playNotificationSound(); showToast(tr('t_new_message', { name: visibleNew[0].senderName })); }
    rememberKnownMessages();
  }catch(e){ serverMode = false; clearInterval(syncTimer); updateSyncUI(); showToast(tr('t_live_lost')); }
}
function allMessagesFrom(st){ const out = []; Object.values(st.messages || {}).forEach(list => (list || []).forEach(m => out.push(m))); return out; }
function rememberKnownMessages(){ knownMessageIds = new Set(allMessagesFrom(state).map(m => m.id)); }
function findNewForeignMessages(nextState){ return allMessagesFrom(nextState).filter(m => !knownMessageIds.has(m.id) && (!profile || m.senderId !== profile.memberId)); }
function enableSound(){ soundEnabled = true; localStorage.setItem(SOUND_KEY, '1'); try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} updateSoundUI(); }
function toggleSound(){ if(!soundEnabled){ enableSound(); playNotificationSound(); showToast(tr('t_sound_on')); }else{ soundEnabled = false; localStorage.setItem(SOUND_KEY, '0'); updateSoundUI(); showToast(tr('t_sound_off')); } }
function updateSoundUI(){ if(els.soundBtn){ els.soundBtn.textContent = soundEnabled ? '🔔' : '🔕'; els.soundBtn.title = tr('sound_label') + ': ' + (soundEnabled ? tr('state_on') : tr('state_off')); els.soundBtn.classList.toggle('active-sound', soundEnabled); } }
function playNotificationSound(){ if(!soundEnabled) return; try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); const t = audioCtx.currentTime; beep(t, 660, 0.09, 0.055); beep(t + 0.12, 880, 0.11, 0.045); }catch(e){} }
function beep(start, freq, duration, volume){ const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start); gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(start); osc.stop(start + duration + 0.02); }

// ---- Invite / Share: one permanent link, sent with the native share sheet (mobile) or clipboard ----
function appLink(){ return location.origin + location.pathname.replace(/[^/]*$/, ''); }
async function inviteShare(){
  if(location.protocol === 'file:'){ return showToast(tr('sync_local')); }
  const link = appLink();
  const msg = tr('invite_message') + '\n' + link;
  if(navigator.share){
    try{ await navigator.share({ title: tr('invite_title'), text: tr('invite_message'), url: link }); return; }
    catch(e){ if(e && e.name === 'AbortError') return; }
  }
  try{ await navigator.clipboard.writeText(msg); showToast(tr('invite_copied')); }
  catch(e){ try{ window.prompt(tr('invite_copied'), link); }catch(_){} }
}

// ---- Control Room: admin-only command center (laptop/desktop) ----
function openControlRoom(){
  if(!isAdmin()) return showToast(tr('cr_only_admin'));
  renderControlRoom();
  openModal(els.controlRoomModal);
}
function lastActivity(chat){
  const msgs = state.messages[chat.id] || [];
  const last = msgs[msgs.length - 1];
  return last ? formatTime(last.time) : '—';
}
function renderControlRoom(){
  if(!els.controlRoomModal) return;
  const onlineCount = state.members.filter(m => m.online).length;
  const msgCount = allMessagesFrom(state).length;
  const files = collectFiles();
  const kpis = [
    { v: state.chats.length, k:'cr_kpi_convos' },
    { v: onlineCount + '/' + state.members.length, k:'cr_kpi_staff' },
    { v: msgCount, k:'cr_kpi_messages' },
    { v: files.length, k:'cr_kpi_files' }
  ];
  els.crKpis.innerHTML = kpis.map(x => `<div class="cr-kpi"><div class="cr-kpi-val">${escapeHTML(String(x.v))}</div><div class="cr-kpi-lbl">${escapeHTML(tr(x.k))}</div></div>`).join('');

  els.crConvos.innerHTML = state.chats.map(chat => {
    const unread = unreadCount(chat);
    return `<button class="cr-row" data-cr-chat="${chat.id}">
      <div class="avatar small">${escapeHTML(chat.color || initials(chat.name))}</div>
      <div class="cr-row-copy">
        <div class="cr-row-title" style="color:${nameColor(chat.type==='dm' ? chat.name : chat.id)}">${chat.locked ? '🔒 ' : ''}${escapeHTML(chat.name)}</div>
        <div class="cr-row-sub">${chatTypeLabel(chat)} • ${accessLabel(chat)} • ${chat.memberIds?.length || 0} ${tr('members_word')} • ${tr('cr_last')}: ${lastActivity(chat)}</div>
      </div>
      ${unread ? `<span class="badge">${unread}</span>` : ''}
    </button>`;
  }).join('');
  els.crConvos.querySelectorAll('[data-cr-chat]').forEach(btn => btn.addEventListener('click', () => {
    state.activeChatId = btn.dataset.crChat; markChatRead(state.activeChatId); scheduleMarkRead(state.activeChatId);
    closeModals(); setTab('chats'); saveState(); renderAll();
  }));

  els.crStaff.innerHTML = state.members.map(m => `<div class="cr-row static">
    <div class="avatar small">${escapeHTML(initials(m.name))}</div>
    <div class="cr-row-copy">
      <div class="cr-row-title" style="color:${nameColor(m.id)}">${escapeHTML(m.name)}</div>
      <div class="cr-row-sub">${escapeHTML(m.role || '')}${m.team ? ' • ' + escapeHTML(m.team) : ''}</div>
    </div>
    <span class="cr-pill ${m.online ? 'on' : 'off'}">${m.online ? tr('cr_online') : tr('cr_offline')}</span>
    ${profile && m.id !== profile.memberId ? `<button class="mini-btn" data-cr-dm="${m.id}">${tr('msg_btn')}</button>` : ''}
  </div>`).join('');
  els.crStaff.querySelectorAll('[data-cr-dm]').forEach(btn => btn.addEventListener('click', () => { closeModals(); openPrivateChat(btn.dataset.crDm); }));

  els.crFiles.innerHTML = files.slice(0, 16).map(f => {
    const img = (f.type||'').startsWith('image/') ? safeImg(f.data) : '';
    const dl = safeDataUrl(f.data);
    return `<div class="cr-row static">
    ${img ? `<img class="attachment-thumb tiny" src="${img}" alt="${escapeHTML(f.name)}" />` : `<div class="attachment-icon small">${fileIcon(f.name)}</div>`}
    <div class="cr-row-copy">
      <div class="cr-row-title">${escapeHTML(f.name)}</div>
      <div class="cr-row-sub">${f.locked ? '🔒 ' : ''}${escapeHTML(f.chatName)} • ${escapeHTML(f.senderName)} • ${fileSize(f.size || 0)}</div>
    </div>
    ${dl ? `<a class="mini-btn" href="${dl}" download="${escapeHTML(f.name)}">${tr('download')}</a>` : ''}
  </div>`; }).join('') || `<div class="empty-state">${tr('cr_no_files')}</div>`;
}

boot();
