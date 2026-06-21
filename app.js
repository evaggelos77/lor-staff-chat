const STORAGE_KEY = 'lor_staff_chat_v5_state';
const PROFILE_KEY = 'lor_staff_chat_v5_profile';
const SOUND_KEY = 'lor_staff_chat_v5_sound_enabled';
const ACTIVE_KEY = 'lor_staff_chat_v5_active_chat';
const APP_VERSION = 'V5 ONLINE';

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
  searchInput: $('searchInput'), toast: $('toast'), soundBtn: $('soundBtn'), testSoundBtn: $('testSoundBtn'), syncHint: $('syncHint')
};

function uid(){ return 'id-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36); }
function nowMinus(minutes){ return new Date(Date.now() - minutes*60000).toISOString(); }
function formatTime(iso){ return new Intl.DateTimeFormat('el-GR',{hour:'2-digit',minute:'2-digit'}).format(new Date(iso)); }
function initials(name){ return (name || 'LOR').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function escapeHTML(s=''){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
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
function accessLabel(chat){ if(chat.access === 'all') return 'Όλοι'; if(chat.access === 'locked') return 'Κλειδωμένο'; if(chat.type === 'dm') return 'Ιδιωτικό'; return 'Μόνο μέλη'; }
function chatTypeLabel(chat){ return chat.type === 'dm' ? 'Προσωπική' : 'Ομάδα'; }
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
  bindEvents();
  renderAll();
  updateSoundUI();
  updateSyncUI();
  rememberKnownMessages();
  bootCompleted = true;
  registerSW();
}

function bindEvents(){
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModals()));
  document.querySelectorAll('.pill-btn, .mobile-nav button').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  $('mobileMenuBtn').addEventListener('click', () => els.sidebar.classList.toggle('open'));
  $('settingsBtn').addEventListener('click', () => showToast('Αλλαγή χρήστη από το κουμπί δεξιά. Ο Admin βλέπει όλες τις συνομιλίες.'));
  if(els.soundBtn) els.soundBtn.addEventListener('click', toggleSound);
  if(els.testSoundBtn) els.testSoundBtn.addEventListener('click', () => { enableSound(); playNotificationSound(); showToast('Δοκιμή ήχου ειδοποίησης.'); });
  $('newGroupBtn').addEventListener('click', () => { renderGroupMemberPicker(); openModal(els.groupModal); });
  $('addMemberBtn').addEventListener('click', () => { if(!isAdmin()) return showToast('Μόνο ο Admin προσθέτει νέο προσωπικό στο demo.'); openModal(els.memberModal); });
  $('announceBtn').addEventListener('click', () => { if(!canSendAnnouncement()) return showToast('Ανακοίνωση μπορεί να στείλει Admin ή υπεύθυνος ομάδας.'); els.announceText.value = state.pinned || ''; openModal(els.announceModal); });
  $('infoBtn').addEventListener('click', () => showToast('Κάθε συνομιλία έχει δικά της μέλη και δικαιώματα.'));
  $('exportBtn').addEventListener('click', exportData);
  $('demoReplyBtn').addEventListener('click', demoReply);
  $('clearDemoBtn').addEventListener('click', resetDemo);
  $('logoutBtn').addEventListener('click', logout);

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
  if(window.innerWidth < 821 && tab !== 'chats') els.sidebar.classList.add('open');
}
function renderCurrentTab(){ if(currentTab === 'chats') renderChatList(); if(currentTab === 'staff') renderStaffList(); if(currentTab === 'files') renderFileList(); }
function renderAll(){ ensureActiveChatVisible(); renderProfile(); renderChatList(); renderStaffList(); renderFileList(); renderActiveChat(); renderAttachmentPreview(); updateSoundUI(); updateSyncUI(); }
function renderProfile(){
  const name = profile?.name || 'Demo Admin';
  const role = profile?.role || 'Διαχειριστής';
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
        <div class="chat-name">${chat.locked ? '🔒 ' : ''}${escapeHTML(displayChatName(chat))}</div>
        <div class="chat-last">${last ? escapeHTML(last.text || attachmentSummary(last.attachments)) : escapeHTML(chat.description || 'Νέα συνομιλία')}</div>
        <div class="scope-line">${chatTypeLabel(chat)} • ${accessLabel(chat)} • ${chat.memberIds?.length || 0} μέλη</div>
      </div>
      ${unread ? `<span class="badge">${unread}</span>` : `<span class="status-dot"></span>`}
    </button>`;
  }).join('') || `<div class="empty-state">Δεν έχεις πρόσβαση σε συνομιλίες με αυτή την αναζήτηση.</div>`;
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
      <div class="staff-name">${escapeHTML(m.name)}</div>
      <div class="staff-meta">${escapeHTML(m.role || 'Υπάλληλος')} • ${escapeHTML(m.team || 'Χωρίς ομάδα')} ${m.phone ? '• ' + escapeHTML(m.phone) : ''}</div>
    </div>
    <div class="staff-actions">
      ${profile && m.id !== profile.memberId ? `<button class="mini-btn" data-dm="${m.id}">Μήνυμα</button>` : `<span class="tag">Εσύ</span>`}
      <span class="status-dot" style="opacity:${m.online ? 1 : .25}"></span>
    </div>
  </div>`).join('') || `<div class="empty-state">Δεν βρέθηκαν ονόματα.</div>`;
  els.staffList.querySelectorAll('[data-dm]').forEach(btn => btn.addEventListener('click', () => openPrivateChat(btn.dataset.dm)));
}
function renderFileList(){
  const q = (els.searchInput.value || '').toLowerCase().trim();
  const files = collectFiles().filter(f => !q || (f.name + ' ' + f.chatName + ' ' + f.senderName).toLowerCase().includes(q));
  els.fileList.innerHTML = files.map(f => `<div class="file-item">
    ${f.type.startsWith('image/') ? `<img class="attachment-thumb" src="${f.data}" alt="${escapeHTML(f.name)}" />` : `<div class="attachment-icon">${fileIcon(f.name)}</div>`}
    <div class="file-copy">
      <div class="file-name">${escapeHTML(f.name)}</div>
      <div class="file-meta">${f.locked ? '🔒 ' : ''}${escapeHTML(f.chatName)} • ${escapeHTML(f.senderName)} • ${fileSize(f.size || 0)}</div>
    </div>
    <a class="mini-btn" href="${f.data}" download="${escapeHTML(f.name)}">Λήψη</a>
  </div>`).join('') || `<div class="empty-state">Δεν έχεις ορατά αρχεία ακόμη.</div>`;
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
  els.activeChatMeta.textContent = `${chat.memberIds?.length || 0} μέλη • ${chatTypeLabel(chat)} • ${accessLabel(chat)} • ${serverMode ? '🟢 online' : 'τοπικό demo'}`;
  els.activeChatAvatar.textContent = chat.color || initials(displayChatName(chat));
  els.pinnedNotice.textContent = state.pinned;
  els.detailChatName.textContent = displayChatName(chat);
  els.detailChatType.textContent = chatTypeLabel(chat);
  els.detailMembers.textContent = chat.memberIds?.length || 0;
  els.detailFiles.textContent = collectFiles().filter(f => f.chatName === displayChatName(chat)).length;
  if(els.detailAccess) els.detailAccess.textContent = accessLabel(chat);
  if(els.detailAllowed) els.detailAllowed.textContent = allowedNames(chat);
  els.messageInput.placeholder = canWriteToChat(chat) ? 'Γράψε μήνυμα...' : 'Δεν έχεις δικαίωμα αποστολής εδώ';
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
    const d = new Date(msg.time).toLocaleDateString('el-GR');
    const sep = d !== lastDate ? `<div class="day-separator">${d}</div>` : '';
    lastDate = d;
    const mine = isMine(msg);
    const readers = (msg.readBy || []).filter(id => id !== msg.senderId).length;
    return `${sep}<article class="message ${mine ? 'mine' : ''}">
      <div class="avatar">${escapeHTML(initials(msg.senderName))}</div>
      <div class="bubble">
        <div class="msg-sender">${escapeHTML(msg.senderName)}</div>
        ${msg.text ? `<div class="msg-text">${escapeHTML(msg.text)}</div>` : ''}
        ${renderAttachments(msg.attachments || [])}
        <div class="msg-time">${formatTime(msg.time)} ${mine ? `✓✓ ${readers ? 'διαβάστηκε' : ''}` : ''}</div>
      </div>
    </article>`;
  }).join('') || `<div class="empty-state center">Ξεκίνα τη συνομιλία. ${chat?.locked ? 'Η συνομιλία είναι κλειδωμένη μόνο στα μέλη της.' : ''}</div>`;
  els.messages.scrollTop = els.messages.scrollHeight;
}
function renderAttachments(attachments){
  if(!attachments.length) return '';
  return attachments.map(att => `<div class="attachment-card">
    ${att.type.startsWith('image/') ? `<img class="attachment-thumb" src="${att.data}" alt="${escapeHTML(att.name)}" />` : `<div class="attachment-icon">${fileIcon(att.name)}</div>`}
    <div class="attachment-actions"><div class="attachment-title">${escapeHTML(att.name)}</div><a href="${att.data}" download="${escapeHTML(att.name)}">Άνοιγμα / Λήψη</a></div>
  </div>`).join('');
}
function attachmentSummary(atts=[]){ return atts.length ? `${atts.length} συνημμένο/α` : ''; }
function fileIcon(name=''){ const ext = name.split('.').pop().toLowerCase(); if(['pdf'].includes(ext)) return 'PDF'; if(['xls','xlsx'].includes(ext)) return 'XLS'; if(['doc','docx'].includes(ext)) return 'DOC'; if(['zip'].includes(ext)) return 'ZIP'; return '📄'; }

