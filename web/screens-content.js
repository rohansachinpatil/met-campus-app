/* ============================================================
   MET Campus — content screens & sheets
   ============================================================ */

/* ---------- results ---------- */
function selectedResult(){
  return db.results.find(r => r.id === S.pickResult) || db.results[0];
}
function gradeClass(g){
  if(g.indexOf('A') === 0) return '';
  if(g.indexOf('B') === 0) return 'grade--b';
  if(g.indexOf('C') === 0) return 'grade--c';
  return 'grade--a';
}
function resultsPage(){
  const r = selectedResult();
  if(!r) return pageHead('Results', 'No grade cards published yet') + '<div class="section">' + emptyState('No results available', 'Your examination section has not published results. No CGPA or grade figures were supplied for this demo.', 'award') + '</div>';
  return pageHead('Results', 'Published by the examination section') +
    '<div class="chips" style="margin-top:2px">' +
      db.results.map(x => '<button class="chip ' + (r.id === x.id ? 'on' : '') + '" data-act="pickResult" data-val="' + x.id + '" aria-pressed="' + (r.id === x.id) + '">' + esc(x.title.replace('Semester ','Sem ')) + '</button>').join('') +
    '</div>' +
    '<section class="result-hero">' +
      '<div class="row-between">' +
        '<span class="badge" style="background:rgba(255,255,255,.13);color:#fff"><i style="background:#7dc38e"></i>Published</span>' +
        (r.isNew ? '<span class="badge" style="background:var(--butter);color:var(--ink)">New</span>' : '<span style="font-size:9.5px;color:rgba(255,255,255,.45)">' + fmtShort(r.publishedAt) + '</span>') +
      '</div>' +
      '<h2>' + esc(r.title) + '</h2>' +
      '<div class="result-sgpa"><b class="num">' + r.sgpa.toFixed(2) + '</b><span>SGPA<br>this semester</span></div>' +
      '<div class="result-foot">' +
        '<div><span>CGPA</span><b style="display:block;margin-top:2px">' + r.cgpa.toFixed(2) + '</b></div>' +
        '<div><span>Credits</span><b style="display:block;margin-top:2px">' + r.credits + '</b></div>' +
        '<div><span>Subjects</span><b style="display:block;margin-top:2px">' + r.subjects.length + '</b></div>' +
        '<button class="icon-btn icon-btn--sm" data-act="downloadMarksheet" aria-label="Download marksheet" style="background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.15);color:#fff">' + ic('download', 17, 2) + '</button>' +
      '</div>' +
    '</section>' +
    '<div class="section section--tight">' +
      '<div class="section-head"><h2 style="font-size:17px">Grade card</h2><span class="section-head__sub">' + (r.publishedAt ? fmtShort(r.publishedAt) : '') + '</span></div>' +
      '<div class="card card--flat" style="padding:0;overflow:hidden">' +
        r.subjects.map(s =>
          '<div class="grade-row">' +
            '<span class="sq sq--lilac" style="width:34px;height:34px;border-radius:10px;font-size:8.5px">' + esc(s.code) + '</span>' +
            '<span class="grade-row__name">' + esc(s.name) + '<span class="grade-row__code">' + s.credits + ' credits</span></span>' +
            '<span class="grade ' + gradeClass(s.grade) + '">' + esc(s.grade) + '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="card card--flat" style="margin-top:10px;display:flex;align-items:center;gap:14px">' +
        '<div><div class="glance__num num" style="font-size:38px">' + r.cgpa.toFixed(2) + '</div><div class="label" style="margin-top:4px">Cumulative CGPA</div></div>' +
        '<div class="grow" style="text-align:right"><span class="badge badge--green"><i></i>' + (r.sgpa >= 8.5 ? 'First class with distinction' : 'First class') + '</span>' +
          '<div style="font-size:9.5px;color:var(--muted);margin-top:6px">Across Semester III–V</div></div>' +
      '</div>' +
      '<button class="btn btn--ghost btn--block" style="margin-top:10px" data-act="downloadMarksheet">' + ic('download', 16, 1.9) + ' Download marksheet</button>' +
       '<p style="font-size:9.5px;color:var(--muted-2);line-height:1.5;margin-top:14px">This local demo contains no supplied results. Any grade card shown here must be entered by staff from a verified source.</p>' +
    '</div>';
}

/* ---------- campus pass ---------- */
function entryPage(){
  const logs = db.entry.logs.slice().sort((a,b) => new Date(b.at) - new Date(a.at));
  return pageHead('Campus pass', 'Scan at any campus gate', {
    right: '<button class="icon-btn" data-act="refreshPass" aria-label="Refresh pass">' + ic('refresh', 18, 1.9) + '</button>'
  }) +
    '<section class="entry-poster">' +
      '<div class="pass-head">' +
        '<div class="pass-brand"><span class="pass-brand__mark">' + logoMark(19) + '</span><div><b>MET CAMPUS</b><span>Student gate pass</span></div></div>' +
        '<span class="pass-chip"><span class="dot-green"></span>Active</span>' +
      '</div>' +
      '<div class="qr-panel">' +
        '<canvas id="qr" width="264" height="264" aria-label="QR code for campus entry"></canvas>' +
        '<div class="qr-panel__id">' + esc(db.entry.passId) + '</div>' +
      '</div>' +
      '<div class="pass-name">' + esc(db.profile.name) + '</div>' +
      '<div class="pass-meta">' + esc(db.profile.class) + ' · PRN ' + esc(db.profile.prn) + '</div>' +
      '<div class="pass-perf">' +
        '<div class="pass-perf__body">' +
          '<div><div class="pass-perf__label">VALID UNTIL</div><div class="pass-perf__value">Today · 11:59 PM</div></div>' +
          '<div style="text-align:right"><div class="pass-perf__label">GATE</div><div class="pass-perf__value">' + esc(db.entry.gate) + '</div></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<p class="pass-scene"><span class="dot-green"></span>Brightness up · Hold steady at the scanner<br>Entry allowed 7:30 AM – 7:30 PM</p>' +
    '<div class="btn-row" style="margin:14px 16px 0">' +
      '<button class="btn btn--ghost btn--sm" data-act="addToWallet">' + ic('wallet', 15, 1.8) + ' Add to wallet</button>' +
      '<button class="btn btn--sm" data-act="entryHelp">' + ic('help', 15, 1.8) + ' Pass help</button>' +
    '</div>' +
    '<div class="section">' +
      '<div class="section-head"><h2 style="font-size:18px">Today’s entries</h2><span class="section-head__sub">Main gate &amp; library</span></div>' +
      '<div class="card card--flat">' +
        logs.map(log =>
          '<div class="entry-log">' +
            '<span class="entry-log__time">' + fmtTime(log.at) + '</span>' +
            '<span class="entry-log__icon" style="background:' + (log.direction === 'in' ? 'var(--mint-soft)' : 'var(--rose-soft)') + '">' + ic(log.gate === 'Central library' ? 'bookOpen' : 'building', 14, 1.9) + '</span>' +
            '<span class="entry-log__main"><b>' + esc(log.gate) + '</b><span>' + esc(log.label) + '</span></span>' +
            '<span class="badge ' + (log.direction === 'in' ? 'badge--green' : 'badge--red') + '">' + (log.direction === 'in' ? 'In' : 'Out') + '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="att-note" style="margin-top:12px">' + ic('shield', 16, 1.8) + '<span><b>One pass per student.</b> The QR refreshes every 24 hours. Sharing screenshots may lock your entry for 24 hours.</span></div>' +
    '</div>';
}

/* ---------- placements ---------- */
function eligibilityFor(d){
  const open = !deadlineMeta(d.deadline).closed;
  const cgpaKnown = db.profile.cgpa != null && db.profile.cgpa !== '' && isFinite(Number(db.profile.cgpa));
  const backlogKnown = db.profile.backlogs != null && db.profile.backlogs !== '' && isFinite(Number(db.profile.backlogs));
  const cgpaOk = cgpaKnown ? Number(db.profile.cgpa) >= Number(d.minCgpa || 0) : null;
  const backlogOk = backlogKnown ? Number(db.profile.backlogs) <= Number(d.maxBacklogs || 0) : null;
  const pending = open && (cgpaOk == null || backlogOk == null);
  return { open, cgpaOk, backlogOk, pending, eligible: open && cgpaOk !== false && backlogOk !== false };
}
function placementsPage(){
  const open = db.drives.filter(d => !deadlineMeta(d.deadline).closed);
  const eligible = open.filter(d => eligibilityFor(d).eligible);
  const applied = db.drives.filter(d => d.applied);
  let list = db.drives.slice();
  if(S.driveFilter === 'eligible') list = list.filter(d => eligibilityFor(d).eligible && !deadlineMeta(d.deadline).closed);
  if(S.driveFilter === 'applied') list = list.filter(d => d.applied);
  if(S.driveFilter === 'closed') list = list.filter(d => deadlineMeta(d.deadline).closed);

  return pageHead('Placements', 'Training & Placement Cell') +
      '<section class="poster poster--butter" style="min-height:208px">' +
      '<div class="poster-blob" style="right:-34px;bottom:-50px;width:170px;height:170px;background:rgba(255,255,255,.34)"></div>' +
      '<div class="poster-content">' +
        '<div class="row-between"><span class="badge badge--glass">Sample listings · verify with TPO</span><span style="opacity:.5">' + ic('briefcase', 20, 1.8) + '</span></div>' +
        '<div class="title-xl" style="font-size:40px;line-height:.94;margin-top:22px;letter-spacing:-2px">Explore<br>opportunities</div>' +
        '<div class="stat-row">' +
          '<div class="stat"><b>' + open.length + '</b><span>drives open</span></div>' +
          '<div class="stat"><b>' + eligible.length + '</b><span>you qualify for</span></div>' +
          '<div class="stat"><b>' + applied.length + '</b><span>applications</span></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="section section--tight" style="padding-top:16px">' +
      '<div class="chips chips--plain" style="padding-left:16px;padding-right:16px" role="group" aria-label="Filter placement drives">' +
        [['all','All drives'],['eligible','Eligible'],['applied','Applied'],['closed','Closed']].map(([k,l]) =>
          '<button class="chip ' + (S.driveFilter === k ? 'on' : '') + '" data-act="driveFilter" data-val="' + k + '" aria-pressed="' + (S.driveFilter === k) + '">' + l + '</button>'
        ).join('') +
      '</div>' +
      (list.length ? list.map(d => {
        const dm = deadlineMeta(d.deadline);
        const el = eligibilityFor(d);
        return '<article class="drive-card">' +
      '<div class="drive-head">' +
            '<span class="logo-tile logo-tile--' + d.tone + '">' + esc(initials(d.company)) + '</span>' +
            '<div class="grow"><div class="drive-company">' + esc(d.company) + '</div><div class="drive-type">' + esc(d.type) + ' · ' + esc(d.location) + '</div></div>' +
            (d.demo ? '<span class="badge badge--amber">Sample</span>' : '') +
            (d.applied ? '<span class="badge badge--green">Applied</span>' : dm.closed ? '<span class="badge">Closed</span>' : el.pending ? '<span class="badge badge--amber">Check requirements</span>' : el.eligible ? '<span class="badge badge--green"><i></i>Eligible</span>' : '<span class="badge badge--red">Not eligible</span>') +
          '</div>' +
          '<div class="drive-role">' + esc(d.role) + '</div>' +
          '<div class="drive-meta"><span>' + ic('calendar', 12, 2) + dm.label + '</span><span>' + ic('award', 12, 2) + 'Min CGPA ' + Number(d.minCgpa || 0).toFixed(1) + '</span><span>' + ic('users', 12, 2) + (d.applicants || 0) + ' applied</span></div>' +
          '<div class="drive-foot">' +
            '<div class="drive-ctc">₹' + Number(d.ctc).toFixed(1) + '<small> LPA</small></div>' +
            '<button class="btn btn--sm ' + (d.applied ? 'btn--soft' : 'btn--ink') + '" data-go="/drive/' + d.id + '">' + (d.applied ? 'View application' : 'View drive') + '</button>' +
          '</div>' +
        '</article>';
      }).join('') : emptyState('No drives in this view', 'Try another filter, or check back when the placement cell posts the next company.', 'briefcase')) +
      '<div class="att-note" style="margin-top:2px">' + ic('help', 16, 1.8) + '<span><b>Demo only.</b> Applications are saved on this device; no profile, resume or response is sent to a recruiter or TPO.</span></div>' +
    '</div>';
}
function drivePage(id){
  const d = db.drives.find(x => x.id === id);
  if(!d) return emptyState('Drive not found', 'This placement drive may have been removed.', 'briefcase');
  const dm = deadlineMeta(d.deadline);
  const el = eligibilityFor(d);
  return pageHead('Placement drive', d.company + ' · ' + d.type) +
    '<section class="poster poster--' + (d.tone === 'lilac' ? 'lilac' : 'butter') + '">' +
      '<div class="poster-content">' +
        '<div class="placement-hero">' +
          '<span class="logo-tile logo-tile--ink" style="background:var(--ink);color:#fff">' + esc(initials(d.company)) + '</span>' +
          '<div class="grow"><div class="title-md">' + esc(d.company) + '</div><div class="kicker" style="margin-top:3px">' + esc(d.type) + ' · ' + esc(d.location) + '</div></div>' +
          (d.applied ? '<span class="badge badge--glass">Applied</span>' : '') +
        '</div>' +
        '<h1 class="title-xl" style="margin-top:22px;font-size:32px">' + esc(d.role) + '</h1>' +
        '<div class="row" style="margin-top:13px;gap:18px;flex-wrap:wrap">' +
          '<div><div class="kicker">CTC</div><div style="font-size:24px;font-weight:700;letter-spacing:-.8px">₹' + Number(d.ctc).toFixed(1) + ' <span style="font-size:10px;font-weight:500;opacity:.55">LPA</span></div></div>' +
          '<div><div class="kicker">Deadline</div><div style="font-size:14px;font-weight:600;margin-top:3px">' + fmtShort(d.deadline) + '</div><div style="font-size:9.5px;opacity:.55;margin-top:1px">' + dm.short + '</div></div>' +
          '<div><div class="kicker">Applicants</div><div style="font-size:14px;font-weight:600;margin-top:3px">' + d.applicants + '</div></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="section section--tight">' +
      '<div class="section-head"><h2 style="font-size:17px">About the role</h2><span class="badge">' + esc(d.type) + '</span></div>' +
      (d.demo ? '<div class="att-note" style="margin-bottom:10px">' + ic('info',16,1.8) + '<span><b>Sample listing.</b> This is demonstration content, not a verified employer drive. Confirm details with the TPO before applying.</span></div>' : '') +
      '<p class="body" style="font-size:12.5px;line-height:1.6">' + esc(d.about) + '</p>' +
      '<div class="card card--flat" style="margin-top:14px;padding:2px 14px">' +
        '<div class="sheet-kv"><span>Location</span><b>' + esc(d.location) + '</b></div>' +
        '<div class="sheet-kv"><span>Compensation</span><b>₹' + Number(d.ctc).toFixed(1) + ' LPA</b></div>' +
        '<div class="sheet-kv"><span>Bond</span><b>' + esc(d.bond || 'No bond') + '</b></div>' +
        '<div class="sheet-kv"><span>Eligible branches</span><b>' + esc(d.eligibleBranches || 'All branches') + '</b></div>' +
        '<div class="sheet-kv"><span>Applications close</span><b>' + fmtDate(d.deadline) + ', 5 PM</b></div>' +
      '</div>' +
      '<div class="section-head" style="margin-top:24px"><h2 style="font-size:17px">Selection process</h2></div>' +
      '<div class="card card--flat" style="padding:4px 14px">' +
        d.rounds.map((r, i) => '<div class="round"><span class="round__n ' + (i === 0 ? 'done' : '') + '">' + (i + 1) + '</span><div class="round__main"><div class="round__title">' + esc(r) + '</div><div class="round__sub">' + (i === 0 ? 'Usually the first shortlist step' : 'Shortlisted candidates are notified by email') + '</div></div></div>').join('') +
      '</div>' +
      '<div class="section-head" style="margin-top:24px"><h2 style="font-size:17px">Eligibility</h2></div>' +
      '<div class="card card--flat" style="padding:4px 14px">' +
          '<div class="sheet-kv"><span>Minimum CGPA</span><b style="color:' + (el.cgpaOk === true ? 'var(--green)' : el.cgpaOk === false ? 'var(--red)' : 'var(--muted)') + '">' + (el.cgpaOk == null ? 'Verify with TPO' : el.cgpaOk ? 'Met' : 'Not met') + ' · ' + Number(d.minCgpa || 0).toFixed(1) + '</b></div>' +
          '<div class="sheet-kv"><span>Active backlogs</span><b style="color:' + (el.backlogOk === true ? 'var(--green)' : el.backlogOk === false ? 'var(--red)' : 'var(--muted)') + '">' + (el.backlogOk == null ? 'Not supplied' : el.backlogOk ? 'Within limit' : 'Not met') + '</b></div>' +
          '<div class="sheet-kv"><span>Branch</span><b>Computer Science and Design</b></div>' +
          '<div class="sheet-kv"><span>Your CGPA</span><b>' + (db.profile.cgpa == null ? 'Not supplied' : Number(db.profile.cgpa).toFixed(2)) + '</b></div>' +
      '</div>' +
       (d.applied ? '<div class="submitted-box" style="margin-top:18px">' + ic('checkCircle', 19, 2) + '<div><h3>Application saved locally</h3><p>Your response was saved on this device on ' + fmtDate(d.appliedAt) + '. It has not been sent to the placement cell or employer.</p></div></div>' : '') +
      '<div style="height:88px"></div>' +
    '</div>' +
    '<div class="applybar">' +
      (d.applied ? '<button class="btn btn--block" disabled>' + ic('check', 17, 2.2) + ' Application submitted</button>' :
       dm.closed ? '<button class="btn btn--block" disabled>Applications closed</button>' :
        !el.eligible ? '<button class="btn btn--block" disabled>Requirements not met · check with TPO</button>' :
        '<button class="btn btn--block" data-act="applyDrive" data-val="' + d.id + '">' + (el.pending ? 'Apply · eligibility to verify' : 'Apply to ' + esc(d.company)) + '</button>') +
    '</div>';
}

/* ---------- assignments ---------- */
function assignmentsPage(){
  let list = db.assignments.slice().sort((a,b) => new Date(a.due) - new Date(b.due));
  if(S.workFilter === 'due') list = list.filter(a => !a.submitted);
  if(S.workFilter === 'submitted') list = list.filter(a => a.submitted);
  return pageHead('All work', db.assignments.filter(a => !a.submitted).length + ' to submit · ' + db.assignments.length + ' total') +
    '<div class="chips" style="padding-left:16px" role="group" aria-label="Filter assignments">' +
      [['all','All'],['due','To submit'],['submitted','Submitted']].map(([k,l]) => '<button class="chip ' + (S.workFilter === k ? 'on' : '') + '" data-act="workFilter" data-val="' + k + '" aria-pressed="' + (S.workFilter === k) + '">' + l + '</button>').join('') +
    '</div>' +
    '<div class="section section--tight"><div class="work-list" style="padding:0 16px">' +
      (list.length ? list.map(assignmentCard).join('') : emptyState('No assignments here', 'Try a different filter.', 'bookOpen')) +
    '</div></div>';
}
function assignmentPage(id){
  const a = db.assignments.find(x => x.id === id);
  if(!a) return emptyState('Assignment not found', 'It may have been removed by your faculty.', 'bookOpen');
  const s = subj(a.subjectId);
  const due = dueMeta(a.due);
  const attached = S.attached[a.id];
  return pageHead('Assignment', s.code + ' · ' + esc(s.faculty)) +
    '<section class="detail-hero tint-' + s.tone + '">' +
      '<div class="poster-blob" style="right:-30px;top:-36px;width:130px;height:130px;background:rgba(255,255,255,.3)"></div>' +
      '<div class="row-between" style="position:relative;z-index:2">' + subjectChip(s) +
        (a.submitted ? '<span class="badge badge--green">' + ic('check', 10, 3) + ' Turned in</span>' :
          due.tone === 'red' ? '<span class="badge badge--red">' + due.label + '</span>' :
          due.label === 'Due today' ? '<span class="badge badge--amber">Due today</span>' :
          '<span class="badge">' + due.label + '</span>') +
      '</div>' +
      '<h1>' + esc(a.title) + '</h1>' +
      '<div class="detail-meta"><span class="tag tag--white">' + ic('calendar', 11, 2) + 'Due ' + due.date + '</span><span class="tag tag--white">' + ic('award', 11, 2) + (a.points == null ? 'Points not supplied' : a.points + ' points') + '</span><span class="tag tag--white">' + (s.credits == null ? 'Credit data not supplied' : s.credits + ' credit course') + '</span></div>' +
    '</section>' +
    '<div class="assignment-body">' +
      '<h2>Instructions</h2>' +
      '<p>' + esc(a.description) + '</p>' +
      (a.attachments && a.attachments.length ? '<h2 style="margin-top:20px">Attached files</h2>' + a.attachments.map(f =>
        '<button class="attach-row" data-act="download" data-val="' + esc(f.name) + '" style="width:100%;text-align:left">' +
          '<span class="sq sq--peach" style="width:34px;height:38px;border-radius:9px">' + ic('file', 15, 1.8) + '</span>' +
          '<span class="attach-row__name grow">' + esc(f.name) + '<span class="attach-row__size">' + esc(f.size) + '</span></span>' +
          '<span style="color:var(--muted)">' + ic('download', 16, 1.9) + '</span>' +
        '</button>'
      ).join('') : '') +
      '<div class="card card--flat" style="margin-top:18px;display:flex;align-items:center;gap:11px;padding:12px">' +
        '<span class="avatar avatar--sm avatar--' + s.tone + '">' + esc(initials(s.faculty)) + '</span>' +
        '<span class="grow"><span class="li__title">' + esc(s.faculty) + '</span><span class="li__sub">' + esc(s.name) + '</span></span>' +
        '<span class="badge">Announcements only</span>' +
      '</div>' +
      (a.submitted ?
        '<div class="submitted-box"><span class="sq sq--mint" style="width:34px;height:34px">' + ic('check', 17, 2.4) + '</span>' +
          '<div><h3>Submitted ' + fmtShort(a.submittedAt) + ' at ' + fmtTime(a.submittedAt) + '</h3>' +
          '<p>Your work is with ' + esc(s.faculty) + '. Check campus announcements or contact the department if you need to resubmit.</p>' +
          '</div></div>' +
        (a.submissionText ? '<div class="submit-panel"><h2>Your answer</h2><div class="card card--flat" style="padding:14px;font-size:12px;line-height:1.55;color:var(--ink-soft)">' + esc(a.submissionText) + '</div></div>' : '') +
        (a.submissionFile ? '<div class="attach-row" style="margin-top:10px"><span class="sq sq--peach" style="width:32px;height:36px">' + ic('file', 14, 1.8) + '</span><span class="attach-row__name grow">' + esc(a.submissionFile) + '<span class="attach-row__size">Submitted work</span></span>' + ic('download', 16, 1.9) + '</div>' : '')
      :
        '<form class="submit-panel" data-form="submitAssignment" data-id="' + a.id + '">' +
          '<h2>Your work</h2>' +
          '<div class="field field--area"><textarea name="answer" placeholder="Add a note for your faculty or paste a link…" aria-label="Your answer"></textarea></div>' +
          '<button type="button" class="btn btn--ghost btn--sm" style="margin-top:8px" data-act="attachAssignment" data-val="' + a.id + '">' + ic('paperclip', 14, 1.9) + (attached ? ' Attached · my_submission.pdf' : ' Attach a file') + '</button>' +
          '<button class="btn btn--block" style="margin-top:12px" type="submit">' + ic('send', 15, 1.9) + ' Submit assignment</button>' +
          '<p style="font-size:9px;color:var(--muted-2);text-align:center;margin-top:8px">Attachments are simulated in this demo.</p>' +
        '</form>'
      ) +
      '<div style="height:24px"></div>' +
    '</div>';
}

/* ---------- notices ---------- */
function noticeCard(a){
  return '<article class="stream-card ' + (a.pinned ? 'stream-card--pinned' : '') + '">' +
    '<div class="stream-head">' +
      '<span class="avatar avatar--sm avatar--' + a.tone + '">' + esc(initials(a.author)) + '</span>' +
      '<div class="grow"><div class="stream-author">' + esc(a.author) + '</div><div class="stream-meta">' + esc(a.role) + ' · ' + timeAgo(a.at) + '</div></div>' +
      '<span class="subject-chip subject-chip--' + a.tone + '">' + esc(a.tag) + '</span>' +
    '</div>' +
    '<h3 class="title-sm" style="margin-top:11px">' + esc(a.title) + '</h3>' +
    '<p class="stream-body">' + esc(a.body) + '</p>' +
    (a.eventId ? '<button class="btn btn--ghost btn--sm" style="margin-top:10px" data-go="/event/' + encodeURIComponent(a.eventId) + '">' + ic('calendar',14,1.8) + ' View event &amp; register</button>' : a.attachment && /^https?:\/\//i.test(a.attachment) ? '<a class="stream-attach" href="' + esc(a.attachment) + '" target="_blank" rel="noopener noreferrer">' + ic('arrowUpRight',13,1.8) + ' Open registration link</a>' : a.attachment ? '<button class="stream-attach" data-act="download" data-val="' + esc(a.attachment) + '">' + ic('file', 13, 1.8) + esc(a.attachment) + '</button>' : '') +
  '</article>';
}
function noticesPage(){
  const pinned = db.announcements.filter(a => a.pinned);
  const rest = db.announcements.filter(a => !a.pinned);
  return pageHead('Noticeboard', db.announcements.length + ' notices from across campus') +
    '<div class="section section--tight" style="padding-top:4px">' +
      (pinned.length ? '<div class="label" style="margin:0 2px 8px">Pinned</div>' + pinned.map(noticeCard).join('') : '') +
      '<div class="label" style="margin:16px 2px 8px">All notices</div>' +
      (rest.length ? rest.map(noticeCard).join('') : (pinned.length ? '' : emptyState('No announcements yet', 'Campus, class and club updates will appear here.', 'megaphone'))) +
    '</div>';
}

/* ---------- notifications ---------- */
function notifIcon(type){
  const map = { result:'award', placement:'briefcase', event:'calendar', notice:'megaphone', attendance:'checkCircle' };
  return map[type] || 'bell';
}
function notifTone(type){
  const map = { result:'lilac', placement:'butter', event:'rose', notice:'rose', attendance:'mint' };
  return map[type] || 'lilac';
}
function notificationsPage(){
  const unread = db.notifications.filter(n => !n.read);
  const read = db.notifications.filter(n => n.read);
  return pageHead('Notifications', unread.length ? unread.length + ' unread updates' : 'You are all caught up', {
    right: unread.length ? '<button class="btn btn--text" data-act="markAllRead">Mark all read</button>' : ''
  }) +
    '<div class="section section--tight" style="padding-top:4px">' +
      (unread.length ? '<div class="label" style="margin:0 2px 8px">New</div><div class="card card--flat" style="padding:0;overflow:hidden">' +
        unread.map(n => '<button class="notif-row" data-act="openNotification" data-val="' + n.id + '">' +
          '<span class="sq sq--' + notifTone(n.type) + '">' + ic(notifIcon(n.type), 17, 1.8) + '</span>' +
          '<span class="notif-row__main"><span class="notif-row__title">' + esc(n.title) + ' <span class="unread-dot"></span></span>' +
          '<span class="notif-row__body">' + esc(n.body) + '</span></span>' +
          '<span class="notif-row__time">' + timeAgo(n.at) + '</span>' +
        '</button>').join('') + '</div>' : '') +
      (read.length ? '<div class="label" style="margin:' + (unread.length ? '20px' : '0') + ' 2px 8px">Earlier</div><div class="card card--flat" style="padding:0;overflow:hidden">' +
        read.map(n => '<button class="notif-row" data-act="openNotification" data-val="' + n.id + '">' +
          '<span class="sq sq--' + notifTone(n.type) + '" style="opacity:.7">' + ic(notifIcon(n.type), 17, 1.8) + '</span>' +
          '<span class="notif-row__main"><span class="notif-row__title">' + esc(n.title) + '</span>' +
          '<span class="notif-row__body">' + esc(n.body) + '</span></span>' +
          '<span class="notif-row__time">' + timeAgo(n.at) + '</span>' +
        '</button>').join('') + '</div>' : '') +
      (!unread.length && !read.length ? emptyState('No notifications yet', 'Updates about attendance, results and placements will show up here.', 'bell') : '') +
    '</div>';
}

/* ============================================================
   SHEETS
   ============================================================ */
function openSubject(id){
  const s = subj(id);
  if(!s) return;
  const p = subjectPct(s);
  const next = db.timetable && Object.keys(db.timetable).map(day => (db.timetable[day] || []).filter(sl => sl.subjectId === id).map(sl => ({ day:Number(day), slot:sl }))).flat()[0];
  const upcoming = assignmentsForSubject(id).filter(a => !a.submitted).slice(0,2);
  const noteCount = notesForSubject(id).length;
  openSheet(
    '<div class="row" style="gap:13px;margin-bottom:16px">' +
      '<span class="sq sq--' + s.tone + '" style="width:52px;height:52px;border-radius:16px;font-size:13px">' + esc(s.code) + '</span>' +
      '<div class="grow"><h2 class="sheet-title" style="font-size:22px;margin-bottom:3px">' + esc(s.name) + '</h2>' +
      '<p class="sheet-sub" style="margin:0">' + esc(s.faculty) + ' · Room ' + esc(s.room) + '</p></div>' +
    '</div>' +
    '<div class="card card--flat" style="display:flex;align-items:center;gap:16px;padding:15px">' +
      ring(p, 66, attColor(p), 'rgba(19,19,19,.08)') +
      '<div class="grow"><div class="row-between"><span class="label">Attendance</span><span class="badge ' + attBadgeClass(p) + '">' + (p == null ? 'Not recorded' : p >= 75 ? 'On track' : 'At risk') + '</span></div>' +
        '<div class="title-sm" style="margin-top:6px">' + (s.total ? s.attended + ' of ' + s.total + ' lectures' : 'No sessions recorded') + '</div>' +
        '<div class="li__sub">' + (p == null ? 'Verified attendance will appear after a register is entered.' : p >= 75 ? 'You can skip ' + safeToSkip(s) + ' more lecture' + (safeToSkip(s) === 1 ? '' : 's') + ' and stay above 75%.' : lecturesNeeded(s) + ' more lectures get you back to 75%.') + '</div>' +
        '<div class="bar ' + attBarClass(p) + '" style="margin-top:8px"><i style="width:' + (p == null ? 0 : p) + '%"></i></div>' +
      '</div>' +
    '</div>' +
    (next ? '<div class="sheet-section"><div class="sheet-section__title">Next on your timetable</div>' +
      '<div class="li" style="border:1px solid var(--line);border-radius:16px;background:#fff"><span class="sq sq--' + s.tone + '">' + esc(next.slot.start) + '</span>' +
      '<span class="li__main"><span class="li__title">' + DOW_LONG[next.day] + ' · ' + esc(next.slot.type) + '</span><span class="li__sub">Room ' + esc(next.slot.room || s.room) + ' · ' + esc(next.slot.start) + '–' + esc(next.slot.end) + '</span></span></div></div>' : '') +
    '<div class="sheet-section"><div class="sheet-section__title">Upcoming work</div>' +
      (upcoming.length ? upcoming.map(a => '<button class="li" style="border:1px solid var(--line);border-radius:16px;background:#fff;width:100%;text-align:left;margin-bottom:7px" data-act="goFromSheet" data-val="/assignment/' + a.id + '">' +
         '<span class="sq sq--butter">' + ic('file', 15, 1.8) + '</span><span class="li__main"><span class="li__title">' + esc(a.title) + '</span><span class="li__sub">' + dueMeta(a.due).label + ' · ' + (a.points == null ? 'Points not supplied' : a.points + ' points') + '</span></span>' + ic('chevronRight', 15, 2) + '</button>').join('') :
        '<div class="att-note" style="font-size:10.5px">Nothing pending in this subject. ' + noteCount + ' note' + (noteCount === 1 ? '' : 's') + ' available in Classroom.</div>') +
    '</div>' +
    '<div class="btn-row" style="margin-top:16px">' +
      '<button class="btn btn--ghost" data-act="goFromSheet" data-val="/notices">' + ic('megaphone',15,1.8) + ' Announcements</button>' +
      '<button class="btn" data-act="goFromSheet" data-val="/classroom">' + ic('bookOpen', 15, 1.8) + ' Open class</button>' +
    '</div>'
  );
}
function openSlotSheet(day, index){
  const slot = (db.timetable[day] || [])[index];
  if(!slot) return;
  const info = slotInfo(slot);
  const s = slot.subjectId ? subj(slot.subjectId) : null;
  openSheet(
    '<div class="row" style="gap:12px;margin-bottom:14px">' +
      '<span class="sq sq--' + info.tone + '" style="width:50px;height:50px;border-radius:15px">' + esc(info.code) + '</span>' +
      '<div><h2 class="sheet-title" style="font-size:22px;margin-bottom:2px">' + esc(info.name) + '</h2><p class="sheet-sub" style="margin:0">' + esc(slot.type) + ' · ' + DOW_LONG[day] + '</p></div>' +
    '</div>' +
    '<div class="card card--flat" style="padding:2px 14px">' +
      '<div class="sheet-kv"><span>Time</span><b>' + slot.start + ' – ' + slot.end + '</b></div>' +
      '<div class="sheet-kv"><span>Room</span><b>' + esc(info.room || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Faculty</span><b>' + esc(info.faculty || 'Not supplied') + '</b></div>' +
      (slot.batch ? '<div class="sheet-kv"><span>Batch</span><b>' + esc(timetableBatchLabel(slot.batch)) + '</b></div>' : '') +
      '<div class="sheet-kv"><span>Type</span><b>' + esc(slot.type) + '</b></div>' +
    '</div>' +
    (s ? '<div class="btn-row" style="margin-top:16px"><button class="btn btn--ghost" data-act="openSubjectFromSlot" data-val="' + s.id + '">Subject details</button>' +
      '<button class="btn" data-act="goFromSheet" data-val="/attendance">Attendance</button></div>' :
      '<div class="att-note" style="margin-top:16px">' + ic('info', 16, 1.8) + '<span>This timetable entry is not linked to an in-app subject or attendance register.</span></div>')
  );
}
function openNotice(id){
  const a = db.announcements.find(x => x.id === id);
  if(!a) return;
  openSheet(
    '<div class="row" style="gap:11px;margin-bottom:14px">' +
      '<span class="avatar avatar--' + a.tone + '">' + esc(initials(a.author)) + '</span>' +
      '<div><div class="title-sm">' + esc(a.author) + '</div><div class="label" style="margin-top:2px">' + esc(a.role) + ' · ' + timeAgo(a.at) + '</div></div>' +
      '<span class="subject-chip subject-chip--' + a.tone + '" style="margin-left:auto">' + esc(a.tag) + '</span>' +
    '</div>' +
    '<h2 class="sheet-title">' + esc(a.title) + '</h2>' +
    '<p class="body" style="margin-top:12px;font-size:12.5px;line-height:1.65">' + esc(a.body) + '</p>' +
    (a.eventId ? '<button class="btn btn--block" style="margin-top:14px" data-go="/event/' + encodeURIComponent(a.eventId) + '">' + ic('calendar',16,1.8) + ' View event &amp; register</button>' : a.attachment && /^https?:\/\//i.test(a.attachment) ? '<a class="attach-row" style="width:100%;margin-top:14px" href="' + esc(a.attachment) + '" target="_blank" rel="noopener noreferrer">' + ic('arrowUpRight',17,1.8) + '<span class="attach-row__name grow">Open registration form</span>' + ic('arrowUpRight',16,1.9) + '</a>' : a.attachment ? '<button class="attach-row" style="width:100%;margin-top:14px;text-align:left" data-act="download" data-val="' + esc(a.attachment) + '">' + ic('file', 17, 1.8) + '<span class="attach-row__name grow">' + esc(a.attachment) + '</span>' + ic('download', 16, 1.9) + '</button>' : '') +
    '<button class="btn btn--block" style="margin-top:16px" data-act="closeSheet">Done</button>'
  );
}
function openProfile(){
  const p = overallAttendance();
  openSheet(
    '<div style="text-align:center;padding:4px 0 8px">' +
      '<span class="avatar avatar--xl avatar--lilac" style="margin:0 auto">' + esc(initials(db.profile.name)) + '</span>' +
      '<h2 class="sheet-title" style="margin-top:12px">' + esc(db.profile.name) + '</h2>' +
      '<p class="sheet-sub" style="margin-bottom:0">' + esc(db.profile.class) + (db.profile.division ? ' · Division ' + esc(db.profile.division) : '') + '</p>' +
      '<span class="badge" style="margin-top:9px">Student · Semester ' + esc(db.profile.semester) + '</span>' +
    '</div>' +
    '<div class="card card--flat" style="padding:2px 14px;margin-top:8px">' +
      '<div class="sheet-kv"><span>PRN</span><b>' + esc(db.profile.prn || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Roll number</span><b>' + esc(db.profile.roll || 'Not supplied') + '</b></div>' +
      '<div class="sheet-kv"><span>Email</span><b style="font-weight:500">' + esc(db.profile.email) + '</b></div>' +
      '<div class="sheet-kv"><span>Phone</span><b style="font-weight:500">' + esc(db.profile.phone) + '</b></div>' +
      '<div class="sheet-kv"><span>CGPA</span><b>' + (db.profile.cgpa == null ? 'Not supplied' : Number(db.profile.cgpa).toFixed(2)) + '</b></div>' +
      '<div class="sheet-kv"><span>Attendance</span><b>' + (p == null ? 'Not recorded' : p + '%') + '</b></div>' +
      '<div class="sheet-kv"><span>Backlogs</span><b>' + (db.profile.backlogs ? db.profile.backlogs : 'None') + '</b></div>' +
    '</div>' +
    '<div class="btn-row" style="margin-top:16px"><button class="btn btn--ghost" data-act="toastProfileEdit">Edit profile</button><button class="btn" data-act="closeSheet">Done</button></div>' +
    '<p style="font-size:9px;text-align:center;color:var(--muted-2);margin-top:12px">Details are managed by the academic office. Raise a ticket to correct them.</p>'
  );
}
function openPreferences(){
  const items = [
    ['attendance','Attendance alerts','When a lecture is marked or your percentage drops'],
    ['placements','Placement drives','New drives that match your profile'],
    ['notices','Announcements','Exam, library and administrative updates'],
    ['events','Campus events','Club and cell event promotions']
  ];
  openSheet(
    '<h2 class="sheet-title">Notifications</h2>' +
    '<p class="sheet-sub">Choose what MET Campus can nudge you about.</p>' +
    '<div class="card card--flat" style="padding:2px 14px">' +
      items.map(([k,t,s]) => '<div class="sheet-kv" style="align-items:center;padding:13px 0">' +
        '<div style="padding-right:10px"><b style="display:block;font-size:12px">' + t + '</b><span style="font-size:9.5px;line-height:1.35;display:block;margin-top:2px">' + s + '</span></div>' +
        '<button class="switch ' + (db.prefs[k] ? 'on' : '') + '" data-act="togglePref" data-val="' + k + '" aria-label="' + t + '" aria-pressed="' + !!db.prefs[k] + '"></button>' +
      '</div>').join('') +
    '</div>' +
    '<button class="btn btn--block" data-act="closeSheet">Done</button>'
  );
}
function openHelp(){
  openSheet(
    '<h2 class="sheet-title">Help &amp; support</h2>' +
    '<p class="sheet-sub">The campus helpdesk can help with logins, attendance corrections and documents.</p>' +
    '<div class="card card--flat" style="padding:2px 14px">' +
      '<div class="sheet-kv"><span>Campus helpdesk</span><b>+91 22 2644 0091</b></div>' +
      '<div class="sheet-kv"><span>Email</span><b style="font-weight:500">helpdesk@met.edu</b></div>' +
      '<div class="sheet-kv"><span>Office</span><b>Admin block · 2nd floor</b></div>' +
      '<div class="sheet-kv"><span>Hours</span><b>9 AM – 5 PM, Mon–Sat</b></div>' +
    '</div>' +
    '<div class="sheet-section"><div class="sheet-section__title">Common questions</div>' +
      '<div class="stream-card" style="margin-bottom:7px"><div class="title-sm">My attendance is wrong</div><p class="stream-body">Speak to your class coordinator or subject faculty. Corrections are made at the department office.</p></div>' +
      '<div class="stream-card" style="margin-bottom:7px"><div class="title-sm">I cannot see a result</div><p class="stream-body">Results appear after the examination section publishes them. Unpublished internal marks stay with the department.</p></div>' +
    '</div>' +
    '<button class="btn btn--block" data-act="closeSheet">Done</button>'
  );
}
function openApply(id){
  const d = db.drives.find(x => x.id === id);
  if(!d) return;
  const el = eligibilityFor(d);
  const dm = deadlineMeta(d.deadline);
  openSheet(
    '<div class="row" style="gap:11px;margin-bottom:14px">' +
      '<span class="logo-tile logo-tile--' + d.tone + '">' + esc(initials(d.company)) + '</span>' +
      '<div><h2 class="sheet-title" style="font-size:22px;margin-bottom:2px">Apply to ' + esc(d.company) + '</h2>' +
      '<p class="sheet-sub" style="margin:0">' + esc(d.role) + ' · ₹' + Number(d.ctc).toFixed(1) + ' LPA</p></div>' +
    '</div>' +
    (!el.open ? '<div class="gate-result gate-result--no"><h3>' + ic('alert', 15, 2) + ' Applications are closed</h3><p>' + dm.label + '</p></div>' : !el.eligible ? '<div class="gate-result gate-result--no"><h3>' + ic('alert', 15, 2) + ' Requirements not met</h3><p>Based on the academic details currently on file. Contact the TPO for eligibility questions.</p></div>' :
      '<form data-form="driveApply" data-id="' + esc(d.id) + '">' +
        '<div class="card card--flat" style="padding:2px 14px">' +
          '<div class="sheet-kv"><span>Candidate</span><b>' + esc(db.profile.name) + '</b></div>' +
          '<div class="sheet-kv"><span>PRN</span><b>' + esc(db.profile.prn || 'Not supplied') + '</b></div>' +
          '<div class="sheet-kv"><span>CGPA</span><b>' + (db.profile.cgpa == null ? 'Verify with TPO' : Number(db.profile.cgpa).toFixed(2)) + '</b></div>' +
          '<div class="sheet-kv"><span>Deadline</span><b>' + esc(dm.label) + '</b></div>' +
        '</div>' +
        (el.pending ? '<div class="att-note" style="margin-top:10px">' + ic('info',15,1.8) + '<span>Your CGPA or backlog details were not supplied. The TPO must verify eligibility; your application will be marked pending review.</span></div>' : '') +
        '<div class="sheet-section"><div class="sheet-section__title">Application form</div>' + questionFieldsHTML(d.formQuestions || [], 'answer_') + '</div>' +
        '<button class="btn btn--block" style="margin-top:14px" type="submit">' + ic('send', 16, 1.9) + ' Submit application</button>' +
      '</form>') +
    '<button class="btn btn--ghost btn--block" style="margin-top:8px" data-act="closeSheet">Cancel</button>'
  );
}
function openDay(dateStr){
  const date = new Date(dateStr + 'T12:00:00');
  const day = ymd(date);
  const records = (db.sessions || []).filter(session => session.date === day && Object.prototype.hasOwnProperty.call(session.records || {}, db.profile.id));
  openSheet(
    '<h2 class="sheet-title">' + fmtLongDate(date) + '</h2>' +
    '<p class="sheet-sub">' + (dayAttendanceStatus(date) === 'holiday' ? 'No lectures scheduled.' : records.length ? records.length + ' recorded session' + (records.length === 1 ? '' : 's') : 'No attendance records for this day.') + '</p>' +
    '<div class="card card--flat" style="padding:2px 14px">' +
      records.map(session => {
        const s = subj(session.subjectId);
        const state = session.records[db.profile.id];
        return '<div class="sheet-kv"><span>' + esc(s ? s.code + ' · ' + s.name : session.subjectId) + '</span><b style="color:' + (state === 'P' ? 'var(--green)' : 'var(--red)') + '">' + (state === 'P' ? 'Present' : 'Absent') + '</b></div>';
      }).join('') +
    '</div>' +
    '<button class="btn btn--block" data-act="closeSheet">Done</button>'
  );
}

/* compatibility aliases used by inline markup/actions */
function openSubjectFromSlot(id){ openSubject(id); }
