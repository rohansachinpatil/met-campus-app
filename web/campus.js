/* ============================================================
   MET Campus — curriculum, events and role-specific portals
   ============================================================ */
function parseFormQuestions(text){
  return String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).map((line, i) => {
    let label = line, type = 'short', required = true, options = [];
    if(/\[optional\]$/i.test(label)){ required = false; label = label.replace(/\s*\[optional\]$/i, '').trim(); }
    const choice = label.match(/^(.*?)\s*\[choice:\s*(.*?)\]$/i);
    if(choice){ label = choice[1].trim(); type = 'choice'; options = choice[2].split(',').map(x => x.trim()).filter(Boolean); }
    else if(/\[long\]$/i.test(label)){ type = 'long'; label = label.replace(/\s*\[long\]$/i, '').trim(); }
    else if(/\[email\]$/i.test(label)){ type = 'email'; label = label.replace(/\s*\[email\]$/i, '').trim(); }
    return { id:'q' + (i + 1), label:label, type:type, options:options, required:required };
  }).filter(q => q.label);
}
function questionsToText(questions){
  return (questions || []).map(q => q.label + (q.type === 'long' ? ' [long]' : q.type === 'email' ? ' [email]' : q.type === 'choice' ? ' [choice: ' + (q.options || []).join(', ') + ']' : '') + (q.required === false ? ' [optional]' : '')).join('\n');
}
function questionFieldsHTML(questions, prefix){
  if(!questions || !questions.length) return '<p class="label">No extra questions. Your MET name and PRN will be included with the registration.</p>';
  return questions.map(q => {
    const name = (prefix || 'answer_') + q.id;
    const required = q.required === false ? '' : ' required';
    const label = esc(q.label) + (q.required === false ? ' · optional' : '');
    if(q.type === 'long') return '<label class="field-label" for="' + esc(name) + '">' + label + '</label><div class="field field--area"><textarea id="' + esc(name) + '" name="' + esc(name) + '" placeholder="Your answer"' + required + '></textarea></div>';
    if(q.type === 'choice') return '<label class="field-label" for="' + esc(name) + '">' + label + '</label><div class="field field--select"><select id="' + esc(name) + '" name="' + esc(name) + '"' + required + '><option value="">Choose an answer</option>' + (q.options || []).map(o => '<option>' + esc(o) + '</option>').join('') + '</select></div>';
    return '<label class="field-label" for="' + esc(name) + '">' + label + '</label><div class="field"><input id="' + esc(name) + '" name="' + esc(name) + '" type="' + (q.type === 'email' ? 'email' : 'text') + '" placeholder="Your answer"' + required + '></div>';
  }).join('');
}
function clubById(id){ return (db.clubs || CAMPUS_CLUBS).find(c => c.id === id); }
function eventById(id){ return (db.events || []).find(e => e.id === id); }
function registerSemesterForPortal(){
  const p = currentPortal();
  return p && (p.department === 'CSD' || p.classScope === 'S.E. CSD') ? 'III' : 'V';
}
function registerSubjectsForPortal(){
  const p = currentPortal();
  if(!p || !(p.department === 'CSD' || p.classScope === 'S.E. CSD')) return [];
  const semester = db.curriculum.find(s => s.semester === registerSemesterForPortal());
  return (semester ? semester.courses : []).map((course,i) => ({
    id:'register-' + semester.semester + '-' + i,
    code:course[0],
    catalogCode:course[1] || '',
    name:course[2],
    faculty:'Faculty assignment not supplied',
    room:'TBA',
    credits:course[3],
    tone:['lilac','peri','butter','rose','mint','peach'][i % 6]
  }));
}
function registerSubjectById(id){ return registerSubjectsForPortal().find(s => s.id === id); }
function timetableSubjectsForPortal(){
  const p = currentPortal();
  return p && p.classScope === 'S.E. CSD' ? registerSubjectsForPortal() : db.subjects;
}
function timetableSubjectById(id){ return db.subjects.find(s => s.id === id) || registerSubjectById(id); }
function portalEvents(){
  const p = currentPortal();
  let items = db.events || [];
  if(p && p.role === 'club') items = items.filter(e => e.clubId === p.clubId);
  return items.slice().sort((a,b) => new Date(a.startsAt) - new Date(b.startsAt));
}
function eventRegistrationCount(id){ return (db.formResponses || []).filter(r => r.kind === 'event' && r.targetId === id).length; }
function studentEventResponse(id){ return (db.formResponses || []).find(r => r.kind === 'event' && r.targetId === id && r.studentId === db.profile.id); }

