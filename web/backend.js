/* Supabase Auth + account-scoped app-state sync. The service-role key is never used here. */
(function (global) {
  const config = global.__MET_CONFIG__ || {};
  const baseUrl = String(config.supabaseUrl || '').replace(/\/$/, '');
  const anonKey = String(config.supabaseAnonKey || '');
  const isPublishableKey = anonKey.indexOf('sb_publishable_') === 0;
  const authStorageKey = 'metCampus.supabase.auth.v1';
  const stateStoragePrefix = 'metCampus.v4.account.';
  let authSession = null;
  let pendingSave = null;
  let pendingCampusSave = null;
  let saveTimer = null;
  let campusSaveTimer = null;
  let saveQueue = Promise.resolve();
  let campusVersion = 0;
  let lastCampusData = null;
  let secureRequestId = 0;
  const secureRequests = new Map();

  function configured() { return !!(baseUrl && anonKey); }
  function demoMode() { return config.demoMode === true; }
  function userId() { return authSession && authSession.user ? authSession.user.id : ''; }

  function secureStore(action, value) {
    if (!global.ReactNativeWebView) {
      try {
        if (action === 'get') return Promise.resolve(global.localStorage.getItem(authStorageKey));
        if (action === 'set') global.localStorage.setItem(authStorageKey, value);
        if (action === 'delete') global.localStorage.removeItem(authStorageKey);
        return Promise.resolve(null);
      } catch (_) {
        return Promise.resolve(null);
      }
    }

    const requestId = 'secure-' + (++secureRequestId);
    return new Promise((resolve, reject) => {
      const timeout = global.setTimeout(() => {
        secureRequests.delete(requestId);
        reject(new Error('Secure session storage is unavailable.'));
      }, 8000);
      secureRequests.set(requestId, { resolve, reject, timeout });
      global.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'secure-storage', requestId: requestId, action: action, value: value || ''
      }));
    });
  }

  global.__metNativeReply = function (reply) {
    const pending = reply && secureRequests.get(reply.requestId);
    if (!pending) return;
    global.clearTimeout(pending.timeout);
    secureRequests.delete(reply.requestId);
    if (reply.error) pending.reject(new Error(reply.error));
    else pending.resolve(reply.value == null ? null : reply.value);
  };

  async function readSession() {
    if (authSession) return authSession;
    const raw = await secureStore('get');
    if (!raw) return null;
    try { authSession = JSON.parse(raw); return authSession; }
    catch (_) { await secureStore('delete'); return null; }
  }

  async function writeSession(session) {
    authSession = session || null;
    if (session) await secureStore('set', JSON.stringify(session));
    else await secureStore('delete');
  }

  async function request(path, options) {
    options = options || {};
    let session = options.session === false ? null : await readSession();
    const send = activeSession => {
      const headers = { apikey: anonKey, Accept: 'application/json' };
      if (options.body !== undefined) headers['Content-Type'] = 'application/json';
      if (options.prefer) headers.Prefer = options.prefer;
      if (activeSession && activeSession.access_token) headers.Authorization = 'Bearer ' + activeSession.access_token;
      else if (!isPublishableKey) headers.Authorization = 'Bearer ' + anonKey;
      return global.fetch(baseUrl + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      });
    };
    let response = await send(session);
    if (response.status === 401 && session && session.refresh_token) {
      const refreshed = await refreshSession(session);
      if (refreshed) {
        refreshed.user = refreshed.user || session.user;
        await writeSession(refreshed);
        session = refreshed;
        response = await send(session);
      }
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); }
      catch (_) { payload = { message: text }; }
    }
    if (!response.ok) {
      const message = payload && (payload.msg || payload.message || payload.error_description || payload.error);
      const error = new Error(message || 'The campus service could not complete the request.');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function authRequest(path, body, session) {
    const headers = { apikey: anonKey, 'Content-Type': 'application/json' };
    if (session && session.access_token) headers.Authorization = 'Bearer ' + session.access_token;
    else if (!isPublishableKey) headers.Authorization = 'Bearer ' + anonKey;
    const response = await global.fetch(baseUrl + path, {
      method: 'POST', headers: headers, body: JSON.stringify(body || {})
    });
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); }
      catch (_) { payload = { message: text }; }
    }
    if (!response.ok) {
      const message = payload && (payload.msg || payload.message || payload.error_description || payload.error);
      throw new Error(message || 'Sign-in failed. Check your account and try again.');
    }
    return payload;
  }

  async function getProfile(id) {
    const rows = await request('/rest/v1/profiles?select=*&id=eq.' + encodeURIComponent(id));
    if (!Array.isArray(rows) || !rows[0]) {
      throw new Error('This account has not been provisioned by a campus administrator.');
    }
    return rows[0];
  }

  async function getState(id) {
    const rows = await request('/rest/v1/user_app_state?select=state&user_id=eq.' + encodeURIComponent(id));
    return Array.isArray(rows) && rows[0] ? rows[0].state : null;
  }

  async function getCampusContent() {
    const rows = await request('/rest/v1/campus_content?select=data,version&id=eq.1');
    if (!Array.isArray(rows) || !rows[0]) throw new Error('Campus content is not initialized in Supabase.');
    campusVersion = Number(rows[0].version) || 0;
    return rows[0].data || {};
  }

  async function getFormResponses() {
    const rows = await request('/rest/v1/form_responses?select=id,user_id,kind,target_id,club_id,student_name,student_prn,student_email,submitted_at,payload&order=submitted_at.desc');
    return (Array.isArray(rows) ? rows : []).map(row => Object.assign({}, row.payload || {}, {
      id: row.id,
      kind: row.kind,
      targetId: row.target_id,
      studentId: row.user_id || '',
      studentName: row.student_name || '',
      prn: row.student_prn || '',
      email: row.student_email || '',
      submittedAt: row.submitted_at,
      clubId: row.club_id || ''
    }));
  }

  async function buildLoginResult(session) {
    if (!session || !session.user || !session.user.id) throw new Error('The service returned an invalid account session.');
    authSession = session;
    await secureStore('set', JSON.stringify(session));
    const profile = await getProfile(session.user.id);
    if (!profile.password_setup_completed_at) {
      return {
        session: session,
        profile: profile,
        state: null,
        campusContent: {},
        formResponses: [],
        requiresPasswordSetup: true
      };
    }
    const values = await Promise.all([
      getState(session.user.id), getCampusContent(), getFormResponses()
    ]);
    return { session: session, profile: profile, state: values[0], campusContent: values[1], formResponses: values[2] };
  }

  async function refreshSession(session) {
    if (!session || !session.refresh_token) return null;
    const refreshed = await authRequest('/auth/v1/token?grant_type=refresh_token', {
      refresh_token: session.refresh_token
    }, null);
    return refreshed;
  }

  async function initialize() {
    if (!configured()) return null;
    let saved = await readSession();
    if (!saved) return null;
    try {
      const user = await global.fetch(baseUrl + '/auth/v1/user', {
        headers: { apikey: anonKey, Authorization: 'Bearer ' + saved.access_token }
      });
      if (!user.ok) throw new Error('Session expired');
      saved.user = await user.json();
      return await buildLoginResult(saved);
    } catch (_) {
      try {
        saved = await refreshSession(saved);
        if (!saved) throw new Error('Session expired');
        return await buildLoginResult(saved);
      } catch (error) {
        await writeSession(null);
        throw error;
      }
    }
  }

  async function signIn(email, password) {
    if (!configured()) throw new Error('Backend is not configured for this build.');
    const session = await authRequest('/auth/v1/token?grant_type=password', {
      email: String(email || '').trim().toLowerCase(), password: String(password || '')
    }, null);
    try {
      return await buildLoginResult(session);
    } catch (error) {
      await writeSession(null);
      throw error;
    }
  }

  async function signInStudent(prn, password) {
    if (!configured()) throw new Error('Backend is not configured for this build.');
    const session = await authRequest('/functions/v1/student-sign-in', {
      prn: String(prn || '').trim(), password: String(password || '')
    }, null);
    try {
      return await buildLoginResult(session);
    } catch (error) {
      await writeSession(null);
      throw error;
    }
  }

  async function signInStaff(username, password) {
    if (!configured()) throw new Error('Backend is not configured for this build.');
    const session = await authRequest('/functions/v1/staff-sign-in', {
      username: String(username || '').trim().toLowerCase(), password: String(password || '')
    }, null);
    try {
      return await buildLoginResult(session);
    } catch (error) {
      await writeSession(null);
      throw error;
    }
  }

  async function completePasswordSetup(password) {
    if (!configured()) throw new Error('Backend is not configured for this build.');
    const session = await readSession();
    if (!session || !session.access_token) throw new Error('Sign in again before setting your password.');
    const response = await authRequest('/functions/v1/password-setup', { password: String(password || '') }, session);
    if (!response || !response.session) throw new Error('Password changed. Sign in again with your new password.');
    return await buildLoginResult(response.session);
  }

  async function requestPasswordReset(email) {
    if (!configured()) throw new Error('Backend is not configured for this build.');
    await authRequest('/auth/v1/recover', { email: String(email || '').trim().toLowerCase() }, null);
  }

  async function signOut() {
    const session = await readSession();
    try {
      await flush();
      if (session && session.access_token) {
        await global.fetch(baseUrl + '/auth/v1/logout?scope=global', {
          method: 'POST', headers: { apikey: anonKey, Authorization: 'Bearer ' + session.access_token }
        });
      }
    } finally {
      await writeSession(null);
    }
  }

  function localStateKey(id) { return stateStoragePrefix + id; }

  function userStateFromDB(db) {
    const assignmentState = {};
    (db.assignments || []).forEach(item => {
      assignmentState[item.id] = {
        submitted: !!item.submitted,
        submittedAt: item.submittedAt || null,
        submissionText: item.submissionText || '',
        submissionFile: item.submissionFile || ''
      };
    });
    const driveState = {};
    (db.drives || []).forEach(item => {
      driveState[item.id] = { applied: !!item.applied, appliedAt: item.appliedAt || null };
    });
    const subjectAttendance = {};
    (db.subjects || []).forEach(item => {
      subjectAttendance[item.id] = { attended: Number(item.attended) || 0, total: Number(item.total) || 0 };
    });
    const result = {
      prefs: db.prefs || {},
      subjectAttendance: subjectAttendance,
      assignmentState: assignmentState,
      driveState: driveState,
      notifications: db.notifications || [],
      entry: db.entry || {},
      labGroup: db.profile && db.profile.labGroup || ''
    };
    if (db.session && db.session.role !== 'student') {
      result.staffWorkspace = {
        students: db.students || [],
        sessions: db.sessions || [],
        gateRequests: db.gateRequests || [],
        gateLog: db.gateLog || [],
        activity: db.activity || []
      };
    }
    return result;
  }

  function campusContentFromDB(db) {
    const omit = (item, keys) => {
      const result = Object.assign({}, item);
      keys.forEach(key => { delete result[key]; });
      return result;
    };
    return {
      timetable: db.timetable || {},
      timetableInfo: db.timetableInfo || {},
      subjects: (db.subjects || []).map(item => omit(item, ['attended', 'total'])),
      assignments: (db.assignments || []).map(item => omit(item, ['submitted', 'submittedAt', 'submissionText', 'submissionFile'])),
      announcements: db.announcements || [],
      notes: db.notes || [],
      results: db.results || [],
      drives: (db.drives || []).filter(item => !item.demo).map(item => omit(item, ['applied', 'appliedAt'])),
      curriculum: db.curriculum || [],
      clubs: db.clubs || [],
      events: (db.events || []).filter(item => !item.demo)
    };
  }

  function formResponseRows(db) {
    if (!db.session || db.session.role !== 'student') return [];
    return (db.formResponses || []).filter(item => item.studentId === userId()).map(item => {
      const event = item.kind === 'event' && (db.events || []).find(row => row.id === item.targetId);
      return {
        id: item.id,
        user_id: userId(),
        kind: item.kind,
        target_id: item.targetId,
        club_id: event ? event.clubId : '',
        submitted_at: item.submittedAt || new Date().toISOString(),
        payload: {
          answers: item.answers || [],
          eligibilityPending: !!item.eligibilityPending
        }
      };
    });
  }

  function cacheState(state) {
    const id = userId();
    if (!id) return;
    try { global.localStorage.setItem(localStateKey(id), JSON.stringify(state)); }
    catch (error) { global.console.warn('MET Campus: local cache could not be updated', error); }
  }

  async function saveState(snapshot) {
    const id = userId();
    if (!id) return;
    await request('/rest/v1/user_app_state?on_conflict=user_id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: { user_id: id, state: snapshot }
    });
  }

  async function saveFormResponses(rows) {
    if (!rows.length) return;
    await request('/rest/v1/form_responses?on_conflict=user_id,kind,target_id', {
      method: 'POST',
      prefer: 'resolution=ignore-duplicates,return=minimal',
      body: rows
    });
  }

  async function saveCampusContent(patch, fullData) {
    const result = await request('/rest/v1/rpc/save_campus_content', {
      method: 'POST', body: { p_data: patch, p_expected_version: campusVersion }
    });
    const version = Number(result);
    if (!Number.isFinite(version)) throw new Error('Campus content sync returned an invalid version.');
    campusVersion = version;
    lastCampusData = fullData;
  }

  function scheduleSave(db) {
    const id = userId();
    if (!configured() || !id || !db) return;
    const snapshot = userStateFromDB(db);
    cacheState(snapshot);
    pendingSave = snapshot;
    global.clearTimeout(saveTimer);
    saveTimer = global.setTimeout(() => { flush().catch(reportSyncError); }, 700);

    if (db.session && db.session.role !== 'student') {
      const fullData = campusContentFromDB(db);
      const patch = {};
      const previous = lastCampusData || {};
      Object.keys(fullData).forEach(key => {
        if (JSON.stringify(fullData[key]) !== JSON.stringify(previous[key])) patch[key] = fullData[key];
      });
      if (Object.keys(patch).length) {
        pendingCampusSave = { patch: patch, fullData: fullData };
        global.clearTimeout(campusSaveTimer);
        campusSaveTimer = global.setTimeout(() => { flush().catch(reportSyncError); }, 700);
      }
    }

    if (db.session && db.session.role === 'student') {
      const rows = formResponseRows(db);
      if (rows.length) {
        saveQueue = saveQueue.catch(() => {}).then(() => saveFormResponses(rows)).catch(reportSyncError);
      }
    }
  }

  function flush() {
    global.clearTimeout(saveTimer);
    global.clearTimeout(campusSaveTimer);
    saveTimer = null;
    campusSaveTimer = null;
    if (!userId()) return saveQueue;
    const snapshot = pendingSave;
    const campusPending = pendingCampusSave;
    pendingSave = null;
    pendingCampusSave = null;
    if (snapshot) saveQueue = saveQueue.catch(() => {}).then(() => saveState(snapshot));
    if (campusPending) {
      saveQueue = saveQueue.catch(() => {}).then(() => saveCampusContent(campusPending.patch, campusPending.fullData));
    }
    return saveQueue;
  }

  function reportSyncError(error) {
    global.console.error('MET Campus cloud sync failed:', error);
    global.__MET_SYNC_ERROR__ = 'Your latest changes could not be synced. Check your connection and try again.';
  }

  global.MET_BACKEND = {
    configured: configured,
    demoMode: demoMode,
    userId: userId,
    initialize: initialize,
    signIn: signIn,
    signInStudent: signInStudent,
    signInStaff: signInStaff,
    completePasswordSetup: completePasswordSetup,
    requestPasswordReset: requestPasswordReset,
    signOut: signOut,
    setCampusBaseline: function (db) { lastCampusData = campusContentFromDB(db); },
    scheduleSave: scheduleSave,
    flush: flush,
    cacheState: cacheState
  };
})(window);
