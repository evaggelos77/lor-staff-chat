const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || process.argv[2] || 8787;
const ROOT = __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(ROOT, 'lor_staff_chat_live_data.json');
let revision = 1;

function t(min){ return new Date(Date.now() - min*60000).toISOString(); }
function shortRand(){ return Math.random().toString(36).slice(2,8); }
function normalizeName(s=''){ return String(s).toLocaleLowerCase('el-GR').normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }

function defaultState(){
  return {
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
        { id:'srv-welcome-1', senderId:'m-ev', senderName:'Ευάγγελος', text:'Καλωσήρθατε στο LOR Staff Chat. Η γενική ομάδα είναι ορατή σε όλους.', time:t(84), attachments:[], readBy:['m-ev'] },
        { id:'srv-welcome-2', senderId:'m-anna', senderName:'Άννα', text:'Ό,τι αφορά όλη την ομάδα γράφεται εδώ. Ιδιωτικά και οικονομικά μπαίνουν σε ξεχωριστό chat.', time:t(61), attachments:[], readBy:['m-ev','m-anna'] }
      ],
      'event-athens': [
        { id:'srv-event-1', senderId:'m-anna', senderName:'Άννα', text:'Οδηγίες event: άφιξη 17:30, τεχνικός έλεγχος 18:00.', time:t(132), attachments:[], readBy:['m-ev','m-anna'] }
      ],
      'equipment': [
        { id:'srv-eq-1', senderId:'m-nikos', senderName:'Νίκος', text:'Εδώ ανεβάζουμε μόνο φωτογραφίες και αρχεία εξοπλισμού.', time:t(95), attachments:[], readBy:['m-ev','m-nikos'] }
      ],
      'finance': [
        { id:'srv-fin-1', senderId:'m-ev', senderName:'Ευάγγελος', text:'Παναγιώτη, εδώ θα μπαίνουν οικονομικά στοιχεία, προσφορές και κόστη. Δεν εμφανίζονται στη Μαρία ή στην Άννα αν δεν τους δώσουμε πρόσβαση.', time:t(48), attachments:[], readBy:['m-ev'] }
      ],
      'dm-anna': [
        { id:'srv-dm-anna-1', senderId:'m-anna', senderName:'Άννα', text:'Αυτή είναι προσωπική συνομιλία. Δεν τη βλέπει η υπόλοιπη ομάδα.', time:t(38), attachments:[], readBy:['m-ev','m-anna'] }
      ],
      'dm-maria': [],
      'dm-panagiotis': []
    }
  };
}

