/* ============================================================
   MET Campus — student screens (part 1)
   ============================================================ */

function page(html, opts){
  opts = opts || {};
  const dock = opts.dock !== false;
  return { html: '<div class="page ' + (dock ? '' : 'page--no-dock') + '">' + html + '</div>', dock: dock, title: opts.title || '' };
}
function notFound(path){
  return page('<div class="wrap" style="padding-top:56px">' +
    emptyState('This screen took a wrong turn', 'The page you were looking for is not part of the demo. Head back to your campus home.', 'alert') +
    '<div class="btn-row" style="margin-top:14px"><button class="btn btn--block" data-go="' + defaultHome() + '">Back to home</button></div>' +
  '</div>', { dock:false, title:'Not found' });
}
function pageFor(path){
  if(path === '/login') return { html: authPage(), dock:false, title:'Sign in' };
  if(path === '/password-setup') return { html: passwordSetupPage(), dock:false, title:'Set your password' };
  if(path === '/home') return page(homePage(), { title:'Home' });
  if(path === '/timetable') return page(timetablePage(), { title:'Timetable' });
  if(path === '/attendance') return page(attendancePage(), { title:'Attendance' });
  if(path === '/classroom') return page(classroomPage(), { title:'Classroom' });
  if(path === '/more') return page(morePage(), { title:'More' });
  if(path === '/results') return page(resultsPage(), { dock:false, title:'Results' });
  if(path === '/entry') return page(entryPage(), { dock:false, title:'Campus pass' });
  if(path === '/placements') return page(placementsPage(), { dock:false, title:'Placements' });
  if(path === '/events') return page(eventsPage(), { title:'Campus events' });
  if(path.indexOf('/event/') === 0) return page(eventDetailPage(path.slice('/event/'.length)), { title:'Event registration' });
  if(path === '/curriculum') return page(curriculumPage(false), { title:'Curriculum' });
  if(path.indexOf('/drive/') === 0) return page(drivePage(path.split('/')[2]), { dock:false, title:'Placement drive' });
  if(path === '/assignments') return page(assignmentsPage(), { dock:false, title:'All work' });
  if(path.indexOf('/assignment/') === 0) return page(assignmentPage(path.split('/')[2]), { dock:false, title:'Assignment' });
  if(path === '/notices') return page(noticesPage(), { dock:false, title:'Noticeboard' });
  if(path === '/notifications') return page(notificationsPage(), { dock:false, title:'Notifications' });
  if(isAdminPath(path)) return adminPageFor(path);
  return notFound(path);
}

/* ============================================================
   AUTH
   ============================================================ */
function authPage(){
  const staff = S.authRole === 'staff';
  const demoMode = MET_BACKEND.demoMode() && !MET_BACKEND.configured();
  const username = demoMode && staff ? 'tpo_iot' : '';
  const prn = demoMode && !staff ? 'demo-student' : '';
  const pass = demoMode ? 'metcampus' : '';
  const identityField = staff
    ? '<div>' +
        '<label class="field-label" for="auth-username">Staff or club username</label>' +
        '<div class="field"><span class="field__icon">' + ic('user', 18, 1.7) + '</span>' +
          '<input id="auth-username" name="username" type="text" value="' + esc(username) + '" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="64" placeholder="e.g. hodcsd_iot" required aria-label="Staff or club username">' +
        '</div>' +
      '</div>'
    : '<div>' +
        '<label class="field-label" for="auth-prn">Student PRN</label>' +
        '<div class="field"><span class="field__icon">' + ic('user', 18, 1.7) + '</span>' +
          '<input id="auth-prn" name="prn" type="text" value="' + esc(prn) + '" autocomplete="username" inputmode="' + (demoMode ? 'text' : 'numeric') + '" autocapitalize="off" spellcheck="false" minlength="8" maxlength="20"' + (demoMode ? '' : ' pattern="[0-9]{8,20}"') + ' placeholder="Enter your PRN" aria-describedby="auth-prn-hint" required aria-label="Student PRN">' +
        '</div>' +
        '<p class="field-hint" id="auth-prn-hint">Enter the PRN issued by MET.</p>' +
      '</div>';
  return '<div class="page page--no-dock auth" style="padding-bottom:0">' +
    '<div class="auth-head">' +
      '<div class="brand">' +
        '<div class="brand-mark">' + logoMark(27) + '</div>' +
        '<div class="brand-name"><span>MET</span><span>Campus</span><small>ADGAON, NASHIK</small></div>' +
      '</div>' +
      '<button class="icon-btn auth-help" data-act="openHelp" aria-label="Help">' + ic('help', 19, 1.8) + '</button>' +
    '</div>' +
    '<div class="auth-art">' + campusArt() + '</div>' +
    '<div class="auth-sheet">' +
      '<div class="sheet-grab"></div>' +
      '<h1 class="auth-title">Sign in</h1>' +
      '<p class="auth-sub">Use your MET account to open your campus.</p>' +
      '<div class="role-toggle" role="group" aria-label="Sign in as">' +
        '<button class="' + (!staff ? 'on' : '') + '" data-act="authRole" data-val="student" aria-pressed="' + (!staff) + '">Student</button>' +
        '<button class="' + (staff ? 'on' : '') + '" data-act="authRole" data-val="staff" aria-pressed="' + staff + '">Staff / Club</button>' +
      '</div>' +
      '<form data-form="signin">' +
        '<div class="field-stack">' +
          identityField +
          '<div>' +
            '<label class="field-label" for="auth-pass">Password</label>' +
            '<div class="field"><span class="field__icon">' + ic('lock', 18, 1.7) + '</span>' +
               '<input id="auth-pass" name="password" type="password" value="' + pass + '" autocomplete="current-password" required aria-label="Password">' +
              '<button type="button" class="field__action" data-act="togglePw" data-val="auth-pass" aria-label="Show password">' + ic('eye', 18, 1.7) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
           '<p class="auth-error ' + (globalThis.__MET_AUTH_ERROR__ ? 'on' : '') + '" id="auth-error" role="alert" aria-live="polite">' + esc(globalThis.__MET_AUTH_ERROR__ || (staff ? 'Enter your assigned username and password.' : 'Enter your PRN and password to continue.')) + '</p>' +
         '<div class="auth-meta">' +
           '<span class="checkline"><span class="checkbox on">' + ic('check', 11, 3) + '</span> Keep me signed in</span>' +
           '<button type="button" class="btn btn--text" data-act="forgot">Forgot password?</button>' +
         '</div>' +
         (MET_BACKEND.configured() ? '<label class="checkline" style="margin:8px 0 12px;align-items:flex-start"><input type="checkbox" name="dataConsent" required style="width:16px;height:16px;accent-color:#131313;margin-top:2px"> I understand my account profile, preferences and app records/submissions are synced to the campus backend for campus services.</label>' : '') +
         '<button class="btn btn--block btn--lg" type="submit">Sign in</button>' +
       '</form>' +
        '<div class="auth-note"><b>' + (MET_BACKEND.configured() ? 'Campus account required' : demoMode ? 'Development demo' : 'Backend setup required') + '</b> · ' +
            (MET_BACKEND.configured() ? (staff ? 'Use the username assigned to your staff or club account. Your access comes from the verified campus account.' : 'Sign in with your PRN and password. Student registration requests require email confirmation and MET approval.') : demoMode ? 'This local demo is for development only. Production access uses individually provisioned campus accounts.' : 'This release will not accept demo credentials. Configure the Supabase project before distributing the APK.') + '</div>' +
      '<p class="auth-foot">MET Institute of Technology<br>Bhujbal Knowledge City, Adgaon, Nashik, Maharashtra</p>' +
    '</div>' +
  '</div>';
}