function curriculumPage(admin){
  const p = admin ? currentPortal() : null;
  if(admin && p && ((p.role === 'hod' && p.department !== 'CSD') || (p.role === 'coordinator' && p.classScope !== 'T.E. CSD' && p.classScope !== 'S.E. CSD'))){
    return pageHead('Curriculum', 'Department workspace') + '<div class="section">' + emptyState('Curriculum not linked to this portal', 'The curriculum supplied for this demo is Computer Science and Design. Ask the campus administrator to map this account to the correct department.', 'book') + '</div>';
  }
  const sem = db.curriculum.find(s => s.semester === S.curriculumSem) || db.curriculum[4];
  const rows = sem.courses.map(c => '<div class="curriculum-row">' +
    '<div class="curriculum-row__top"><span class="badge badge--soft">' + esc(c[0]) + '</span>' +
      '<span class="label">' + (c[3] === '—' || c[3] === 'Audit' ? esc(c[3]) : esc(String(c[3]) + ' credits')) + '</span></div>' +
    '<b>' + esc(c[2]) + '</b>' + (c[1] ? '<code>' + esc(c[1]) + '</code>' : '<span class="label">Course code not listed in supplied curriculum</span>') +
  '</div>').join('');
  const faculty = S.curriculumSem === 'V' ? '<section class="section"><div class="section-head"><h2>Semester V faculty</h2><span class="section-head__sub">2026–27</span></div><div class="card card--flat curriculum-faculty">' +
    db.subjects.map(s => '<div><span class="subject-chip subject-chip--' + s.tone + '">' + esc(s.code) + '</span><b>' + esc(s.name) + '</b><span>' + esc(s.faculty) + '</span></div>').join('') +
  '</div></section>' : '';
  return (admin ? pageHead('Curriculum', 'B.Tech. · Computer Science and Design') : '<header class="topbar"><div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Curriculum</div><div class="topbar__sub">B.Tech. · Computer Science and Design</div></div></header>') +
     '<div class="sem-rail" role="group" aria-label="Choose a semester">' + db.curriculum.map(s => '<button class="chip ' + (S.curriculumSem === s.semester ? 'on' : '') + '" data-act="curriculumSem" data-val="' + esc(s.semester) + '" aria-pressed="' + (S.curriculumSem === s.semester) + '">Sem ' + esc(s.semester) + '</button>').join('') + '</div>' +
    '<section class="curriculum-hero"><span class="badge badge--glass">' + esc(sem.academicYear) + '</span><h1>Semester ' + esc(sem.semester) + '</h1><p>' + esc(sem.programme) + '</p><span class="curriculum-count">' + sem.courses.length + ' listed courses</span></section>' +
    '<section class="section"><div class="card card--flat curriculum-list">' + rows + '</div>' +
      '<div class="att-note" style="margin-top:12px">' + ic('info', 16, 1.8) + '<span>Transcribed from the curriculum details supplied for MET. Verify code/credit anomalies with the department before using this as the official academic record.</span></div></section>' + faculty + dockSpace();
}