function manualLogin(){ const name = els.loginName.value.trim(); const role = els.loginRole.value.trim() || 'Υπάλληλος'; if(!name) return showToast('Γράψε όνομα χρήστη.'); doLogin(name, role); }
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
      member = {id: uid(), name, role, phone:'', team:'Demo χρήστες', online:true, permissions:['staff']};
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
  showToast(`Μπήκες ως ${member.name}. Βλέπεις μόνο όσα έχεις δικαίωμα.`);
}
function normalizeName(s=''){ return s.toLocaleLowerCase('el-GR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function logout(){ localStorage.removeItem(PROFILE_KEY); profile = null; els.loginModal.classList.remove('hidden'); renderAll(); showToast('Μπορείς να μπεις με άλλο όνομα για test δικαιωμάτων.'); }
function saveMember(){
  if(!isAdmin()) return showToast('Μόνο ο Admin προσθέτει νέο προσωπικό.');
  const name = els.memberName.value.trim(); if(!name) return showToast('Γράψε όνομα προσωπικού.');
  const member = { id:uid(), name, role:els.memberRole.value.trim() || 'Υπάλληλος', phone:els.memberPhone.value.trim(), team:els.memberTeam.value.trim() || 'Γενική ομάδα', online:false, permissions:['staff'] };
  state.members.push(member);
  state.chats.find(c => c.id === 'general')?.memberIds.push(member.id);
  saveState(); sendOp({ type:'member', member }); closeModals(); renderAll(); showToast('Το όνομα αποθηκεύτηκε και μπήκε στη Γενική Ομάδα.');
  els.memberName.value = els.memberRole.value = els.memberPhone.value = els.memberTeam.value = '';
}
function renderGroupMemberPicker(){
  if(!els.memberPicker) return;
  const members = visibleMembersForStaff();
  const me = profile?.memberId;
  els.memberPicker.innerHTML = members.map(m => `<label class="checkbox-row"><input type="checkbox" value="${m.id}" ${m.id === me ? 'checked disabled' : ''} /> <span>${escapeHTML(m.name)}</span><em>${escapeHTML(m.role || '')}</em></label>`).join('');
}
function saveGroup(){
  const name = els.groupName.value.trim(); if(!name) return showToast('Γράψε όνομα ομάδας.');
  const selected = els.memberPicker ? [...els.memberPicker.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value) : [];
  if(profile && !selected.includes(profile.memberId)) selected.push(profile.memberId);
  if(selected.length < 2) return showToast('Βάλε τουλάχιστον 2 άτομα στην ομάδα.');
  const access = els.groupAccess?.value || 'members';
  const chat = { id: uid(), type:'group', name, description: els.groupDescription.value.trim() || 'Νέα κλειδωμένη ομάδα προσωπικού', memberIds: selected, unread:0, color: initials(name).slice(0,1), access, locked: access !== 'all' };
  const seed = { id:uid(), senderId: profile?.memberId || 'system', senderName: profile?.name || 'LOR Admin', text:`Δημιουργήθηκε η ομάδα: ${name}. Ορατή μόνο στα επιλεγμένα μέλη.`, time:new Date().toISOString(), attachments:[], readBy: profile ? [profile.memberId] : [] };
  state.chats.unshift(chat);
  state.messages[chat.id] = [seed];
  state.activeChatId = chat.id;
  saveState(); sendOp({ type:'group', chat, message: seed }); closeModals(); renderAll(); showToast('Η νέα ομάδα δημιουργήθηκε με δικαιώματα.');
  els.groupName.value = els.groupDescription.value = '';
}
function openPrivateChat(memberId){
  if(!profile) return showToast('Πρώτα κάνε είσοδο.');
  if(memberId === profile.memberId) return;
  const target = memberById(memberId); if(!target) return;
  let chat = state.chats.find(c => c.type === 'dm' && c.memberIds.includes(profile.memberId) && c.memberIds.includes(memberId));
  if(!chat){
    chat = { id:'dm-' + [profile.memberId, memberId].sort().join('-'), type:'dm', name:target.name, description:`Προσωπική συνομιλία με ${target.name}`, memberIds:[profile.memberId, memberId], unread:0, color: initials(target.name).slice(0,1), access:'private', locked:true };
    state.chats.unshift(chat); state.messages[chat.id] = [];
    sendOp({ type:'dm', chat });
  }
  state.activeChatId = chat.id;
  saveState(); renderAll(); setTab('chats'); els.sidebar.classList.remove('open');
  showToast(`Άνοιξε προσωπικό chat με ${target.name}.`);
}
function canSendAnnouncement(){ return isAdmin() || hasPermission('event_manager'); }
function saveAnnouncement(){
  if(!canSendAnnouncement()) return showToast('Δεν έχεις δικαίωμα ανακοίνωσης.');
  const text = els.announceText.value.trim(); if(!text) return showToast('Γράψε ανακοίνωση.');
  state.pinned = text; const msg = addMessage({ text:'📌 Νέα ανακοίνωση: ' + text, attachments:[] });
  saveState(); sendOp({ type:'announce', chatId: state.activeChatId, pinned: text, message: msg }); closeModals(); renderAll(); showToast('Η ανακοίνωση καρφιτσώθηκε στη συγκεκριμένη συνομιλία.');
}

async function handleFiles(files){
  if(!files.length) return;
  const chat = activeChat(); if(!canWriteToChat(chat)) return showToast('Δεν έχεις δικαίωμα να ανεβάσεις εδώ.');
  for(const file of files){
    if(file.size > 4 * 1024 * 1024){ showToast(`Το ${file.name} είναι μεγάλο για demo. Μέχρι 4MB.`); continue; }
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
  const chat = activeChat(); if(!canWriteToChat(chat)) return showToast('Δεν έχεις δικαίωμα αποστολής σε αυτή τη συνομιλία.');
  const text = els.messageInput.value.trim(); if(!text && !pendingAttachments.length) return;
  const msg = addMessage({ text, attachments: pendingAttachments });
  pendingAttachments = []; els.messageInput.value = ''; autoGrow(); renderAttachmentPreview(); saveState(); renderAll();
  sendOp({ type:'message', chatId: chat.id, message: msg });
}
function addMessage({text, attachments}){
  const p = profile || { memberId:'m-ev', name:'Ευάγγελος' };
  const msg = { id:uid(), senderId:p.memberId, senderName:p.name, text, time:new Date().toISOString(), attachments: attachments || [], readBy:[p.memberId] };
  if(!state.messages[state.activeChatId]) state.messages[state.activeChatId] = [];
  state.messages[state.activeChatId].push(msg);
  return msg;
}
function demoReply(){
  const chat = activeChat();
  const otherIds = (chat.memberIds || []).filter(id => id !== profile?.memberId);
  const member = memberById(otherIds[Math.floor(Math.random()*otherIds.length)]) || state.members[1];
  const replies = ['Το είδα, προχωράω τώρα.','Έφτασα στον χώρο και περιμένω οδηγίες.','Ανέβασα τα στοιχεία στη σωστή συνομιλία.','Το κρατάω κλειδωμένο μόνο σε αυτή την ομάδα.','Ο εξοπλισμός είναι έτοιμος.'];
  const reply = { id:uid(), senderId:member.id, senderName:member.name, text:replies[Math.floor(Math.random()*replies.length)], time:new Date().toISOString(), attachments:[], readBy:[member.id] };
  state.messages[chat.id].push(reply);
  saveState(); sendOp({ type:'message', chatId: chat.id, message: reply }); renderAll(); playNotificationSound(); showToast('Προστέθηκε δοκιμαστική απάντηση στη σωστή συνομιλία.');
}
async function resetDemo(){
  if(!confirm('Να καθαρίσει το demo και να γυρίσει στην αρχική κατάσταση;')) return;
  if(serverMode){ await sendOp({ type:'reset' }); await fetchServerState(); }
  else { state = defaultState(); }
  pendingAttachments = []; saveState(); renderAll(); showToast('Το demo καθαρίστηκε.');
}
function exportData(){
  const payload = { exportedAt:new Date().toISOString(), appVersion:APP_VERSION, profile, visibleOnly: !isAdmin(), state: isAdmin() ? state : {...state, chats: visibleChats(), messages: Object.fromEntries(visibleChats().map(c => [c.id, state.messages[c.id] || []]))} };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'lor-staff-chat-export.json'; a.click(); URL.revokeObjectURL(url); showToast('Κατέβηκε export με βάση τα δικαιώματά σου.');
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
      startSyncLoop(); showToast('Live σύνδεση ενεργή — όλοι βλέπουν τα μηνύματα σε πραγματικό χρόνο.');
    }
  }catch(e){ serverMode = false; }
}
function updateSyncUI(){
  if(!els.syncHint) return;
  const chat = activeChat();
  if(serverMode){ els.syncHint.textContent = `🟢 Online • ${accessLabel(chat)} • Μηνύματα/αρχεία φαίνονται μόνο στους χρήστες της συνομιλίας • Ήχος: ${soundEnabled ? 'ON' : 'OFF'}`; }
  else { els.syncHint.textContent = 'Τοπικό demo στη συσκευή • Άνοιξε το online link για επικοινωνία σε πραγματικό χρόνο.'; }
}
function startSyncLoop(){ clearInterval(syncTimer); syncTimer = setInterval(fetchServerState, 1400); }
// One mutation = one op. The server appends atomically, so two people sending at once never overwrite each other.
async function sendOp(op){
  if(!serverMode) return null;
  try{
    const res = await fetch('/api/op', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ op }) });
    if(!res.ok) throw new Error('op failed');
    return await res.json();
  }catch(e){ showToast('Δεν στάλθηκε. Έλεγξε τη σύνδεση και ξαναδοκίμασε.'); return null; }
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
    if(bootCompleted && visibleNew.length){ playNotificationSound(); showToast(`Νέο μήνυμα από ${visibleNew[0].senderName}.`); }
    rememberKnownMessages();
  }catch(e){ serverMode = false; clearInterval(syncTimer); updateSyncUI(); showToast('Η live σύνδεση χάθηκε. Γύρισε σε τοπικό demo.'); }
}
function allMessagesFrom(st){ const out = []; Object.values(st.messages || {}).forEach(list => (list || []).forEach(m => out.push(m))); return out; }
function rememberKnownMessages(){ knownMessageIds = new Set(allMessagesFrom(state).map(m => m.id)); }
function findNewForeignMessages(nextState){ return allMessagesFrom(nextState).filter(m => !knownMessageIds.has(m.id) && (!profile || m.senderId !== profile.memberId)); }
function enableSound(){ soundEnabled = true; localStorage.setItem(SOUND_KEY, '1'); try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} updateSoundUI(); }
function toggleSound(){ if(!soundEnabled){ enableSound(); playNotificationSound(); showToast('Ο ήχος ειδοποίησης ενεργοποιήθηκε.'); }else{ soundEnabled = false; localStorage.setItem(SOUND_KEY, '0'); updateSoundUI(); showToast('Ο ήχος ειδοποίησης έκλεισε.'); } }
function updateSoundUI(){ if(els.soundBtn){ els.soundBtn.textContent = soundEnabled ? '🔔 Ήχος ON' : '🔕 Ήχος OFF'; els.soundBtn.classList.toggle('active-sound', soundEnabled); } }
function playNotificationSound(){ if(!soundEnabled) return; try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); const t = audioCtx.currentTime; beep(t, 660, 0.09, 0.055); beep(t + 0.12, 880, 0.11, 0.045); }catch(e){} }
function beep(start, freq, duration, volume){ const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start); gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(start); osc.stop(start + duration + 0.02); }

boot();