function passwordSetupPage(){
  return '<div class="page page--no-dock auth" style="padding-bottom:0">' +
    '<div class="auth-head"><div class="brand"><div class="brand-mark">' + logoMark(27) + '</div>' +
      '<div class="brand-name"><span>MET</span><span>Campus</span><small>ACCOUNT SECURITY</small></div></div></div>' +
    '<div class="auth-sheet">' +
      '<div class="sheet-grab"></div>' +
      '<h1 class="auth-title">Choose a personal password</h1>' +
      '<p class="auth-sub">Your first password is temporary. Set a private password of at least 12 characters to continue.</p>' +
      '<form data-form="passwordSetup">' +
        '<div class="field-stack">' +
          '<div><label class="field-label" for="new-password">New password</label>' +
            '<div class="field"><span class="field__icon">' + ic('lock', 18, 1.7) + '</span>' +
              '<input id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required aria-label="New password">' +
            '</div></div>' +
          '<div><label class="field-label" for="confirm-password">Confirm new password</label>' +
            '<div class="field"><span class="field__icon">' + ic('lock', 18, 1.7) + '</span>' +
              '<input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required aria-label="Confirm new password">' +
            '</div></div>' +
        '</div>' +
        '<p class="auth-error" id="password-setup-error" role="alert" aria-live="polite"></p>' +
        '<button class="btn btn--block btn--lg" type="submit">Save personal password</button>' +
      '</form>' +
      '<button type="button" class="btn btn--text" style="margin-top:10px" data-act="signOut">Use a different account</button>' +
      '<div class="auth-note"><b>Campus data is locked</b> · You must set a personal password before accessing the app.</div>' +
    '</div>' +
  '</div>';
}

/* ============================================================
   HOME
   ============================================================ */