function eventsPage(){
  const events = (db.events || []).filter(e => e.published).sort((a,b) => new Date(a.startsAt) - new Date(b.startsAt));
  return '<header class="topbar"><div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Campus events</div><div class="topbar__sub">Promotions from MET clubs and cells</div></div><button class="icon-btn" data-go="/notifications" aria-label="Notifications">' + ic('bell',19,1.8) + (unreadNotifs() ? '<span class="dot"></span>' : '') + '</button></header>' +
    '<section class="poster poster--lilac" style="min-height:168px"><div class="poster-blob" style="right:-40px;bottom:-76px;width:180px;height:180px;background:rgba(255,255,255,.34)"></div><div class="poster-content"><span class="badge badge--glass">Student life at MET</span><h1>Find your<br>people.</h1><p>One place for club events and registration.</p></div></section>' +
    '<div class="section-head" style="padding:16px 16px 8px"><h2>Upcoming</h2><span class="section-head__sub">' + events.length + ' promotions</span></div>' +
    '<div class="event-list">' + (events.length ? events.map(e => {
      const c = clubById(e.clubId) || {name:'MET Campus',tone:'peri'};
      return '<button class="event-card" data-go="/event/' + encodeURIComponent(e.id) + '"><div class="event-card__top"><span class="avatar avatar--' + esc(c.tone) + '">' + esc(initials(c.name)) + '</span><span class="grow"><b>' + esc(c.name) + '</b><span>' + esc(c.subtitle || 'Campus club') + '</span></span>' + (e.demo ? '<span class="badge badge--amber">Sample</span>' : '') + '</div><h3>' + esc(e.title) + '</h3><p>' + esc(e.description) + '</p><div class="event-card__meta"><span>' + ic('calendar',13,1.8) + esc(fmtDate(e.startsAt)) + '</span><span>' + ic('location',13,1.8) + esc(e.venue || 'Venue TBA') + '</span></div><span class="btn btn--block btn--sm" style="margin-top:12px">' + (studentEventResponse(e.id) ? 'View your registration' : 'View event & register') + '</span></button>';
    }).join('') : emptyState('No events posted yet', 'Club and cell administrators will publish event details here.', 'calendar')) + '</div>' + dockSpace();
}

