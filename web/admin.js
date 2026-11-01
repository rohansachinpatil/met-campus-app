/* ============================================================
   MET Campus — faculty & admin console
   ============================================================ */

function uid(prefix){
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function notify(type, title, body, target){
  db.notifications.unshift({
    id: uid('no'), type: type, title: title, body: body,
    at: new Date().toISOString(), read: false, target: target || ''
  });
}
function logActivity(icon, label, meta){
  db.activity.unshift({
    id: uid('ac'), icon: icon, label: label, meta: meta,
    at: new Date().toISOString()
  });
  db.activity = db.activity.slice(0, 20);
}
function adminBar(title, sub, opts){
  opts = opts || {};
  return '<header class="topbar">' +
    (opts.back === false ? '' : '<button class="icon-btn" data-act="back" aria-label="Go back">' + ic('arrowLeft', 19, 2) + '</button>') +
    '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">' + esc(title) + '</div>' +
      (sub ? '<div class="topbar__sub">' + sub + '</div>' : '') +
    '</div>' + (opts.right || '') +
  '</header>';
}
function adminAction(path, icon, label, meta, tone){
  return '<button class="admin-action tint-' + tone + '" data-go="' + path + '">' +
    '<span class="admin-action__icon">' + ic(icon, 17, 1.8) + '</span>' +
    '<b>' + esc(label) + '</b><span>' + esc(meta) + '</span>' +
  '</button>';
}
function adminTile(icon, label, meta, tone, attrs){
  return '<button class="tile tint-' + tone + '" ' + (attrs || '') + '>' +
    '<span class="tile__icon">' + ic(icon, 18, 1.8) + '</span>' +
    '<span class="tile__label">' + esc(label) + '</span><span class="tile__meta">' + esc(meta) + '</span>' +
  '</button>';
}

function adminPageFor(path){
  if(!db.session || db.session.role === 'student' || !currentPortal()) return notFound(path);
  if(path === '/admin') return page(adminHomePage(), { title: 'Admin desk' });
  if(path === '/admin/attendance') return page(adminAttendancePage(), { title: 'Attendance register' });
  if(path === '/admin/publish') return page(adminPublishPage(), { title: 'Publish' });
  if(path === '/admin/more') return page(adminMorePage(), { title: 'More' });
  if(path === '/admin/curriculum') return page(curriculumPage(true), { title: 'Curriculum' });
  if(path === '/admin/events') return page(adminEventsPage(), { title: 'Campus events' });
  if(path === '/admin/event/new') return page(adminEventFormPage(), { title: 'New event' });
  if(path === '/admin/event-responses') return page(adminEventResponsesPage(), { title: 'Event responses' });
  if(path === '/admin/placement-responses') return page(adminPlacementResponsesPage(), { dock:false, title: 'Placement applications' });
  if(path === '/admin/students') return page(adminStudentsPage(), { dock: false, title: 'Students' });
  if(path === '/admin/results') return page(adminResultsPage(), { dock: false, title: 'Results' });
  if(path === '/admin/placements') return page(adminPlacementsPage(), { dock: false, title: 'Placement drives' });
  if(path === '/admin/placement/new') return page(adminNewDrivePage(), { dock: false, title: 'New drive' });
  if(path === '/admin/gate') return page(adminGatePage(), { dock: false, title: 'Campus gate' });
  if(path === '/admin/timetable') return page(adminTimetablePage(), { dock: false, title: 'Timetable' });
  return notFound(path);
}

/* ============================================================
   OVERVIEW
   ============================================================ */
function adminHomePage(){
  const pending = db.gateRequests.filter(r => r.status === 'pending');
  const low = db.students.filter(s => s.attendance < 75).sort((a, b) => a.attendance - b.attendance);
  const avg = db.students.length ? Math.round(db.students.reduce((n, s) => n + s.attendance, 0) / db.students.length) : 0;
  const today = todaySlots();
  const todayStr = ymd(new Date());
  const markedToday = db.sessions.filter(s => s.date === todayStr).length;
  const classPeriods = today.filter(s => s.subjectId).length;
  const registersLeft = Math.max(0, classPeriods - markedToday);
  const hello = greeting() === 'Good afternoon' ? 'Afternoon,' : greeting() === 'Good evening' ? 'Evening,' : 'Morning,';

  let needs = '';
  if(pending.length){
    needs += '<button class="li" data-go="/admin/gate">' +
      '<span class="sq sq--butter">' + ic('scan', 17, 1.9) + '</span>' +
      '<span class="li__main"><span class="li__title">' + pending.length + ' gate pass' + (pending.length === 1 ? '' : 'es') + ' waiting</span>' +
      '<span class="li__sub">' + esc(pending.map(r => r.name.split(' ')[0]).join(', ')) + ' need a quick check at the main gate.</span></span>' +
      '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>';
  }
  if(low.length){
    needs += '<button class="li" data-go="/admin/students">' +
      '<span class="sq sq--rose">' + ic('alert', 17, 1.9) + '</span>' +
      '<span class="li__main"><span class="li__title">' + low.length + ' student' + (low.length === 1 ? '' : 's') + ' below 75%</span>' +
      '<span class="li__sub">Lowest: ' + esc(low[0].name) + ' at ' + low[0].attendance + '%. A conversation now is easier than a detention later.</span></span>' +
      '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>';
  }
  if(registersLeft){
    needs += '<button class="li" data-go="/admin/attendance">' +
      '<span class="sq sq--lilac">' + ic('clipboard', 17, 1.9) + '</span>' +
      '<span class="li__main"><span class="li__title">' + registersLeft + ' register' + (registersLeft === 1 ? '' : 's') + ' still open today</span>' +
      '<span class="li__sub">' + markedToday + ' of ' + classPeriods + ' scheduled lectures are marked. Close the day before 5 PM.</span></span>' +
      '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>';
  }
  if(!needs){
    needs = '<div class="li" style="cursor:default"><span class="sq sq--mint">' + ic('checkCircle', 17, 1.9) + '</span>' +
      '<span class="li__main"><span class="li__title">Everything is in order</span>' +
      '<span class="li__sub">Registers are closed, the gate is quiet and every student is above the attendance bar.</span></span></div>';
  }

  const schedule = today.length ? today.map((slot, i) => {
    const info = slotInfo(slot);
    return '<div class="session-row">' +
      '<div class="session-row__date"><b>' + esc(slot.start) + '</b><span>' + esc(slot.end) + '</span></div>' +
      '<span class="sq sq--' + info.tone + '" style="width:34px;height:34px;font-size:8px">' + esc(info.code || '—') + '</span>' +
      '<div class="session-row__main"><b>' + esc(info.name) + '</b><span>' + esc(slot.type) + ' · Room ' + esc(info.room || '—') + '</span></div>' +
      '<button class="icon-btn icon-btn--sm" data-go="/admin/attendance" aria-label="Open register">' + ic('clipboard', 15, 1.8) + '</button>' +
    '</div>';
  }).join('') : '<div class="att-note" style="margin:0">' + ic('sparkle', 16, 1.8) + '<span>No periods scheduled today. A rare quiet day on campus.</span></div>';

  return '<header class="admin-hero">' +
      '<div class="row-between" style="position:relative;z-index:2">' +
        '<div class="row" style="gap:10px">' +
          '<span class="avatar avatar--butter">' + esc(initials(db.admin.name)) + '</span>' +
          '<div><div style="font-size:14px;font-weight:600;letter-spacing:-.2px">' + esc(db.admin.name) + '</div>' +
            '<div style="font-size:9.5px;color:rgba(255,255,255,.45);margin-top:2px">' + esc(db.admin.role) + '</div></div>' +
        '</div>' +
        '<button class="icon-btn" data-go="/notifications" aria-label="Notifications" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.14);color:#fff">' +
          ic('bell', 19, 1.8) + (unreadNotifs() ? '<span class="dot" style="border-color:#131313"></span>' : '') +
        '</button>' +
      '</div>' +
      '<h1>' + hello + '<br>' + esc(db.admin.firstName) + '.</h1>' +
      '<p class="admin-hero__sub">' + fmtLongDate(new Date()) + ' · Division ' + esc(db.profile.division) + ' has ' + today.length + ' periods and ' + pending.length + ' thing' + (pending.length === 1 ? '' : 's') + ' waiting for you.</p>' +
      '<div class="admin-stats">' +
        '<div><b>' + db.students.length + '</b><span>students in the division</span></div>' +
        '<div><b>' + avg + '%</b><span>average attendance</span></div>' +
        '<div><b>' + pending.length + '</b><span>gate checks pending</span></div>' +
      '</div>' +
    '</header>' +

    '<div class="admin-actions">' +
      adminAction('/admin/attendance', 'clipboard', 'Mark attendance', 'Open today’s register', 'lilac') +
      adminAction('/admin/publish', 'megaphone', 'Publish', 'Notice, work, notes, results', 'butter') +
      adminAction('/admin/gate', 'scan', 'Gate pass', 'Verify a student at the gate', 'mint') +
      adminAction('/admin/students', 'users', 'Students', 'Directory and attendance', 'peri') +
      adminAction('/admin/timetable', 'calendar', 'Timetable', 'Add or move a period', 'peach') +
      adminAction('/admin/placements', 'briefcase', 'Placements', 'Drives and applications', 'rose') +
    '</div>' +

    '<section class="section">' +
      '<div class="section-head"><h2>Needs a look</h2><span class="section-head__sub">Before 5 PM</span></div>' +
      '<div class="card card--flat" style="padding:2px 14px">' + needs + '</div>' +
    '</section>' +

    '<section class="section">' +
      '<div class="section-head"><h2>Today at MET</h2><button class="section-link" data-go="/admin/timetable">Manage timetable</button></div>' +
      '<div class="card card--flat" style="padding:2px 14px">' + schedule + '</div>' +
    '</section>' +

    '<section class="section">' +
      '<div class="section-head"><h2>Recent activity</h2><span class="section-head__sub">Staff log</span></div>' +
      '<div class="card card--flat" style="padding:6px 14px">' +
        db.activity.slice(0, 5).map(a =>
          '<div class="activity"><span class="activity__dot">' + ic(a.icon || 'sparkle', 14, 1.9) + '</span>' +
          '<span class="activity__main"><b>' + esc(a.label) + '</b><span>' + esc(a.meta) + ' · ' + timeAgo(a.at) + '</span></span></div>'
        ).join('') +
      '</div>' +
    '</section>' + dockSpace();
}

/* ============================================================
   ATTENDANCE REGISTER
   ============================================================ */
function ensureRegDraft(){
  const dateStr = S.regDate || ymd(new Date());
  const courses = registerSubjectsForPortal();
  if(!courses.length) return {subjectId:'',date:dateStr,records:{},existing:false};
  if(!registerSubjectById(S.regSubject)) S.regSubject = courses[0].id;
  if(S.regDraft && S.regDraft.subjectId === S.regSubject && S.regDraft.date === dateStr) return S.regDraft;
  const existing = db.sessions.find(x => x.subjectId === S.regSubject && x.date === dateStr);
  const records = {};
  db.students.forEach(s => {
    records[s.id] = existing && existing.records[s.id] ? existing.records[s.id] : '';
  });
  S.regDraft = { subjectId: S.regSubject, date: dateStr, records: records, existing: !!existing };
  return S.regDraft;
}
function adminAttendancePage(){
  if(!db.students.length) return pageHead('Attendance register', 'Approved roster import required') + '<div class="section">' + emptyState('No approved roster is loaded', 'Attendance stays unavailable until MET imports an approved roster into the protected backend.', 'clipboard') + '</div>';
  const courses = registerSubjectsForPortal();
  if(!courses.length) return pageHead('Attendance register', 'No roster or course mapping') + '<div class="section">' + emptyState('Class register not available', 'A matching class roster and semester course list have not been supplied for this portal.', 'clipboard') + '</div>';
  const subject = registerSubjectById(S.regSubject) || courses[0];
  const draft = ensureRegDraft();
  const present = Object.values(draft.records).filter(v => v === 'P').length;
  const absent = Object.values(draft.records).filter(v => v === 'A').length;
  const unmarked = db.students.length - present - absent;
  const dateObj = new Date((S.regDate || ymd(new Date())) + 'T12:00:00');
  const existing = db.sessions.find(x => x.subjectId === subject.id && x.date === draft.date);

  return adminBar('Register', 'S.E. CSD · Semester III · AY 2025–26', {
      right: '<span class="badge badge--ink">' + esc(subject.code) + '</span>'
    }) +
     '<div class="chips" style="padding-top:4px" role="group" aria-label="Choose a subject">' +
       courses.map(s => '<button class="chip ' + (s.id === subject.id ? 'on' : '') + '" data-act="regSubject" data-val="' + s.id + '" aria-pressed="' + (s.id === subject.id) + '">' +
        esc(s.code) + ' · ' + esc(s.name.split(' ')[0]) + '</button>').join('') +
    '</div>' +
    '<form class="row" data-form="regDate" style="padding:2px 16px 0;align-items:stretch">' +
      '<div class="field" style="flex:1"><span class="field__icon">' + ic('calendar', 17, 1.7) + '</span>' +
        '<input type="date" name="date" value="' + esc(draft.date) + '" aria-label="Register date" style="font-size:12px"></div>' +
      '<button class="btn btn--ghost btn--sm" type="submit" style="min-height:48px">Load</button>' +
    '</form>' +
    '<div class="register-summary">' +
      '<div><b>' + present + ' present · ' + absent + ' absent · ' + unmarked + ' unmarked</b>' +
        '<span>' + fmtLongDate(dateObj) + ' · ' + esc(subject.name) + '</span></div>' +
      '<span class="badge ' + (existing ? 'badge--green' : 'badge--amber') + '">' + (existing ? 'Saved' : 'Draft') + '</span>' +
    '</div>' +
    (existing ? '<div class="att-note" style="margin:10px 16px 0">' + ic('checkCircle', 15, 1.9) +
      '<span><b>This register is already saved.</b> Changes will update the same lecture. The class snapshot updates when you save.</span></div>' : '') +
    '<div class="reg-list">' +
      db.students.map(s => {
        const state = draft.records[s.id] || '';
        return '<div class="reg-row">' +
          avatarHTML(s.name, s.tone, 'avatar--sm') +
          '<div class="reg-row__main"><div class="reg-row__name">' + esc(s.name) +
            '</div>' +
            '<div class="reg-row__meta">Roll ' + esc(s.roll || '—') + ' · PRN ' + esc(s.prn || 'Not supplied') + '</div></div>' +
          '<div class="reg-toggle">' +
            '<button class="' + (state === 'P' ? 'on-present' : '') + '" data-act="regMark" data-val="' + s.id + ':P" aria-label="Mark ' + esc(s.name) + ' present" aria-pressed="' + (state === 'P') + '">P</button>' +
            '<button class="' + (state === 'A' ? 'on-absent' : '') + '" data-act="regMark" data-val="' + s.id + ':A" aria-label="Mark ' + esc(s.name) + ' absent" aria-pressed="' + (state === 'A') + '">A</button>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="btn-row" style="margin:12px 16px 0">' +
      '<button class="btn btn--ghost" data-act="regAll">' + ic('check', 15, 2) + ' All present</button>' +
      '<button class="btn" data-act="saveRegister" ' + (unmarked ? 'disabled' : '') + '>' + ic('checkCircle', 15, 1.9) + ' Save register</button>' +
    '</div>' +
    '<p style="font-size:9px;color:var(--muted-2);text-align:center;margin:10px 16px 0;line-height:1.45">Mark every student present or absent before saving. The register is stored locally and does not populate attendance for the separate T.E. CSD student demo.</p>' +
    dockSpace();
}

/* ============================================================
   PUBLISH
   ============================================================ */
function publishTabs(){
  const tabs = [['notice', 'Notice'], ['assignment', 'Assignment'], ['note', 'Note'], ['result', 'Result']];
  return '<div class="seg" style="margin:8px 16px 0" role="group" aria-label="Choose what to publish">' +
    tabs.map(([k, l]) => '<button aria-pressed="' + (S.publishType === k) + '" class="' + (S.publishType === k ? 'on' : '') + '" data-act="publishType" data-val="' + k + '">' + l + '</button>').join('') +
  '</div>';
}
function recentPublishes(){
  const rows = [];
  db.announcements.forEach(a => rows.push({ kind: 'Notice', icon: 'megaphone', title: a.title, at: a.at, tone: a.tone || 'butter' }));
  db.assignments.forEach(a => rows.push({ kind: 'Assignment', icon: 'bookOpen', title: a.title, at: a.due, tone: 'lilac' }));
  db.notes.forEach(n => rows.push({ kind: 'Note', icon: 'file', title: n.title, at: n.at, tone: 'peri' }));
  db.results.forEach(r => rows.push({ kind: 'Result', icon: 'award', title: r.title, at: r.publishedAt, tone: 'mint' }));
  return rows.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
}
function adminPublishPage(){
  let form = '';
  const identity = currentAdminIdentity();
  if(S.publishType === 'notice'){
    form = '<form class="form-card" data-form="publishNotice" style="margin-top:14px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Post a notice</h2>' +
      '<label class="field-label" for="pn-title">Title</label>' +
      '<div class="field"><input id="pn-title" name="title" placeholder="What does the campus need to know?" required></div>' +
      '<label class="field-label" for="pn-body">Details</label>' +
      '<div class="field field--area"><textarea id="pn-body" name="body" placeholder="Add the context, date and room students should note…" required></textarea></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="pn-tag">Tag</label><div class="field field--select"><select id="pn-tag" name="tag">' +
          ['Exam', 'Class', 'Placement', 'Library', 'General'].map(t => '<option>' + t + '</option>').join('') +
        '</select></div></div>' +
        '<div style="flex:1"><label class="field-label" for="pn-file">Attachment</label><div class="field"><input id="pn-file" name="attachment" placeholder="optional.pdf"></div></div>' +
      '</div>' +
      '<label class="checkline" style="margin-top:12px"><input type="checkbox" name="pinned" style="width:16px;height:16px;accent-color:#131313"> Pin this notice to the top</label>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('megaphone', 16, 1.9) + ' Publish notice</button>' +
    '</form>';
  } else if(S.publishType === 'assignment'){
    form = '<form class="form-card" data-form="publishAssignment" style="margin-top:14px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Set assignment</h2>' +
      '<label class="field-label" for="pa-subject">Subject</label>' +
      '<div class="field field--select"><select id="pa-subject" name="subjectId">' +
        db.subjects.map(s => '<option value="' + s.id + '">' + esc(s.code + ' · ' + s.name) + '</option>').join('') +
      '</select></div>' +
      '<label class="field-label" for="pa-title">Title</label>' +
      '<div class="field"><input id="pa-title" name="title" placeholder="e.g. Normalization problem set" required></div>' +
      '<label class="field-label" for="pa-desc">Instructions</label>' +
      '<div class="field field--area"><textarea id="pa-desc" name="description" placeholder="What should students submit, and how?" required></textarea></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="pa-due">Due date</label><div class="field"><input id="pa-due" name="due" type="date" value="' + ymd(addDays(new Date(), 3)) + '" required></div></div>' +
        '<div style="flex:1"><label class="field-label" for="pa-points">Points</label><div class="field"><input id="pa-points" name="points" type="number" min="1" max="100" value="20"></div></div>' +
      '</div>' +
      '<label class="field-label" for="pa-file">Attachment</label>' +
      '<div class="field"><input id="pa-file" name="attachment" placeholder="brief.pdf"></div>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('bookOpen', 16, 1.9) + ' Publish assignment</button>' +
    '</form>';
  } else if(S.publishType === 'note'){
    form = '<form class="form-card" data-form="publishNote" style="margin-top:14px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Share a note</h2>' +
      '<label class="field-label" for="pnt-subject">Subject</label>' +
      '<div class="field field--select"><select id="pnt-subject" name="subjectId">' +
        db.subjects.map(s => '<option value="' + s.id + '">' + esc(s.code + ' · ' + s.name) + '</option>').join('') +
      '</select></div>' +
      '<label class="field-label" for="pnt-title">Title</label>' +
      '<div class="field"><input id="pnt-title" name="title" placeholder="Unit 4 · Transport layer" required></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="pnt-type">File type</label><div class="field field--select"><select id="pnt-type" name="type">' +
          ['PDF', 'PPT', 'DOC'].map(t => '<option>' + t + '</option>').join('') +
        '</select></div></div>' +
        '<div style="flex:1"><label class="field-label" for="pnt-size">Size</label><div class="field"><input id="pnt-size" name="size" value="1.8 MB"></div></div>' +
      '</div>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('file', 16, 1.9) + ' Add to Classroom</button>' +
    '</form>';
  } else {
    form = '<form class="form-card" data-form="publishResult" style="margin-top:14px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Publish a result</h2>' +
      '<label class="field-label" for="pr-title">Result title</label>' +
      '<div class="field"><input id="pr-title" name="title" placeholder="e.g. Semester V · End-semester examination" required></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="pr-sem">Semester</label><div class="field field--select"><select id="pr-sem" name="semester">' +
          ['I','II','III','IV','V','VI','VII','VIII'].map(s => '<option' + (s === 'V' ? ' selected' : '') + '>' + s + '</option>').join('') +
        '</select></div></div>' +
        '<div style="flex:1"><label class="field-label" for="pr-sgpa">SGPA</label><div class="field"><input id="pr-sgpa" name="sgpa" type="number" step="0.01" min="0" max="10" required></div></div>' +
        '<div style="flex:1"><label class="field-label" for="pr-cgpa">CGPA</label><div class="field"><input id="pr-cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" required></div></div>' +
      '</div>' +
      '<div class="sheet-section__title" style="margin-top:14px">Grades</div>' +
      '<div class="card card--flat" style="padding:0 12px;background:var(--bg)">' +
        db.subjects.map(s => '<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)">' +
          '<span class="subject-chip subject-chip--' + s.tone + '" style="min-width:46px;text-align:center">' + esc(s.code) + '</span>' +
          '<span class="grow" style="font-size:10.5px">' + esc(s.name) + '</span>' +
          '<div class="field field--select" style="width:72px;min-height:34px;padding:0 9px"><select name="grade_' + s.id + '" style="font-size:11px">' +
            '<option value="">Select</option>' + ['A+','A','B+','B','C','D','F'].map(g => '<option>' + g + '</option>').join('') +
          '</select></div></div>').join('') +
      '</div>' +
      '<label class="checkline" style="margin-top:13px"><input type="checkbox" name="verified" value="yes" required style="width:16px;height:16px;accent-color:#131313"> I verified these values against an official grade card.</label>' +
      '<p class="label" style="margin-top:7px">Results were not supplied for this demo. Enter a result only when it has been verified; no figures or grades are pre-filled.</p>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('award', 16, 1.9) + ' Publish verified result</button>' +
    '</form>';
  }

  const recent = recentPublishes();
  return '<header class="topbar">' +
      '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Publish</div>' +
        '<div class="topbar__sub">Publish an update as ' + esc(identity.name) + '</div></div>' +
      '<span class="avatar avatar--sm avatar--butter">' + esc(initials(identity.name)) + '</span>' +
    '</header>' +
    publishTabs() + form +
    '<section class="section">' +
      '<div class="section-head"><h2>Recently published</h2><span class="section-head__sub">This week</span></div>' +
      '<div class="card card--flat" style="padding:4px 14px">' +
        recent.map(r => '<div class="activity"><span class="activity__dot tint-' + r.tone + '">' + ic(r.icon, 14, 1.9) + '</span>' +
          '<span class="activity__main"><b>' + esc(r.title) + '</b><span>' + r.kind + ' · ' + timeAgo(r.at) + '</span></span></div>').join('') +
      '</div>' +
    '</section>' + dockSpace();
}

/* ============================================================
   STUDENTS
   ============================================================ */
function adminStudentsPage(){
  if(!hasCsdRoster()) return pageHead('Students', 'No roster is mapped to this account') + '<div class="section">' + emptyState('Roster not available', 'MET must import an approved roster into the protected backend before this portal can view student records.', 'users') + '</div>';
  if(!db.students.length) return pageHead('Students', 'Approved roster import required') + '<div class="section">' + emptyState('No approved roster is loaded', 'Student records will appear here after MET imports an approved roster into the protected backend.', 'users') + '</div>';
  const q = (S.studentsQuery || '').trim().toLowerCase();
  let list = db.students.slice();
  if(q){
    list = list.filter(s => (s.name + ' ' + s.roll + ' ' + s.prn + ' ' + s.email).toLowerCase().indexOf(q) >= 0);
  }
  const low = db.students.filter(s => s.attendance != null && s.attendance < 75).length;
  return pageHead('S.E. CSD roster', 'AY 2025–26 · ' + db.students.length + ' names' + (low ? ' · ' + low + ' below 75%' : ''), {
      right: '<span class="badge badge--ink">' + db.students.length + '</span>'
    }) +
    '<form class="searchbar" data-form="studentSearch">' + ic('search', 18, 1.8) +
      '<input name="q" value="' + esc(S.studentsQuery || '') + '" placeholder="Search name, roll or PRN" aria-label="Search students">' +
      (q ? '<button type="button" class="icon-btn icon-btn--sm icon-btn--ghost" data-act="clearStudentsQuery" aria-label="Clear search">' + ic('x', 14, 2) + '</button>' : '') +
    '</form>' +
    '<div class="section section--tight">' +
      '<div class="card card--flat" style="padding:0;overflow:hidden">' +
        (list.length ? list.map(s => {
          const tone = s.attendance == null ? 'badge--amber' : s.attendance < 75 ? 'badge--red' : s.attendance < 85 ? 'badge--amber' : 'badge--green';
          return '<button class="reg-row" style="width:100%;text-align:left" data-act="adminStudent" data-val="' + s.id + '">' +
            avatarHTML(s.name, s.tone, 'avatar--sm') +
            '<span class="reg-row__main"><span class="reg-row__name">' + esc(s.name) + '</span>' +
              '<span class="reg-row__meta">Roll ' + esc(s.roll) + ' · PRN ' + esc(s.prn || 'Not supplied') + ' · CGPA not supplied</span></span>' +
            '<span class="badge ' + tone + '">' + (s.attendance == null ? 'Not recorded' : s.attendance + '%') + '</span>' +
            '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span>' +
          '</button>';
        }).join('') : emptyState('No students match', 'Try a roll number, PRN or part of a name.', 'search')) +
      '</div>' +
      '<div class="att-note" style="margin-top:12px">' + ic('users', 16, 1.8) +
        '<span><b>Source: S.E. Computer Science and Design roll list, AY 2025–26.</b> Attendance, CGPA, email and phone were not supplied and remain blank until entered.</span></div>' +
    '</div>' + dockSpace();
}

/* ============================================================
   RESULTS
   ============================================================ */
function adminResultsPage(){
  return pageHead('Results', db.results.length + ' grade cards published', {
      right: '<button class="icon-btn" data-act="startPublishResult" aria-label="Publish a result">' + ic('plus', 18, 2) + '</button>'
    }) +
    '<div class="section section--tight" style="padding-top:6px">' +
      (!db.results.length ? emptyState('No results published', 'No grade cards or CGPA values were included in the supplied data. Publish a verified result when available.', 'award') : '') +
      db.results.map((r, i) => '<article class="card" style="margin-bottom:10px;' + (i === 0 ? 'background:var(--butter-soft)' : '') + '">' +
        '<div class="row-between"><span class="badge ' + (i === 0 ? 'badge--ink' : '') + '">Semester ' + esc(r.semester) + '</span>' +
          '<span class="label">' + (r.isNew ? 'New · ' : '') + timeAgo(r.publishedAt) + '</span></div>' +
        '<h3 class="title-lg" style="margin-top:12px;font-size:22px">' + esc(r.title) + '</h3>' +
        '<div class="row" style="margin-top:14px;gap:24px">' +
          '<div><span class="label">SGPA</span><div class="num" style="font-size:27px;font-weight:700;letter-spacing:-1px;margin-top:2px">' + r.sgpa.toFixed(2) + '</div></div>' +
          '<div><span class="label">CGPA</span><div class="num" style="font-size:27px;font-weight:700;letter-spacing:-1px;margin-top:2px">' + r.cgpa.toFixed(2) + '</div></div>' +
          '<div><span class="label">Credits</span><div class="num" style="font-size:27px;font-weight:700;letter-spacing:-1px;margin-top:2px">' + r.credits + '</div></div>' +
        '</div>' +
        '<div class="btn-row" style="margin-top:14px">' +
          '<button class="btn btn--ghost btn--sm" data-go="/results">Preview card</button>' +
          '<button class="btn btn--danger btn--sm" data-act="deleteResult" data-val="' + r.id + '">' + ic('trash', 14, 1.9) + ' Remove</button>' +
        '</div>' +
      '</article>').join('') +
      '<div class="att-note">' + ic('award', 16, 1.8) +
         '<span><b>Local demo only.</b> A verified grade card appears in this device’s student Results screen; it is not sent to student accounts or a server.</span></div>' +
    '</div>';
}

/* ============================================================
   PLACEMENTS
   ============================================================ */
function adminPlacementsPage(){
  const open = db.drives.filter(d => !deadlineMeta(d.deadline).closed).length;
  const applications = db.drives.reduce((n, d) => n + d.applicants, 0);
  return pageHead('Placement drives', 'Training & Placement Cell', {
      right: '<button class="icon-btn" data-go="/admin/placement/new" aria-label="Add a drive">' + ic('plus', 18, 2) + '</button>'
    }) +
    '<section class="poster poster--butter" style="min-height:170px">' +
      '<div class="poster-blob" style="right:-36px;bottom:-60px;width:160px;height:160px;background:rgba(255,255,255,.32)"></div>' +
      '<div class="poster-content">' +
        '<span class="badge badge--glass">Sample listings · verify with TPO</span>' +
        '<div class="title-xl" style="font-size:38px;line-height:.94;margin-top:20px;letter-spacing:-2px">Placement<br>opportunities</div>' +
        '<div class="stat-row"><div class="stat"><b>' + open + '</b><span>live drives</span></div>' +
          '<div class="stat"><b>' + db.drives.length + '</b><span>companies</span></div>' +
          '<div class="stat"><b>' + applications + '</b><span>applications</span></div></div>' +
      '</div>' +
    '</section>' +
    '<div class="section section--tight">' +
      db.drives.map(d => {
        const dm = deadlineMeta(d.deadline);
        return '<article class="drive-card">' +
          '<div class="drive-head"><span class="logo-tile logo-tile--' + d.tone + '">' + esc(initials(d.company)) + '</span>' +
            '<div class="grow"><div class="drive-company">' + esc(d.company) + '</div><div class="drive-type">' + esc(d.role) + ' · ' + esc(d.location) + '</div></div>' +
            (d.demo ? '<span class="badge badge--amber">Sample</span>' : dm.closed ? '<span class="badge">Closed</span>' : '<span class="badge badge--green"><i></i>Live</span>') + '</div>' +
          '<div class="drive-meta"><span>' + ic('calendar', 12, 2) + dm.label + '</span>' +
            '<span>' + ic('users', 12, 2) + d.applicants + ' applied</span>' +
            '<span>' + ic('award', 12, 2) + 'Min CGPA ' + d.minCgpa.toFixed(1) + '</span></div>' +
          '<div class="drive-foot"><div class="drive-ctc">₹' + Number(d.ctc).toFixed(1) + '<small> LPA</small></div>' +
            '<div class="row" style="gap:6px"><button class="btn btn--ghost btn--sm" data-go="/drive/' + d.id + '">Preview</button>' +
            '<button class="mini-btn mini-btn--no" data-act="deleteDrive" data-val="' + d.id + '" aria-label="Remove ' + esc(d.company) + ' drive">' + ic('trash', 13, 1.9) + '</button></div></div>' +
        '</article>';
      }).join('') +
      '<div class="btn-row" style="margin-top:2px"><button class="btn btn--ghost btn--block" data-go="/admin/placement-responses">' + ic('clipboard',16,1.9) + ' View application responses</button><button class="btn btn--block" data-go="/admin/placement/new">' + ic('plus', 16, 2) + ' Add a placement drive</button></div>' +
    '</div>';
}
function adminNewDrivePage(){
  return pageHead('New drive', 'Add a company to the placement season') +
    '<form class="form-card" data-form="addDrive" style="margin-top:6px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Company &amp; role</h2>' +
      '<label class="field-label" for="nd-company">Company</label>' +
      '<div class="field"><input id="nd-company" name="company" placeholder="e.g. Infosys" required></div>' +
      '<label class="field-label" for="nd-role">Role</label>' +
      '<div class="field"><input id="nd-role" name="role" placeholder="e.g. Systems Engineer" required></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="nd-ctc">CTC (LPA)</label><div class="field"><input id="nd-ctc" name="ctc" type="number" step="0.1" min="0" required placeholder="Verified LPA"></div></div>' +
        '<div style="flex:1"><label class="field-label" for="nd-location">Location</label><div class="field"><input id="nd-location" name="location" required placeholder="Office or remote"></div></div>' +
      '</div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="nd-type">Type</label><div class="field field--select"><select id="nd-type" name="type" required><option value="">Choose type</option><option>Full-time</option><option>Internship</option><option>Internship + PPO</option></select></div></div>' +
        '<div style="flex:1"><label class="field-label" for="nd-deadline">Last date</label><div class="field"><input id="nd-deadline" name="deadline" type="date" required></div></div>' +
      '</div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="nd-cgpa">Min CGPA</label><div class="field"><input id="nd-cgpa" name="minCgpa" type="number" step="0.1" min="0" max="10" required placeholder="Verified requirement"></div></div>' +
        '<div style="flex:1"><label class="field-label" for="nd-backlogs">Max backlogs</label><div class="field"><input id="nd-backlogs" name="maxBacklogs" type="number" min="0" step="1" required placeholder="0 or more"></div></div>' +
      '</div>' +
      '<label class="field-label" for="nd-branches">Eligible branches</label>' +
       '<div class="field"><input id="nd-branches" name="branches" placeholder="Verified eligible branches" required></div>' +
      '<label class="field-label" for="nd-about">About the role</label>' +
      '<div class="field field--area"><textarea id="nd-about" name="about" placeholder="What will the student work on, and what should they know before applying?" required></textarea></div>' +
      '<label class="field-label" for="nd-rounds">Selection rounds</label>' +
      '<div class="field field--area" style="min-height:88px"><textarea id="nd-rounds" name="rounds" style="min-height:64px" placeholder="One round per line, e.g. Online assessment&#10;Technical interview&#10;HR interview"></textarea></div>' +
      '<label class="field-label" for="nd-bond">Bond / service agreement</label>' +
       '<div class="field"><input id="nd-bond" name="bond" placeholder="Verified terms, if applicable"></div>' +
      '<label class="field-label" for="nd-questions">Application form questions</label>' +
      '<div class="field field--area"><textarea id="nd-questions" name="questions" placeholder="Resume or portfolio link\nCurrent CGPA\nWhy are you interested? [long]\nPreferred location [optional]"></textarea></div>' +
      '<p class="label" style="margin-top:6px">One question per line. Add <b>[long]</b> for a paragraph, <b>[email]</b> for email, <b>[choice: A, B]</b> for options, or <b>[optional]</b> to make it optional. Student name and PRN are added automatically.</p>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('briefcase', 16, 1.9) + ' Add drive</button>' +
    '</form>';
}

/* ============================================================
   GATE
   ============================================================ */
function adminGatePage(){
  const pending = db.gateRequests.filter(r => r.status === 'pending');
  const gate = S.gate;
  let result = '';
  if(gate && gate.notFound){
    result = '<div class="gate-result gate-result--no"><h3>' + ic('alert', 15, 2) + ' No pass found</h3>' +
      '<p>Nothing matched “' + esc(gate.query) + '”. Check the PRN or ask the student to open their campus pass.</p></div>';
  } else if(gate){
    const s = studentById(gate.studentId);
    if(s){
      const low = s.attendance < 75;
      result = '<div class="gate-result ' + (low ? 'gate-result--ok' : 'gate-result--ok') + '">' +
        '<h3>' + ic('checkCircle', 16, 2) + ' Pass valid · ' + esc(s.name) + '</h3>' +
        '<p>' + esc(s.name) + ' · Roll ' + esc(s.roll) + ' · PRN ' + esc(s.prn) + '. The campus pass is active and the photo matches the student record.</p></div>' +
        '<div class="card card--flat" style="margin-top:10px">' +
          '<div class="row" style="gap:11px"><span class="avatar avatar--' + s.tone + '">' + esc(initials(s.name)) + '</span>' +
            '<div class="grow"><div class="title-sm">' + esc(s.name) + '</div><div class="label" style="margin-top:2px">' + esc(s.email) + '</div></div>' +
            '<span class="badge ' + (s.attendance < 75 ? 'badge--red' : 'badge--green') + '">' + s.attendance + '%</span></div>' +
          '<div class="sheet-kv" style="margin-top:10px"><span>Pass ID</span><b>MET-' + esc(s.prn) + '</b></div>' +
          '<div class="sheet-kv"><span>Class</span><b>' + esc(db.profile.class) + ' · ' + esc(db.profile.division) + '</b></div>' +
          '<div class="sheet-kv"><span>CGPA</span><b>' + s.cgpa.toFixed(2) + '</b></div>' +
          '<div class="sheet-kv"><span>Verified</span><b>' + clockNow() + '</b></div>' +
        '</div>' +
        (low ? '<div class="att-note" style="margin-top:10px">' + ic('alert', 15, 1.9) + '<span><b>Attendance is below 75%.</b> Entry is allowed, but flag the student to the class coordinator.</span></div>' : '') +
        '<div class="btn-row" style="margin-top:10px">' +
          '<button class="btn btn--ghost" data-act="gateLog" data-val="in">' + ic('arrowLeft', 15, 2) + ' Log entry</button>' +
          '<button class="btn" data-act="gateLog" data-val="out">Log exit ' + ic('arrowUpRight', 15, 2) + '</button>' +
        '</div>' +
        '<button class="btn btn--text" style="margin:8px auto 0;display:block" data-act="gateClear">Verify another pass</button>';
    }
  }

  return pageHead('Gate pass', 'Main gate · Adgaon, Nashik · 7:30 AM–7:30 PM', {
      right: '<span class="badge ' + (pending.length ? 'badge--amber' : 'badge--green') + '">' + pending.length + ' pending</span>'
    }) +
    '<form class="form-card" data-form="gateLookup" style="margin-top:6px">' +
      '<label class="field-label" for="gate-q">Pass ID, PRN or student name</label>' +
      '<div class="field"><span class="field__icon">' + ic('scan', 18, 1.7) + '</span>' +
        '<input id="gate-q" name="q" placeholder="MET-72145819K or Aarav Deshmukh" aria-label="Pass ID, PRN or student name"></div>' +
      '<div class="btn-row" style="margin-top:10px">' +
        '<button class="btn btn--ghost" type="button" data-act="gateScan">' + ic('qr', 15, 1.9) + ' Simulate scan</button>' +
        '<button class="btn" type="submit">' + ic('checkCircle', 15, 1.9) + ' Verify pass</button>' +
      '</div>' +
      '<p style="font-size:9px;color:var(--muted-2);margin-top:8px;line-height:1.45">Search using a roll number, supplied PRN or student name from the S.E. CSD roll list.</p>' +
    '</form>' +
    result +
    '<div class="section">' +
      '<div class="section-head"><h2>Waiting at the gate</h2><span class="section-head__sub">' + pending.length + ' requests</span></div>' +
      '<div class="card card--flat">' +
        (pending.length ? pending.map(r =>
          '<div class="request-row">' + avatarHTML(r.name, (studentById(r.studentId) || {}).tone || 'peri', 'avatar--sm') +
            '<div class="request-row__main"><b>' + esc(r.name) + '</b><span>' + esc(r.reason) + ' · ' + timeAgo(r.at) + '</span></div>' +
            '<div class="request-actions"><button class="mini-btn mini-btn--ok" data-act="approveGate" data-val="' + r.id + '">Allow</button>' +
            '<button class="mini-btn mini-btn--no" data-act="declineGate" data-val="' + r.id + '">Decline</button></div></div>'
        ).join('') : emptyState('The gate is quiet', 'No students are waiting for manual verification.', 'scan')) +
      '</div>' +
    '</div>' +
    '<div class="section">' +
      '<div class="section-head"><h2>Today’s gate log</h2><span class="section-head__sub">' + db.gateLog.length + ' movements</span></div>' +
      '<div class="card card--flat" style="padding:2px 14px">' +
        db.gateLog.slice(0, 8).map(g => '<div class="entry-log">' +
          '<span class="entry-log__time">' + fmtTime(g.at) + '</span>' +
          '<span class="entry-log__icon" style="background:' + (g.direction === 'in' ? 'var(--mint-soft)' : 'var(--rose-soft)') + '">' + ic(g.direction === 'in' ? 'arrowLeft' : 'arrowUpRight', 14, 1.9) + '</span>' +
          '<span class="entry-log__main"><b>' + esc(g.name) + '</b><span>' + esc(g.prn) + ' · ' + esc(g.gate) + '</span></span>' +
          '<span class="badge ' + (g.direction === 'in' ? 'badge--green' : 'badge--red') + '">' + (g.direction === 'in' ? 'In' : 'Out') + '</span>' +
        '</div>').join('') +
      '</div>' +
    '</div>' + dockSpace();
}

/* ============================================================
   TIMETABLE
   ============================================================ */
function adminTimetablePage(){
  const slots = (db.timetable[S.adminDay] || []).slice().sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const dates = weekDates();
  const todayNum = new Date().getDay();
  const p = currentPortal();
  const courses = timetableSubjectsForPortal();
  const semesterLabel = p && p.classScope === 'S.E. CSD' ? 'Sem III · S.E. CSD' : 'Sem V · T.E. CSD';
  const subjectOptions = courses.map(s => '<option value="' + s.id + '">' + esc(s.code + ' · ' + s.name) + '</option>').join('');
  const batchOptions = TE_CSD_SEM_V_BATCHES.map(b => '<option value="' + b.id + '">' + esc(timetableBatchLabel(b.id)) + '</option>').join('');
  const dayOptions = [1,2,3,4,5,6].map(d => '<option value="' + d + '"' + (d === S.adminDay ? ' selected' : '') + '>' + DOW_LONG[d] + '</option>').join('');

  return pageHead('Timetable', DOW_LONG[S.adminDay] + ' · ' + slots.length + ' periods', {
      right: '<span class="badge badge--ink">' + esc(semesterLabel) + '</span>'
    }) +
    '<div class="week-days">' +
      dates.map((date, i) => {
        const d = i + 1;
         return '<button class="day-btn ' + (S.adminDay === d ? 'on' : '') + (todayNum === d ? ' today' : '') + '" data-act="adminDay" data-val="' + d + '" aria-label="' + DOW_LONG[d] + ', ' + date.getDate() + '" aria-pressed="' + (S.adminDay === d) + '">' +
          '<span>' + DOW_SHORT[d] + '</span><b>' + date.getDate() + '</b></button>';
      }).join('') +
    '</div>' +
    '<div class="section section--tight" style="padding-top:14px">' +
      (slots.length ? '<div class="card card--flat" style="padding:2px 12px">' +
        slots.map((slot, idx) => {
          const info = slotInfo(slot);
          return '<div class="session-row">' +
            '<div class="session-row__date"><b>' + esc(slot.start) + '</b><span>' + esc(slot.end) + '</span></div>' +
            '<span class="sq sq--' + info.tone + '" style="width:34px;height:34px;font-size:8px">' + esc(info.code || '—') + '</span>' +
            '<div class="session-row__main"><b>' + esc(info.name) + '</b><span>' + esc(slot.type) + (slot.batch ? ' · ' + esc(timetableBatchLabel(slot.batch)) : '') + ' · ' + esc(info.room || 'Room not supplied') + '</span></div>' +
            '<button class="icon-btn icon-btn--sm" data-act="editSlot" data-val="' + S.adminDay + ':' + idx + '" aria-label="Edit ' + esc(info.name) + '">' + ic('edit', 14, 1.9) + '</button>' +
            '<button class="mini-btn mini-btn--no" data-act="deleteSlot" data-val="' + S.adminDay + ':' + idx + '">' + ic('trash', 13, 1.9) + '</button>' +
          '</div>';
        }).join('') + '</div>'
        : emptyState('No periods on ' + DOW_LONG[S.adminDay], 'Add a lecture, lab or campus session below.', 'calendar')) +
    '</div>' +
    '<form class="form-card" data-form="addSlot" style="margin-top:14px">' +
      '<h2 class="title-sm" style="margin-bottom:10px">Add a period</h2>' +
      '<label class="field-label" for="as-day">Day</label>' +
      '<div class="field field--select"><select id="as-day" name="day" required><option value="">Choose a day</option>' + dayOptions + '</select></div>' +
      '<label class="field-label" for="as-subject">Subject</label>' +
      '<div class="field field--select"><select id="as-subject" name="subjectId"><option value="">Campus session (no subject)</option>' + subjectOptions + '</select></div>' +
      '<label class="field-label" for="as-title">Title for campus sessions</label>' +
      '<div class="field"><input id="as-title" name="title" placeholder="e.g. Placement orientation"></div>' +
      '<label class="field-label" for="as-batch">Batch / rotation (optional)</label>' +
      '<div class="field field--select"><select id="as-batch" name="batch"><option value="">All T.E. CSD students</option>' + batchOptions + '</select></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="as-start">Start</label><div class="field"><input id="as-start" name="start" type="time" required></div></div>' +
        '<div style="flex:1"><label class="field-label" for="as-end">End</label><div class="field"><input id="as-end" name="end" type="time" required></div></div>' +
      '</div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label" for="as-type">Type</label><div class="field field--select"><select id="as-type" name="type" required><option value="">Choose a type</option><option>Lecture</option><option>Lab</option><option>Tutorial</option><option>Seminar</option><option>Self study</option><option>Activity</option></select></div></div>' +
        '<div style="flex:1"><label class="field-label" for="as-room">Room</label><div class="field"><input id="as-room" name="room" placeholder="402"></div></div>' +
      '</div>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('plus', 16, 2) + ' Add to timetable</button>' +
    '</form>' +
    '<p style="font-size:9px;color:var(--muted-2);text-align:center;margin:12px 16px 0;line-height:1.45">Changes are saved to this device and appear immediately in the student timetable and “Next class” card.</p>' +
    dockSpace();
}
function openSlotEditor(day, index){
  const slot = (db.timetable[day] || [])[index];
  if(!slot) return;
  const info = slotInfo(slot);
  const subjectOptions = '<option value="">Campus session (no subject)</option>' +
      timetableSubjectsForPortal().map(s => '<option value="' + s.id + '"' + (slot.subjectId === s.id ? ' selected' : '') + '>' + esc(s.code + ' · ' + s.name) + '</option>').join('');
  const batchOptions = '<option value="">All T.E. CSD students</option>' + TE_CSD_SEM_V_BATCHES.map(b => '<option value="' + b.id + '"' + (slot.batch === b.id ? ' selected' : '') + '>' + esc(timetableBatchLabel(b.id)) + '</option>').join('');
  openSheet(
    '<h2 class="sheet-title">Edit period</h2>' +
    '<p class="sheet-sub">' + DOW_LONG[day] + ' · ' + esc(info.name) + '</p>' +
    '<form data-form="editSlot" data-id="' + day + ':' + index + '">' +
      '<label class="field-label">Subject</label>' +
      '<div class="field field--select"><select name="subjectId">' + subjectOptions + '</select></div>' +
      '<label class="field-label">Title for campus sessions</label>' +
      '<div class="field"><input name="title" value="' + esc(slot.title || '') + '" placeholder="e.g. Library hour"></div>' +
      '<label class="field-label">Batch / rotation (optional)</label>' +
      '<div class="field field--select"><select name="batch">' + batchOptions + '</select></div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label">Start</label><div class="field"><input name="start" value="' + esc(slot.start) + '" required></div></div>' +
        '<div style="flex:1"><label class="field-label">End</label><div class="field"><input name="end" value="' + esc(slot.end) + '" required></div></div>' +
      '</div>' +
      '<div class="row" style="align-items:flex-start;gap:10px">' +
        '<div style="flex:1"><label class="field-label">Type</label><div class="field field--select"><select name="type">' +
          ['Lecture','Lab','Tutorial','Seminar','Self study','Activity'].map(t => '<option' + (t === slot.type ? ' selected' : '') + '>' + t + '</option>').join('') +
        '</select></div></div>' +
        '<div style="flex:1"><label class="field-label">Room</label><div class="field"><input name="room" value="' + esc(slot.room || '') + '" placeholder="402"></div></div>' +
      '</div>' +
      '<button class="btn btn--block" type="submit" style="margin-top:14px">Save changes</button>' +
      '<button class="btn btn--danger btn--block" type="button" style="margin-top:8px" data-act="deleteSlot" data-val="' + day + ':' + index + '">' + ic('trash', 15, 1.9) + ' Remove period</button>' +
    '</form>'
  );
}
function openStudentSheet(id){
  const s = studentById(id);
  if(!s) return;
  const attendanceKnown = s.attendance != null;
  openSheet(
    '<div style="text-align:center;padding:4px 0 8px">' +
      '<span class="avatar avatar--xl avatar--' + s.tone + '" style="margin:0 auto">' + esc(initials(s.name)) + '</span>' +
      '<h2 class="sheet-title" style="margin-top:12px">' + esc(s.name) + '</h2>' +
      '<p class="sheet-sub" style="margin-bottom:0">Roll ' + esc(s.roll) + ' · S.E. CSD · AY 2025–26</p>' +
      '<span class="badge ' + (!attendanceKnown ? 'badge--amber' : s.attendance < 75 ? 'badge--red' : 'badge--green') + '" style="margin-top:9px">' + (!attendanceKnown ? 'Attendance not recorded' : s.attendance < 75 ? 'Attendance at risk' : 'Attendance on track') + '</span>' +
    '</div>' +
    '<div class="card card--flat" style="padding:2px 14px;margin-top:8px">' +
      '<div class="sheet-kv"><span>PRN</span><b>' + esc(s.prn || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Email</span><b style="font-weight:500">' + esc(s.email || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Phone</span><b style="font-weight:500">' + esc(s.phone || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Attendance</span><b style="color:' + attColor(s.attendance) + '">' + (attendanceKnown ? s.attendance + '%' : 'Not recorded') + '</b></div>' +
      '<div class="sheet-kv"><span>CGPA</span><b>' + (s.cgpa == null ? 'Not supplied' : Number(s.cgpa).toFixed(2)) + '</b></div>' +
      '<div class="sheet-kv"><span>Backlogs</span><b>' + (s.backlogs == null ? 'Not supplied' : s.backlogs) + '</b></div>' +
    '</div>' +
    (attendanceKnown && s.attendance < 75 ? '<div class="att-note" style="margin-top:12px">' + ic('alert', 15, 1.9) + '<span><b>Attendance recovery plan needed.</b> Review the saved register and work with the student.</span></div>' : '') +
    '<p class="label" style="margin-top:12px">Contact details are available only after an approved backend roster import.</p>' +
    '<button class="btn btn--block" style="margin-top:12px" data-act="closeSheet">Done</button>'
  );
}

/* ============================================================
   ADMIN MORE
   ============================================================ */
function adminMorePage(){
  const p = currentPortal();
  const identity = currentAdminIdentity();
  let links = [];
  if(p.role === 'club') links = [
    ['calendar','My events',(db.events || []).filter(e => e.clubId === p.clubId).length + ' promotions','/admin/events','rose'],
    ['plus','Promote event','Create a form','/admin/event/new','butter'],
    ['clipboard','Responses',(db.formResponses || []).filter(r => r.kind === 'event' && (eventById(r.targetId) || {}).clubId === p.clubId).length + ' registrations','/admin/event-responses','mint']
  ];
  else if(p.role === 'tpo') links = [
    ['briefcase','Placement drives',db.drives.length + ' opportunities','/admin/placements','butter'],
    ['clipboard','Applications',(db.formResponses || []).filter(r => r.kind === 'drive').length + ' submissions','/admin/placement-responses','lilac'],
    ['calendar','Campus events','Club promotions','/admin/events','mint'],
    ['users','Student directory',db.students.length + ' supplied roll-list entries','/admin/students','peri'],
    ['megaphone','Announcements','Share a TPO update','/admin/publish','peach']
  ];
  else if(p.role === 'principal') links = [
    ['users','CSD roll list',db.students.length + ' · S.E. CSD · AY 2025–26','/admin/students','peri'],
    ['award','Results',db.results.length + ' published','/admin/results','lilac'],
    ['briefcase','Placements',db.drives.length + ' sample drives','/admin/placements','butter'],
    ['clipboard','Placement applications',(db.formResponses || []).filter(r => r.kind === 'drive').length + ' submissions','/admin/placement-responses','peach'],
    ['calendar','Campus events','Promotions and registrations','/admin/events','mint'],
    ['megaphone','Announcements','Institute updates','/admin/publish','rose']
  ];
  else if(p.role === 'hod' && p.department === 'CSD') links = [
    ['users','S.E. CSD roll list',db.students.length + ' · AY 2025–26','/admin/students','peri'],
    ['clipboard','Attendance register','Sem III · S.E. CSD','/admin/attendance','lilac'],
    ['calendar','Timetable','No weekly time slots supplied','/admin/timetable','butter'],
    ['book','Curriculum','All 8 semesters','/admin/curriculum','mint'],
    ['award','Results',db.results.length + ' published','/admin/results','rose']
  ];
  else if(p.role === 'coordinator' && p.classScope === 'S.E. CSD') links = [
    ['users','Student roll list',db.students.length + ' · AY 2025–26','/admin/students','peri'],
    ['clipboard','Attendance register','Sem III course list','/admin/attendance','lilac'],
    ['book','Curriculum','Semester III','/admin/curriculum','mint'],
    ['calendar','Timetable','No weekly time slots supplied','/admin/timetable','butter']
  ];
  else if(p.role === 'coordinator' && p.classScope === 'T.E. CSD') links = [
    ['book','Curriculum','All 8 semesters','/admin/curriculum','mint'],
    ['calendar','Timetable','Enter verified days and times','/admin/timetable','butter'],
    ['megaphone','Announcements','Share a class update','/admin/publish','peach']
  ];
  const tiles = links.filter(x => canOpenStaffRoute(x[3])).map(x => adminTile(x[0],x[1],x[2],x[4],'data-go="' + x[3] + '"')).join('');
  return '<header class="topbar">' +
      '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">More</div>' +
        '<div class="topbar__sub">Portal tools and account</div></div>' +
      '<button class="icon-btn" data-act="openHelp" aria-label="Help">' + ic('help', 19, 1.8) + '</button>' +
    '</header>' +
    '<section class="admin-profile">' +
      '<span class="avatar avatar--lg avatar--' + esc(identity.tone || 'butter') + '" style="background:rgba(255,255,255,.6)">' + esc(initials(identity.name)) + '</span>' +
      '<div class="grow"><h2>' + esc(identity.name) + '</h2><p>' + esc(identity.role) + '</p>' +
        '<p style="margin-top:4px">' + esc(identity.email) + '</p></div>' +
      '<span class="badge badge--ink">Portal</span>' +
    '</section>' +
    '<div class="group-label">Available to this portal</div>' +
    '<div class="wrap"><div class="tile-grid">' + (tiles || '<p class="label">No additional tools are mapped to this placeholder account.</p>') + '</div></div>' +
    '<div class="att-note" style="margin:12px 16px 0">' + ic('shield',16,1.8) + '<span>Portal access is selected by demo email in this local prototype. This is not production authentication or server-side authorization.</span></div>' +
    '<div class="group-label">Account</div>' +
    '<div class="menu">' +
      '<button class="li" data-act="openPreferences"><span class="menu__icon">' + ic('bell', 16, 1.8) + '</span>' +
        '<span class="li__main"><span class="li__title">Notification preferences</span><span class="li__sub">Announcements, placements and events</span></span>' +
        '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
      '<button class="li" data-act="openHelp"><span class="menu__icon">' + ic('help', 16, 1.8) + '</span>' +
        '<span class="li__main"><span class="li__title">Help &amp; support</span><span class="li__sub">Campus helpdesk and common questions</span></span>' +
        '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
      '<button class="li" data-act="resetDemo"><span class="menu__icon">' + ic('refresh', 16, 1.8) + '</span>' +
        '<span class="li__main"><span class="li__title">Reset demo data</span><span class="li__sub">Restore every seeded record and sign out</span></span>' +
        '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
      '<button class="li" data-act="signOut"><span class="menu__icon">' + ic('logout', 16, 1.8) + '</span>' +
        '<span class="li__main"><span class="li__title">Sign out</span><span class="li__sub">' + esc(identity.email) + '</span></span>' +
        '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
    '</div>' +
    '<p style="text-align:center;font-size:9.5px;color:var(--muted-2);margin-top:20px">MET Campus · Portal prototype<br>Demo data stays on this device</p>' +
    dockSpace();
}
