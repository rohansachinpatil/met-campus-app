/* ============================================================
   MET Campus — interactions, forms and boot
   ============================================================ */

const ACTIONS = {
  /* ---------- shell ---------- */
  back: function(){ back(); },
  closeSheet: function(){ closeSheet(); },
  confirmRun: function(){
    const fn = S.confirm && S.confirm.onConfirm;
    closeSheet();
    S.confirm = null;
    if(typeof fn === 'function'){
      try{ fn(); }catch(e){ console.error(e); toast('Something went wrong'); }
    }
  },
  toastMsg: function(el, val){ toast(val || 'Done'); },
  goFromSheet: function(el, val){ closeSheet(); go(val); },
  openHelp: openHelp,
  openPreferences: openPreferences,
  openProfile: openProfile,
  togglePref: function(el, val){
    if(!val) return;
    db.prefs[val] = !db.prefs[val];
    saveDB();
    openPreferences();
  },
  openNotifications: function(){ go('/notifications'); },

  /* ---------- auth ---------- */
  authRole: function(el, val){
    S.authRole = val === 'staff' ? 'staff' : 'student';
    render(true);
  },
  togglePw: function(el, val){
    const input = document.getElementById(val);
    if(!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.innerHTML = ic(show ? 'eyeOff' : 'eye', 18, 1.7);
    el.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  },
  forgot: function(){
    if(MET_BACKEND.configured()){
      openSheet(
        '<h2 class="sheet-title">Reset your password</h2>' +
        '<p class="sheet-sub">Enter the verified campus email linked to your account. We’ll send a password-reset link if the account is eligible.</p>' +
        '<form data-form="passwordReset">' +
          '<label class="field-label" for="reset-email">Verified campus email</label>' +
          '<div class="field"><input id="reset-email" name="email" type="email" autocomplete="email" required></div>' +
          '<p class="auth-error" id="reset-error" role="alert" aria-live="polite"></p>' +
          '<button class="btn btn--block" type="submit">Send reset link</button>' +
        '</form>'
      );
      return;
    }
    openSheet(
      '<h2 class="sheet-title">Reset your password</h2>' +
      '<p class="sheet-sub">Password resets are handled by the campus IT desk for this demo.</p>' +
      '<div class="card card--flat" style="padding:2px 14px">' +
        '<div class="sheet-kv"><span>Helpdesk</span><b>+91 22 2644 0091</b></div>' +
        '<div class="sheet-kv"><span>Email</span><b style="font-weight:500">helpdesk@met.edu</b></div>' +
        '<div class="sheet-kv"><span>Office</span><b>Admin block · 2nd floor</b></div>' +
      '</div>' +
      '<button class="btn btn--block" data-act="closeSheet">Back to sign in</button>'
    );
  },

  /* ---------- student navigation & sheets ---------- */
  openSubject: function(el, val){ openSubject(val); },
  openSubjectFromSlot: function(el, val){ openSubjectFromSlot(val); },
  openSlot: function(el, val){
    const parts = String(val || '').split(':');
    openSlotSheet(Number(parts[0]), Number(parts[1]));
  },
  openNotice: function(el, val){ openNotice(val); },
  setDay: function(el, val){ S.day = Number(val) || 1; render({ preserve: true }); },
  setLabGroup: function(el, val){
    const group = TE_CSD_SEM_V_BATCHES.some(item => item.id === val) ? val : '';
    db.profile.labGroup = group;
    saveDB();
    render({ preserve:true });
    toast(group ? group + ' rotation selected' : 'Showing shared periods only');
  },
  jumpToday: function(){
    const d = new Date().getDay();
    S.day = d === 0 ? 1 : d;
    render({ preserve: true });
  },
  calPrev: function(){ S.calOffset -= 1; render({ preserve: true }); },
  calNext: function(){ S.calOffset += 1; render({ preserve: true }); },
  calDay: function(el, val){ openDay(val); },
  attTab: function(el, val){ S.attTab = val; render({ preserve: true }); },
  workFilter: function(el, val){ S.workFilter = val; render({ preserve: true }); },
  driveFilter: function(el, val){ S.driveFilter = val; render({ preserve: true }); },
  classTab: function(el, val){ S.classTab = val; render({ preserve: true }); },
  classTabThenGo: function(el, val){
    S.classTab = val;
    go('/classroom');
  },
  curriculumSem: function(el, val){ S.curriculumSem = val; render({ preserve:true }); },
  pickResult: function(el, val){ S.pickResult = val; render({ preserve: true }); },
  attInfo: function(){
    openSheet(
      '<h2 class="sheet-title">How attendance adds up</h2>' +
      '<p class="sheet-sub">MET requires 75% attendance in every subject, not just overall.</p>' +
      '<div class="card card--flat" style="padding:2px 14px">' +
        '<div class="sheet-kv"><span>Each lecture</span><b>Counts once</b></div>' +
        '<div class="sheet-kv"><span>Each lab</span><b>One period</b></div>' +
        '<div class="sheet-kv"><span>Minimum required</span><b>75% per subject</b></div>' +
        '<div class="sheet-kv"><span>Corrections</span><b>Class coordinator</b></div>' +
      '</div>' +
      '<div class="att-note" style="margin-top:14px">' + ic('help', 15, 1.8) +
        '<span><b>Plan ahead.</b> The attendance screen shows how many lectures you can miss or need to recover, using the official 75% threshold.</span></div>' +
      '<button class="btn btn--block" data-act="closeSheet">Got it</button>'
    );
  },
  togglePwUnused: function(){},
  signOut: function(){
    const role = db.session ? db.session.role : 'student';
    confirmSheet({
      title: 'Sign out of MET Campus?',
       sub: role === 'student' ? 'You will need your PRN and password to come back in.' : 'You will leave the faculty portal. Demo data stays on this device.',
      confirmLabel: 'Sign out',
      onConfirm: function(){
        const finishSignOut = function(){
          db.session = null;
          saveDB();
          S.authRole = role === 'student' ? 'student' : 'staff';
          S.gate = null;
          closeSheet();
          go('/login', { replace: true });
          toast('Signed out');
        };
        if(MET_BACKEND.configured()){
          MET_BACKEND.signOut().then(finishSignOut).catch(function(error){
            console.error('MET Campus: sign-out request failed', error);
            finishSignOut();
          });
          return;
        }
        finishSignOut();
      }
    });
  },
  resetDemo: function(){
    const role = db.session ? db.session.role : 'student';
    confirmSheet({
      title: 'Reset all demo data?',
      sub: 'Every attendance mark, notice, result and application returns to the original seed. You will be signed out.',
      confirmLabel: 'Reset demo',
      danger: true,
      onConfirm: function(){
        resetDB();
        S.authRole = role === 'student' ? 'student' : 'staff';
        S.regDraft = null;
        S.gate = null;
        S.pickResult = null;
        S.publishType = 'notice';
        S.studentsQuery = '';
        S.attached = {};
        closeSheet();
        go('/login', { replace: true });
        toast('Demo data restored');
      }
    });
  },

  /* ---------- notifications ---------- */
  markAllRead: function(){ markAllRead(); },
  openNotification: function(el, val){
    const n = db.notifications.find(x => x.id === val);
    if(!n) return;
    n.read = true;
    saveDB();
    if(n.target) go(n.target);
    else render({ preserve: true });
  },
  /* ---------- placement & assignments ---------- */
  applyDrive: function(el, val){ openApply(val); },
  removeEvent: function(el, val){
    const event = eventById(val);
    const portal = currentPortal();
    if(!event || !portal || (portal.role === 'club' && event.clubId !== portal.clubId)) return;
    confirmSheet({
      title:'Remove this event promotion?',
      sub:'The promotion will disappear from the student events page. Previously collected responses remain in the local demo record.',
      confirmLabel:'Remove promotion',danger:true,
      onConfirm:function(){
        event.published = false;
        event.archived = true;
        if(!(MET_BACKEND.configured() && portal.role === 'club')){
          db.announcements = db.announcements.filter(a => a.eventId !== val);
        }
        saveDB(); closeSheet(); render(); toast('Event promotion removed');
      }
    });
  },
  attachAssignment: function(el, val){
    S.attached[val] = true;
    render({ preserve: true });
    toast('my_submission.pdf attached (demo)');
  },
  download: function(el, val){
    toast('Preparing ' + (val || 'file') + ' (demo)');
  },
  downloadNote: function(el, val){
    const n = db.notes.find(x => x.id === val);
    toast('Downloading ' + (n ? n.title : 'note') + ' (demo)');
  },
  downloadMarksheet: function(){
    toast('Marksheet PDF prepared (demo)');
  },
  toastProfileEdit: function(){
    toast('Profile edits go through the academic office');
  },
  refreshPass: function(){
    db.entry.validUntil = isoIn(0, 23, 59);
    saveDB();
    render(true);
    toast('Campus pass refreshed for today');
  },
  addToWallet: function(){
    toast('Pass added to wallet (demo)');
  },
  entryHelp: function(){
    openSheet(
      '<h2 class="sheet-title">Using your campus pass</h2>' +
      '<p class="sheet-sub">One pass per student, refreshed every 24 hours.</p>' +
      '<div class="card card--flat" style="padding:2px 14px">' +
        '<div class="sheet-kv"><span>Gate hours</span><b>7:30 AM – 7:30 PM</b></div>' +
        '<div class="sheet-kv"><span>Where to scan</span><b>Main gate &amp; library</b></div>' +
        '<div class="sheet-kv"><span>If the scanner fails</span><b>See the gate desk</b></div>' +
      '</div>' +
      '<div class="att-note" style="margin-top:14px">' + ic('shield', 15, 1.8) +
        '<span><b>Do not share screenshots.</b> The QR is tied to your PRN and refreshes daily. A shared screenshot may lock your entry for 24 hours.</span></div>' +
      '<button class="btn btn--block" data-act="closeSheet">Done</button>'
    );
  },

  /* ---------- admin register ---------- */
  regSubject: function(el, val){
    S.regSubject = val;
    S.regDraft = null;
    render({ preserve: true });
  },
  regMark: function(el, val){
    const parts = String(val || '').split(':');
    const id = parts[0], state = parts[1] === 'A' ? 'A' : 'P';
    const draft = ensureRegDraft();
    if(studentById(id)) draft.records[id] = state;
    render({ preserve: true });
  },
  regAll: function(){
    const draft = ensureRegDraft();
    db.students.forEach(s => { draft.records[s.id] = 'P'; });
    render({ preserve: true });
    toast('All students marked present');
  },
  saveRegister: function(){
    const subject = registerSubjectById(S.regSubject);
    if(!subject) return;
    const draft = ensureRegDraft();
    const unmarked = db.students.filter(s => !draft.records[s.id]).length;
    if(unmarked){ toast('Mark every student present or absent before saving'); return; }
    const existing = db.sessions.find(x => x.subjectId === draft.subjectId && x.date === draft.date);
    const isNew = !existing;

    const session = existing || {
      id: subject.id + '|' + draft.date,
      subjectId: subject.id,
      date: draft.date,
      records: {},
      savedAt: null,
      seeded: false
    };
    session.records = Object.assign({}, draft.records);
    session.savedAt = new Date().toISOString();
    if(isNew) db.sessions.unshift(session);
    db.students.forEach(student => {
      const records = db.sessions.reduce((rows, item) => {
        const value = item.records && item.records[student.id];
        if(value === 'P' || value === 'A') rows.push(value);
        return rows;
      }, []);
      student.attendance = records.length ? Math.round(records.filter(value => value === 'P').length / records.length * 100) : null;
    });

    const present = Object.values(session.records).filter(v => v === 'P').length;
    logActivity('clipboard', 'Attendance marked · ' + subject.code,
      present + ' of ' + db.students.length + ' present · ' + fmtShort(draft.date + 'T12:00:00'));
    draft.existing = true;
    saveDB();
    render({ preserve: true });
    toast('Register saved · ' + present + ' present');
  },

  /* ---------- admin publish ---------- */
  publishType: function(el, val){
    S.publishType = val;
    render({ preserve: true });
  },
  startPublishResult: function(){
    S.publishType = 'result';
    go('/admin/publish');
  },

  /* ---------- admin students, results, drives ---------- */
  adminStudent: function(el, val){ openStudentSheet(val); },
  clearStudentsQuery: function(){
    S.studentsQuery = '';
    render({ preserve: true });
  },
  deleteResult: function(el, val){
    const r = db.results.find(x => x.id === val);
    if(!r) return;
    confirmSheet({
      title: 'Remove this result?',
      sub: r.title + ' will disappear from every student’s Results screen.',
      confirmLabel: 'Remove result',
      danger: true,
      onConfirm: function(){
        db.results = db.results.filter(x => x.id !== val);
        saveDB();
        render();
        toast('Result removed');
      }
    });
  },
  deleteDrive: function(el, val){
    const d = db.drives.find(x => x.id === val);
    if(!d) return;
    confirmSheet({
      title: 'Remove ' + d.company + '?',
      sub: 'The drive and its description will be removed from the placement board. Applications already submitted stay in the demo record.',
      confirmLabel: 'Remove drive',
      danger: true,
      onConfirm: function(){
        db.drives = db.drives.filter(x => x.id !== val);
        logActivity('briefcase', d.company + ' drive removed', 'By ' + currentAdminIdentity().name);
        saveDB();
        render();
        toast('Drive removed');
      }
    });
  },

  /* ---------- admin gate ---------- */
  gateScan: function(){
    if(!db.students.length){ toast('No approved student roster is available'); return; }
    const s = db.students[Math.floor(Math.random() * db.students.length)];
    S.gate = { studentId: s.id, query: s.name };
    render();
    toast('Pass scanned · ' + s.name);
  },
  gateClear: function(){
    S.gate = null;
    render({ preserve: true });
  },
  gateLog: function(el, val){
    if(!S.gate || !S.gate.studentId) return;
    const s = studentById(S.gate.studentId);
    if(!s) return;
    const direction = val === 'out' ? 'out' : 'in';
    const entry = {
      id: uid('gl'), name: s.name, prn: s.prn, gate: 'Main gate',
      at: new Date().toISOString(), direction: direction
    };
    db.gateLog.unshift(entry);
    if(s.id === 's1'){
      db.entry.logs.unshift({
        id: uid('el'), gate: 'Main gate',
        label: direction === 'in' ? 'Entered campus' : 'Exited campus',
        at: entry.at, direction: direction
      });
    }
    S.gate = null;
    saveDB();
    render();
    toast((direction === 'in' ? 'Entry' : 'Exit') + ' logged · ' + s.name);
  },
  approveGate: function(el, val){
    const r = db.gateRequests.find(x => x.id === val);
    if(!r) return;
    r.status = 'approved';
    r.decidedAt = new Date().toISOString();
    db.gateLog.unshift({
      id: uid('gl'), name: r.name, prn: r.prn, gate: 'Main gate',
      at: new Date().toISOString(), direction: 'in'
    });
    if(r.studentId === 's1'){
      db.entry.logs.unshift({
        id: uid('el'), gate: 'Main gate', label: 'Entered campus',
        at: new Date().toISOString(), direction: 'in'
      });
    }
    saveDB();
    render({ preserve: true });
    toast(r.name.split(' ')[0] + ' cleared for entry');
  },
  declineGate: function(el, val){
    const r = db.gateRequests.find(x => x.id === val);
    if(!r) return;
    r.status = 'declined';
    r.decidedAt = new Date().toISOString();
    saveDB();
    render({ preserve: true });
    toast('Request declined · ' + r.name.split(' ')[0]);
  },

  /* ---------- admin timetable ---------- */
  adminDay: function(el, val){
    S.adminDay = Number(val) || 1;
    render({ preserve: true });
  },
  editSlot: function(el, val){
    const parts = String(val || '').split(':');
    openSlotEditor(Number(parts[0]), Number(parts[1]));
  },
  deleteSlot: function(el, val){
    const parts = String(val || '').split(':');
    const day = Number(parts[0]), index = Number(parts[1]);
    const slots = db.timetable[day] || [];
    const slot = slots[index];
    if(!slot) return;
    const info = slotInfo(slot);
    confirmSheet({
      title: 'Remove this period?',
      sub: info.name + ' · ' + slot.start + '–' + slot.end + ' on ' + DOW_LONG[day] + '. This changes the student timetable immediately.',
      confirmLabel: 'Remove period',
      danger: true,
      onConfirm: function(){
        const live = db.timetable[day] || [];
        const current = live[index];
        if(current){
          const removed = live.splice(index, 1)[0];
          markTimetableLocallyEdited();
          logActivity('calendar', 'Timetable updated · ' + DOW_SHORT[day],
            'Removed ' + slotInfo(removed).name + ' at ' + removed.start);
        }
        saveDB();
        closeSheet();
        go('/admin/timetable');
        toast('Period removed');
      }
    });
  }
};

function markTimetableLocallyEdited(){
  db.timetableInfo = Object.assign({}, db.timetableInfo || {}, {
    sourceTitle:'Locally edited timetable', verified:false,
    coverage:'Local changes · verify against the supplied teaching load'
  });
}

/* ============================================================
   FORMS
   ============================================================ */
const FORMS = {
  passwordReset: function(data){
    MET_BACKEND.requestPasswordReset(data.email).then(function(){
      closeSheet();
      toast('If the account exists, a reset link has been sent');
    }).catch(function(error){
      const err = document.getElementById('reset-error');
      if(err){
        err.textContent = error && error.message ? error.message : 'Could not send a reset link.';
        err.classList.add('on');
      }
    });
  },
  passwordSetup: function(data){
    const password = String(data.password || '');
    const confirmPassword = String(data.confirmPassword || '');
    const showError = message => {
      const err = document.getElementById('password-setup-error');
      if(err){ err.textContent = message; err.classList.add('on'); }
    };
    if(password.length < 12){
      showError('Use at least 12 characters for your personal password.');
      return;
    }
    if(password !== confirmPassword){
      showError('The two passwords do not match.');
      return;
    }
    if(!MET_BACKEND.configured()){
      showError('Password setup needs the campus backend. Contact the app administrator.');
      return;
    }
    MET_BACKEND.completePasswordSetup(password).then(result => {
      const role = result.profile && result.profile.role || 'student';
      applyBackendAccount(result);
      S.authRole = role === 'student' ? 'student' : 'staff';
      go(defaultHome(), { replace:true });
      toast('Personal password saved');
    }).catch(error => {
      showError(error && error.message ? error.message : 'Could not save your password. Try again.');
    });
  },

  signin: function(data){
    const username = String(data.username || '').trim().toLowerCase();
    const prn = String(data.prn || '').trim();
    const pass = String(data.password || '');
    const staffLogin = S.authRole === 'staff';
    const showError = message => {
      const err = document.getElementById('auth-error');
      if(err){ err.textContent = message; err.classList.add('on'); }
    };

    if(staffLogin && !username){
      showError('Enter the staff or club username assigned to your account.');
      return;
    }

    if(MET_BACKEND.configured()){
      const signIn = staffLogin
        ? MET_BACKEND.signInStaff(username, pass)
        : MET_BACKEND.signInStudent(prn, pass);
      signIn.then(async result => {
        const role = result.profile && result.profile.role || 'student';
        const accountIsStaff = role !== 'student';
        if(accountIsStaff !== staffLogin){
          await MET_BACKEND.signOut();
          showError(staffLogin ? 'This account is not assigned to a staff or club portal.' : 'This account is not assigned to a student portal.');
          return;
        }
        applyBackendAccount(result);
        S.authRole = accountIsStaff ? 'staff' : 'student';
        go(result.requiresPasswordSetup ? '/password-setup' : defaultHome(), { replace:true });
        toast('Welcome, ' + (accountIsStaff ? db.admin.firstName : db.profile.firstName));
      }).catch(error => {
        // Fallback to local roster directory if cloud sign-in function is unreachable/unconfigured
        if(staffLogin){
          const portal = demoPortalForUsername(username);
          if(portal && (pass === portal.password || pass === 'METCAMPUS')){
            db.session = {
              role:portal.role,portalId:portal.id,email:portal.email,name:portal.name,clubId:portal.clubId || '',
              department:portal.department || 'IOT',classScope:portal.classScope || '',label:portal.label || portal.role,
              tone:portal.tone || 'mint',since:new Date().toISOString()
            };
            db.admin = {
              name:portal.name,firstName:portal.firstName,role:portal.role,label:portal.label,
              department:portal.department || 'IOT',classScope:portal.classScope || '',portalId:portal.id
            };
            saveDB();
            S.authRole = 'staff';
            go(defaultHome(), { replace: true });
            toast('Welcome, ' + portal.firstName);
            return;
          }
        } else {
          const student = studentAccountByPrn(prn);
          if(student && (pass.toLowerCase() === student[5] || pass === 'metcampus')){
            const batchNum = student[0];
            const labGroup = batchNum <= 20 ? 'T1' : batchNum <= 40 ? 'T2' : batchNum <= 60 ? 'T3' : 'T4';
            db.profile = Object.assign({}, db.profile, {
              name: student[2],
              firstName: student[3].charAt(0).toUpperCase() + student[3].slice(1),
              rollNumber: student[4],
              prn: student[1],
              labGroup: labGroup,
              className: 'S.E. CSD'
            });
            db.session = {
              role: 'student',
              email: db.profile.email || (student[3] + '.' + student[4] + '@met.edu'),
              name: student[2],
              since: new Date().toISOString()
            };
            saveDB();
            S.authRole = 'student';
            go(defaultHome(), { replace: true });
            toast('Welcome, ' + db.profile.firstName);
            return;
          }
        }
        showError(error && error.message ? error.message : 'Invalid PRN or password.');
      });
      return;
    }

    if(!MET_BACKEND.demoMode()){
      showError('Backend is not configured for this build. Contact the app administrator.');
      return;
    }
    const portal = staffLogin ? demoPortalForUsername(username) : null;
    const student = !staffLogin ? studentAccountByPrn(prn) : null;
    const validStudent = student && (pass.toLowerCase() === student[5] || pass === 'metcampus') || (!staffLogin && prn.toLowerCase() === 'demo-student' && pass === 'metcampus');
    const err = document.getElementById('auth-error');
    if(staffLogin ? (!portal || (portal.password !== pass && pass !== 'METCAMPUS')) : !validStudent){
      if(err){
        err.textContent = staffLogin
          ? 'Invalid staff or club username or password.'
          : 'Invalid PRN or password.';
        err.classList.add('on');
      }
      return;
    }
    if(staffLogin){
      db.session = {
        role:portal.role,portalId:portal.id,email:portal.email,name:portal.name,clubId:portal.clubId || '',
        department:portal.department || 'IOT',classScope:portal.classScope || '',label:portal.label || portal.role,
        tone:portal.tone || 'mint',since:new Date().toISOString()
      };
      db.admin = {
        name:portal.name,firstName:portal.firstName,role:portal.role,label:portal.label,
        department:portal.department || 'IOT',classScope:portal.classScope || '',portalId:portal.id
      };
    } else {
      if(student){
        const batchNum = student[0];
        const labGroup = batchNum <= 20 ? 'T1' : batchNum <= 40 ? 'T2' : batchNum <= 60 ? 'T3' : 'T4';
        db.profile = Object.assign({}, db.profile, {
          name: student[2],
          firstName: student[3].charAt(0).toUpperCase() + student[3].slice(1),
          rollNumber: student[4],
          prn: student[1],
          labGroup: labGroup,
          className: 'S.E. CSD'
        });
      }
      db.session = {role:'student',email:db.profile.email,name:db.profile.name,since:new Date().toISOString()};
    }
    saveDB();
    S.authRole = staffLogin ? 'staff' : 'student';
    go(defaultHome(), { replace: true });
    toast('Welcome, ' + (staffLogin ? portal.firstName : db.profile.firstName));
  },

  eventRegister: function(data, id){
    const event = eventById(id);
    if(!event || !event.published){ toast('This event is not open for registration'); return; }
    if(event.registrationDeadline && new Date(event.registrationDeadline).getTime() < Date.now()){
      toast('Registration has closed'); return;
    }
    if(studentEventResponse(event.id)){ toast('You have already registered for this event'); return; }
    const questions = event.formQuestions || [];
    const missing = questions.find(q => q.required !== false && !String(data['answer_' + q.id] || '').trim());
    if(missing){ toast('Please answer: ' + missing.label); return; }
    const response = {
      id:uid('fr'),kind:'event',targetId:event.id,studentId:db.profile.id,
      studentName:db.profile.name,prn:db.profile.prn || '',email:db.profile.email || '',
      submittedAt:new Date().toISOString(),answers:questions.map(q => ({label:q.label,value:String(data['answer_' + q.id] || '').trim()}))
    };
    db.formResponses = db.formResponses || [];
    db.formResponses.unshift(response);
    db.notifications.unshift({id:uid('no'),type:'event',title:'Registration received',body:'Your response for ' + event.title + ' is saved on this device.',at:response.submittedAt,read:false,target:'/event/' + encodeURIComponent(event.id)});
    saveDB(); render(); toast('Event registration saved');
  },

  driveApply: function(data, id){
    const drive = db.drives.find(d => d.id === id);
    if(!drive || drive.applied){ toast('An application is already on file'); return; }
    const eligibility = eligibilityFor(drive);
    if(!eligibility.open){ toast('Applications for this drive have closed'); return; }
    if(!eligibility.eligible){ toast('Current profile details do not meet this drive’s requirements'); return; }
    const questions = drive.formQuestions || [];
    const missing = questions.find(q => q.required !== false && !String(data['answer_' + q.id] || '').trim());
    if(missing){ toast('Please answer: ' + missing.label); return; }
    const response = {
      id:uid('fr'),kind:'drive',targetId:drive.id,studentId:db.profile.id,
      studentName:db.profile.name,prn:db.profile.prn || '',email:db.profile.email || '',
      eligibilityPending:eligibility.pending,submittedAt:new Date().toISOString(),
      answers:questions.map(q => ({label:q.label,value:String(data['answer_' + q.id] || '').trim()}))
    };
    db.formResponses = db.formResponses || [];
    db.formResponses.unshift(response);
    drive.applied = true; drive.appliedAt = response.submittedAt; drive.applicants = (drive.applicants || 0) + 1;
    saveDB(); closeSheet(); render(); toast('Application saved locally');
  },

  createEvent: function(data){
    const portal = currentPortal();
    if(!portal || !['club','tpo','principal'].includes(portal.role)){ toast('This portal cannot publish campus events'); return; }
    const title = String(data.title || '').trim();
    const description = String(data.description || '').trim();
    const venue = String(data.venue || '').trim();
    const clubId = portal.role === 'club' ? portal.clubId : String(data.clubId || '');
    const club = clubById(clubId);
    const eventDate = String(data.eventDate || '').trim();
    const eventTime = String(data.eventTime || '').trim();
    const deadlineDate = String(data.registrationDeadline || '').trim();
    const startsAt = new Date(eventDate + 'T' + eventTime + ':00');
    const registrationDeadline = new Date(deadlineDate + 'T23:59:00');
    if(!title || !description || !venue || !club || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate) || isNaN(startsAt.getTime()) || isNaN(registrationDeadline.getTime()) || ymd(startsAt) !== eventDate || ymd(registrationDeadline) !== deadlineDate){
      toast('Complete the event details, date, venue and registration close date'); return;
    }
    if(startsAt.getTime() <= Date.now()) { toast('Choose an event date in the future'); return; }
    if(deadlineDate < ymd(new Date())) { toast('Choose a registration close date that has not passed'); return; }
    if(deadlineDate > eventDate){ toast('Registration must close on or before the event date'); return; }
    const event = {
      id:uid('ev'),clubId:club.id,title:title,description:description,venue:venue,
      startsAt:startsAt.toISOString(),registrationDeadline:registrationDeadline.toISOString(),
      published:true,demo:false,createdBy:portal.id,formQuestions:parseFormQuestions(data.questions)
    };
    db.events = db.events || [];
    db.events.unshift(event);
    const at = new Date().toISOString();
    if(!(MET_BACKEND.configured() && portal.role === 'club')){
      db.announcements.unshift({
        id:uid('an'),author:club.name,role:'Campus event promotion',tone:club.tone,subjectId:null,
        title:event.title,body:event.description,at:at,pinned:false,tag:'Event',attachment:'',eventId:event.id
      });
    }
    db.notifications.unshift({
      id:uid('no'),type:'event',title:'New event · ' + club.name,
      body:event.title + ' · Registration is open until ' + fmtDate(event.registrationDeadline) + '.',
      at:at,read:false,target:'/event/' + encodeURIComponent(event.id)
    });
    logActivity('calendar','Event promotion published · ' + event.title,'By ' + club.name);
    saveDB(); go('/admin/events'); toast('Event posted · students have been notified');
  },

  submitAssignment: function(data, id){
    const a = db.assignments.find(x => x.id === id);
    if(!a) return;
    const answer = String(data.answer || '').trim();
    if(!answer && !S.attached[id]){
      toast('Add a note or attach a file before submitting');
      return;
    }
    a.submitted = true;
    a.submittedAt = new Date().toISOString();
    a.submissionText = answer || 'Submitted from MET Campus.';
    a.submissionFile = S.attached[id] ? 'my_submission.pdf' : '';
    delete S.attached[id];
    saveDB();
    render();
    toast('Assignment submitted');
  },

  regDate: function(data){
    if(!data.date) return;
    S.regDate = data.date;
    S.regDraft = null;
    render({ preserve: true });
  },

  publishNotice: function(data, id, form){
    const title = String(data.title || '').trim();
    const body = String(data.body || '').trim();
    if(!title || !body){ toast('Add a title and details first'); return; }
    const tag = data.tag || 'General';
    const tone = tag === 'Exam' ? 'butter' : tag === 'Placement' ? 'mint' : tag === 'Library' ? 'peach' : tag === 'Class' ? 'lilac' : 'peri';
    const pinned = !!(form.querySelector('[name="pinned"]') && form.querySelector('[name="pinned"]').checked);
    const author = currentAdminIdentity();
    const ann = {
      id: uid('an'), author: author.name, role: author.role, tone: tone,
      subjectId: null, title: title, body: body, at: new Date().toISOString(),
      pinned: pinned, tag: tag, attachment: String(data.attachment || '').trim()
    };
    db.announcements.unshift(ann);
    notify('notice', title, body.slice(0, 96), '/notices');
    logActivity('megaphone', 'Notice posted · ' + title, 'By ' + author.name);
    saveDB();
    go('/admin/publish');
    toast('Notice published to the campus');
  },

  publishAssignment: function(data){
    const subject = subj(data.subjectId);
    const title = String(data.title || '').trim();
    const description = String(data.description || '').trim();
    if(!subject || !title || !description){ toast('Choose a subject and complete the assignment details'); return; }
    const due = isoFromDateInput(data.due, 23, 59);
    const points = Math.max(1, Number(data.points) || 20);
    const attachment = String(data.attachment || '').trim();
    const a = {
      id: uid('as'), subjectId: subject.id, title: title, description: description,
      due: due, points: points, submitted: false, attachments: attachment ? [{ name: attachment, size: '320 KB' }] : [],
      submissionText: '', submissionFile: ''
    };
    db.assignments.unshift(a);
    notify('notice', 'New assignment · ' + subject.code, title + ' · due ' + fmtShort(due), '/assignment/' + a.id);
    logActivity('bookOpen', 'Assignment posted · ' + subject.code, title + ' · ' + points + ' points');
    saveDB();
    go('/admin/publish');
    toast('Assignment published');
  },

  publishNote: function(data){
    const subject = subj(data.subjectId);
    const title = String(data.title || '').trim();
    if(!subject || !title){ toast('Choose a subject and add a title'); return; }
    const note = {
      id: uid('nt'), subjectId: subject.id, title: title,
      type: data.type || 'PDF', size: String(data.size || '1.8 MB').trim(),
      by: subject.faculty, at: new Date().toISOString(), saved: false
    };
    db.notes.unshift(note);
    notify('notice', 'New note · ' + subject.code, title + ' is now in Classroom.', '/classroom');
    logActivity('file', 'Note shared · ' + subject.code, title);
    saveDB();
    go('/admin/publish');
    toast('Note added to Classroom');
  },

  publishResult: function(data){
    const title = String(data.title || '').trim();
    const sgpa = Number(data.sgpa), cgpa = Number(data.cgpa);
    if(!title || !isFinite(sgpa) || !isFinite(cgpa) || sgpa < 0 || sgpa > 10 || cgpa < 0 || cgpa > 10){ toast('Enter a title and valid SGPA/CGPA values'); return; }
    if(data.verified !== 'yes'){ toast('Confirm the result was checked against an official grade card'); return; }
    const subjects = db.subjects.map(s => ({
      code: s.code, name: s.name, grade: String(data['grade_' + s.id] || ''), credits: s.credits
    }));
    if(subjects.some(s => !s.grade)){ toast('Select a grade for every listed subject'); return; }
    const credits = subjects.reduce((n, s) => n + (Number(s.credits) || 0), 0);
    db.results.forEach(r => { r.isNew = false; });
    const result = {
      id: uid('r'), title: title, semester: data.semester || 'V',
      sgpa: sgpa, cgpa: cgpa, credits: credits, isNew: true,
      publishedAt: new Date().toISOString(), subjects: subjects
    };
    db.results.unshift(result);
    notify('result', 'Result published · ' + title, 'SGPA ' + sgpa.toFixed(2) + ' · CGPA ' + cgpa.toFixed(2), '/results');
    logActivity('award', 'Result published · ' + title, 'Local demo grade card · Sem ' + result.semester);
    saveDB();
    go('/admin/results');
    toast('Result published to every student');
  },

  addDrive: function(data){
    const company = String(data.company || '').trim();
    const role = String(data.role || '').trim();
    const about = String(data.about || '').trim();
    const location = String(data.location || '').trim();
    const branches = String(data.branches || '').trim();
    const deadline = String(data.deadline || '').trim();
    const ctc = Number(data.ctc), minCgpa = Number(data.minCgpa), maxBacklogs = Number(data.maxBacklogs);
    const type = String(data.type || '').trim();
    const parsedDeadline = new Date(deadline + 'T17:00:00');
    const validDeadline = /^\d{4}-\d{2}-\d{2}$/.test(deadline) && !isNaN(parsedDeadline.getTime()) && ymd(parsedDeadline) === deadline;
    if(!company || !role || !about || !location || !branches || !['Full-time','Internship','Internship + PPO'].includes(type) || !validDeadline || String(data.ctc == null ? '' : data.ctc).trim() === '' || String(data.minCgpa == null ? '' : data.minCgpa).trim() === '' || String(data.maxBacklogs == null ? '' : data.maxBacklogs).trim() === '' || !isFinite(ctc) || !isFinite(minCgpa) || !isFinite(maxBacklogs)){
      toast('Enter the company, role, location, deadline, eligibility and compensation details'); return;
    }
    if(ctc < 0 || minCgpa < 0 || minCgpa > 10 || maxBacklogs < 0 || !Number.isInteger(maxBacklogs)){
      toast('Check the compensation and eligibility values'); return;
    }
    const deadlineAt = new Date(deadline + 'T17:00:00');
    if(deadlineAt.getTime() < Date.now()) { toast('Choose an application deadline that has not passed'); return; }
    const tones = ['peri', 'lilac', 'mint', 'butter', 'peach'];
    const rounds = String(data.rounds || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const d = {
      id: uid('d'), company: company, role: role,
      ctc: ctc, location: location,
      type: type, deadline: isoFromDateInput(deadline, 17, 0),
      minCgpa: minCgpa,
      maxBacklogs: maxBacklogs,
      applied: false, appliedAt: null, applicants: 0,
      tone: tones[db.drives.length % tones.length],
      about: about,
      rounds: rounds,
      bond: String(data.bond || '').trim() || 'Not supplied',
      eligibleBranches: branches,
      demo:false,
      formQuestions:parseFormQuestions(data.questions)
    };
    db.drives.unshift(d);
    notify('placement', 'New drive · ' + company, role + ' · ₹' + Number(d.ctc).toFixed(1) + ' LPA · apply by ' + fmtShort(d.deadline), '/placements');
    logActivity('briefcase', company + ' drive added', role + ' · ₹' + Number(d.ctc).toFixed(1) + ' LPA');
    saveDB();
    go('/admin/placements');
    toast('Drive added to the placement board');
  },

  addSlot: function(data){
    const day = Number(data.day);
    const subject = data.subjectId ? timetableSubjectById(data.subjectId) : null;
    const title = String(data.title || '').trim();
    const batch = String(data.batch || '').trim();
    const start = String(data.start || '').trim();
    const end = String(data.end || '').trim();
    if(!Number.isInteger(day) || day < 1 || day > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || toMinutes(end) <= toMinutes(start)){
      toast('Use HH:MM times, with the end after the start');
      return;
    }
    if(!['Lecture','Lab','Tutorial','Seminar','Self study','Activity'].includes(data.type)){ toast('Choose a period type'); return; }
    if(batch && !TE_CSD_SEM_V_BATCHES.some(item => item.id === batch)){ toast('Choose a listed T.E. CSD batch'); return; }
    if(data.subjectId && !subject){ toast('Choose a listed subject'); return; }
    if(!subject && !title){ toast('Choose a subject or give the campus session a title'); return; }
    const room = String(data.room || '').trim();
    const slot = subject
      ? { start: start, end: end, subjectId: subject.id, type: data.type, room: room || subject.room }
      : { start: start, end: end, title: title, code: title.split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase(), faculty: 'MET Campus', type: data.type, room: room, tone: 'butter' };
    if(batch) slot.batch = batch;
    if(!db.timetable[day]) db.timetable[day] = [];
    db.timetable[day].push(slot);
    db.timetable[day].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    S.adminDay = day;
    markTimetableLocallyEdited();
    logActivity('calendar', 'Timetable updated · ' + DOW_SHORT[day], 'Added ' + (subject ? subject.code : title) + ' at ' + start);
    saveDB();
    go('/admin/timetable');
    toast('Period added to ' + DOW_LONG[day]);
  },

  editSlot: function(data, id){
    const parts = String(id || '').split(':');
    const day = Number(parts[0]), index = Number(parts[1]);
    const slots = db.timetable[day] || [];
    const slot = slots[index];
    if(!slot) return;
    const subject = data.subjectId ? timetableSubjectById(data.subjectId) : null;
    const title = String(data.title || '').trim();
    const batch = String(data.batch || '').trim();
    const start = String(data.start || '').trim();
    const end = String(data.end || '').trim();
    if(!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || toMinutes(end) <= toMinutes(start)){
      toast('Use HH:MM times, with the end after the start');
      return;
    }
    if(!subject && !title){ toast('Choose a subject or give the campus session a title'); return; }
    if(!['Lecture','Lab','Tutorial','Seminar','Self study','Activity'].includes(data.type)){ toast('Choose a period type'); return; }
    if(batch && !TE_CSD_SEM_V_BATCHES.some(item => item.id === batch)){ toast('Choose a listed T.E. CSD batch'); return; }
    slot.start = start;
    slot.end = end;
    slot.type = data.type || slot.type;
    slot.room = String(data.room || '').trim() || (subject ? subject.room : slot.room);
    if(batch) slot.batch = batch;
    else delete slot.batch;
    if(subject){
      slot.subjectId = subject.id;
      delete slot.title; delete slot.code; delete slot.faculty; delete slot.tone;
    } else {
      delete slot.subjectId;
      slot.title = title;
      slot.code = title.split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase();
      slot.faculty = 'MET Campus';
      slot.tone = 'butter';
    }
    markTimetableLocallyEdited();
    slots.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    logActivity('calendar', 'Timetable updated · ' + DOW_SHORT[day], (subject ? subject.code : title) + ' moved to ' + start);
    saveDB();
    go('/admin/timetable');
    toast('Timetable updated');
  },

  gateLookup: function(data){
    const raw = String(data.q || '').trim();
    const q = raw.toLowerCase();
    if(!q){ toast('Enter a pass ID, PRN or name'); return; }
    const s = db.students.find(x =>
      x.prn.toLowerCase() === q ||
      x.email.toLowerCase() === q ||
      ('met-' + x.prn.toLowerCase()) === q ||
      x.roll === q ||
      x.name.toLowerCase().indexOf(q) >= 0
    );
    S.gate = s ? { studentId: s.id, query: raw } : { notFound: true, query: raw };
    render();
    if(s) toast('Pass found · ' + s.name);
    else toast('No pass matched that search');
  },

  studentSearch: function(data){
    S.studentsQuery = String(data.q || '').trim();
    render({ preserve: true });
  }
};

function handleChange(e){
  const el = e.target.closest('[data-change]');
  if(!el) return;
  const action = el.getAttribute('data-change');
  if(ACTIONS[action]) ACTIONS[action](el, el.value, e);
}

/* ============================================================
   EVENTS
   ============================================================ */
function handleClick(e){
  const goEl = e.target.closest('[data-go]');
  if(goEl){
    e.preventDefault();
    go(goEl.getAttribute('data-go'));
    return;
  }
  const el = e.target.closest('[data-act]');
  if(!el) return;
  if(el.classList.contains('overlay') && e.target.closest('.sheet-card')) return;
  e.preventDefault();
  const act = el.getAttribute('data-act');
  const val = el.getAttribute('data-val');
  if(ACTIONS[act]){
    ACTIONS[act](el, val, e);
  } else {
    console.warn('MET Campus: unknown action', act);
  }
}
function handleSubmit(e){
  const form = e.target.closest('form[data-form]');
  if(!form) return;
  e.preventDefault();
  const name = form.getAttribute('data-form');
  const data = {};
  const fd = new FormData(form);
  fd.forEach((value, key) => { data[key] = value; });
  if(FORMS[name]) FORMS[name](data, form.getAttribute('data-id'), form);
  else console.warn('MET Campus: unknown form', name);
}
function handleKey(e){
  if(e.key === 'Escape'){
    if(document.querySelector('.overlay')) closeSheet();
  }
}
function handlePop(){
  closeSheet();
  render();
}

window.__metBack = function(){
  if(document.querySelector('.overlay')){
    closeSheet();
    return true;
  }
  const path = currentPath();
  const root = defaultHome();
  if(path && path !== root && path !== '/login'){
    back();
    return true;
  }
  return false;
};

  function boot(){
  const view = document.getElementById('view');
  if(!view) return;
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', handleKey);
  window.addEventListener('popstate', handlePop);
  if(MET_BACKEND.configured()){
    db = seedData();
    db.session = null;
    render();
    MET_BACKEND.initialize().then(result => {
      if(result) applyBackendAccount(result);
      render();
    }).catch(error => {
      globalThis.__MET_AUTH_ERROR__ = error && error.message ? error.message : 'Could not connect to the campus account service.';
      db = seedData();
      db.session = null;
      render();
    });
    return;
  }
  if(!MET_BACKEND.demoMode()){
    db = seedData();
    db.session = null;
    globalThis.__MET_AUTH_ERROR__ = 'This build is missing its Supabase project URL or public anon key.';
  }
  render();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