function eventDetailPage(id){
  const e = eventById(decodeURIComponent(id));
  if(!e) return '<div class="section">' + emptyState('Event not found', 'This promotion may have been removed.', 'calendar') + '</div>';
  const c = clubById(e.clubId) || {name:'MET Campus',subtitle:'Campus club',tone:'peri'};
  if(!e.published) return pageHead('Event registration', c.name) + '<div class="section">' + emptyState('Registration is unavailable', 'This promotion is no longer open. If you already registered, the event administrator still has your local demo response.', 'calendar') + '</div>' + dockSpace();
  const registered = studentEventResponse(e.id);
  const q = e.formQuestions || [];
  return pageHead('Event registration', c.name) +
    '<section class="poster poster--' + esc(c.tone) + '" style="min-height:195px"><div class="poster-blob" style="right:-35px;bottom:-75px;width:175px;height:175px;background:rgba(255,255,255,.3)"></div><div class="poster-content"><span class="badge badge--glass">' + esc(c.subtitle) + '</span>' + (e.demo ? '<span class="badge badge--amber" style="margin-left:6px">Sample promotion</span>' : '') + '<h1>' + esc(e.title) + '</h1><p>' + esc(fmtDate(e.startsAt)) + ' · ' + esc(fmtTime(e.startsAt)) + '</p></div></section>' +
    '<div class="section"><p class="body" style="font-size:13px;line-height:1.6">' + esc(e.description) + '</p><div class="card card--flat" style="padding:2px 14px;margin-top:12px"><div class="sheet-kv"><span>Organised by</span><b>' + esc(c.name) + '</b></div><div class="sheet-kv"><span>When</span><b>' + esc(fmtDate(e.startsAt)) + ' · ' + esc(fmtTime(e.startsAt)) + '</b></div><div class="sheet-kv"><span>Where</span><b>' + esc(e.venue || 'Venue to be confirmed') + '</b></div><div class="sheet-kv"><span>Register by</span><b>' + esc(e.registrationDeadline ? fmtDate(e.registrationDeadline) : 'While registration is open') + '</b></div></div></div>' +
     (registered ? '<div class="section"><div class="gate-result gate-result--ok"><h3>' + ic('checkCircle',16,2) + ' Registration received</h3><p>Your response is saved on this device only. It has not been sent to the event team.</p></div></div>' :
       '<form class="form-card" data-form="eventRegister" data-id="' + esc(e.id) + '"><h2 class="title-sm">Register for this event</h2><p class="label" style="margin:5px 0 12px">The demo student name and any supplied profile details are saved with your response.</p><div class="sheet-kv"><span>Student</span><b>' + esc(db.profile.name) + '</b></div><div class="sheet-kv"><span>PRN</span><b>' + esc(db.profile.prn || 'Not provided') + '</b></div>' + questionFieldsHTML(q,'answer_') + '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('send',16,1.9) + ' Save registration</button><p class="label" style="margin-top:9px">Registration details are stored locally in this demo.</p></form>') + dockSpace();
}

function adminEventsPage(){
  const p = currentPortal();
  const events = portalEvents();
  return pageHead(p && p.role === 'club' ? 'My club events' : 'Campus events', p && p.role === 'club' ? p.label : 'Promotions and registrations', {right:'<button class="icon-btn" data-go="/admin/event/new" aria-label="Create event promotion">' + ic('plus',18,2) + '</button>'}) +
    '<div class="section section--tight">' + (events.length ? events.map(e => {
      const club = clubById(e.clubId) || {name:'MET Campus',tone:'peri'};
       return '<article class="card event-admin-card"><div class="row-between"><span class="badge badge--' + (e.archived ? 'amber' : e.published ? 'green' : 'amber') + '">' + (e.archived ? 'Archived' : e.published ? 'Published' : 'Draft') + '</span><span class="label">' + esc(fmtDate(e.startsAt)) + '</span></div><h3>' + esc(e.title) + '</h3><p class="label">' + esc(club.name) + ' · ' + eventRegistrationCount(e.id) + ' registrations</p><div class="btn-row">' + (e.published ? '<button class="btn btn--ghost btn--sm" data-go="/event/' + encodeURIComponent(e.id) + '">Preview</button>' : '') + '<button class="btn btn--ghost btn--sm" data-go="/admin/event-responses">Responses</button>' + (e.published ? '<button class="mini-btn mini-btn--no" data-act="removeEvent" data-val="' + esc(e.id) + '" aria-label="Archive event">' + ic('trash',14,1.9) + '</button>' : '') + '</div></article>';
    }).join('') : emptyState('No promotions yet', 'Create an event and add registration questions for students.', 'calendar')) +
    '<div class="att-note" style="margin-top:12px">' + ic('info',16,1.8) + '<span>Sample promotions are labelled. Replace them with verified event information before relying on the demo.</span></div></div>' + dockSpace();
}

function adminEventFormPage(){
  const p = currentPortal();
  const clubOptions = (db.clubs || CAMPUS_CLUBS).map(c => '<option value="' + c.id + '"' + (p && p.clubId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('');
  const clubField = p && p.role === 'club' ? '<div class="field"><input id="event-club" type="text" value="' + esc((clubById(p.clubId) || {}).name || p.name) + '" disabled><input type="hidden" name="clubId" value="' + esc(p.clubId) + '"></div>' : '<div class="field field--select"><select id="event-club" name="clubId" required><option value="">Choose a club or cell</option>' + clubOptions + '</select></div>';
  return pageHead('New event', 'Post an event promotion') + '<form class="form-card" data-form="createEvent">' +
    '<label class="field-label" for="event-title">Event title</label><div class="field"><input id="event-title" name="title" maxlength="90" required placeholder="Name your event"></div>' +
     '<label class="field-label" for="event-club">Club or cell</label>' + clubField +
    '<label class="field-label" for="event-description">Promotion details</label><div class="field field--area"><textarea id="event-description" name="description" required placeholder="What will students do or learn? Include eligibility and anything to bring."></textarea></div>' +
     '<div class="row" style="gap:10px;align-items:flex-start"><div class="grow"><label class="field-label" for="event-date">Event date</label><div class="field"><input id="event-date" name="eventDate" type="date" required></div></div><div class="grow"><label class="field-label" for="event-time">Start time</label><div class="field"><input id="event-time" name="eventTime" type="time" required></div></div></div>' +
    '<label class="field-label" for="event-venue">Venue</label><div class="field"><input id="event-venue" name="venue" required placeholder="Building, room or online"></div>' +
     '<label class="field-label" for="event-deadline">Registration closes</label><div class="field"><input id="event-deadline" name="registrationDeadline" type="date" required></div>' +
    '<label class="field-label" for="event-questions">Registration form questions</label><div class="field field--area"><textarea id="event-questions" name="questions" placeholder="Your course / semester [choice: FE, SE, TE, BE]\nWhy do you want to attend? [long]\nDietary requirements [optional]"></textarea></div>' +
    '<p class="label" style="margin-top:6px">One question per line. Add <b>[long]</b> for a paragraph, <b>[email]</b> for email, <b>[choice: A, B]</b> for options, or <b>[optional]</b> to make it optional. Student name and PRN are collected automatically.</p>' +
    '<button class="btn btn--block" type="submit" style="margin-top:14px">' + ic('megaphone',16,1.9) + ' Publish promotion</button></form>' + dockSpace();
}

function adminEventResponsesPage(){
  const p = currentPortal();
  const responses = (db.formResponses || []).filter(r => {
    if(r.kind !== 'event') return false;
    const e = eventById(r.targetId);
    return e && (!p || p.role !== 'club' || e.clubId === p.clubId);
  }).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return pageHead('Event responses', responses.length + ' submitted') + '<div class="section section--tight">' +
    (responses.length ? responses.map(r => {
      const e = eventById(r.targetId);
      return '<article class="card response-card"><div class="row-between"><span class="badge badge--ink">' + esc(e ? e.title : 'Event') + '</span><span class="label">' + esc(fmtDate(r.submittedAt)) + '</span></div><h3>' + esc(r.studentName) + '</h3><p class="label">PRN ' + esc(r.prn || 'Not supplied') + '</p>' +
        (r.answers || []).map(a => '<div class="response-answer"><b>' + esc(a.label) + '</b><span>' + esc(a.value || '—') + '</span></div>').join('') + '</article>';
    }).join('') : emptyState('No registrations received', 'Student event form submissions will appear here.', 'clipboard')) + dockSpace() + '</div>';
}

function adminPlacementResponsesPage(){
  const responses = (db.formResponses || []).filter(r => r.kind === 'drive').sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return pageHead('Placement applications', responses.length + ' submitted') + '<div class="section section--tight">' +
    (responses.length ? responses.map(r => {
      const d = db.drives.find(x => x.id === r.targetId);
      return '<article class="card response-card"><div class="row-between"><span class="badge badge--ink">' + esc(d ? d.company + ' · ' + d.role : 'Placement drive') + '</span><span class="badge ' + (r.eligibilityPending ? 'badge--amber' : 'badge--green') + '">' + (r.eligibilityPending ? 'Verify eligibility' : 'Submitted') + '</span></div><h3>' + esc(r.studentName) + '</h3><p class="label">PRN ' + esc(r.prn || 'Not supplied') + ' · ' + esc(fmtDate(r.submittedAt)) + '</p>' + (r.answers || []).map(a => '<div class="response-answer"><b>' + esc(a.label) + '</b><span>' + esc(a.value || '—') + '</span></div>').join('') + '</article>';
    }).join('') : emptyState('No applications received', 'Student placement form submissions will appear here.', 'briefcase')) + dockSpace() + '</div>';
}

function roleDashboardPage(){
  const p = currentPortal();
  if(!p) return notFound('/admin');
  if(p.role === 'club'){
    const events = portalEvents();
    const responses = (db.formResponses || []).filter(r => r.kind === 'event' && (eventById(r.targetId) || {}).clubId === p.clubId).length;
    return '<header class="admin-hero"><div class="row-between"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div></div><h1>Make it<br>happen.</h1><p class="admin-hero__sub">Promote your event to MET students and collect registrations in one place.</p><div class="admin-stats"><div><b>' + events.length + '</b><span>promotions</span></div><div><b>' + responses + '</b><span>responses</span></div><div><b>' + events.filter(e => e.published).length + '</b><span>published</span></div></div></header><div class="admin-actions">' + adminAction('/admin/event/new','plus','Promote event','Create a registration form','lilac') + adminAction('/admin/events','calendar','My events',events.length + ' promotions','butter') + adminAction('/admin/event-responses','clipboard','Responses',responses + ' registrations','mint') + '</div><section class="section"><div class="section-head"><h2>Your club portal</h2><span class="section-head__sub">' + esc(p.email) + '</span></div><div class="att-note">' + ic('info',16,1.8) + '<span>This demo saves event registrations on this device. A Supabase connection and access policies are not configured yet.</span></div></section>' + dockSpace();
  }
  if(p.role === 'tpo'){
    const count = (db.formResponses || []).filter(r => r.kind === 'drive').length;
    const open = db.drives.filter(d => !deadlineMeta(d.deadline).closed).length;
    return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div><h1>Placement<br>desk.</h1><p class="admin-hero__sub">Manage drives, collect applications and share campus opportunities.</p><div class="admin-stats"><div><b>' + open + '</b><span>open sample drives</span></div><div><b>' + count + '</b><span>form submissions</span></div><div><b>' + (db.events || []).filter(e => e.published).length + '</b><span>campus events</span></div></div></header><div class="admin-actions">' + adminAction('/admin/placements','briefcase','Placement drives',open + ' open','butter') + adminAction('/admin/placement/new','plus','Add drive','Create a drive form','lilac') + adminAction('/admin/placement-responses','clipboard','Applications',count + ' submissions','peach') + adminAction('/admin/events','calendar','Campus events','Club promotions','mint') + '</div>' + dockSpace();
  }
  if(p.role === 'hod' && !p.department){
    return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.email) + '</div></div></div><h1>Department<br>overview.</h1><p class="admin-hero__sub">This demo HOD account has no department mapped yet. It cannot view the CSD roster or registers.</p></header><div class="section"><div class="att-note">' + ic('info',16,1.8) + '<span>Replace this placeholder with the official HOD email and department assignment before connecting Supabase.</span></div></div>' + dockSpace();
  }
  if(p.role === 'coordinator' && p.classScope === 'S.E. CSD'){
    return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div><h1>Your class<br>at MET.</h1><p class="admin-hero__sub">S.E. CSD · AY 2025–26. Student records and attendance require an approved roster import.</p><div class="admin-stats"><div><b>—</b><span>roster not imported</span></div><div><b>—</b><span>attendance unavailable</span></div><div><b>III</b><span>curriculum semester</span></div></div></header><div class="admin-actions">' + adminAction('/admin/attendance','clipboard','Attendance register','Roster import required','lilac') + adminAction('/admin/students','users','S.E. roll list','Roster import required','peri') + adminAction('/admin/curriculum','book','Curriculum','Semester III','mint') + '</div><section class="section"><div class="att-note">' + ic('info',16,1.8) + '<span>No student names or PRNs are bundled. MET must import an approved roster into the protected backend before this portal can show records.</span></div></section>' + dockSpace();
  }
  if(p.role === 'coordinator' && p.classScope === 'T.E. CSD'){
    return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div><h1>Third year<br>at MET.</h1><p class="admin-hero__sub">T.E. CSD · Semester V · AY 2026–27. Course and faculty assignments are supplied; the weekly days, times, rooms and matching class roll are not.</p></header><div class="admin-actions">' + adminAction('/admin/curriculum','book','Curriculum','Browse Sem I–VIII','mint') + adminAction('/admin/timetable','calendar','Weekly timetable','Enter verified schedule slots','butter') + adminAction('/admin/publish','megaphone','Announcements','Share a class update','peach') + '</div><section class="section"><div class="att-note">' + ic('info',16,1.8) + '<span>No T.E. CSD roster was provided, so attendance registers and student records are not exposed to this account.</span></div></section>' + dockSpace();
  }
  if(p.role === 'coordinator'){
    return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div><h1>Class<br>coordinator.</h1><p class="admin-hero__sub">Student records and attendance require an approved roster import for this class.</p></header><div class="section"><div class="att-note">' + ic('info',16,1.8) + '<span>MET must import the approved class roster into the protected backend before student records are available.</span></div></div>' + dockSpace();
  }
  const label = p.role === 'principal' ? 'Institute overview' : p.role === 'hod' ? 'CSD department' : 'T.E. CSD · Semester V';
  const avg = db.students.filter(s => s.attendance != null).length ? Math.round(db.students.reduce((n,s) => n + (s.attendance || 0),0) / db.students.filter(s => s.attendance != null).length) : null;
  const actions = p.role === 'principal' ? adminAction('/admin/students','users','CSD roster','Approved roster import required','peri') + adminAction('/admin/results','award','Results',db.results.length + ' published','lilac') + adminAction('/admin/events','calendar','Campus events','Review promotions','mint') + adminAction('/admin/placement-responses','clipboard','Applications',(db.formResponses || []).filter(r => r.kind === 'drive').length + ' submissions','peach') + adminAction('/admin/publish','megaphone','Announcements','Campus-wide notices','butter') :
    adminAction('/admin/attendance','clipboard','Attendance register','Mark a class session','lilac') + adminAction('/admin/students','users','Student directory',db.students.length + ' CSD students','peri') + adminAction('/admin/timetable','calendar','Timetable','Add supplied day/time slots','butter') + adminAction('/admin/curriculum','book','Curriculum','Browse Sem I–VIII','mint') + adminAction('/admin/publish','megaphone','Announcements','Share a class notice','peach');
  return '<header class="admin-hero"><div class="row"><span class="avatar avatar--butter">' + esc(initials(p.name)) + '</span><div><b>' + esc(p.name) + '</b><div class="admin-hero__label">' + esc(p.label) + '</div></div></div><h1>' + (p.role === 'principal' ? 'Campus<br>overview.' : p.role === 'hod' ? 'CSD<br>department.' : 'Your class<br>at MET.') + '</h1><p class="admin-hero__sub">' + esc(label) + ' · Academic year 2026–27. ' + (db.students.length ? db.students.length + ' roster records are available.' : 'Student records require an approved roster import.') + '</p><div class="admin-stats"><div><b>' + (db.students.length ? db.students.length : '—') + '</b><span>CSD roster entries</span></div><div><b>' + (avg == null ? '—' : avg + '%') + '</b><span>' + (avg == null ? 'attendance not entered' : 'recorded attendance') + '</span></div><div><b>' + (db.formResponses || []).length + '</b><span>form responses</span></div></div></header><div class="admin-actions">' + actions + '</div><section class="section"><div class="att-note">' + ic('info',16,1.8) + '<span>Curriculum and available campus content are loaded. Roster, attendance and verified results require approved backend records.</span></div></section>' + dockSpace();
}
function adminHomePage(){ return roleDashboardPage(); }
