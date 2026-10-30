/* ============================================================
   MET Campus — core data, helpers, icons, routing shell
   ============================================================ */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DB_KEY = 'metCampus.v4';
const LEGACY_DB_KEY = 'metCampus.v3';
const DB_VERSION = 4;

const SUBJECT_TONE = {
  dbms: 'lilac',
  cn: 'peri',
  se: 'butter',
  toc: 'rose',
  ml: 'mint'
};
const TONE_BG = {
  lilac: 'var(--lilac-soft)',
  peri: 'var(--sky)',
  butter: 'var(--butter-soft)',
  peach: 'var(--peach-soft)',
  mint: 'var(--mint-soft)',
  rose: 'var(--rose-soft)'
};

/* ---------- dates ---------- */
function pad2(n){ return String(n).padStart(2, '0'); }
function ymd(d){ return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isoIn(days, hour, minute){
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour === undefined ? 23 : hour, minute === undefined ? 59 : minute, 0, 0);
  return d.toISOString();
}
function isoAgo(mins){ return new Date(Date.now() - mins * 60000).toISOString(); }
function isoFromDateInput(value, hour, minute){
  if(!value) return isoIn(3);
  const d = new Date(value + 'T' + pad2(hour || 23) + ':' + pad2(minute || 59) + ':00');
  return isNaN(d.getTime()) ? isoIn(3) : d.toISOString();
}
function fmtShort(iso){ if(!iso || isNaN(new Date(iso).getTime())) return 'Date not supplied'; const d = new Date(iso); return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; }
function fmtDate(iso){ if(!iso || isNaN(new Date(iso).getTime())) return 'Date not supplied'; const d = new Date(iso); return DOW_SHORT[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; }
function fmtLongDate(date){ const d = new Date(date); return DOW_LONG[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
function fmtTime(iso){
  if(!iso || isNaN(new Date(iso).getTime())) return 'Time not supplied';
  const d = new Date(iso);
  let h = d.getHours(), m = pad2(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if(h === 0) h = 12;
  return h + ':' + m + ' ' + ap;
}
function clockNow(){
  const d = new Date();
  let h = d.getHours(); const m = pad2(d.getMinutes()); const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if(h === 0) h = 12;
  return h + ':' + m + ' ' + ap;
}
function timeAgo(iso){
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if(mins < 1) return 'Just now';
  if(mins < 60) return mins + ' min ago';
  const h = Math.floor(mins / 60);
  if(h < 24) return h + (h === 1 ? ' hr ago' : ' hrs ago');
  const d = Math.floor(h / 24);
  if(d === 1) return 'Yesterday';
  if(d < 7) return d + ' days ago';
  return fmtShort(iso);
}
function dueMeta(iso){
  if(!iso) return { label:'Due date not supplied', tone:'', date:'Date not supplied' };
  if(isNaN(new Date(iso).getTime())) return { label:'Due date not supplied', tone:'', date:'Date not supplied' };
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(iso));
  const diff = Math.round((target - today) / 86400000);
  if(diff < 0){
    return { label: diff === -1 ? 'Overdue by a day' : 'Overdue by ' + Math.abs(diff) + ' days', tone: 'red', date: fmtShort(iso) };
  }
  if(diff === 0) return { label: 'Due today', tone: 'amber', date: fmtShort(iso) };
  if(diff === 1) return { label: 'Due tomorrow', tone: 'amber', date: fmtShort(iso) };
  return { label: 'Due in ' + diff + ' days', tone: 'muted', date: fmtShort(iso) };
}
function greeting(){
  const h = new Date().getHours();
  if(h < 12) return 'Good morning';
  if(h < 17) return 'Good afternoon';
  return 'Good evening';
}
function deadlineMeta(iso){
  if(!iso || isNaN(new Date(iso).getTime())) return { label:'Deadline not supplied', short:'No deadline', closed:false };
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(iso));
  const diff = Math.round((target - today) / 86400000);
  if(diff < 0) return { label: 'Applications closed', short: 'Closed', closed: true };
  if(diff === 0) return { label: 'Closes today', short: 'Today', closed: false };
  if(diff === 1) return { label: 'Closes tomorrow', short: '1 day left', closed: false };
  return { label: 'Closes ' + fmtShort(iso), short: diff + ' days left', closed: false };
}

/* ---------- small helpers ---------- */
function esc(v){
  return String(v == null ? '' : v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function initials(name){
  return String(name || '')
    .replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i,'')
    .split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase();
}
function first(v){ return v && v.length ? v[0] : ''; }
function pct(a, t){ return t > 0 ? Math.round((a / t) * 100) : 0; }
function subjectPct(s){ return s && s.total > 0 ? pct(s.attended, s.total) : null; }
function overallAttendance(){
  const a = db.subjects.reduce((n,s) => n + s.attended, 0);
  const t = db.subjects.reduce((n,s) => n + s.total, 0);
  return t > 0 ? pct(a,t) : null;
}
function totalLectures(){
  return db.subjects.reduce((n,s) => n + s.total, 0);
}
function totalAttended(){
  return db.subjects.reduce((n,s) => n + s.attended, 0);
}
function subj(id){ return db.subjects.find(s => s.id === id); }
function studentById(id){ return db.students.find(s => s.id === id); }
function unreadNotifs(){ return db.notifications.filter(n => !n.read).length; }
function pendingAssignments(){ return db.assignments.filter(a => !a.submitted); }
function assignmentsForSubject(id){ return db.assignments.filter(a => a.subjectId === id); }
function notesForSubject(id){ return db.notes.filter(n => n.subjectId === id); }
function attColor(p){ return p == null ? '#756e7c' : p >= 75 ? '#2c7547' : '#a83838'; }
function attBarClass(p){ return p == null ? '' : p >= 75 ? 'bar--green' : 'bar--red'; }
function attBadgeClass(p){ return p == null ? '' : p >= 75 ? 'badge--green' : 'badge--red'; }
function safeToSkip(s){
  const p = subjectPct(s);
  if(p == null) return 0;
  if(p >= 75) return Math.max(0, Math.floor(s.attended / 0.75 - s.total));
  return 0;
}
function lecturesNeeded(s){
  const p = subjectPct(s);
  if(p == null) return 0;
  if(p >= 75) return 0;
  return Math.max(1, Math.ceil(3 * s.total - 4 * s.attended));
}
function nextClass(){
  const now = new Date();
  for(let add = 0; add < 8; add++){
    const d = addDays(now, add);
    if(d.getDay() === 0) continue;
    const slots = timetableSlotsForStudent(d.getDay());
    for(const slot of slots){
      const [h,m] = slot.start.split(':').map(Number);
      const start = new Date(d); start.setHours(h, m, 0, 0);
      if(start > now) return Object.assign({}, slot, { day: d.getDay(), date: d, startDate: start });
    }
  }
  return null;
}
function slotInfo(slot){
  if(slot.subjectId){
    const s = subj(slot.subjectId) || (typeof registerSubjectById === 'function' ? registerSubjectById(slot.subjectId) : null);
    return {
      name: slot.displayName || (s ? s.name : slot.title),
      shortName: slot.displayName || (s ? s.name.replace('Database Management Systems','Database Management').replace('Theory of Computation','Theory of Computation') : slot.title),
      code: slot.displayCode || (s ? s.code : (slot.code || '')),
      faculty: slot.faculty || (s ? s.faculty : ''),
      room: slot.room || (s ? s.room : ''),
      tone: s ? s.tone : (slot.tone || 'butter')
    };
  }
  return {
    name: slot.title,
    shortName: slot.title,
    code: slot.code || '',
    faculty: slot.faculty || '',
    room: slot.room || '',
    tone: slot.tone || 'butter'
  };
}
function timetableHasBatchSlots(){ return Object.values(db.timetable || {}).some(slots => (slots || []).some(slot => !!slot.batch)); }
function timetableBatchLabel(id){
  const batch = TE_CSD_SEM_V_BATCHES.find(item => item.id === id);
  return batch ? batch.id + ' · Rolls ' + batch.start + '–' + batch.end : String(id || '');
}
function timetableSlotsForStudent(day){
  const group = db.profile && db.profile.labGroup;
  return (db.timetable[day] || []).filter(slot => !slot.batch || (!!group && slot.batch === group)).slice().sort((a,b) => toMinutes(a.start) - toMinutes(b.start));
}
function todaySlots(){ return timetableSlotsForStudent(new Date().getDay()); }
function nextClassLabel(){
  const nx = nextClass();
  if(!nx) return null;
  const today = new Date();
  const sameDay = nx.date.toDateString() === today.toDateString();
  if(sameDay){
    const mins = Math.max(1, Math.round((nx.startDate - Date.now()) / 60000));
    return 'In ' + mins + ' min';
  }
  const tomorrow = addDays(today, 1).toDateString() === nx.date.toDateString();
  return (tomorrow ? 'Tomorrow' : DOW_SHORT[nx.day]) + ' · ' + nx.start;
}
function ring(p, size, color, track){
  size = size || 76;
  const sw = Math.max(5, Math.round(size * 0.075));
  const r = (size - sw) / 2 - 1;
  const c = 2 * Math.PI * r;
  return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px">' +
    '<svg width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="' + (track || 'rgba(19,19,19,.1)') + '" stroke-width="' + sw + '"/>' +
      '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="' + (color || '#131313') + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (p == null ? c : c * (1 - p / 100)) + '"/>' +
    '</svg>' +
      '<div class="ring__label"><b style="color:' + (color || '#131313') + '">' + (p == null ? '—' : p + '%') + '</b></div>' +
  '</div>';
}

/* ---------- icons ---------- */
const ICONS = {
  home:'<path d="M3.6 10.8 12 3.6l8.4 7.2"/><path d="M5.6 9.6V20a1 1 0 0 0 1 1H10v-5.6h4V21h3.4a1 1 0 0 0 1-1V9.6"/>',
  calendar:'<rect x="3.2" y="5.2" width="17.6" height="15.6" rx="4"/><path d="M3.2 10h17.6M8.2 3v4M15.8 3v4"/>',
  clipboard:'<rect x="5" y="4.5" width="14" height="17" rx="3"/><path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7M9 10h6M9 14h6M9 18h3"/>',
  check:'<path d="m5 12.5 4.4 4.4L19 6.8"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.6 2.6 5.2-5.6"/>',
  book:'<path d="M4.2 5.4A2.4 2.4 0 0 1 6.6 3H20v16.4H6.6a2.4 2.4 0 0 0-2.4 2.4z"/><path d="M4.2 5.4v16.4M8.4 7.4h8M8.4 11h6"/>',
  grid:'<rect x="3" y="3" width="7.4" height="7.4" rx="2.2"/><rect x="13.6" y="3" width="7.4" height="7.4" rx="2.2"/><rect x="3" y="13.6" width="7.4" height="7.4" rx="2.2"/><rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2.2"/>',
  bell:'<path d="M18.2 9.2A6.2 6.2 0 0 0 5.8 9.2c0 7-2.8 8.2-2.8 8.2h18s-2.8-1.2-2.8-8.2"/><path d="M10.2 21h3.6"/>',
  arrowLeft:'<path d="M19.5 12h-15M11 4.5 3.5 12l7.5 7.5"/>',
  arrowUpRight:'<path d="M6.5 17.5 17.5 6.5M8 6.5h9.5V16"/>',
  chevronRight:'<path d="m9 5 7 7-7 7"/>',
  chevronLeft:'<path d="m15 5-7 7 7 7"/>',
  chevronDown:'<path d="m5 9 7 7 7-7"/>',
  plus:'<path d="M12 4.5v15M4.5 12h15"/>',
  x:'<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  pin:'<path d="M9 3.5h6l-1 5 3 3H7l3-3z"/><path d="M12 11.5V20"/>',
  paperclip:'<path d="M21 12.5 12.5 21a5.5 5.5 0 0 1-7.8-7.8L13.7 4.2a3.7 3.7 0 1 1 5.2 5.2L10.5 17a2 2 0 1 1-2.8-2.8l8.1-8.1"/>',
  send:'<path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10z"/>',
  briefcase:'<rect x="3" y="7.5" width="18" height="13" rx="3"/><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3 12h18"/>',
  award:'<circle cx="12" cy="9" r="5.2"/><path d="m8.5 13.5-1 7 4.5-2.6 4.5 2.6-1-7"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  file:'<path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M13.5 3v5.5H19M8.5 13h7M8.5 17h4.5"/>',
  download:'<path d="M12 3.5v11M8 11l4 4 4-4"/><path d="M4.5 19.5h15"/>',
  qr:'<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 14h2.5M18 18h2.5v2.5H18zM14 18v2.5"/>',
  location:'<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.2 2"/>',
  users:'<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.7" cy="7.3" r="3.5"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5M15.5 4a3.6 3.6 0 0 0 0 6.6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  settings:'<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout:'<path d="M9.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4.5M16 16l4-4-4-4M20 12H9"/>',
  shield:'<path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.8 7.5-9.5V6z"/><path d="m9 12 2 2 4-4.5"/>',
  camera:'<path d="M3.5 8.5h3l1.5-2.5h8l1.5 2.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>',
  alert:'<path d="M12 4 2.8 20h18.4z"/><path d="M12 9v4.5M12 17h.01"/>',
  sparkle:'<path d="M12 3.5c.6 4.7 3.2 7.3 7.9 7.9-4.7.6-7.3 3.2-7.9 7.9-.6-4.7-3.2-7.3-7.9-7.9 4.7-.6 7.3-3.2 7.9-7.9z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  eye:'<path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="m3 3 18 18M10.6 6.1A9.7 9.7 0 0 1 12 5.5c5.9 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.5M6.6 6.6A16.5 16.5 0 0 0 2.5 12S6.1 18.5 12 18.5c1.1 0 2.1-.2 3.1-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  trash:'<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  wallet:'<path d="M3.5 7.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M16 12.5h4M3.5 8.5h17"/>',
  phone:'<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2C11.6 19.5 4.5 12.4 4.5 5.5a2 2 0 0 1 2-2z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 0 1 5.2.9c0 1.8-2.7 2.1-2.7 3.6M12 17h.01"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 6.2M20 4.5V11h-6.5"/>',
  filter:'<path d="M3.5 5.5h17l-6.5 7.5V20l-4-2.2v-4.8z"/>',
  building:'<path d="M4 21V6l8-3 8 3v15M9 21v-4h6v4M8 9h1M15 9h1M8 13h1M15 13h1"/>',
  bookOpen:'<path d="M12 6.5C10.2 5.2 7.5 5 4 5.8v13.4c3.5-.8 6.2-.6 8 .7 1.8-1.3 4.5-1.5 8-.7V5.8c-3.5-.8-6.2-.6-8 .7z"/><path d="M12 6.5v13.4"/>',
  megaphone:'<path d="M3 11v2a2 2 0 0 0 2 2h2l8 4V5L7 9H5a2 2 0 0 0-2 2zM18 8.5a5 5 0 0 1 0 7"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.5l6.1-.9z"/>',
  flag:'<path d="M5 21V4M5 4h11l-1.7 4L16 12H5"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  image:'<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5-8 8"/>'
};
function ic(name, size, sw){
  size = size || 20; sw = sw || 1.8;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}
function logoMark(size){
  const s = size || 24;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M5.2 6.3C7.4 5.2 9.9 5.6 12 7.1c2.1-1.5 4.6-1.9 6.8-.8v11.2c-2.2-1.1-4.7-.7-6.8.8-2.1-1.5-4.6-1.9-6.8-.8z" fill="currentColor"/>' +
    '<path d="M12 7.1v11.2" stroke="' + (s > 30 ? '#131313' : '#131313') + '" stroke-width="1.1" opacity=".35"/>' +
  '</svg>';
}

/* ---------- illustrations ---------- */
function campusArt(){
  return '<svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><filter id="caShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3d2a58" flood-opacity=".16"/></filter></defs>' +
    '<path d="M52 40C119-2 260 4 317 52c47 40 22 113-39 146-63 34-175 23-228-21C-3 137-9 77 52 40Z" fill="#c4d7f7" opacity=".75"/>' +
    '<circle cx="315" cy="45" r="18" fill="#f7e5ad"/>' +
    '<g stroke="#e5c567" stroke-width="2.4" stroke-linecap="round"><path d="M315 16v-6M341 45h6M336 24l4-4M294 66l-4 4M294 24l-4-4M336 66l4 4"/></g>' +
    '<path d="M40 72c0-8 6-14 14-14 3 0 6 1 8 3 2-8 9-14 18-14 10 0 19 8 20 18 2-1 4-2 6-2 8 0 14 6 14 14 0 2 0 3-1 4H41c-1-2-1-5-1-9Z" fill="#eef4ff" opacity=".8"/>' +
    '<path d="M250 110c0-6 5-11 11-11 2 0 4 1 6 2 2-6 7-10 14-10 8 0 14 6 15 13 2-1 3-1 5-1 6 0 11 5 11 11H250Z" fill="#eef4ff" opacity=".55"/>' +
    '<ellipse cx="190" cy="248" rx="146" ry="16" fill="#93b2e9" opacity=".38"/>' +
    '<rect x="45" y="118" width="52" height="110" rx="14" fill="#f7edda"/>' +
    '<rect x="283" y="126" width="54" height="102" rx="14" fill="#f7edda"/>' +
    '<rect x="94" y="88" width="192" height="140" rx="18" fill="#fdf7e8"/>' +
    '<path d="M94 106c0-9.9 8.1-18 18-18h156c9.9 0 18 8.1 18 18v10H94z" fill="#efe0c6"/>' +
     '<text x="190" y="108" text-anchor="middle" fill="#131313" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="3">MET</text>' +
    '<g fill="#aec8f3">' +
      '<rect x="108" y="128" width="22" height="24" rx="7"/><rect x="140" y="128" width="22" height="24" rx="7"/><rect x="218" y="128" width="22" height="24" rx="7"/><rect x="250" y="128" width="22" height="24" rx="7"/>' +
      '<rect x="108" y="162" width="22" height="24" rx="7"/><rect x="140" y="162" width="22" height="24" rx="7"/><rect x="218" y="162" width="22" height="24" rx="7"/><rect x="250" y="162" width="22" height="24" rx="7"/>' +
    '</g>' +
    '<g fill="#ffffff" opacity=".45"><rect x="110" y="130" width="8" height="3" rx="1.5"/><rect x="142" y="130" width="8" height="3" rx="1.5"/><rect x="220" y="130" width="8" height="3" rx="1.5"/><rect x="252" y="130" width="8" height="3" rx="1.5"/></g>' +
    '<path d="M169 228v-54a21 21 0 0 1 42 0v54z" fill="#131313"/>' +
    '<path d="M190 150v78M178 193h24" stroke="#f7e5ad" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>' +
    '<circle cx="205" cy="202" r="1.8" fill="#f7e5ad"/>' +
    '<rect x="156" y="224" width="68" height="9" rx="4.5" fill="#e2d2ba"/>' +
    '<rect x="146" y="233" width="88" height="9" rx="4.5" fill="#ebdcc5"/>' +
    '<g fill="#f7edda"><rect x="52" y="140" width="14" height="20" rx="4"/><rect x="76" y="140" width="14" height="20" rx="4"/><rect x="52" y="174" width="14" height="20" rx="4"/><rect x="76" y="174" width="14" height="20" rx="4"/></g>' +
    '<g fill="#aec8f3" opacity=".9"><rect x="54" y="142" width="10" height="16" rx="3"/><rect x="78" y="142" width="10" height="16" rx="3"/><rect x="54" y="176" width="10" height="16" rx="3"/><rect x="78" y="176" width="10" height="16" rx="3"/></g>' +
    '<g fill="#f7edda"><rect x="292" y="150" width="14" height="20" rx="4"/><rect x="314" y="150" width="14" height="20" rx="4"/><rect x="292" y="184" width="14" height="20" rx="4"/><rect x="314" y="184" width="14" height="20" rx="4"/></g>' +
    '<g fill="#ddc0ef" opacity=".95"><rect x="294" y="152" width="10" height="16" rx="3"/><rect x="316" y="152" width="10" height="16" rx="3"/><rect x="294" y="186" width="10" height="16" rx="3"/><rect x="316" y="186" width="10" height="16" rx="3"/></g>' +
    '<path d="M290 118V58" stroke="#131313" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M291 60h25l-7 10 7 10h-25z" fill="#f7e5ad" stroke="#131313" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<rect x="34" y="196" width="6" height="32" rx="3" fill="#6d5238"/>' +
    '<circle cx="37" cy="184" r="19" fill="#cfe7c9"/><circle cx="26" cy="197" r="14" fill="#bcddb6"/><circle cx="49" cy="197" r="13" fill="#bcddb6"/>' +
    '<rect x="338" y="204" width="6" height="27" rx="3" fill="#6d5238"/>' +
    '<circle cx="341" cy="194" r="17" fill="#cfe7c9"/><circle cx="331" cy="205" r="12" fill="#bcddb6"/>' +
    '<path d="M84 245h212" stroke="#d9c9b3" stroke-width="3" stroke-linecap="round"/>' +
     '<g filter="url(#caShadow)"><rect x="8" y="132" width="110" height="34" rx="17" fill="#fff"/><circle cx="26" cy="149" r="4.5" fill="#4f9a63"/><text x="37" y="153" fill="#131313" font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">Campus updates</text></g>' +
     '<g filter="url(#caShadow)"><rect x="252" y="84" width="118" height="34" rx="17" fill="#fff"/><circle cx="270" cy="101" r="4.5" fill="#d7a63c"/><text x="281" y="105" fill="#131313" font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">Your day at MET</text></g>' +
    '<g fill="#131313" opacity=".55"><path d="M67 49l2.2 5.8L75 57l-5.8 2.2L67 65l-2.2-5.8L59 57l5.8-2.2z"/><path d="M340 178l1.6 4.2 4.4 1.8-4.4 1.6-1.6 4.4-1.8-4.4-4.2-1.6 4.2-1.8z"/></g>' +
    '<circle cx="148" cy="248" r="3" fill="#f7e5ad"/><circle cx="236" cy="251" r="2" fill="#ddc0ef"/>' +
  '</svg>';
}

function deskArt(){
  return '<svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><filter id="dkShadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#6b5220" flood-opacity=".22"/></filter></defs>' +
    '<circle cx="116" cy="86" r="66" fill="#fff" opacity=".32"/>' +
    '<g filter="url(#dkShadow)">' +
      '<rect x="53" y="118" width="126" height="12" rx="6" fill="#2a272c"/>' +
      '<rect x="62" y="46" width="100" height="72" rx="8" fill="#1e1c20"/>' +
      '<rect x="68" y="52" width="88" height="58" rx="4" fill="#eef4ff"/>' +
      '<rect x="75" y="60" width="34" height="4.5" rx="2.2" fill="#aec8f3"/>' +
      '<rect x="75" y="69" width="50" height="4.5" rx="2.2" fill="#ddc0ef"/>' +
      '<rect x="75" y="78" width="26" height="4.5" rx="2.2" fill="#f2c8a7"/>' +
      '<rect x="75" y="87" width="58" height="4.5" rx="2.2" fill="#cfe7c9"/>' +
      '<rect x="75" y="96" width="19" height="4.5" rx="2.2" fill="#aec8f3"/>' +
      '<rect x="138" y="60" width="11" height="4.5" rx="2.2" fill="#ddc0ef" opacity=".7"/>' +
      '<rect x="126" y="128" width="62" height="5" rx="2.5" fill="#f7f2e6"/>' +
      '<circle cx="112" cy="121" r="1.6" fill="#f7e5ad"/>' +
    '</g>' +
    '<g transform="rotate(-7 57 128)">' +
      '<rect x="24" y="120" width="64" height="11" rx="3.5" fill="#ddc0ef" stroke="#131313" stroke-opacity=".08"/>' +
      '<rect x="20" y="131" width="72" height="11" rx="3.5" fill="#fff" stroke="#131313" stroke-opacity=".08"/>' +
      '<rect x="27" y="109" width="56" height="11" rx="3.5" fill="#aec8f3" stroke="#131313" stroke-opacity=".08"/>' +
    '</g>' +
    '<g><rect x="166" y="99" width="25" height="27" rx="7" fill="#f6ecd8" stroke="#131313" stroke-opacity=".1"/>' +
      '<path d="M191 106h5a5 5 0 0 1 0 10h-5" stroke="#131313" stroke-opacity=".35" stroke-width="2.4"/>' +
      '<path d="M174 92c-3-4 3-6 0-10M182 92c-3-4 3-6 0-10" stroke="#c9b98f" stroke-width="2" stroke-linecap="round"/>' +
    '</g>' +
    '<g><rect x="164" y="132" width="25" height="22" rx="6" fill="#aec8f3" stroke="#131313" stroke-opacity=".08"/>' +
      '<path d="M176 132c0-10-7-17-12-18 1 9 5 15 12 18ZM176 132c0-8 6-15 12-16-1 8-5 13-12 16Z" fill="#5f9c70"/>' +
    '</g>' +
    '<path d="M148 140l17-9" stroke="#f2a66e" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M152 143l4-2" stroke="#131313" stroke-width="5" stroke-linecap="round"/>' +
    '<g fill="#f7e5ad"><path d="M198 44l2.4 6.4 6.6 2.4-6.6 2.4-2.4 6.4-2.4-6.4-6.6-2.4 6.6-2.4z"/></g>' +
    '<g fill="#fff" opacity=".55"><circle cx="36" cy="58" r="3"/><circle cx="30" cy="84" r="2"/><circle cx="202" cy="150" r="2.4"/></g>' +
    '<circle cx="206" cy="76" r="12" fill="#aec8f3" opacity=".5"/>' +
    '<path d="M32 70c4-7 12-8 17-3" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>' +
  '</svg>';
}

/* ---------- data ---------- */
function seedTETimetable(){
  const timetable = {1:[],2:[],3:[],4:[],5:[],6:[]};
  Object.keys(TE_CSD_SEM_V_TIMETABLE).forEach(day => {
    timetable[day] = TE_CSD_SEM_V_TIMETABLE[day].map((slot,index) => Object.assign({id:'te-v-' + day + '-' + (index + 1)}, slot));
  });
  return timetable;
}
function seedData(){
  const dateAt = (day, hour) => new Date(day + 'T' + pad2(hour || 12) + ':00:00').toISOString();
  const subjects = [
    {id:'dsd',code:'DSD',catalogCode:'26AF1257PC504',category:'PCC4',name:'Database System Design',faculty:'Prof. K. T. Borse (K.T.B)',room:'TBA',attended:0,total:0,credits:3,tone:'lilac'},
    {id:'dsd_lab',code:'DSD Lab',catalogCode:'26AF1257PCL509',category:'PCC Lab',name:'Database System Design Laboratory',faculty:'Prof. K. T. Borse (K.T.B)',room:'TBA',attended:0,total:0,credits:1,tone:'lilac'},
    {id:'fsd',code:'FSD',catalogCode:'',category:'Department course',name:'Full Stack Development',faculty:'Dr. N. J. Rathod (N.J.R)',room:'TBA',attended:0,total:0,credits:null,tone:'peach'},
    {id:'fsdl',code:'FSDL',catalogCode:'26AF1257PCL509',category:'PCC Lab',name:'Full Stack Development (SE Lab)',faculty:'Dr. N. J. Rathod (N.J.R)',room:'TBA',attended:0,total:0,credits:2,tone:'peach'},
    {id:'iot',code:'IOT',catalogCode:'26AF1257PE507',category:'PEC · Elective I',name:'Internet of Things',faculty:'Dr. N. J. Rathod (N.J.R)',room:'TBA',attended:0,total:0,credits:3,tone:'mint'},
    {id:'ml',code:'ML',catalogCode:'26AF1245PC501',category:'PCC1',name:'Machine Learning',faculty:'Prof. S. S. Shaikh (S.S.S)',room:'TBA',attended:0,total:0,credits:3,tone:'butter'},
    {id:'ml_lab',code:'ML Lab',catalogCode:'26AF1257PCL508',category:'PCC Lab',name:'Machine Learning Laboratory',faculty:'Prof. S. S. Shaikh (S.S.S)',room:'TBA',attended:0,total:0,credits:1,tone:'butter'},
    {id:'oe',code:'OE',catalogCode:'25AF1XXXOEM05X',category:'Open Elective',name:'Business Analytics & Text Mining Modeling using Python',faculty:'Prof. A. Y. Panpatil (A.Y.P.)',room:'TBA',attended:0,total:0,credits:2,tone:'peri'},
    {id:'sem',code:'SEM',catalogCode:'26AF1257AE510',category:'AEC',name:'Seminar',faculty:'Prof. D. M. Avhad (D.M.A.) · Prof. S. P. Khaimar (S.P.K)',room:'TBA',attended:0,total:0,credits:1,tone:'rose'},
    {id:'sep',code:'SEP',catalogCode:'26AF1257PC503',category:'PCC3',name:'Software Engineering and Project Management',faculty:'Dr. G. V. Sonawane (G.V.S)',room:'TBA',attended:0,total:0,credits:3,tone:'lilac'},
    {id:'toc',code:'TOC',catalogCode:'26AF1245PC502',category:'PCC2',name:'Theory of Computations',faculty:'Prof. V. B. Bhamare (V.B.B)',room:'TBA',attended:0,total:0,credits:3,tone:'rose'},
    {id:'wc',code:'WC',catalogCode:'',category:'Department course · code not supplied',name:'Wireless Communication',faculty:'Prof. R. R. Raskar (R.R.R)',room:'TBA',attended:0,total:0,credits:null,tone:'mint'}
  ];
  const timetable = seedTETimetable();
  const students = CSD_STUDENT_ROSTER.map((r,i) => ({
    id:'s' + (i + 1), roll:r[0], prn:r[1], name:r[2], email:'', phone:'',
    cgpa:null, attendance:null, tone:['lilac','mint','peri','rose','peach','butter'][i % 6],
    division:'', backlogs:null, class:'S.E. Computer Science and Design', academicYear:'2025–26'
  }));
  const assignments = [
    {id:'as1',subjectId:'dsd',title:'Unit 2 and 3 Assignment + mid sem question bank',description:'Classroom assignment posted by Kalyani Borse. The source post did not include a due date or points.',due:null,points:null,submitted:false,attachments:[],submissionText:'',submissionFile:'',by:'Kalyani Borse',createdAt:dateAt('2026-10-01')},
    {id:'as2',subjectId:'dsd',title:'Unit 1 assignment',description:'Google Classroom title included “submission date-7/8/2026”. This is interpreted as 7 August 2026 (day/month format); confirm the date before using it for live reminders.',due:dateAt('2026-08-07',23),points:null,submitted:false,attachments:[],submissionText:'',submissionFile:'',by:'Kalyani Borse',createdAt:dateAt('2026-09-04')},
    {id:'as3',subjectId:'oe',title:'Assignment no 1',description:'Classroom assignment posted by Archana Panpatil. A due date was not present in the supplied stream.',due:null,points:null,submitted:false,attachments:[],submissionText:'',submissionFile:'',by:'Archana Panpatil',createdAt:dateAt('2026-09-03')}
  ];
  const announcements = [
    {id:'an1',author:'Swapnil Khairnar',role:'CSD · Seminar notice',tone:'lilac',subjectId:'sem',title:'Seminar and mini-project groups',body:'Students may use the same group members and topic for the Mini-Project and Seminar. Groups may have up to 6 members and should use a professional academic name. Choose a topic connected to a current or previous-year subject. Final deliverables: a PPT and a written report of at least 20 pages, using the shared formats. Presentations are scheduled after the mid-semester examinations.',at:dateAt('2026-09-02'),pinned:true,tag:'Seminar',attachment:'https://forms.gle/FgJmEYnFAEAs72zq9'},
    {id:'an2',author:'Swapnil Khairnar',role:'CSD · Classroom stream',tone:'peri',subjectId:'sem',title:'Classroom is now used for Seminar',body:'This Classroom is used for Seminar from today. The seminar presentation and report formats are shared in Google Slides and Google Docs. The supplied registration deadline was 5 September 2026.',at:dateAt('2026-08-19'),pinned:false,tag:'Class',attachment:''}
  ];
  const notes = [
    ['dsd','Practical no 6 write up and program','Kalyani Borse','2026-10-22'],
    ['dsd','Transaction','Kalyani Borse','2026-10-21'],
    ['dsd','Practical no 5','Kalyani Borse','2026-09-21'],
    ['dsd','Practical no 4 - write up and program','Kalyani Borse','2026-09-15'],
    ['dsd','ER diagram study material','Kalyani Borse','2026-09-07'],
    ['dsd','Practical No 2 - writeup','Kalyani Borse','2026-09-01'],
    ['dsd','Practical no 3 - writeup','Kalyani Borse','2026-09-01'],
    ['dsd','Practical 1 writeup','Kalyani Borse','2026-08-31'],
    ['dsd','Unit 1 PPTs','Kalyani Borse','2026-08-21'],
    ['dsd','Practical no 2 material','Kalyani Borse','2026-08-20'],
    ['oe','Question bank with solutions','Archana Panpatil','2026-10-01'],
    ['oe','Notes for midsem','Archana Panpatil','2026-10-01'],
    ['oe','Python study material for Unit 2','Archana Panpatil','2026-09-28'],
    ['oe','Revised question bank (Theory + MCQ)','Archana Panpatil','2026-09-04'],
    ['oe','Unit 1 - Introduction to Text Mining','Archana Panpatil','2026-09-03']
  ].map((n,i) => ({id:'nt'+(i+1),subjectId:n[0],title:n[1],type:'Material',size:'Google Classroom',by:n[2],at:dateAt(n[3]),saved:false}));
  const results = [];

  const drives = [
    {id:'d1',company:'Infosys',role:'Systems Engineer',ctc:6.5,location:'Bengaluru',type:'Full-time',deadline:isoIn(4,17,0),minCgpa:6.5,maxBacklogs:0,applied:false,appliedAt:null,applicants:0,tone:'peri',about:'Sample placement drive for the prototype. Replace with an approved employer brief before publishing to students.',rounds:['Online assessment','Technical interview','HR interview'],bond:'Not confirmed',eligibleBranches:'CSD',demo:true,formQuestions:[{id:'resume',label:'Resume or portfolio link',type:'short',required:true}]},
    {id:'d2',company:'TCS Digital',role:'Digital Associate',ctc:7,location:'Mumbai',type:'Full-time',deadline:isoIn(8,17,0),minCgpa:7,maxBacklogs:0,applied:false,appliedAt:null,applicants:0,tone:'lilac',about:'Sample placement drive for the prototype. Replace with an approved employer brief before publishing to students.',rounds:['Aptitude and coding','Technical interview','HR discussion'],bond:'Not confirmed',eligibleBranches:'CSD',demo:true,formQuestions:[{id:'resume',label:'Resume or portfolio link',type:'short',required:true}]},
    {id:'d3',company:'Persistent Systems',role:'Software Engineer',ctc:9.5,location:'Pune',type:'Full-time',deadline:isoIn(12,17,0),minCgpa:7.5,maxBacklogs:0,applied:false,appliedAt:null,applicants:0,tone:'mint',about:'Sample placement drive for the prototype. Replace with an approved employer brief before publishing to students.',rounds:['Coding assessment','Technical interview','Project discussion'],bond:'Not confirmed',eligibleBranches:'CSD',demo:true,formQuestions:[{id:'resume',label:'Resume or portfolio link',type:'short',required:true}]},
    {id:'d4',company:'Siemens',role:'R&D Engineer',ctc:12,location:'Navi Mumbai',type:'Full-time',deadline:isoIn(16,17,0),minCgpa:8.5,maxBacklogs:0,applied:false,appliedAt:null,applicants:0,tone:'butter',about:'Sample placement drive for the prototype. Replace with an approved employer brief before publishing to students.',rounds:['Technical screening','Panel interview','HR discussion'],bond:'Not confirmed',eligibleBranches:'CSD',demo:true,formQuestions:[{id:'resume',label:'Resume or portfolio link',type:'short',required:true}]},
    {id:'d5',company:'Zensar',role:'Graduate Trainee',ctc:5.5,location:'Pune',type:'Full-time',deadline:isoIn(-3,17,0),minCgpa:6,maxBacklogs:0,applied:false,appliedAt:null,applicants:0,tone:'peach',about:'Sample placement drive for the prototype. Replace with an approved employer brief before publishing to students.',rounds:['Aptitude test','Technical interview','HR interview'],bond:'Not confirmed',eligibleBranches:'CSD',demo:true,formQuestions:[{id:'resume',label:'Resume or portfolio link',type:'short',required:true}]}
  ];
  const events = [
    {id:'ev-ecell-demo',clubId:'ecell',title:'Campus Startup Showcase · sample',description:'Sample promotion for the eCell MET portal. Replace this with the approved event brief, date and venue.',venue:'Venue to be confirmed',startsAt:isoIn(10,10,0),registrationDeadline:isoIn(8,23,59),published:true,demo:true,formQuestions:[{id:'idea',label:'What idea would you like to share?',type:'long',required:true}]},
    {id:'ev-staple-demo',clubId:'staple',title:'Career Preparation Clinic · sample',description:'Sample STAPLE promotion. Add the real session details before publishing an official event.',venue:'Venue to be confirmed',startsAt:isoIn(14,11,0),registrationDeadline:isoIn(12,23,59),published:true,demo:true,formQuestions:[{id:'topic',label:'What career topic would you like help with?',type:'short',required:true}]},
    {id:'ev-code-demo',clubId:'codecrafters',title:'Code Crafters Build Night · sample',description:'Sample student developer event. Replace with the actual build-night brief and registration details.',venue:'Venue to be confirmed',startsAt:isoIn(18,15,0),registrationDeadline:isoIn(16,23,59),published:true,demo:true,formQuestions:[{id:'stack',label:'Which technology would you like to work with?',type:'short',required:true}]},
    {id:'ev-tedx-demo',clubId:'tedxmet',title:'TEDxMET Nashik Volunteer Call · sample',description:'Sample TEDxMET Nashik event promotion. Add approved event details before using this as an official announcement.',venue:'Venue to be confirmed',startsAt:isoIn(22,10,0),registrationDeadline:isoIn(20,23,59),published:true,demo:true,formQuestions:[{id:'interest',label:'Which volunteer area interests you?',type:'short',required:true}]},
    {id:'ev-sacsde-demo',clubId:'sacsde',title:'CSD Student Forum · sample',description:'Sample SACSDE promotion. Replace with the committee’s confirmed event details.',venue:'Venue to be confirmed',startsAt:isoIn(26,12,0),registrationDeadline:isoIn(24,23,59),published:true,demo:true,formQuestions:[{id:'question',label:'What would you like the committee to discuss?',type:'long',required:true}]}
  ];
  const notifications = [
    {id:'no1',type:'notice',title:'Seminar group details and formats',body:'Review the CSD seminar announcement and supplied registration form.',at:dateAt('2026-09-02'),read:false,target:'/notices'},
    {id:'no2',type:'event',title:'Campus events are open',body:'Browse student club event promotions and registration forms.',at:new Date().toISOString(),read:false,target:'/events'},
    {id:'no3',type:'notice',title:'New DSD Classroom materials',body:'Practical write-up and program posted by Kalyani Borse.',at:dateAt('2026-10-22'),read:true,target:'/classroom'}
  ];
  return {
    version: DB_VERSION,
    session: null,
    profile: {
      id:'demo-student',name:'CSD Student Demo',firstName:'Student',email:'student@met.edu',phone:'',
      class:'T.E. Computer Science and Design · Demo profile',programme:'B.Tech. in Computer Science and Design',
      division:'',roll:'',prn:'',cgpa:null,backlogs:null,semester:'V',
      academicYear:'2026–27',batch:'2024–28',labGroup:'',tone:'lilac'
    },
    admin:{name:'MET Staff',firstName:'Staff',email:'',role:'Campus administration',tone:'butter'},
    subjects,timetable,timetableInfo:Object.assign({},TE_CSD_SEM_V_TIMETABLE_META),
    assignments,announcements,notes,results,drives,students,sessions:[],
    curriculum:CURRICULUM_DATA,clubs:CAMPUS_CLUBS,events,formResponses:[],
    notifications,
    entry: {
      passId:'MET-DEMO',validUntil:isoIn(0,23,59),gate:'Main gate · MET',logs:[]
    },
    gateRequests:[],gateLog:[],activity:[],
    prefs:{attendance:true,placements:true,notices:true,events:true,results:true},
    demo: true
  };
}

function loadDB(){
  if(MET_BACKEND.configured() || !MET_BACKEND.demoMode()) return seedData();
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && parsed.version === DB_VERSION) return parsed;
    }
  }catch(e){}
  try{
    const legacyRaw = localStorage.getItem(LEGACY_DB_KEY);
    const legacy = legacyRaw && JSON.parse(legacyRaw);
    if(legacy && legacy.version === 3){
      const defaults = seedData();
      const migrated = Object.assign({}, defaults, legacy, {version:DB_VERSION});
      migrated.profile = Object.assign({}, defaults.profile, legacy.profile || {});
      const savedTimetable = legacy.timetable || {};
      const hasSavedPeriods = Object.values(savedTimetable).some(slots => Array.isArray(slots) && slots.length > 0);
      migrated.timetable = hasSavedPeriods ? savedTimetable : defaults.timetable;
      migrated.timetableInfo = hasSavedPeriods
        ? {classScope:'T.E. CSD',semester:'V',academicYear:'2026–27',effectiveFrom:'',sourceTitle:'Previously saved local timetable',coverage:'Local entries · verify against the current teaching load',verified:false}
        : Object.assign({}, defaults.timetableInfo);
      if(!hasSavedPeriods) migrated.profile.labGroup = '';
      localStorage.setItem(DB_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }catch(e){}
  return seedData();
}
let db = loadDB();

function applyBackendAccount(result){
  const defaults = seedData();
  const saved = result && result.state && typeof result.state === 'object' ? result.state : {};
  const campus = result && result.campusContent && typeof result.campusContent === 'object' ? result.campusContent : {};
  db = Object.assign(defaults, campus);
  const subjectDefaults = defaults.subjects || [];
  const sharedSubjects = Array.isArray(campus.subjects) ? campus.subjects : subjectDefaults;
  db.subjects = sharedSubjects.map(shared => {
    const base = subjectDefaults.find(item => item.id === shared.id) || {};
    return Object.assign({}, base, shared);
  });
  if(Array.isArray(campus.assignments)) db.assignments = campus.assignments;
  if(Array.isArray(campus.drives)) db.drives = campus.drives;
  if(Array.isArray(campus.events)) db.events = campus.events;
  db.drives = (db.drives || []).filter(item => !item.demo);
  db.events = (db.events || []).filter(item => !item.demo);
  db.assignments = (db.assignments || []).map(item => {
    const personal = (saved.assignmentState || {})[item.id] || {};
    return Object.assign({}, item, personal);
  });
  db.drives = (db.drives || []).map(item => Object.assign({}, item, (saved.driveState || {})[item.id] || {}));
  if(saved.subjectAttendance){
    db.subjects = db.subjects.map(item => Object.assign({}, item, saved.subjectAttendance[item.id] || {}));
  }
  db.notifications = Array.isArray(saved.notifications) ? saved.notifications : defaults.notifications;
  db.entry = saved.entry || { passId:'', validUntil:'', gate:'', logs:[] };
  db.prefs = saved.prefs || defaults.prefs;
  db.formResponses = result && Array.isArray(result.formResponses) ? result.formResponses : [];
  db.students = defaults.students;
  db.sessions = [];
  db.gateRequests = [];
  db.gateLog = [];
  db.activity = [];
  const profile = result.profile || {};
  db.profile = Object.assign({}, defaults.profile, {
    id: profile.id,
    name: profile.name || (saved.profile && saved.profile.name) || defaults.profile.name,
    firstName: profile.first_name || (saved.profile && saved.profile.firstName) || defaults.profile.firstName,
    email: profile.email || (saved.profile && saved.profile.email) || '',
    phone: profile.phone || (saved.profile && saved.profile.phone) || '',
    class: profile.class_name || (saved.profile && saved.profile.class) || defaults.profile.class,
    programme: profile.programme || (saved.profile && saved.profile.programme) || defaults.profile.programme,
    division: profile.division || (saved.profile && saved.profile.division) || '',
    roll: profile.roll_number || (saved.profile && saved.profile.roll) || '',
    prn: profile.prn || (saved.profile && saved.profile.prn) || '',
    cgpa: profile.cgpa == null ? (saved.profile && saved.profile.cgpa) : Number(profile.cgpa),
    backlogs: profile.backlogs == null ? (saved.profile && saved.profile.backlogs) : Number(profile.backlogs),
    semester: profile.semester || (saved.profile && saved.profile.semester) || defaults.profile.semester,
    academicYear: profile.academic_year || (saved.profile && saved.profile.academicYear) || defaults.profile.academicYear,
    batch: profile.batch || (saved.profile && saved.profile.batch) || defaults.profile.batch,
    labGroup: profile.lab_group || saved.labGroup || '',
    tone: profile.tone || (saved.profile && saved.profile.tone) || defaults.profile.tone
  });
  const role = profile.role || 'student';
  if(role === 'student'){
    db.students = [];
  } else if(saved.staffWorkspace){
    db.students = saved.staffWorkspace.students || defaults.students;
    db.sessions = saved.staffWorkspace.sessions || [];
    db.gateRequests = saved.staffWorkspace.gateRequests || [];
    db.gateLog = saved.staffWorkspace.gateLog || [];
    db.activity = saved.staffWorkspace.activity || [];
  }
  const portalId = profile.portal_id || (role === 'student' ? '' : role);
  db.session = {
    role: role,
    portalId: portalId,
    email: profile.email || '',
    name: profile.name || '',
    firstName: profile.first_name || '',
    clubId: profile.club_id || '',
    department: profile.department || '',
    classScope: profile.class_scope || '',
    label: profile.label || role,
    tone: profile.tone || 'butter',
    since: new Date().toISOString()
  };
  db.admin = {
    name: profile.name || 'MET Staff',
    firstName: profile.first_name || 'Staff',
    email: profile.email || '',
    role: profile.label || role,
    tone: profile.tone || 'butter'
  };
  db.demo = false;
  MET_BACKEND.setCampusBaseline(db);
}

function saveDB(){
  if(MET_BACKEND.configured()){
    MET_BACKEND.scheduleSave(db);
    return;
  }
  try{ localStorage.setItem(DB_KEY, JSON.stringify(db)); }catch(e){}
}
function resetDB(){
  db = seedData();
  saveDB();
}

/* ---------- ui state ---------- */
const S = {
  authRole: 'student',
  staffPortalId: '',
  day: (new Date().getDay() === 0 ? 1 : new Date().getDay()),
  attTab: 'subjects',
  classTab: 'work',
  workFilter: 'all',
  driveFilter: 'all',
  pickResult: null,
  calOffset: 0,
  publishType: 'notice',
  regSubject: 'dsd',
  regDate: ymd(new Date()),
  regKey: '',
  regDraft: null,
  adminDay: (new Date().getDay() === 0 ? 1 : new Date().getDay()),
  curriculumSem: 'V',
  gate: null,
  studentsQuery: '',
  attached: {},
  preserveScroll: false,
  scrollBottom: false,
  confirm: null
};

/* ---------- navigation ---------- */
const STUDENT_TABS = [
  { path:'/home', label:'Home', icon:'home' },
  { path:'/timetable', label:'Timetable', icon:'calendar' },
  { path:'/attendance', label:'Attendance', icon:'checkCircle' },
  { path:'/classroom', label:'Classroom', icon:'book' },
  { path:'/more', label:'More', icon:'grid' }
];
const ADMIN_TABS = [
  { path:'/admin', label:'Desk', icon:'grid' },
  { path:'/admin/attendance', label:'Register', icon:'clipboard' },
  { path:'/admin/publish', label:'Publish', icon:'megaphone' },
  { path:'/admin/more', label:'More', icon:'menu' }
];

function facultyPortal(portalId){
  return FACULTY_PORTALS.find(portal => portal.id === portalId) || null;
}
function demoPortalForFaculty(portalId){
  const demoIds = { hodcsd:'hod1', hodcse:'hod2', hodarsa:'hod3', hoscee:'hod4', hodece:'hod5' };
  const id = demoIds[portalId] || portalId;
  return CAMPUS_PORTALS.find(portal => portal.id === id) || null;
}
function currentPortal(){
  if(!db.session || db.session.role === 'student') return null;
  const portal = CAMPUS_PORTALS.find(p => p.id === db.session.portalId);
  return Object.assign({}, portal || {}, {
    id: db.session.portalId,
    email: db.session.email || (portal && portal.email) || '',
    name: db.session.name || (portal && portal.name) || '',
    firstName: db.session.firstName || (portal && portal.firstName) || '',
    role: db.session.role || (portal && portal.role) || '',
    clubId: db.session.clubId || (portal && portal.clubId) || '',
    department: db.session.department || (portal && portal.department) || '',
    classScope: db.session.classScope || (portal && portal.classScope) || '',
    label: db.session.label || (portal && portal.label) || db.session.role,
    tone: db.session.tone || (portal && portal.tone) || 'butter'
  });
}
function currentAdminIdentity(){
  const p = currentPortal();
  return p ? Object.assign({}, p, {role:p.label || p.role}) : db.admin || {name:'MET Staff',firstName:'Staff',role:'Campus administration',email:''};
}
function hasCsdRoster(){
  const p = currentPortal();
  return !!p && (p.role === 'principal' || p.role === 'tpo' || p.department === 'CSD' || p.classScope === 'S.E. CSD');
}
function canOpenStaffRoute(path){
  if(path === '/admin' || path === '/admin/more') return !!currentPortal();
  const p = currentPortal();
  if(!p) return false;
  if(path === '/admin/curriculum' || path === '/admin/publish') return p.role !== 'club';
  if(p.role === 'tpo') return ['/admin/placements','/admin/placement/new','/admin/placement-responses','/admin/students','/admin/events','/admin/event/new','/admin/event-responses'].includes(path);
  if(p.role === 'hod') return p.department === 'CSD' && ['/admin/attendance','/admin/students','/admin/timetable','/admin/results'].includes(path);
  if(p.role === 'coordinator'){
    if(p.classScope === 'S.E. CSD') return ['/admin/attendance','/admin/students'].includes(path);
    if(p.classScope === 'T.E. CSD') return ['/admin/timetable'].includes(path);
    return false;
  }
  if(p.role === 'principal') return ['/admin/students','/admin/results','/admin/placements','/admin/placement-responses','/admin/events','/admin/event/new','/admin/event-responses'].includes(path);
  if(p.role === 'club') return ['/admin/events','/admin/event/new','/admin/event-responses'].includes(path);
  return false;
}
function adminTabsForSession(){
  const p = currentPortal();
  if(!p) return [];
  if(p.role === 'tpo') return [
    {path:'/admin',label:'TPO',icon:'grid'},
    {path:'/admin/placements',label:'Drives',icon:'briefcase'},
    {path:'/admin/events',label:'Events',icon:'calendar'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'club') return [
    {path:'/admin',label:'Portal',icon:'grid'},
    {path:'/admin/events',label:'Events',icon:'calendar'},
    {path:'/admin/event-responses',label:'Responses',icon:'clipboard'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'principal') return [
    {path:'/admin',label:'Overview',icon:'grid'},
    {path:'/admin/students',label:'Students',icon:'users'},
    {path:'/admin/publish',label:'Notices',icon:'megaphone'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'coordinator' && p.classScope === 'T.E. CSD') return [
    {path:'/admin',label:'Class',icon:'grid'},
    {path:'/admin/timetable',label:'Timetable',icon:'calendar'},
    {path:'/admin/curriculum',label:'Curriculum',icon:'book'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'coordinator' && p.classScope === 'S.E. CSD') return [
    {path:'/admin',label:'Class',icon:'grid'},
    {path:'/admin/attendance',label:'Register',icon:'clipboard'},
    {path:'/admin/students',label:'Roster',icon:'users'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'coordinator') return [
    {path:'/admin',label:'Class',icon:'grid'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  if(p.role === 'hod' && !p.department) return [
    {path:'/admin',label:'HOD',icon:'grid'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
  return [
    {path:'/admin',label:'HOD',icon:'grid'},
    {path:'/admin/attendance',label:'Register',icon:'clipboard'},
    {path:'/admin/students',label:'Students',icon:'users'},
    {path:'/admin/more',label:'More',icon:'menu'}
  ];
}

function currentPath(){
  const h = location.hash.replace(/^#/, '');
  return h || '';
}
function postNativeState(){
  try{
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'state',
        path: currentPath(),
        sheet: !!document.querySelector('.overlay')
      }));
    }
  }catch(e){}
}
function isAdminPath(path){ return path === '/admin' || path.indexOf('/admin/') === 0; }
function defaultHome(){
  return db.session && db.session.role !== 'student' ? '/admin' : '/home';
}
function normalizeRoute(){
  let path = currentPath();
  if(!db.session){
    if(path !== '/login') path = '/login';
  } else {
    if(path === '/login' || !path) path = defaultHome();
    if(isAdminPath(path) && db.session.role === 'student') path = '/home';
    if(isAdminPath(path) && !canOpenStaffRoute(path)) path = '/admin';
  }
  if(path !== currentPath()){
    history.replaceState({}, '', '#' + path);
  }
  return path;
}
function go(path, opts){
  opts = opts || {};
  if(!path) return;
  closeSheet();
  if(opts.replace) history.replaceState({}, '', '#' + path);
  else history.pushState({}, '', '#' + path);
  render(false);
}
function back(){
  if(history.length > 1) history.back();
  else go(defaultHome(), { replace:true });
}
function markAllRead(){
  db.notifications.forEach(n => { n.read = true; });
  saveDB();
  render(true);
  toast('All notifications marked as read');
}
/* ---------- render shell ---------- */
function renderDock(path){
  const dock = document.getElementById('dock');
  if(!dock) return;
  const tabs = db.session && db.session.role !== 'student' ? adminTabsForSession() : STUDENT_TABS;
  const show = tabs.some(t => t.path === path);
  dock.classList.toggle('on', show);
  if(!show){ dock.innerHTML = ''; return; }
  dock.innerHTML = tabs.map(t => {
    const on = t.path === path;
    return '<button class="dock-item ' + (on ? 'on' : '') + '" data-go="' + t.path + '" aria-current="' + (on ? 'page' : 'false') + '">' +
      ic(t.icon, 21, on ? 2 : 1.8) + '<span>' + t.label + '</span></button>';
  }).join('');
}
function render(opts){
  opts = opts || {};
  const view = document.getElementById('view');
  if(!view) return;
  const path = normalizeRoute();
  const keep = !!opts.preserve;
  const scroll = view.scrollTop;

  let page;
  try{
    page = pageFor(path);
  }catch(err){
    page = { html: '<div class="wrap" style="padding-top:40px"><div class="empty"><h3>Something went wrong</h3><p>' + esc(err.message) + '</p></div></div>', dock:false };
    console.error(err);
  }
  view.innerHTML = page.html;
  if(keep){
    const pageEl = view.querySelector('.page');
    if(pageEl) pageEl.classList.add('page--instant');
    view.scrollTop = scroll;
  } else {
    view.scrollTop = 0;
  }
  if(S.scrollBottom){
    requestAnimationFrame(() => { view.scrollTop = view.scrollHeight; });
    S.scrollBottom = false;
  }
  renderDock(path);
  afterRender(path);
  document.title = page.title ? page.title + ' · MET Campus' : 'MET Campus';
  postNativeState();
}

function afterRender(path){
  if(path === '/entry') drawQR();
}

function drawQR(){
  const c = document.getElementById('qr');
  if(!c) return;
  const size = 264, n = 29, u = size / n;
  const x = c.getContext('2d');
  c.width = size; c.height = size;
  x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
  x.fillStyle = '#131313';
  let h = 7;
  const seed = db.profile.prn + new Date().toDateString();
  for(const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const finderAt = (i, j) => {
    for(const [a,b] of [[0,0],[0,n-7],[n-7,0]]){
      if(i >= a && i < a+7 && j >= b && j < b+7){
        const p = i-a, q = j-b;
        return p === 0 || q === 0 || p === 6 || q === 6 || (p > 1 && p < 5 && q > 1 && q < 5);
      }
    }
    if(i >= n-9 && i < n-4 && j >= n-9 && j < n-4) return i === n-9 || i === n-5 || j === n-9 || j === n-5 || (i === n-7 && j === n-7);
    return null;
  };
  for(let i = 0; i < n; i++){
    for(let j = 0; j < n; j++){
      let v = finderAt(i, j);
      if(v === null){
        h = (h * 1664525 + 1013904223) >>> 0;
        v = (h >>> 17) & 1;
        if(i > 7 && i < 12 && j > 7 && j < 12) v = 0;
      }
      if(v) x.fillRect(j * u, i * u, Math.ceil(u), Math.ceil(u));
    }
  }
}

/* ---------- toast & sheet ---------- */
let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}
function openSheet(html){
  const root = document.getElementById('modal-root');
  if(!root) return;
  root.innerHTML = '<div class="overlay" data-act="closeSheet" role="presentation">' +
    '<div class="sheet-card" role="dialog" aria-modal="true">' +
      '<div class="sheet-grab"></div>' +
      '<button class="icon-btn icon-btn--sm" data-act="closeSheet" aria-label="Close" style="position:sticky;top:0;float:right;z-index:3;margin:-4px -2px 0 10px;background:#fff">' + ic('x', 16, 2) + '</button>' +
      html +
    '</div></div>';
  postNativeState();
}
function closeSheet(){
  const root = document.getElementById('modal-root');
  if(root) root.innerHTML = '';
  postNativeState();
}
function confirmSheet(opts){
  S.confirm = opts;
  openSheet(
    '<h2 class="sheet-title">' + esc(opts.title) + '</h2>' +
    '<p class="sheet-sub">' + esc(opts.sub || '') + '</p>' +
    '<div class="btn-row" style="margin-top:18px">' +
      '<button class="btn btn--ghost" data-act="closeSheet">Cancel</button>' +
      '<button class="btn ' + (opts.danger ? 'btn--danger' : '') + '" data-act="confirmRun">' + esc(opts.confirmLabel || 'Confirm') + '</button>' +
    '</div>'
  );
}

/* ---------- shared pieces ---------- */
function pageHead(title, sub, opts){
  opts = opts || {};
  return '<header class="page-head">' +
    '<button class="icon-btn" data-act="' + (opts.back === false ? 'closeSheet' : 'back') + '" aria-label="' + (opts.back === false ? 'Close' : 'Go back') + '">' +
      ic(opts.back === false ? 'x' : 'arrowLeft', 19, 2) +
    '</button>' +
    '<div class="page-head__title"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
    (opts.right || '') +
  '</header>';
}
function emptyState(title, body, icon){
  return '<div class="empty"><div class="empty__art">' + ic(icon || 'book', 26, 1.7) + '</div>' +
    '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p></div>';
}
function avatarHTML(name, tone, cls){
  return '<span class="avatar ' + (cls || '') + ' avatar--' + (tone || 'lilac') + '">' + esc(initials(name)) + '</span>';
}
function subjectChip(s){
  return '<span class="subject-chip subject-chip--' + s.tone + '">' + esc(s.code) + '</span>';
}
function dockSpace(){ return '<div style="height:24px"></div>'; }