function loadState(){
  try{ if(fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }catch(e){}
  const s = defaultState(); try{ fs.writeFileSync(DATA_FILE, JSON.stringify(s,null,2), 'utf8'); }catch(e){} return s;
}
function saveState(){ try{ fs.writeFileSync(DATA_FILE, JSON.stringify(state,null,2), 'utf8'); }catch(e){} revision++; }
let state = loadState();

// ---- limits (demo-safe, but generous) ----
const MAX_TEXT = 4000;
const MAX_ATTACHMENTS = 8;
const MAX_ATT_DATA = 8 * 1024 * 1024; // ~8MB per attachment (base64 string length)

function sanitizeMessage(m){
  const text = typeof m.text === 'string' ? m.text.slice(0, MAX_TEXT) : '';
  let attachments = Array.isArray(m.attachments) ? m.attachments.slice(0, MAX_ATTACHMENTS) : [];
  attachments = attachments
    .filter(a => a && typeof a.data === 'string' && a.data.length <= MAX_ATT_DATA)
    .map(a => ({ id:String(a.id||'').slice(0,80), name:String(a.name||'file').slice(0,200), type:String(a.type||'application/octet-stream').slice(0,120), size:Number(a.size)||0, data:a.data }));
  return {
    id: String(m.id||'').slice(0,120),
    senderId: String(m.senderId||'').slice(0,120),
    senderName: String(m.senderName||'').slice(0,120),
    text, time: m.time || new Date().toISOString(),
    attachments,
    readBy: Array.isArray(m.readBy) ? m.readBy.map(x=>String(x).slice(0,120)).slice(0,50) : []
  };
}

function ensureMember(name, role){
  const norm = normalizeName(name);
  let m = state.members.find(x => normalizeName(x.name) === norm);
  if(!m){
    m = { id:'m-'+(norm.replace(/[^a-z0-9α-ω]+/gi,'-').replace(/(^-|-$)/g,'')||'user')+'-'+shortRand(),
          name:String(name).slice(0,80), role:String(role||'Υπάλληλος').slice(0,80), phone:'', team:'Demo χρήστες', online:true, permissions:['staff'] };
    state.members.push(m);
    const gen = state.chats.find(c => c.id === 'general');
    if(gen && !gen.memberIds.includes(m.id)) gen.memberIds.push(m.id);
  }
  m.online = true;
  return m;
}

function applyOp(op){
  if(!op || !op.type) throw new Error('bad op');
  switch(op.type){
    case 'login': {
      const m = ensureMember(op.name, op.role);
      saveState();
      return { member: m };
    }
    case 'message': {
      const chatId = op.chatId;
      if(!chatId || !op.message || !op.message.id) throw new Error('bad message');
      if(!state.messages[chatId]) state.messages[chatId] = [];
      if(!state.messages[chatId].some(x => x.id === op.message.id)){
        state.messages[chatId].push(sanitizeMessage(op.message));
        saveState();
      }
      return {};
    }
    case 'group': {
      const chat = op.chat;
      if(!chat || !chat.id) throw new Error('bad group');
      if(!state.chats.some(c => c.id === chat.id)) state.chats.unshift(chat);
      if(!state.messages[chat.id]) state.messages[chat.id] = [];
      if(op.message && op.message.id && !state.messages[chat.id].some(x => x.id === op.message.id)){
        state.messages[chat.id].push(sanitizeMessage(op.message));
      }
      saveState();
      return {};
    }
    case 'dm': {
      const chat = op.chat;
      if(chat && chat.id && !state.chats.some(c => c.id === chat.id)){
        state.chats.unshift(chat);
        if(!state.messages[chat.id]) state.messages[chat.id] = [];
        saveState();
      }
      return {};
    }
    case 'member': {
      const member = op.member;
      if(member && member.id && !state.members.some(m => m.id === member.id)){
        state.members.push(member);
        const gen = state.chats.find(c => c.id === 'general');
        if(gen && !gen.memberIds.includes(member.id)) gen.memberIds.push(member.id);
        saveState();
      }
      return {};
    }
    case 'announce': {
      if(typeof op.pinned === 'string') state.pinned = op.pinned.slice(0, MAX_TEXT);
      if(op.chatId && op.message && op.message.id){
        if(!state.messages[op.chatId]) state.messages[op.chatId] = [];
        if(!state.messages[op.chatId].some(x => x.id === op.message.id)) state.messages[op.chatId].push(sanitizeMessage(op.message));
      }
      saveState();
      return {};
    }
    case 'markRead': {
      const { chatId, memberId } = op;
      if(chatId && memberId && state.messages[chatId]){
        let changed = false;
        state.messages[chatId].forEach(m => {
          if(!(m.readBy || []).includes(memberId)){ m.readBy = Array.from(new Set([...(m.readBy || []), memberId])); changed = true; }
        });
        if(changed) saveState();
      }
      return {};
    }
    case 'reset': { state = defaultState(); saveState(); return {}; }
    default: throw new Error('unknown op ' + op.type);
  }
}

function sendJson(res, status, obj){
  const body = JSON.stringify(obj);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});
  res.end(body);
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data', chunk => { body += chunk; if(body.length > 40 * 1024 * 1024){ req.destroy(); reject(new Error('body too large')); } });
    req.on('end',()=>resolve(body)); req.on('error',reject);
  });
}
function contentType(file){
  const ext = path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'})[ext] || 'application/octet-stream';
}

const server = http.createServer(async (req,res)=>{
  try{
    const url = new URL(req.url, `http://${req.headers.host}`);
    if(req.method === 'OPTIONS'){
      res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}); return res.end();
    }
    // Lightweight poll: clients hit this every ~1.4s and only pull full state when the number changed.
    if(url.pathname === '/api/revision' && req.method === 'GET') return sendJson(res, 200, {ok:true, revision});
    if(url.pathname === '/api/state' && req.method === 'GET') return sendJson(res, 200, {ok:true, revision, state});
    if(url.pathname === '/api/op' && req.method === 'POST'){
      const body = await readBody(req); const data = JSON.parse(body || '{}');
      const result = applyOp(data.op);
      return sendJson(res, 200, Object.assign({ok:true, revision}, result));
    }
    if(url.pathname === '/api/reset' && req.method === 'POST'){
      state = defaultState(); saveState(); return sendJson(res, 200, {ok:true, revision, state});
    }
    let filePath = path.normalize(path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
    if(!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(filePath, (err, data)=>{
      if(err){ res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
      const noCache = /\.(html|js|css|webmanifest)$/i.test(filePath);
      res.writeHead(200, {'Content-Type': contentType(filePath), 'Cache-Control': noCache ? 'no-store' : 'public, max-age=300'}); res.end(data);
    });
  }catch(e){ sendJson(res, 400, {ok:false, error:e.message}); }
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces(); const ips = [];
  for(const name of Object.keys(nets)){ for(const net of nets[name]){ if(net.family === 'IPv4' && !net.internal) ips.push(net.address); } }
  console.log('\n==============================================');
  console.log(' LOR. STAFF CHAT — ONLINE / PRIVATE ROLES');
  console.log('==============================================');
  console.log(`Τοπικά: http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`Στο ίδιο Wi‑Fi: http://${ip}:${PORT}`));
  console.log('==============================================\n');
});
