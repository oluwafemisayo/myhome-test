/* Minimal runtime for MyHome prototype components outside the Claude design canvas.
   Renders the template tree (DC_TREE) with Preact, re-rendering after each setState. */
(function () {
  const { h, render } = window.preact;

  class DCLogic {
    constructor(props) { this.props = props || {}; }
    setState(patch) {
      const p = typeof patch === 'function' ? patch(this.state) : patch;
      this.state = Object.assign({}, this.state, p);
      if (this.__schedule) this.__schedule();
    }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
  const ONLY = /^\{\{\s*([\w.$]+)\s*\}\}$/;

  function lookup(path, scope) {
    const parts = path.split('.');
    let cur = Object.prototype.hasOwnProperty.call(scope.vars, parts[0]) ? scope.vars[parts[0]] : scope.root[parts[0]];
    for (let i = 1; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function interp(str, scope) {
    if (typeof str !== 'string') return str;
    const m = ONLY.exec(str);
    if (m) return lookup(m[1], scope);
    return str.replace(HOLE, (_, p) => { const v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function build(node, scope) {
    if (typeof node === 'string') { const v = interp(node, scope); return v == null ? '' : String(v); }
    const tag = node[0], attrs = node[1], kids = node[2];
    if (tag === '#root') return kids.map((k) => build(k, scope));
    if (tag === 'sc-if') return interp(attrs.value, scope) ? kids.map((k) => build(k, scope)) : null;
    if (tag === 'sc-for') {
      const list = interp(attrs.list, scope) || [];
      return list.map((item) => kids.map((k) => build(k, { root: scope.root, vars: Object.assign({}, scope.vars, { [attrs.as]: item }) })));
    }
    const props = {};
    for (const name in attrs) {
      const v = interp(attrs[name], scope);
      if (v === undefined) continue;
      if (/^on[A-Z]/.test(name) && typeof v !== 'function') continue;
      if ((name === 'disabled' || name === 'open') && (v === false || v === 'false')) continue;
      props[name] = v;
    }
    return h(tag, props, ...kids.map((k) => build(k, scope)));
  }

  // def = { head, tree, Component } from DC_APPS; falls back to the single-app globals (pack page)
  window.mountDC = function (container, props, hooks, def) {
    hooks = hooks || {};
    def = def || { head: window.DC_HEAD, tree: window.DC_TREE, Component: window.DC_COMPONENT };
    if (def.head && window.__dcHeadFor !== def) {
      document.querySelectorAll('[data-dc-head]').forEach((el) => el.remove());
      const holder = document.createElement('div'); holder.innerHTML = def.head;
      Array.from(holder.children).forEach((el) => { el.setAttribute('data-dc-head', ''); document.head.appendChild(el); });
      window.__dcHeadFor = def;
    }
    const C = def.Component;
    const comp = new C(props || {});
    let queued = false;
    const draw = () => {
      queued = false;
      let tree;
      try { tree = build(def.tree, { root: comp.renderVals(), vars: {} }); }
      catch (e) { console.error(e); if (hooks.onError) hooks.onError(e); return; }
      render(h('div', { style: 'display:contents' }, tree), container);
      if (comp.componentDidUpdate) { try { comp.componentDidUpdate(); } catch (e) { console.error(e); } }
      if (hooks.afterRender) hooks.afterRender(comp);
    };
    comp.__schedule = () => { if (!queued) { queued = true; Promise.resolve().then(draw); } };
    draw();
    return { comp, unmount: () => { if (comp.componentWillUnmount) comp.componentWillUnmount(); render(null, container); } };
  };
})();
