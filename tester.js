/* Tester layer: consent, tasks, feedback and results. Everything stays on the tester's phone
   until they choose to send it.

   Design comparison (config.js → designs):
   'both'   every tester tries both designs. Part 1 uses one design for all tasks; part 2 repeats
            compareTasks in the other design, then asks which they preferred. Order alternates at random.
   'random' each tester sees one design, picked at random.
   'current' / 'hearth'  everyone sees that design.
   A link can override it: ?design=current or ?design=hearth (one design), ?order=hearth-first. */
(function () {
  const S = window.STUDY || { tasks: [] };
  const KEY = 'myhome-study-v2';
  const NAMES = { current: 'blue and cream', hearth: 'green' };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode */ } };
  let st = load() || { pid: null, started: null, events: [], tasks: {}, tasks2: {}, current: null, order: null, phase: 1, pref: null };
  const now = () => new Date().toISOString();
  const log = (type, data) => { st.events.push(Object.assign({ type, at: now(), design: design() }, data || {})); if (st.events.length > 2000) st.events.shift(); save(); };
  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const params = new URLSearchParams(location.search);

  // ----- which design(s)
  function pickOrder() {
    const forced = params.get('design');
    if (forced === 'current' || forced === 'hearth') return [forced];
    const mode = S.designs || 'both';
    if (mode === 'current' || mode === 'hearth') return [mode];
    const hearthFirst = params.get('order') === 'hearth-first' ? true : params.get('order') === 'current-first' ? false : Math.random() < 0.5;
    const pair = hearthFirst ? ['hearth', 'current'] : ['current', 'hearth'];
    return mode === 'random' ? [pair[0]] : pair;
  }
  function design() { return st.order ? st.order[Math.min(st.phase, st.order.length) - 1] : (pickOrder()[0]); }
  const both = () => !!st.order && st.order.length === 2;
  const inPart2 = () => both() && st.phase === 2;
  const taskList = () => inPart2() ? S.tasks.filter((t) => (S.compareTasks || []).indexOf(t.id) >= 0) : S.tasks;
  const results = () => inPart2() ? st.tasks2 : st.tasks;

  let app = null; let lastScreen = null;
  function startApp() {
    if (app) app.unmount();
    const apps = window.DC_APPS || {};
    const def = apps[design()] || apps.current;
    const start = inPart2() ? 'Renting, set up' : (params.get('start') || 'Onboarding');
    document.documentElement.setAttribute('data-design', design());
    app = window.mountDC($('#app'), { startAt: start }, {
      afterRender: (comp) => { const s = comp.state && comp.state.screen; if (s && s !== lastScreen) { lastScreen = s; log('screen', { screen: s, task: st.current }); } },
      onError: (e) => { log('error', { message: String(e && e.message) }); $('#err').hidden = false; }
    }, def);
  }

  // ----- sheets
  function sheet(html) { const el = $('#sheet'); el.innerHTML = '<div class="sheet-card" role="dialog" aria-modal="true">' + html + '</div>'; el.hidden = false; const f = el.querySelector('button, textarea, input'); if (f) f.focus(); }
  function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  function welcome() {
    $('#welcome').hidden = false;
    const two = (S.designs || 'both') === 'both' && !params.get('design');
    $('#welcome').innerHTML = '<div class="w-card">' +
      '<span class="kick">PROTOTYPE TEST</span><h1>Thanks for helping test MyHome</h1>' +
      '<p>It’s an early version of an app for renters, buyers and homeowners. It takes about ' + S.minutes + ' minutes. There are no wrong answers. We’re testing the app, not you.</p>' +
      (two ? '<p><strong>There are two parts.</strong> First you’ll use the app for a few tasks. Then you’ll try a few of them again in a different design and tell us which you prefer.</p>' : '') +
      '<ul><li><strong>Use made-up details.</strong> Nothing you type leaves this phone unless you choose to send your results at the end.</li>' +
      '<li><strong>Everything is example data:</strong> letters, homes, firms and prices are fictional.</li>' +
      '<li><strong>What we record:</strong> which screens you visit, how long each task takes, and any notes you write. No names, no contacts.</li>' +
      '<li>You can stop at any time.</li></ul>' +
      '<label class="agree"><input type="checkbox" id="agree"> I understand and I’m happy to take part</label>' +
      '<button class="btn primary" id="go" disabled>Start</button></div>';
    $('#agree').addEventListener('change', (e) => { $('#go').disabled = !e.target.checked; });
    $('#go').addEventListener('click', () => {
      st.pid = st.pid || Math.random().toString(36).slice(2, 7).toUpperCase(); st.started = now(); st.order = pickOrder(); st.phase = 1;
      log('consent', { order: st.order }); save();
      $('#welcome').hidden = true; startApp(); showTasks(true);
    });
  }

  function taskRows() {
    const R = results();
    return taskList().map((t, i) => { const r = R[t.id] || {}; const status = r.result === 'done' ? '<span class="tag ok">Done</span>' : r.result === 'stuck' ? '<span class="tag due">Stuck</span>' : st.current === t.id ? '<span class="tag on">Now</span>' : '';
      return '<li><button class="task" data-id="' + t.id + '"><span class="n">' + (i + 1) + '</span><span class="tt"><strong>' + esc(t.title) + '</strong><span>' + esc(t.hint) + '</span></span>' + status + '</button></li>'; }).join('');
  }
  function showTasks(first) {
    const cur = taskList().find((t) => t.id === st.current);
    const part = both() ? '<span class="kick">PART ' + st.phase + ' OF 2</span>' : '';
    const next = both() && st.phase === 1 ? 'Next: part 2' : both() ? 'Next: which do you prefer?' : 'Finish and send';
    sheet(part + '<h2>' + (first ? 'Your tasks' : 'Tasks') + '</h2>' +
      (first ? '<p class="sub">Pick a task, then use the app as you normally would. Tap <strong>Tasks</strong> at the top when you’re done or stuck. Think out loud if someone’s with you.</p>' : '') +
      (cur ? '<div class="cur"><span class="kick">NOW</span><strong>' + esc(cur.title) + '</strong><span>' + esc(cur.hint) + '</span><div class="row"><button class="btn primary" id="done">I did it</button><button class="btn" id="stuck">I got stuck</button></div></div>' : '') +
      '<ol class="tasks">' + taskRows() + '</ol>' +
      '<div class="row"><button class="btn" id="close">Back to the app</button><button class="btn" id="finish">' + next + '</button></div>');
    document.querySelectorAll('.task').forEach((b) => b.addEventListener('click', () => { startTask(b.dataset.id); }));
    if (cur) { $('#done').addEventListener('click', () => endTask('done')); $('#stuck').addEventListener('click', () => endTask('stuck')); }
    $('#close').addEventListener('click', closeSheet);
    $('#finish').addEventListener('click', () => { if (both() && st.phase === 1) part2Intro(); else if (both()) preference(); else showResults(); });
  }
  function startTask(id) { const R = results(); st.current = id; R[id] = Object.assign({}, R[id], { started: now(), result: null }); log('task-start', { task: id, screen: lastScreen }); save(); updateBar(); closeSheet(); }
  function endTask(result) {
    const R = results(); const id = st.current; const t = R[id] || {}; const secs = t.started ? Math.round((Date.now() - Date.parse(t.started)) / 1000) : null;
    sheet('<h2>' + (result === 'done' ? 'Nice one' : 'Thanks, that’s useful') + '</h2><label class="lbl" for="tnote">' + (result === 'done' ? 'Anything confusing along the way? (optional)' : 'Where did you get stuck? (optional)') + '</label><textarea id="tnote" rows="4"></textarea><div class="row"><button class="btn primary" id="tsave">Save</button></div>');
    $('#tsave').addEventListener('click', () => { R[id] = Object.assign({}, t, { result, seconds: secs, note: $('#tnote').value.trim(), endScreen: lastScreen, design: design() }); log('task-end', { task: id, result, seconds: secs, screen: lastScreen }); st.current = null; save(); updateBar(); showTasks(false); });
  }

  // ----- part 2 and preference
  function part2Intro() {
    const n = taskList().length; const k = (S.compareTasks || []).length;
    sheet('<span class="kick">PART 2 OF 2</span><h2>Same app, different look</h2><p class="sub">Now try ' + k + ' of the tasks again in a different design. It works exactly the same way. Then we’ll ask which design you prefer.</p>' +
      '<p class="sub">You’ll start already set up as a renter, so there’s no need to sign up again.</p>' +
      '<div class="row"><button class="btn primary" id="p2">Start part 2</button><button class="btn" id="p2b">Back to part 1</button></div>');
    void n;
    $('#p2').addEventListener('click', () => { st.current = null; st.phase = 2; log('part2'); save(); lastScreen = null; startApp(); updateBar(); showTasks(true); });
    $('#p2b').addEventListener('click', () => showTasks(false));
  }
  function preference() {
    const a = NAMES[st.order[0]]; const b = NAMES[st.order[1]];
    const opt = (q, v, l) => '<label class="opt"><input type="radio" name="' + q + '" value="' + v + '"> ' + l + '</label>';
    const group = (q, legend) => '<fieldset class="fs"><legend>' + legend + '</legend>' + opt(q, 'first', 'The first one (' + a + ')') + opt(q, 'second', 'The second one (' + b + ')') + opt(q, 'same', 'No difference') + '</fieldset>';
    sheet('<span class="kick">LAST QUESTIONS</span><h2>Which design did you prefer?</h2>' +
      group('overall', 'Which would you rather use?') + group('read', 'Which was easier to read?') + group('find', 'In which was it easier to find things?') +
      '<label class="lbl" for="why">Why? (optional)</label><textarea id="why" rows="3"></textarea><div class="row"><button class="btn primary" id="psave">Save and see results</button></div>');
    $('#psave').addEventListener('click', () => {
      const val = (q) => { const el = document.querySelector('input[name="' + q + '"]:checked'); if (!el) return null; return el.value === 'first' ? st.order[0] : el.value === 'second' ? st.order[1] : 'no difference'; };
      st.pref = { overall: val('overall'), easierToRead: val('read'), easierToFind: val('find'), why: $('#why').value.trim() }; log('preference', st.pref); save(); showResults();
    });
  }

  function feedback() {
    sheet('<h2>Feedback</h2><p class="sub">About this screen (' + esc(lastScreen || 'start') + '). Anything goes: confusing words, missing things, what you liked.</p><textarea id="fb" rows="5" aria-label="Your feedback"></textarea><div class="row"><button class="btn primary" id="fbs">Save</button><button class="btn" id="fbc">Cancel</button></div>');
    $('#fbs').addEventListener('click', () => { const t = $('#fb').value.trim(); if (t) log('feedback', { screen: lastScreen, task: st.current, text: t }); closeSheet(); toast('Saved. Thank you.'); });
    $('#fbc').addEventListener('click', closeSheet);
  }
  function summary() {
    const rows = (R, list, d) => list.map((t) => Object.assign({ id: t.id, title: t.title, design: d }, R[t.id] || {}));
    const part2 = both() ? rows(st.tasks2, S.tasks.filter((t) => (S.compareTasks || []).indexOf(t.id) >= 0), st.order[1]) : [];
    return { study: S.name, participant: st.pid, started: st.started, finished: now(), designOrder: st.order, device: navigator.userAgent, screenSize: innerWidth + 'x' + innerHeight,
      tasks: rows(st.tasks, S.tasks, st.order ? st.order[0] : design()), part2Tasks: part2, preference: st.pref,
      feedback: st.events.filter((e) => e.type === 'feedback'), path: st.events.filter((e) => e.type === 'screen').map((e) => e.screen + (e.task ? '@' + e.task : '') + '#' + e.design), events: st.events };
  }
  function plain(sm) {
    const line = (t, i) => (i + 1) + '. ' + t.title + ': ' + (t.result || 'not tried') + (t.seconds != null ? ' (' + t.seconds + 's)' : '') + (t.note ? ' — ' + t.note : '');
    let out = 'MyHome test · participant ' + sm.participant + '\nDesign order: ' + (sm.designOrder || []).join(' then ') + '\n\nPart 1 tasks (' + (sm.designOrder ? sm.designOrder[0] : '') + ')\n' + sm.tasks.map(line).join('\n');
    if (sm.part2Tasks.length) out += '\n\nPart 2 tasks (' + sm.designOrder[1] + ')\n' + sm.part2Tasks.map(line).join('\n');
    if (sm.preference) out += '\n\nPreference\nWould rather use: ' + (sm.preference.overall || 'no answer') + '\nEasier to read: ' + (sm.preference.easierToRead || 'no answer') + '\nEasier to find things: ' + (sm.preference.easierToFind || 'no answer') + (sm.preference.why ? '\nWhy: ' + sm.preference.why : '');
    out += '\n\nFeedback\n' + (sm.feedback.map((f) => '[' + f.design + ' · ' + f.screen + '] ' + f.text).join('\n') || 'none') + '\n\nScreens\n' + sm.path.join(' > ');
    return out;
  }
  function showResults() {
    const sm = summary(); log('finish');
    const canPost = !!S.postUrl; const canMail = !!S.contactEmail;
    sheet('<h2>Send your results</h2><p class="sub">Here’s what will be shared: your task results, notes, your answers and the screens you visited. Nothing else.</p><pre class="pre">' + esc(plain(sm)) + '</pre>' +
      '<div class="col">' + (canPost ? '<button class="btn primary" id="post">Send results</button>' : '') + (canMail ? '<button class="btn' + (canPost ? '' : ' primary') + '" id="mail">Send by email</button>' : '') +
      '<button class="btn" id="copy">Copy results</button><button class="btn" id="dl">Download results file</button><button class="btn quiet" id="again">Start again (clears this test)</button><button class="btn quiet" id="back">Back to the app</button></div>');
    if (canPost) $('#post').addEventListener('click', () => { fetch(S.postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(sm) }).then((r) => toast(r.ok ? 'Sent. Thank you!' : 'Couldn’t send. Try email or copy instead.')).catch(() => toast('Couldn’t send. Try email or copy instead.')); });
    if (canMail) $('#mail').addEventListener('click', () => { location.href = 'mailto:' + encodeURIComponent(S.contactEmail) + '?subject=' + encodeURIComponent('MyHome test results ' + sm.participant) + '&body=' + encodeURIComponent(plain(sm).slice(0, 1800)); });
    $('#copy').addEventListener('click', () => { const t = plain(sm) + '\n\n' + JSON.stringify(sm); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied.')).catch(() => toast('Couldn’t copy on this browser. Use download.')); });
    $('#dl').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sm, null, 2)], { type: 'application/json' })); a.download = 'myhome-test-' + sm.participant + '.json'; a.click(); });
    $('#again').addEventListener('click', () => { if (!confirm('Clear this test and start again?')) return; localStorage.removeItem(KEY); location.reload(); });
    $('#back').addEventListener('click', closeSheet);
  }
  function toast(t) { const el = $('#ttoast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3000); }
  function updateBar() { const cur = taskList().find((t) => t.id === st.current); $('#barTask').textContent = (both() ? 'Part ' + st.phase + ' · ' : '') + (cur ? 'Task: ' + cur.title : 'Tasks'); }

  window.addEventListener('DOMContentLoaded', () => {
    $('#barTask').addEventListener('click', () => showTasks(false));
    $('#barFb').addEventListener('click', feedback);
    $('#errReset').addEventListener('click', () => { $('#err').hidden = true; startApp(); });
    $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    updateBar(); startApp();
    if (!st.pid) welcome();
  });
  window.__study = { state: () => st };
})();