function homePage(){
  const p = overallAttendance();
  const all = pendingAssignments();
  const nx = nextClass();
  const nxi = nx ? slotInfo(nx) : null;
  const unread = unreadNotifs();
  const today = todaySlots();
  const todayDay = new Date().getDay();
  const todayHasBatchRotation = (db.timetable[todayDay] || []).some(slot => !!slot.batch);
  const low = db.subjects.filter(s => s.total > 0 && subjectPct(s) < 75).sort((a,b) => subjectPct(a) - subjectPct(b))[0];
  const drive = db.drives.find(d => !d.applied && !deadlineMeta(d.deadline).closed) || db.drives.find(d => !deadlineMeta(d.deadline).closed) || db.drives[0];

  return '<header class="home-hero">' +
      '<div class="home-hero__blob"></div>' +
      '<div class="home-hero__ring"></div>' +
      '<div class="home-hero__sun"></div>' +
      '<div class="home-top">' +
        '<div class="hello">' +
          '<span class="avatar avatar--lilac">' + esc(initials(db.profile.name)) + '<span class="presence"></span></span>' +
          '<div><div class="hello__name">Hey, ' + esc(db.profile.firstName) + '</div><div class="hello__date">' + fmtLongDate(new Date()) + '</div></div>' +
        '</div>' +
        '<button class="icon-btn icon-btn--frost" data-go="/notifications" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' +
          ic('bell', 20, 1.8) + (unread ? '<span class="dot"></span>' : '') +
        '</button>' +
      '</div>' +
      '<h1 class="home-title"><span class="hl">MET</span><span class="line2">Campus</span></h1>' +
      '<p class="home-tagline">' + greeting() + '. Here is your day, ' + esc(db.profile.firstName) + '.</p>' +
    '</header>' +
    '<div class="home-body">' +
      '<button class="class-card" data-go="/classroom" style="width:calc(100% - 32px);margin:0 16px">' +
        '<div class="class-card__head">' +
          '<div><span class="label">T.E. Computer Science and Design · AY 2026–27</span>' +
          '<div class="class-card__title">' + db.subjects.length + ' subjects, one semester</div></div>' +
          '<span class="class-card__add">' + ic('plus', 16, 2.4) + '</span>' +
        '</div>' +
        '<div class="class-card__foot"><span>Semester ' + esc(db.profile.semester) + ' · ' + esc(db.profile.batch) + '</span><b>Open classroom</b></div>' +
      '</button>' +

      (nx && nxi ? '<article class="next-card">' +
        '<div class="next-copy">' +
          '<span class="next-time"><i></i> Next class · ' + esc(nextClassLabel() || '') + '</span>' +
          '<h2>' + esc(nxi.name.replace('Database Management Systems','Database Management')) + '</h2>' +
          '<p class="next-meta">' + esc(nx.start) + '–' + esc(nx.end) + ' · Room ' + esc(nxi.room) + '<br>' + esc(nxi.faculty) + '</p>' +
          '<div class="next-footer"><span class="tag tag--white">' + esc(nx.type) + '</span>' +
            '<button class="icon-btn icon-btn--ink icon-btn--sm" data-go="/timetable" aria-label="Open timetable">' + ic('arrowUpRight', 16, 2) + '</button></div>' +
        '</div>' +
        '<div class="next-art">' + deskArt() + '</div>' +
      '</article>' : '') +

      '<div class="quick-grid">' +
        '<button class="quick tint-peri" data-go="/timetable">' +
          '<span class="quick__icon">' + ic('calendar', 18, 1.9) + '</span>' +
           '<span class="quick__text"><span class="quick__label">Timetable</span><span class="quick__meta">' + (today.length ? today.length + (todayHasBatchRotation && !db.profile.labGroup ? ' shared periods · select batch' : ' periods today') : 'No periods listed today') + '</span></span>' +
          '<span class="quick__arrow">' + ic('arrowUpRight', 14, 2) + '</span>' +
        '</button>' +
        '<button class="quick tint-lilac" data-go="/attendance">' +
          '<span class="quick__icon">' + ic('checkCircle', 18, 1.9) + '</span>' +
           '<span class="quick__text"><span class="quick__label">Attendance</span><span class="quick__meta">' + (p == null ? 'No records yet' : p + '% overall') + '</span></span>' +
          '<span class="quick__arrow">' + ic('arrowUpRight', 14, 2) + '</span>' +
        '</button>' +
        '<button class="quick tint-butter" data-go="/classroom">' +
          '<span class="quick__icon">' + ic('bookOpen', 18, 1.9) + '</span>' +
          '<span class="quick__text"><span class="quick__label">Classroom</span><span class="quick__meta">' + all.length + ' things to submit</span></span>' +
          '<span class="quick__arrow">' + ic('arrowUpRight', 14, 2) + '</span>' +
        '</button>' +
        '<button class="quick tint-mint" data-go="/entry">' +
          '<span class="quick__icon">' + ic('qr', 18, 1.9) + '</span>' +
          '<span class="quick__text"><span class="quick__label">Campus pass</span><span class="quick__meta">Valid today</span></span>' +
          '<span class="quick__arrow">' + ic('arrowUpRight', 14, 2) + '</span>' +
        '</button>' +
      '</div>' +

      '<section class="section">' +
        '<div class="section-head"><h2>Attendance</h2><button class="section-link" data-go="/attendance">See subjects</button></div>' +
        '<div class="glance">' +
          '<div>' +
             '<div class="glance__num num">' + (p == null ? '—' : p + '<span>%</span>') + '</div>' +
             '<div class="glance__meta">' + (p == null ? 'No attendance sessions have been entered yet.' : totalAttended() + ' of ' + totalLectures() + ' lectures<br>Minimum required is 75%') + '</div>' +
          '</div>' +
          '<div class="glance__right">' + ring(p, 66, attColor(p), 'rgba(19,19,19,.08)') + '</div>' +
        '</div>' +
         (p == null ? '<div class="glance-warn" style="background:var(--butter-soft);color:#6f5720">' + ic('info', 15, 1.8) + '<span><b>Attendance not recorded yet.</b> Verified class registers will appear here when entered.</span></div>' : low ? '<div class="glance-warn">' + ic('alert', 15, 2) + '<span><b>' + esc(low.code) + ' needs attention.</b> ' + lecturesNeeded(low) + ' more lectures to reach 75%.</span></div>' :
          '<div class="glance-warn" style="background:var(--mint-soft);color:#3f6449">' + ic('checkCircle', 15, 2) + '<span><b>You are above 75% everywhere.</b> Keep the streak going.</span></div>') +
      '</section>' +

      '<section class="section">' +
           '<div class="section-head"><h2>Today</h2><button class="section-link" data-go="/timetable">Full timetable</button></div>' +
        (today.length ? '<div class="tl-card">' +
          today.slice(0,3).map(slot => {
            const info = slotInfo(slot);
            return '<button class="li" data-act="openSlot" data-val="' + todayDay + ':' + db.timetable[todayDay].indexOf(slot) + '">' +
              '<span class="sq sq--' + info.tone + '">' + esc(info.code || info.name.slice(0,2)) + '</span>' +
              '<span class="li__main"><span class="li__title">' + esc(info.name) + '</span><span class="li__sub">' + esc(slot.start) + (info.room ? ' · Room ' + esc(info.room) : '') + (slot.batch ? ' · ' + esc(timetableBatchLabel(slot.batch)) : '') + '</span></span>' +
              '<span class="li__right"><span class="li__time">' + (slot.type === 'Lab' ? 'Lab' : slot.type === 'Activity' ? 'Activity' : 'Class') + '</span></span>' +
              '<span class="li__chev">' + ic('chevronRight', 16, 2) + '</span>' +
            '</button>';
          }).join('') +
          '</div>'
        : '<div class="li" style="background:var(--paper);border:1px solid var(--line);border-radius:20px">' +
            '<span class="sq sq--butter">' + ic('info', 18, 1.8) + '</span><span class="li__main"><span class="li__title">No periods listed today</span><span class="li__sub">The supplied teaching load covers Monday through Friday.</span></span></div>') +
        (todayHasBatchRotation && !db.profile.labGroup ? '<div class="att-note" style="margin-top:10px">' + ic('info',16,1.8) + '<span><b>Your 12:30 rotation depends on your batch.</b> Choose T1–T4 on the timetable to see your assigned lab or seminar.</span></div>' : '') +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><h2>Noticeboard</h2><button class="section-link" data-go="/notices">All notices</button></div>' +
        '<div class="card card--flat" style="padding:15px">' +
          db.announcements.slice(0,2).map(a =>
            '<button class="notice-mini" data-act="openNotice" data-val="' + a.id + '">' +
              '<span class="sq sq--' + a.tone + '">' + (a.pinned ? ic('pin', 16, 1.9) : ic('megaphone', 16, 1.9)) + '</span>' +
              '<span class="notice-mini__body"><span class="notice-mini__title">' + esc(a.title) + '</span>' +
              '<span class="notice-mini__meta">' + esc(a.author) + ' · ' + esc(a.tag) + '</span></span>' +
              '<span class="notice-mini__time">' + timeAgo(a.at) + '</span>' +
            '</button>'
          ).join('') +
        '</div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><h2>Campus life</h2><button class="section-link" data-go="/events">All events</button></div>' +
        '<div class="home-campus-links"><button class="quick tint-rose" data-go="/events"><span class="quick__icon">' + ic('calendar',18,1.9) + '</span><span class="quick__text"><span class="quick__label">Club events</span><span class="quick__meta">Promotions &amp; registration</span></span><span class="quick__arrow">' + ic('arrowUpRight',14,2) + '</span></button>' +
        '<button class="quick tint-lilac" data-go="/curriculum"><span class="quick__icon">' + ic('book',18,1.9) + '</span><span class="quick__text"><span class="quick__label">Curriculum</span><span class="quick__meta">Browse all 8 semesters</span></span><span class="quick__arrow">' + ic('arrowUpRight',14,2) + '</span></button></div>' +
      '</section>' +

      (drive ? '<section class="section">' +
        '<div class="section-head"><h2>Placements</h2><button class="section-link" data-go="/placements">All drives</button></div>' +
        '<div class="placement-banner">' +
          '<div class="placement-banner__top">' +
            '<span class="logo-tile logo-tile--' + drive.tone + '">' + esc(initials(drive.company)) + '</span>' +
            '<div><div style="font-size:11.5px;font-weight:600">' + esc(drive.company) + '</div><div style="font-size:9.5px;color:rgba(255,255,255,.5);margin-top:2px">' + esc(drive.type) + ' · ' + esc(drive.location) + '</div></div>' +
            '<span class="badge" style="margin-left:auto">' + esc(deadlineMeta(drive.deadline).short) + '</span>' +
          '</div>' +
          '<h3>' + esc(drive.role) + '</h3>' +
          '<p class="placement-banner__role">' + esc(drive.about.split('.')[0]) + '.</p>' +
          '<div class="placement-banner__foot">' +
            '<div class="placement-banner__ctc">₹' + Number(drive.ctc).toFixed(1) + '<small> LPA</small></div>' +
            '<button class="icon-btn icon-btn--sm" data-go="/drive/' + drive.id + '" aria-label="View drive">' + ic('arrowUpRight', 17, 2) + '</button>' +
          '</div>' +
        '</div>' +
      '</section>' : '') +
    '</div>' + dockSpace();
}

