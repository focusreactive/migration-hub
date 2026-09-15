// Transcribed from docs/design/report.design.html:748-1002 (the page script: the
// section-detail modal's data wiring, the section-library filters, the page
// composition disclosure toggle and the scroll-progress bar).
//
// Five changes from the design source, and no others (see task-23-brief.md for the
// full rationale):
//
// 1. The two hardcoded global entries that were appended to DATA (design lines
//    758-761) are replaced by a `var GLOBALS = __GLOBALS__;` placeholder that
//    renderHtmlReport fills with a JSON array built from `input.globals.types`.
// 2. The `ALIAS` fuzzy short-caption map (design line 762) is replaced by a
//    `var TYPES = __TYPES__;` placeholder keyed by typeId. `dataForShot` (the
//    function that resolves a bare thumbnail elsewhere on the page to its type) now
//    looks up `TYPES[shot]` directly instead of normalizing a derived name through
//    `ALIAS`/`DATA`. `resolve()` itself (used by the section-grid card click handler
//    and the hero click handler, both of which already carry a full name) keeps its
//    DATA-based lookup verbatim, minus the now-deleted ALIAS line.
// 3. `SITE` and `TPL` (design lines 764-769) become `__SITE__`/`__TPL__`
//    placeholders, filled from `input.sourceUrl` and from the collection/exemplar
//    data behind `linker.collectionAnchor`.
// 4. `paint()`'s `img.src = '../assets/' + d.shot` becomes `img.src = SHOTS[d.shot]`,
//    with the "no screenshot" branch also firing when `SHOTS[d.shot]` is missing.
//    `dataForShot`'s `img.getAttribute('src').split('/').pop()` becomes
//    `img.getAttribute('data-shot')`.
// 5. A pass added at the top of the IIFE fills `src` on every `img[data-shot]` from
//    `SHOTS` on load.
//
// `SHOTS` itself is not declared here: it is emitted by a separate embedded
// `<script>` (src/scripts/report/html/utils/shots.ts's `scriptMap()`) that runs
// before this one, as a page-global `var SHOTS = {...}`.
export const PAGE_SCRIPT = `
(function(){
  [].slice.call(document.querySelectorAll('img[data-shot]')).forEach(function(img){ var src = SHOTS[img.getAttribute('data-shot')]; if (src) img.src = src; });
  var modal = document.getElementById('secmodal');
  var $ = function(id){ return document.getElementById(id); };
  var norm = function(s){ return (s || '').trim().toLowerCase(); };
  var grid = $('secGrid');
  var cards = grid ? [].slice.call(grid.querySelectorAll('.seccard')) : [];
  var DATA = {};
  cards.forEach(function(c){
    DATA[norm(c.dataset.name)] = { name: c.dataset.name, count: c.dataset.count, kind: c.dataset.kind, shot: c.dataset.shot, pages: c.dataset.pages, summary: c.dataset.summary };
  });
  var GLOBALS = __GLOBALS__;
  GLOBALS.forEach(function(d){ DATA[norm(d.name)] = d; });
  var TYPES = __TYPES__;

  var SITE = __SITE__;
  var SITE_HOST = (function(){ try { return new URL(SITE).hostname; } catch (e) { return SITE; } })();
  var TPL = __TPL__;
  function pageLink(tok){
    var key = norm(tok).replace(/\\s+/g, ' ');
    var t = TPL[key];
    if (!t && tok.charAt(0) === '/') t = { label: tok === '/' ? '/home' : tok, href: SITE + (tok === '/' ? '/' : tok), tip: (tok === '/' ? 'Home' : 'Open ' + tok) + ' · ' + SITE_HOST };
    if (!t) return null;
    var a = document.createElement('a');
    a.className = 'pathlink';
    a.href = t.href; a.target = '_blank'; a.rel = 'noreferrer'; a.title = t.tip;
    a.textContent = t.label;
    return a;
  }
  function renderPages(str){
    var host = $('mPages');
    host.textContent = '';
    if (!str) return;
    var toks = str.split('·').map(function(t){ return t.trim(); }).filter(Boolean);
    var extra = toks.length > 10 ? toks.length - 10 : 0;
    toks.slice(0, 10).forEach(function(tok, i){
      if (i) host.appendChild(document.createTextNode(' · '));
      var a = pageLink(tok);
      host.appendChild(a || document.createTextNode(tok));
    });
    if (extra) host.appendChild(document.createTextNode(' +' + extra + ' more'));
  }

  function resolve(name, fallback){
    var key = norm(name);
    var known = DATA[key];
    var out = {};
    var k;
    for (k in fallback) out[k] = fallback[k];
    if (known) for (k in known) { if (known[k]) out[k] = known[k]; }
    return out;
  }
  function nameFor(sb){
    var sib = sb.nextElementSibling;
    if (sib && !sib.children.length && sib.textContent.trim()) return sib.textContent.trim();
    var card = sb.closest('.card');
    var h = card ? card.querySelector('h3') : null;
    return h ? h.textContent.trim() : 'Section';
  }
  function dataForShot(sb){
    var name = nameFor(sb);
    var img = sb.querySelector('img');
    var card = sb.closest('.card');
    var h = card ? card.querySelector('h3') : null;
    var route = card ? card.querySelector('.mono') : null;
    var ctx = '';
    if (h && norm(h.textContent) !== norm(name)) {
      ctx = h.textContent.trim() + (route ? ' · ' + route.textContent.trim() : '');
    }
    var shot = img ? img.getAttribute('data-shot') : '';
    var known = TYPES[shot];
    var out = { name: name, shot: shot, kind: '', count: '', summary: '', pages: ctx };
    var k;
    if (known) for (k in known) { if (known[k]) out[k] = known[k]; }
    return out;
  }

  var list = [], idx = -1;
  function chip(text){
    var s = 'height: 24px; font-size: 11.5px; padding: 0 10px;';
    var el = document.createElement('span');
    el.className = 'chip';
    el.setAttribute('style', s);
    el.textContent = text;
    return el;
  }
  function paint(d){
    $('mName').textContent = d.name;
    $('mShot').innerHTML = '';
    if (d.shot && SHOTS[d.shot]) {
      var img = document.createElement('img');
      img.src = SHOTS[d.shot];
      img.alt = d.name;
      $('mShot').appendChild(img);
    } else {
      var sp = document.createElement('span');
      sp.textContent = 'NO SCREENSHOT CAPTURED';
      $('mShot').appendChild(sp);
    }
    var chips = $('mChips');
    chips.innerHTML = '';
    (d.kind ? d.kind.split(',') : []).forEach(function(k){
      k = k.trim();
      if (k) chips.appendChild(chip(k));
    });
    if (d.count) chips.appendChild(chip(d.count + (d.count === '1' ? ' instance' : ' instances')));
    $('mSummary').textContent = d.summary || '';
    $('mSummary').hidden = !d.summary;
    renderPages(d.pages);
    $('mMeta').hidden = !d.pages;
    var multi = list.length > 1;
    $('mNav').style.display = multi ? 'flex' : 'none';
    if (multi) $('mPos').textContent = (idx + 1) + ' / ' + list.length;
  }
  function step(n){
    if (list.length < 2) return;
    idx = (idx + n + list.length) % list.length;
    paint(list[idx]);
  }
  function open(items, i){
    list = items; idx = i;
    paint(list[idx]);
    if (!modal.open) modal.showModal();
  }
  $('mClose').addEventListener('click', function(){ modal.close(); });
  $('mPrev').addEventListener('click', function(){ step(-1); });
  $('mNext').addEventListener('click', function(){ step(1); });
  modal.addEventListener('click', function(e){ if (e.target === modal) modal.close(); });
  document.addEventListener('keydown', function(e){
    if (!modal.open) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  function activate(el, handler){
    el.addEventListener('click', handler);
    el.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  }

  cards.forEach(function(c){
    activate(c, function(){
      var visible = cards.filter(function(x){ return x.dataset.match !== '0'; });
      var items = visible.map(function(x){ return resolve(x.dataset.name, { name: x.dataset.name, count: x.dataset.count, kind: x.dataset.kind, shot: x.dataset.shot, pages: x.dataset.pages, summary: x.dataset.summary }); });
      open(items, visible.indexOf(c));
    });
  });

  var shots = [].slice.call(document.querySelectorAll('.shotbox')).filter(function(sb){
    return !sb.closest('#secmodal') && !sb.closest('.seccard');
  });
  shots.forEach(function(sb){
    sb.classList.add('tapshot');
    sb.setAttribute('role', 'button');
    sb.setAttribute('tabindex', '0');
    activate(sb, function(){
      var card = sb.closest('.card');
      var group = card ? [].slice.call(card.querySelectorAll('.shotbox')) : [sb];
      if (group.length < 2) group = [sb];
      open(group.map(dataForShot), group.indexOf(sb));
    });
  });

  var hero = document.querySelector('img.shot');
  if (hero) {
    hero.style.cursor = 'zoom-in';
    hero.setAttribute('tabindex', '0');
    hero.setAttribute('role', 'button');
    activate(hero, function(){
      open([resolve('Home hero with full-width photo', { name: 'Home page hero', shot: 'sec-hero.jpg', kind: '', count: '', pages: '/', summary: '' })], 0);
    });
  }

  // Page composition disclosure
  var pageToggle = $('pageToggle'), pageRest = $('pageRest');
  if (pageToggle && pageRest) {
    pageToggle.addEventListener('click', function(){
      var open = pageRest.style.display === 'none';
      pageRest.style.display = open ? 'flex' : 'none';
      pageToggle.setAttribute('aria-expanded', String(open));
      pageToggle.textContent = open ? 'Show fewer' : 'Show all 12 layout pages';
    });
  }

  // Section library filtering
  var filters = $('secFilters');
  if (filters && grid) {
    var search = $('secSearch');
    var countEl = $('secCount');
    var more = $('secMore');
    var empty = $('secEmpty');
    var active = 'all';
    var toggle = $('secToggle');
    var expanded = false;
    var LIMIT = 12;
    function apply(){
      var q = norm(search.value);
      var matches = 0, shown = 0;
      var collapsed = !expanded && active === 'all' && !q;
      cards.forEach(function(c){
        var tags = c.dataset.tags.split(' ');
        var okTag = active === 'all' || tags.indexOf(active) > -1;
        var hay = (c.dataset.name + ' ' + c.dataset.kind + ' ' + c.dataset.pages).toLowerCase();
        var okQ = !q || hay.indexOf(q) > -1;
        var match = okTag && okQ;
        c.dataset.match = match ? '1' : '0';
        if (match) matches++;
        c.hidden = !match || (collapsed && matches > LIMIT);
        if (!c.hidden) shown++;
      });
      var btn = filters.querySelector('[aria-pressed="true"]');
      var total = btn ? btn.dataset.total : '34';
      if (more) more.hidden = true;
      if (empty) empty.hidden = shown > 0;
      if (countEl) countEl.textContent = shown + ' shown · ' + total + ' in the library';
      if (toggle) {
        toggle.hidden = matches <= LIMIT || !(active === 'all' && !q);
        toggle.textContent = collapsed ? 'Show all ' + matches + ' section types' : 'Show fewer';
        toggle.setAttribute('aria-expanded', String(!collapsed));
      }
    }
    if (toggle) toggle.addEventListener('click', function(){ expanded = !expanded; apply(); });
    [].slice.call(filters.children).forEach(function(b){
      b.addEventListener('click', function(){
        active = b.dataset.filter;
        [].slice.call(filters.children).forEach(function(x){
          var on = x === b;
          x.classList.toggle('chip-on', on);
          x.setAttribute('aria-pressed', String(on));
        });
        apply();
      });
    });
    search.addEventListener('input', apply);
    apply();
  }
  var bar = document.getElementById('scrollProgress');
  if (bar) {
    var ticking = false;
    function setProgress(){
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY || window.pageYOffset) / max : 0;
      bar.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
    }
    function onScroll(){ if (!ticking) { ticking = true; requestAnimationFrame(setProgress); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setProgress();
  }
})();
`;
