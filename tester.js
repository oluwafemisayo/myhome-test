/* Tester layer: consent, tasks, feedback and results. Everything stays on the tester's phone
   until they choose to send it. */
(function () {
  const S = window.STUDY || { tasks: [] };
  const KEY = 'myhome-study-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode */ } };
  let st = load() || { pid: null, started: null, events: [], tasks: {}, current: null };
  const now = () => new Date().toISOString();
  const log = (type, data) => { st.events.push(Object.assign({ type, at: now() }, data || {})); if (st.events.length > 2000) st.events.shift(); save(); };
  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let app = null; let lastScreen = null;
  function startApp() {
    if (app) app.unmount();
    const params = new URLSearchParams(location.search);
    app = window.mountDC($('#app'), { startAt: params.get('start') || 'Onboarding' }, {
      afterRender: (comp) => { const s = comp.state && comp.state.screen; if (s && s !== lastScreen) { lastScreen = s; log('screen', { screen: s, task: st.current }); } },
      onError: (e) => { log('error', { message: String(e && e.message) }); $('#err').hidden = false; }
    });
  }

  // ----- sheets
  function sheet(html) { const el = $('#sheet'); el.innerHTML = '<div class="sheet-card" role="dialog" aria-modal="true">' + html + '</div>'; el.hidden = false; const f = el.querySelector('button, textarea, input'); if (f) f.focus(); }
  function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  function welcome() {
    $('#welcome').hidden = false;
    $('#welcome').innerHTML = '<div class="w-card">' +
      '<span class="kick">PROTOTYPE TEST</span><h1>Thanks for helping test MyHome</h1>' +
      '<p>It’s an early version of an app for renters, buyers and homeowners. It takes about ' + S.minutes + ' minutes. There are no wrong answers. We’re testing the app, not you.</p>' +
      '<ul><li><strong>Use made-up details.</strong> Nothing you type leaves this phone unless you choose to send your results at the end.</li>' +
      '<li><strong>Everything is example data:</strong> letters, homes, firms and prices are fictional.</li>' +
      '<li><strong>What we record:</strong> which screens you visit, how long each task takes, and any notes you write. No names, no contacts.</li>' +
      '<li>You can stop at any time.</li></ul>' +
      '<label class="agree"><input type="checkbox" id="agree"> I understand and I’m happy to take part</label>' +
      '<button class="btn primary" id="go" disabled>Start</button></div>';
    $('#agree').addEventListener('change', (e) => { $('#go').disabled = !e.target.checked; });
    $('#go').addEventListener('click', () => {
      st.pid = st.pid || Math.random().toString(36).slice(2, 7).toUpperCase(); st.started = now(); log('consent'); save();
      $('#welcome').hidden = true; showTasks(true);
    });
  }

  function taskRows() {
    return S.tasks.map((t, i) => { const r = st.tasks[t.id] || {}; const status = r.result === 'done' ? '<span class="tag ok">Done</span>' : r.result === 'stuck' ? '<span class="tag due">Stuck</span>' : st.current === t.id ? '<span class="tag on">Now</span>' : '';
      return '<li><button class="task" data-id="' + t.id + '"><span class="n">' + (i + 1) + '</span><span class="tt"><strong>' + esc(t.title) + '</strong><span>' + esc(t.hint) + '</span></span>' + status + '</button></li>'; }).join('');
  }
  function showTasks(first) {
    const cur = S.tasks.find((t) => t.id === st.current);
    sheet('<h2>' + (first ? 'Your tasks' : 'Tasks') + '</h2>' +
      (first ? '<p class="sub">Pick a task, then use the app as you normally would. Tap <strong>Tasks</strong> at the top when you’re done or stuck. Think out loud if someone’s with you.</p>' : '') +
      (cur ? '<div class="cur"><span class="kick">NOW</span><strong>' + esc(cur.title) + '</strong><span>' + esc(cur.hint) + '</span><div class="row"><button class="btn primary" id="done">I did it</button><button class="btn" id="stuck">I got stuck</button></div></div>' : '') +
      '<ol class="tasks">' + taskRows() + '</ol>' +
      '<div class="row"><button class="btn" id="close">Back to the app</button><button class="btn" id="finish">Finish and send</button></div>');
    document.querySelectorAll('.task').forEach((b) => b.addEventListener('click', () => { startTask(b.dataset.id); }));
    if (cur) { $('#done').addEventListener('click', () => endTask('done')); $('#stuck').addEventListener('click', () => endTask('stuck')); }
    $('#close').addEventListener('click', closeSheet); $('#finish').addEventListener('click', results);
  }
  function startTask(id) { st.current = id; st.tasks[id] = Object.assign({}, st.tasks[id], { started: now(), result: null }); log('task-start', { task: id, screen: lastScreen }); save(); updateBar(); closeSheet(); }
  function endTask(result) {
    const id = st.current; const t = st.tasks[id] || {}; const secs = t.started ? Math.round((Date.now() - Date.parse(t.started)) / 1000) : null;
    sheet('<h2>' + (result === 'done' ? 'Nice one' : 'Thanks — that’s useful') + '</h2><label class="lbl" for="tnote">' + (result === 'done' ? 'Anything confusing along the way? (optional)' : 'Where did you get stuck? (optional)') + '</label><textarea id="tnote" rows="4"></textarea><div class="row"><button class="btn primary" id="tsave">Save</button></div>');
    $('#tsave').addEventListener('click', () => { st.tasks[id] = Object.assign({}, t, { result, seconds: secs, note: $('#tnote').value.trim(), endScreen: lastScreen }); log('task-end', { task: id, result, seconds: secs, screen: lastScreen }); st.current = null; save(); updateBar(); showTasks(false); });
  }
  function feedback() {
    sheet('<h2>Feedback</h2><p class="sub">About this screen (' + esc(lastScreen || 'start') + '). Anything goes: confusing words, missing things, what you liked.</p><textarea id="fb" rows="5" aria-label="Your feedback"></textarea><div class="row"><button class="btn primary" id="fbs">Save</button><button class="btn" id="fbc">Cancel</button></div>');
    $('#fbs').addEventListener('click', () => { const t = $('#fb').value.trim(); if (t) log('feedback', { screen: lastScreen, task: st.current, text: t }); closeSheet(); toast('Saved. Thank you.'); });
    $('#fbc').addEventListener('click', closeSheet);
  }
  function summary() {
    const tasks = S.tasks.map((t) => Object.assign({ id: t.id, title: t.title }, st.tasks[t.id] || {}));
    return { study: S.name, participant: st.pid, started: st.started, finished: now(), device: navigator.userAgent, screenSize: innerWidth + 'x' + innerHeight, tasks, feedback: st.events.filter((e) => e.type === 'feedback'), path: st.events.filter((e) => e.type === 'screen').map((e) => e.screen + (e.task ? '@' + e.task : '')), events: st.events };
  }
  function plain(sm) {
    return 'MyHome test · participant ' + sm.participant + '\n\nTasks\n' + sm.tasks.map((t, i) => (i + 1) + '. ' + t.title + ': ' + (t.result || 'not tried') + (t.seconds != null ? ' (' + t.seconds + 's)' : '') + (t.note ? ' — ' + t.note : '')).join('\n') + '\n\nFeedback\n' + (sm.feedback.map((f) => '[' + f.screen + '] ' + f.text).join('\n') || 'none') + '\n\nScreens\n' + sm.path.join(' > ');
  }
  function results() {
    const sm = summary(); log('finish');
    const canPost = !!S.postUrl; const canMail = !!S.contactEmail;
    sheet('<h2>Send your results</h2><p class="sub">Here’s what will be shared: your task results, notes and the screens you visited. Nothing else.</p><pre class="pre">' + esc(plain(sm)) + '</pre>' +
      '<div class="col">' + (canPost ? '<button class="btn primary" id="post">Send results</button>' : '') + (canMail ? '<button class="btn' + (canPost ? '' : ' primary') + '" id="mail">Send by email</button>' : '') +
      '<button class="btn" id="copy">Copy results</button><button class="btn" id="dl">Download results file</button><button class="btn quiet" id="again">Start again (clears this test)</button><button class="btn quiet" id="back">Back to the app</button></div>');
    if (canPost) $('#post').addEventListener('click', () => { fetch(S.postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(sm) }).then((r) => toast(r.ok ? 'Sent. Thank you!' : 'Couldn’t send — try email or copy instead.')).catch(() => toast('Couldn’t send — try email or copy instead.')); });
    if (canMail) $('#mail').addEventListener('click', () => { location.href = 'mailto:' + encodeURIComponent(S.contactEmail) + '?subject=' + encodeURIComponent('MyHome test results ' + sm.participant) + '&body=' + encodeURIComponent(plain(sm).slice(0, 1800)); });
    $('#copy').addEventListener('click', () => { const t = plain(sm) + '\n\n' + JSON.stringify(sm); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied.')).catch(() => toast('Couldn’t copy on this browser — use download.')); });
    $('#dl').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sm, null, 2)], { type: 'application/json' })); a.download = 'myhome-test-' + sm.participant + '.json'; a.click(); });
    $('#again').addEventListener('click', () => { if (!confirm('Clear this test and start again?')) return; localStorage.removeItem(KEY); location.reload(); });
    $('#back').addEventListener('click', closeSheet);
  }
  function toast(t) { const el = $('#ttoast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3000); }
  function updateBar() { const cur = S.tasks.find((t) => t.id === st.current); $('#barTask').textContent = cur ? 'Task: ' + cur.title : 'Tasks'; }

  window.addEventListener('DOMContentLoaded', () => {
    $('#barTask').addEventListener('click', () => showTasks(false));
    $('#barFb').addEventListener('click', feedback);
    $('#errReset').addEventListener('click', () => { $('#err').hidden = true; startApp(); });
    $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    updateBar(); startApp();
    if (!st.pid) welcome();
  });
})();