/* ============================================================
   TIMETABLE
   ============================================================ */
function weekDates(){
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  return [1,2,3,4,5,6].map((d,i) => addDays(monday, i));
}
function toMinutes(hhmm){ const p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function formatRange(start, end){
  const a = start.split(':'), b = end.split(':');
  return a[0] + ':' + a[1] + ' – ' + b[0] + ':' + b[1];
}
function timetablePage(){
  const dates = weekDates();
  const selected = timetableSlotsForStudent(S.day);
  const allSlots = [1,2,3,4,5,6].flatMap(day => timetableSlotsForStudent(day));
  const labs = allSlots.filter(s => s.type === 'Lab').length;
  const lectures = allSlots.filter(s => s.type === 'Lecture').length;
  const info = db.timetableInfo || TE_CSD_SEM_V_TIMETABLE_META;
  const labGroup = db.profile.labGroup || '';
  const batchSelector = timetableHasBatchSlots() ?
    '<section class="batch-picker" aria-labelledby="batch-picker-title">' +
      '<div><span class="kicker">T.E. CSD · Sem V</span><h2 id="batch-picker-title">Lab &amp; seminar rotation</h2>' +
        '<p>' + (labGroup ? 'Selected ' + esc(timetableBatchLabel(labGroup)) + '. Change it if your coordinator assigned a different batch.' : 'Choose the batch assigned by your coordinator. Your demo profile has no batch recorded.') + '</p></div>' +
      '<div class="batch-picker__options" role="group" aria-label="Choose your timetable batch">' +
        TE_CSD_SEM_V_BATCHES.map(batch => '<button type="button" class="batch-choice ' + (labGroup === batch.id ? 'on' : '') + '" data-act="setLabGroup" data-val="' + batch.id + '" aria-pressed="' + (labGroup === batch.id ? 'true' : 'false') + '"><b>' + batch.id + '</b><span>Rolls ' + batch.start + '–' + batch.end + '</span></button>').join('') +
      '</div>' +
      (labGroup ? '<button type="button" class="batch-clear" data-act="setLabGroup" data-val="" aria-pressed="false">Show shared periods only</button>' : '<p class="batch-picker__hint">Shared classes are shown below until you select a rotation.</p>') +
    '</section>' : '';
  const todayNum = new Date().getDay();
  const totalMinutes = selected.reduce((n,s) => n + (toMinutes(s.end) - toMinutes(s.start)), 0);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isToday = todayNum === S.day;
  const nextIdx = isToday ? selected.findIndex(o => toMinutes(o.start) > nowMins) : -1;

  let blocks = '';
  let prevEnd = null;
  selected.forEach((slot, idx) => {
    if(prevEnd && toMinutes(slot.start) - toMinutes(prevEnd) >= 30){
      blocks += '<div class="tl-break"><span>Break · ' + formatRange(prevEnd, slot.start).replace(' – ', '–') + '</span></div>';
    }
    const info = slotInfo(slot);
    const details = [slot.batch ? timetableBatchLabel(slot.batch) : '', info.room ? 'Room ' + info.room : '', info.faculty || ''].filter(Boolean).join(' · ');
    const isNow = isToday && nowMins >= toMinutes(slot.start) && nowMins <= toMinutes(slot.end);
    const nextUp = isToday && idx === nextIdx;
    blocks += '<div class="tl-row">' +
      '<div class="tl-time"><b>' + slot.start + '</b>' + slot.end + '</div>' +
      '<div class="tl-rail"><i style="background:' + (isNow ? '#131313' : 'var(--peri-deep)') + '"></i><span class="line"></span></div>' +
      '<button class="tl-item ' + (isNow ? 'is-now' : (nextUp ? 'is-next' : '')) + '" data-act="openSlot" data-val="' + S.day + ':' + (db.timetable[S.day] || []).indexOf(slot) + '">' +
        '<div class="tl-top"><span class="tl-type">' + esc(slot.type) + '</span>' +
          (isNow ? '<span class="badge" style="height:20px;font-size:9px">Now</span>' : nextUp ? '<span class="badge" style="height:20px;font-size:9px;background:var(--ink);color:#fff">Up next</span>' : '') +
        '</div>' +
        '<div class="tl-title">' + esc(info.name) + '</div>' +
        (details ? '<div class="tl-meta">' + esc(details) + '</div>' : '') +
      '</button>' +
    '</div>';
    prevEnd = slot.end;
  });

  return '<header class="topbar">' +
      '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Timetable</div><div class="topbar__sub">' + esc(db.profile.class) + (db.profile.division ? ' · Division ' + esc(db.profile.division) : '') + '</div></div>' +
      '<button class="icon-btn" data-act="jumpToday" aria-label="Jump to today">' + ic('calendar', 19, 1.8) + '</button>' +
    '</header>' +
    '<div class="week-days">' +
      dates.map((date, i) => {
        const d = i + 1;
        const isToday = new Date().toDateString() === date.toDateString();
         return '<button class="day-btn ' + (S.day === d ? 'on' : '') + (isToday ? ' today' : '') + '" data-act="setDay" data-val="' + d + '" aria-label="' + DOW_LONG[d] + ', ' + date.getDate() + '" aria-pressed="' + (S.day === d) + '">' +
          '<span>' + DOW_SHORT[d] + '</span><b>' + date.getDate() + '</b>' +
        '</button>';
      }).join('') +
    '</div>' +
    batchSelector +
    '<div class="att-note timetable-source" style="margin-top:10px">' + ic(info.verified === false ? 'alert' : 'info',16,1.8) + '<span>' +
      (info.verified === false ? '<b>Previously saved local timetable.</b> Compare it with the current T.E. CSD teaching load before relying on it.' :
        '<b>' + esc(info.sourceTitle || 'Verified T.E. CSD Semester V timetable') + '.</b> Effective ' + esc(info.effectiveFrom === '2026-08-01' ? '1 Aug 2026' : info.effectiveFrom || 'date not supplied') + ' · ' + esc(info.coverage || 'weekdays') + '.') +
      '</span></div>' +
    '<div class="section section--tight" style="padding-top:18px">' +
      '<div class="section-head" style="margin-bottom:8px">' +
        '<h2 style="font-size:18px">' + DOW_LONG[S.day] + ', ' + dates[S.day - 1].getDate() + ' ' + MONTHS_SHORT[dates[S.day - 1].getMonth()] + '</h2>' +
        '<span class="section-head__sub">' + selected.length + ' sessions · ' + Math.round(totalMinutes / 60) + ' hrs</span>' +
      '</div>' +
        (selected.length ? '<div class="timeline">' + blocks + '</div>' : emptyState('No sessions listed for ' + DOW_LONG[S.day], info.verified === false ? 'No locally saved periods were found for this day.' : 'The supplied teaching load lists Monday through Friday only.', 'calendar')) +
    '</div>' +
    '<div class="section">' +
      '<div class="section-head"><h2>Your week</h2><span class="section-head__sub">Semester ' + esc(db.profile.semester) + '</span></div>' +
      '<div class="week-summary">' +
        '<div><b>' + lectures + '</b><span>lectures</span></div>' +
        '<div><b>' + labs + '</b><span>labs</span></div>' +
        '<div><b>' + (db.subjects.reduce((n,s) => n + (Number(s.credits) || 0), 0) || '—') + '</b><span>listed credits</span></div>' +
      '</div>' +
       '<p style="font-size:10.5px;color:var(--muted);line-height:1.5;margin-top:10px;padding:0 2px">The source schedule includes a 30-minute recess and T1–T4 rotations for the 12:30–14:30 lab/seminar block. Select your assigned batch above to see only your rotation.</p>' +
    '</div>' + dockSpace();
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function attendanceDaysInMonth(base){
  const y = base.getFullYear(), m = base.getMonth();
  const total = new Date(y, m + 1, 0).getDate();
  let present = 0, absent = 0;
  for(let d = 1; d <= total; d++){
    const date = new Date(y, m, d);
    const status = dayAttendanceStatus(date);
    if(status === 'absent') absent++;
    else if(status === 'present') present++;
  }
  return { present, absent, total: present + absent };
}
function dayAttendanceStatus(date){
  if(startOfDay(date) > startOfDay(new Date())) return 'future';
  const day = ymd(date);
  const sessions = (db.sessions || []).filter(s => s.date === day && Object.prototype.hasOwnProperty.call(s.records || {}, db.profile.id));
  if(!sessions.length) return 'unrecorded';
  return sessions.some(s => s.records[db.profile.id] === 'A') ? 'absent' : 'present';
}
function calendarHTML(){
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + S.calOffset);
  const y = base.getFullYear(), m = base.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const summary = attendanceDaysInMonth(base);
  let cells = '';
  for(let i = 0; i < firstDow; i++) cells += '<span class="cal-day blank">·</span>';
  for(let d = 1; d <= days; d++){
    const date = new Date(y, m, d);
    const status = dayAttendanceStatus(date);
    const isToday = date.toDateString() === today.toDateString();
    const cls = status === 'present' ? 'present' : status === 'absent' ? 'absent' : status === 'holiday' ? 'holiday' : '';
    cells += '<button class="cal-day ' + cls + (isToday ? ' today' : '') + '" data-act="calDay" data-val="' + ymd(date) + '" aria-label="' + fmtLongDate(date) + (status === 'present' ? ', present' : status === 'absent' ? ', absent' : '') + '">' +
      d + (status === 'present' || status === 'absent' ? '<i></i>' : '') +
    '</button>';
  }
  return '<div class="cal-card">' +
    '<div class="cal-head"><h3>' + MONTHS[m] + ' ' + y + '</h3>' +
      '<div class="cal-nav"><button data-act="calPrev" aria-label="Previous month">' + ic('chevronLeft', 15, 2.1) + '</button>' +
      '<button data-act="calNext" aria-label="Next month">' + ic('chevronRight', 15, 2.1) + '</button></div>' +
    '</div>' +
    '<div class="cal-grid">' + ['S','M','T','W','T','F','S'].map(d => '<span class="cal-dow">' + d + '</span>').join('') + cells + '</div>' +
    '<div class="cal-legend"><span><i style="background:var(--mint)"></i>Present</span><span><i style="background:var(--rose)"></i>Absent</span><span><i style="background:#efebf2"></i>No record</span></div>' +
    '<div class="cal-summary"><b>' + summary.present + ' days recorded present</b><span>' + summary.absent + ' recorded absent</span></div>' +
  '</div>';
}
function attendancePage(){
  const p = overallAttendance();
  const low = db.subjects.filter(s => s.total > 0 && subjectPct(s) < 75);
  const today = todaySlots();
  return '<header class="topbar">' +
      '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Attendance</div><div class="topbar__sub">Minimum required · 75%</div></div>' +
      '<button class="icon-btn" data-act="attInfo" aria-label="How attendance works">' + ic('help', 19, 1.8) + '</button>' +
    '</header>' +
    '<section class="poster poster--lilac att-hero">' +
      '<div class="poster-blob" style="right:-40px;top:-50px;width:180px;height:180px;background:rgba(255,255,255,.28)"></div>' +
      '<div class="att-hero__copy">' +
        '<span class="badge ' + attBadgeClass(p) + '" style="background:rgba(255,255,255,.55)">' + (p == null ? 'Not recorded' : p >= 75 ? 'Above the bar' : 'Below the bar') + '</span>' +
        '<div class="att-hero__num" style="margin-top:16px">' + (p == null ? '—' : p + '<small>%</small>') + '</div>' +
        '<div class="att-hero__meta">' + (p == null ? 'No verified sessions entered' : totalAttended() + ' of ' + totalLectures() + ' lectures<br>across ' + db.subjects.length + ' subjects') + '</div>' +
      '</div>' +
      ring(p, 82, attColor(p), 'rgba(19,19,19,.12)') +
    '</section>' +
     '<div class="seg" role="group" aria-label="Attendance views">' +
       '<button aria-pressed="' + (S.attTab === 'subjects') + '" class="' + (S.attTab === 'subjects' ? 'on' : '') + '" data-act="attTab" data-val="subjects">Subjects</button>' +
       '<button aria-pressed="' + (S.attTab === 'calendar') + '" class="' + (S.attTab === 'calendar' ? 'on' : '') + '" data-act="attTab" data-val="calendar">Calendar</button>' +
    '</div>' +
    (S.attTab === 'subjects' ?
      '<div class="section section--tight">' +
        (p == null ? '<div class="att-note" style="margin-bottom:12px">' + ic('info',16,1.8) + '<span>Attendance and results were not supplied. Percentages will appear after staff enter a verified register.</span></div>' : low.length ? '<div class="glance-warn" style="margin:0 0 12px">' + ic('alert', 15, 2) + '<span><b>' + esc(low[0].code) + ' is at ' + subjectPct(low[0]) + '%.</b> Attend ' + lecturesNeeded(low[0]) + ' more lectures to reach 75%.</span></div>' : '') +
        '<div class="att-list">' +
          db.subjects.map(s => {
            const sp = subjectPct(s);
            return '<button class="att-row" data-act="openSubject" data-val="' + s.id + '">' +
              '<span class="sq sq--' + s.tone + '">' + esc(s.code) + '</span>' +
              '<span class="att-row__main">' +
                '<span class="att-row__name">' + esc(s.name) + (sp != null && sp < 75 ? ' <span class="badge badge--red" style="height:19px;font-size:8.5px">At risk</span>' : '') + '</span>' +
                '<span class="att-row__meta">' + esc(s.faculty) + ' · ' + (s.total ? s.attended + ' of ' + s.total + ' lectures' : 'No sessions recorded') + '</span>' +
                '<span class="bar ' + attBarClass(sp) + '"><i style="width:' + (sp == null ? 0 : sp) + '%"></i></span>' +
              '</span>' +
              '<span class="att-row__pct" style="color:' + attColor(sp) + '">' + (sp == null ? '—' : sp + '%') + '</span>' +
              '<span class="li__chev">' + ic('chevronRight', 15, 2) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div class="att-note" style="margin-top:12px">' + ic('help', 16, 1.8) + '<span><b>75% is required for each subject.</b> A strong overall average cannot make up for one subject running short, so keep an eye on the red bars.</span></div>' +
      '</div>'
    :
      '<div class="section section--tight">' +
        calendarHTML() +
        '<div class="section-head" style="margin-top:22px"><h2 style="font-size:17px">Today’s lectures</h2><span class="section-head__sub">' + today.length + ' periods</span></div>' +
        (today.length ? '<div class="att-list">' + today.map((slot, i) => {
          const info = slotInfo(slot);
          const session = (db.sessions || []).find(item => item.date === ymd(new Date()) && item.subjectId === slot.subjectId);
          const status = session && session.records ? session.records[db.profile.id] : '';
          return '<div class="att-row" style="cursor:default">' +
            '<span class="sq sq--' + info.tone + '">' + esc(info.code || '—') + '</span>' +
            '<span class="att-row__main"><span class="att-row__name">' + esc(info.name) + '</span><span class="att-row__meta">' + slot.start + ' · ' + esc(info.room) + '</span></span>' +
            '<span class="badge ' + (status === 'P' ? 'badge--green' : status === 'A' ? 'badge--red' : '') + '">' + (status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Not marked') + '</span>' +
          '</div>';
        }).join('') + '</div>' : '<div class="att-note">No lectures scheduled today.</div>') +
        '<div class="att-note" style="margin-top:12px">' + ic('help', 16, 1.8) + '<span><b>How it adds up.</b> Each lecture counts once. Labs count as one period unless your department says otherwise. Corrections go through your class coordinator.</span></div>' +
      '</div>'
    ) + dockSpace();
}

/* ============================================================
   CLASSROOM
   ============================================================ */
function assignmentCard(a){
  const s = subj(a.subjectId);
  if(!s) return '';
  const due = dueMeta(a.due);
  const submitted = a.submitted;
  const dueToday = !submitted && due.label === 'Due today';
  return '<button class="work-card ' + (submitted ? 'work-card--submitted' : dueToday ? 'work-card--due' : '') + '" data-go="/assignment/' + a.id + '">' +
    '<div class="work-card__top">' + subjectChip(s) +
      (submitted ? '<span class="badge badge--green">' + ic('check', 10, 3) + ' Submitted</span>' :
        due.tone === 'red' ? '<span class="badge badge--red">' + due.label + '</span>' :
        dueToday ? '<span class="badge badge--amber">Due today</span>' :
        '<span class="badge">' + due.label + '</span>') +
    '</div>' +
    '<div class="work-card__title">' + esc(a.title) + '</div>' +
    '<div class="work-card__meta"><span>' + ic('calendar', 12, 2) + due.date + '</span><span>' + ic('award', 12, 2) + a.points + ' points</span>' +
      (a.attachments && a.attachments.length ? '<span>' + ic('file', 12, 2) + a.attachments.length + ' file' + (a.attachments.length > 1 ? 's' : '') + '</span>' : '') +
    '</div>' +
    '<span class="work-card__go">' + ic('chevronRight', 16, 2) + '</span>' +
  '</button>';
}
function classroomPage(){
  const stream = db.announcements;
  let list = db.assignments.slice().sort((a,b) => new Date(a.due || '2999-12-31') - new Date(b.due || '2999-12-31'));
  if(S.workFilter === 'due') list = list.filter(a => !a.submitted);
  if(S.workFilter === 'submitted') list = list.filter(a => a.submitted);

  let body = '';
  if(S.classTab === 'work'){
    body = '<div class="chips" style="padding-top:12px" role="group" aria-label="Filter assignments">' +
      [['all','All work'],['due','To submit'],['submitted','Submitted']].map(([k,l]) =>
        '<button class="chip ' + (S.workFilter === k ? 'on' : '') + '" data-act="workFilter" data-val="' + k + '" aria-pressed="' + (S.workFilter === k) + '">' + l + '</button>'
      ).join('') + '</div>' +
      '<div class="section section--tight"><div class="work-list" style="padding:0 16px">' +
        (list.length ? list.map(assignmentCard).join('') : emptyState('Nothing here yet', 'New assignments from your faculty will land here.', 'bookOpen')) +
      '</div>' +
      '<button class="btn btn--ghost btn--block" style="margin-top:12px" data-go="/assignments">See all assignments</button></div>';
  } else if(S.classTab === 'stream'){
    body = '<div class="section section--tight">' +
      stream.map(a => {
        const tone = a.tone || 'lilac';
        return '<article class="stream-card ' + (a.pinned ? 'stream-card--pinned' : '') + '">' +
          '<div class="stream-head">' +
            '<span class="avatar avatar--sm avatar--' + tone + '">' + esc(initials(a.author)) + '</span>' +
            '<div class="grow"><div class="stream-author">' + esc(a.author) + (a.pinned ? ' <span class="pin" aria-label="Pinned">' + ic('pin', 11, 2.2) + '</span>' : '') + '</div>' +
            '<div class="stream-meta">' + esc(a.role) + ' · ' + timeAgo(a.at) + '</div></div>' +
            '<span class="subject-chip subject-chip--' + tone + '">' + esc(a.tag) + '</span>' +
          '</div>' +
          '<h3 class="title-sm" style="margin-top:11px">' + esc(a.title) + '</h3>' +
          '<p class="stream-body">' + esc(a.body) + '</p>' +
           (a.eventId ? '<button class="btn btn--ghost btn--sm" style="margin-top:10px" data-go="/event/' + encodeURIComponent(a.eventId) + '">' + ic('calendar',14,1.8) + ' View event &amp; register</button>' : a.attachment && /^https?:\/\//i.test(a.attachment) ? '<a class="stream-attach" href="' + esc(a.attachment) + '" target="_blank" rel="noopener noreferrer">Open supplied form</a>' : a.attachment ? '<button class="stream-attach" data-act="download" data-val="' + esc(a.attachment) + '">' + ic('file', 13, 1.8) + esc(a.attachment) + '</button>' : '') +
        '</article>';
      }).join('') +
    '</div>';
  } else {
    body = '<div class="section section--tight">' +
      db.notes.slice().sort((a,b) => new Date(b.at) - new Date(a.at)).map(n => {
        const s = subj(n.subjectId);
        return '<button class="note-card" data-act="downloadNote" data-val="' + n.id + '">' +
          '<span class="note-card__type note-card__type--' + n.type.toLowerCase() + '">' + esc(n.type) + '<span>' + ic('download', 11, 2) + '</span></span>' +
          '<span class="grow"><span class="note-card__title">' + esc(n.title) + '</span>' +
            '<span class="note-card__meta">' + esc(s ? s.code : '') + ' · ' + esc(n.size) + ' · ' + fmtShort(n.at) + '</span>' +
          '</span>' +
          '<span style="color:var(--muted)">' + ic('download', 17, 1.8) + '</span>' +
        '</button>';
      }).join('') +
      '<div class="att-note" style="margin-top:12px">' + ic('bookOpen', 16, 1.8) + '<span>Downloads are saved by your browser in this demo. In the live app, files open in the MET reader.</span></div>' +
    '</div>';
  }

  return '<header class="topbar">' +
       '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">Classroom</div><div class="topbar__sub">' + db.subjects.length + ' subjects · Semester ' + esc(db.profile.semester) + ' · 2026–27 sample</div></div>' +
      '<button class="icon-btn" data-go="/notifications" aria-label="Notifications">' + ic('bell', 19, 1.8) + (unreadNotifs() ? '<span class="dot"></span>' : '') + '</button>' +
    '</header>' +
    '<div class="class-rail" style="margin-top:4px">' +
      db.subjects.map(s => {
        const pending = assignmentsForSubject(s.id).filter(a => !a.submitted).length;
        return '<button class="class-card-sm tint-' + s.tone + '" data-act="openSubject" data-val="' + s.id + '">' +
          '<div class="class-card-sm__code">' + esc(s.code) + '</div>' +
          '<div class="class-card-sm__name">' + esc(s.name) + '</div>' +
          '<div class="class-card-sm__foot"><span class="class-card-sm__teacher">' + esc(s.faculty.replace('Prof. ','').replace('Dr. ','')) + '</span>' +
            (pending ? '<span class="badge">' + pending + ' due</span>' : '<span class="badge">' + (subjectPct(s) == null ? 'No attendance' : subjectPct(s) + '%') + '</span>') +
          '</div>' +
        '</button>';
      }).join('') +
    '</div>' +
    '<div class="seg" role="group" aria-label="Classroom sections">' +
      '<button aria-pressed="' + (S.classTab === 'work') + '" class="' + (S.classTab === 'work' ? 'on' : '') + '" data-act="classTab" data-val="work">Work</button>' +
      '<button aria-pressed="' + (S.classTab === 'stream') + '" class="' + (S.classTab === 'stream' ? 'on' : '') + '" data-act="classTab" data-val="stream">Stream</button>' +
      '<button aria-pressed="' + (S.classTab === 'notes') + '" class="' + (S.classTab === 'notes' ? 'on' : '') + '" data-act="classTab" data-val="notes">Notes</button>' +
    '</div>' +
    body + dockSpace();
}

/* ============================================================
   MORE
   ============================================================ */
function morePage(){
  const p = overallAttendance();
  const latestResult = db.results[0];
  const openDrives = db.drives.filter(d => !deadlineMeta(d.deadline).closed).length;
  const today = todaySlots().length;
  return '<header class="topbar">' +
      '<div style="flex:1"><div class="topbar__title" style="font-size:25px;letter-spacing:-1px">More</div><div class="topbar__sub">Your space at MET</div></div>' +
      '<button class="icon-btn" data-act="openPreferences" aria-label="Notification preferences">' + ic('settings', 19, 1.8) + '</button>' +
    '</header>' +
    '<section class="profile-card">' +
      '<button class="icon-btn icon-btn--sm" data-act="openProfile" aria-label="Profile details" style="position:absolute;right:16px;top:16px;z-index:2;background:rgba(255,255,255,.5)">' + ic('edit', 15, 1.9) + '</button>' +
      '<div class="profile-card__top">' +
        '<span class="avatar avatar--xl avatar--lilac" style="background:rgba(255,255,255,.6)">' + esc(initials(db.profile.name)) + '</span>' +
        '<div class="grow"><h2 class="profile-card__name">' + esc(db.profile.name) + '</h2>' +
           '<p class="profile-card__meta">' + esc(db.profile.class) + (db.profile.division ? '<br>Division ' + esc(db.profile.division) : '') + ' · Roll ' + esc(db.profile.roll || '—') + '</p></div>' +
      '</div>' +
      '<div class="profile-card__bottom">' +
         '<div class="profile-card__id">PRN<b>' + esc(db.profile.prn || '—') + '</b></div>' +
         '<div class="profile-card__id">CGPA<b>' + (db.profile.cgpa == null ? '—' : Number(db.profile.cgpa).toFixed(2)) + '</b></div>' +
         '<div class="profile-card__id">Attendance<b>' + (p == null ? '—' : p + '%') + '</b></div>' +
        '<span class="badge badge--glass">Student</span>' +
      '</div>' +
    '</section>' +

    '<div class="group-label">Academics</div>' +
    '<div class="wrap"><div class="tile-grid">' +
       '<button class="tile tint-lilac" data-go="/results"><span class="tile__icon">' + ic('award', 18, 1.8) + '</span><span class="tile__label">Results</span><span class="tile__meta">' + (latestResult ? 'Latest grade card · SGPA ' + Number(latestResult.sgpa).toFixed(2) : 'No results published') + '</span></button>' +
       '<button class="tile tint-peri" data-go="/attendance"><span class="tile__icon">' + ic('checkCircle', 18, 1.8) + '</span><span class="tile__label">Attendance</span><span class="tile__meta">' + (p == null ? 'No records entered' : p + '% this semester') + '</span></button>' +
       '<button class="tile tint-butter" data-go="/timetable"><span class="tile__icon">' + ic('calendar', 18, 1.8) + '</span><span class="tile__label">Timetable</span><span class="tile__meta">' + (today ? today + ' periods today' : 'No periods listed') + '</span></button>' +
       '<button class="tile tint-rose" data-go="/curriculum"><span class="tile__icon">' + ic('book',18,1.8) + '</span><span class="tile__label">Curriculum</span><span class="tile__meta">All 8 semesters</span></button>' +
       '<button class="tile tint-mint" data-act="classTabThenGo" data-val="notes"><span class="tile__icon">' + ic('bookOpen', 18, 1.8) + '</span><span class="tile__label">Notes</span><span class="tile__meta">' + db.notes.length + ' files from faculty</span></button>' +
    '</div></div>' +

    '<div class="group-label">Campus</div>' +
    '<div class="wrap"><div class="tile-grid">' +
       '<button class="tile tint-rose" data-go="/events"><span class="tile__icon">' + ic('calendar', 18, 1.8) + '</span><span class="tile__label">Campus events</span><span class="tile__meta">' + (db.events || []).filter(e => e.published).length + ' promotions</span></button>' +
      '<button class="tile tint-butter" data-go="/placements"><span class="tile__icon">' + ic('briefcase', 18, 1.8) + '</span><span class="tile__label">Placements</span><span class="tile__meta">' + openDrives + ' drives open</span></button>' +
      '<button class="tile tint-peri" data-go="/entry"><span class="tile__icon">' + ic('qr', 18, 1.8) + '</span><span class="tile__label">Campus pass</span><span class="tile__meta">Valid today</span></button>' +
      '<button class="tile tint-lilac" data-go="/notices"><span class="tile__icon">' + ic('megaphone', 18, 1.8) + '</span><span class="tile__label">Noticeboard</span><span class="tile__meta">' + db.announcements.length + ' notices</span></button>' +
    '</div></div>' +

    '<div class="group-label">Institute</div>' +
    '<div class="menu">' +
       '<button class="li" data-act="openPreferences"><span class="menu__icon">' + ic('bell', 16, 1.8) + '</span><span class="li__main"><span class="li__title">Notification preferences</span><span class="li__sub">Attendance, placements, announcements and events</span></span><span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
      '<button class="li" data-act="openHelp"><span class="menu__icon">' + ic('help', 16, 1.8) + '</span><span class="li__main"><span class="li__title">Help &amp; support</span><span class="li__sub">Reach the campus helpdesk</span></span><span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
      '<button class="li" data-act="signOut"><span class="menu__icon">' + ic('logout', 16, 1.8) + '</span><span class="li__main"><span class="li__title">Sign out</span><span class="li__sub">' + esc(db.profile.email) + '</span></span><span class="li__chev">' + ic('chevronRight', 15, 2) + '</span></button>' +
    '</div>' +
    '<p style="text-align:center;font-size:9.5px;color:var(--muted-2);margin-top:20px">MET Campus · Prototype 1.0<br>Made for MET Institute of Technology</p>' +
    dockSpace();
}
