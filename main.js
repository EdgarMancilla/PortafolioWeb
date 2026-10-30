// Edgar Mancilla, portafolio Front End.
// El inspector de la portada, cuatro demostraciones con datos de ejemplo,
// la línea del tiempo de proyectos y las entradas al hacer scroll.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const escHTML = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- entradas, una sola vez ----------
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -5% 0px', threshold: 0.1 });
$$('[data-reveal]').forEach((el) => io.observe(el));

// ---------- inspector: lee la página de verdad ----------
const hero = $('.hero');
const inspector = $('.inspector');
const outline = $('.inspector-outline');
const read = (key) => $(`[data-read="${key}"]`, inspector);

function parseRGB(str) {
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r, g, b, a };
}
const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(); // taste-skill-ignore: código hexadecimal de color
function luminance({ r, g, b }) {
  const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
// el fondo real: sube por los ancestros hasta encontrar uno opaco
function backgroundOf(el) {
  for (let p = el; p; p = p.parentElement) {
    const c = parseRGB(getComputedStyle(p).backgroundColor);
    if (c && c.a > 0.5) return c;
  }
  return { r: 255, g: 255, b: 255 };
}

function inspect(el) {
  if (!el) return;
  const cs = getComputedStyle(el);
  const color = parseRGB(cs.color);
  const bg = backgroundOf(el);
  const ratio = contrast(color, bg);
  const r = el.getBoundingClientRect();
  const family = cs.fontFamily.split(',')[0].replace(/["']/g, '');
  const cls = el.classList[0] ? '.' + el.classList[0] : '';
  read('tag').textContent = el.tagName.toLowerCase() + cls;
  read('font').textContent = `${family} ${cs.fontWeight}`;
  read('size').textContent = `${Math.round(parseFloat(cs.fontSize))}px / ${cs.lineHeight === 'normal' ? 'normal' : Math.round(parseFloat(cs.lineHeight)) + 'px'}`;
  read('color').textContent = hex(color);
  read('color-swatch').style.background = hex(color);
  read('bg').textContent = hex(bg);
  read('bg-swatch').style.background = hex(bg);
  read('ratio').textContent = `${ratio.toFixed(1)}:1`;
  const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
  const grade = ratio >= (big ? 4.5 : 7) ? 'AAA' : ratio >= (big ? 3 : 4.5) ? 'AA' : 'Bajo';
  read('grade').textContent = grade;
  read('grade').classList.toggle('is-low', grade === 'Bajo');
  read('box').textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;

  // el contorno, relativo a la portada
  const h = hero.getBoundingClientRect();
  outline.style.width = `${r.width + 8}px`;
  outline.style.height = `${r.height + 8}px`;
  outline.style.transform = `translate(${r.left - h.left - 4}px, ${r.top - h.top - 4}px)`;
  outline.classList.add('is-on');
}

const picks = $$('[data-pick]', inspector);
function pick(btn) {
  picks.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  inspect($(btn.dataset.pick));
}
picks.forEach((b) => b.addEventListener('click', () => pick(b)));

// con el puntero, lee lo que hay debajo en la mitad izquierda
const inspectable = 'h1, p, a, span[data-line]';
$('[data-inspectable]').addEventListener('pointermove', (e) => {
  const el = e.target.closest(inspectable);
  if (!el || !hero.contains(el)) return;
  const target = el.matches('span[data-line]') ? el.closest('h1') : el;
  picks.forEach((b) => b.setAttribute('aria-pressed', String(target.matches(b.dataset.pick))));
  inspect(target);
});
if (!finePointer) read('hint').textContent = 'Toca un texto de la portada';
window.addEventListener('resize', () => { const on = picks.find((b) => b.getAttribute('aria-pressed') === 'true'); if (on) inspect($(on.dataset.pick)); });
// primera lectura, cuando las fuentes ya cargaron y el título terminó de subir
document.fonts.ready.then(() => setTimeout(() => inspect($('.hero__title')), reduceMotion ? 0 : 1200));

// ---------- terminal ----------
{
  const screen = $('[data-screen]');
  const form = $('[data-form]');
  const input = $('#cmd');
  const history = [];
  let pointer = 0;

  const OUT = {
    ayuda: () => `Comandos disponibles:
  <span class="t-cmd">whoami</span>      quién soy
  <span class="t-cmd">proyectos</span>   los sistemas en los que trabajé
  <span class="t-cmd">stack</span>       herramientas por área
  <span class="t-cmd">calidad</span>     el resultado en SonarQube
  <span class="t-cmd">ia</span>          cómo uso la inteligencia artificial
  <span class="t-cmd">experiencia</span> puestos y fechas
  <span class="t-cmd">logros</span>      logros laborales
  <span class="t-cmd">contacto</span>    cómo escribirme
  <span class="t-cmd">whatsapp</span>    escribirme por WhatsApp
  <span class="t-cmd">cv</span>          abrir el CV en PDF
  <span class="t-cmd">abrir</span> &lt;sección&gt;  ir a una sección (demos, contacto…)
  <span class="t-cmd">limpiar</span>     borrar la pantalla`,
    whoami: () => `Edgar Jesús Mancilla Gutiérrez
Desarrollador Front End, Grupo Salinas
Tlalpan, Ciudad de México`,
    proyectos: () => `<span class="t-dim">2026</span>  Migración de Elektravales      migración y modernización
<span class="t-dim">2025</span>  Tienda de Monedas              configurador de app móvil
<span class="t-dim">2024</span>  Usuario Único                  back-office de usuarios
<span class="t-dim">2024</span>  Reportería                     reportes multiempresa
<span class="t-dim">2023</span>  Sistemas web del Afore         Angular
<span class="t-dim">2022</span>  Control de inventario          Java
Escribe <span class="t-cmd">abrir demos</span> para probar cuatro de ellos.`,
    stack: () => `interfaces   React, Angular, Material UI, Angular Material, PrimeNG, Bootstrap
lenguajes    TypeScript, JavaScript, HTML, CSS, Java, Python
calidad      SonarQube, Checkmarx, Jest
datos/apis   Postman, Swagger, Firestore, MySQL, Google Analytics
entrega      GitLab, GitHub, Jenkins, AWS EC2
equipo e ia  Jira con Scrum, Figma, y Kiro y Claude como apoyo en desarrollo`,
    calidad: () => `Quality Gate: <span class="t-cmd">Aprobado</span>
bugs 0 · vulnerabilidades 0 · code smells 0 · hotspots 0 · duplicación 0.0 %
En los cuatro proyectos recientes, por lineamiento de Grupo Salinas.`,
    ia: () => `herramientas  Kiro y Claude, como apoyo en desarrollo
uso           acelerar tareas repetitivas
revisión      cada resultado lo reviso, lo pruebo y lo valido
calidad       pasa por los mismos controles: SonarQube y Checkmarx
datos         nunca comparto información sensible
seguridad     sigo los lineamientos de seguridad del grupo`,
    logros: () => `Banco Azteca
  · Implementé el proceso de CI/CD del sistema Front End
  · Migré el portal Elektravales en tiempo récord, apoyado en IA
  · Reduje riesgos y reforcé la seguridad de Elektravales
Dale Desarrollos
  · Automaticé el control de inventario de cómputo y móviles`,
    experiencia: () => `jul 2024 – hoy        Desarrollador Front End, en Grupo Salinas
ago 2023 – jul 2024   Desarrollador Front End, Afore Azteca
nov 2021 – jun 2023   Desarrollador, Dale Desarrollos`,
    whatsapp: () => { setTimeout(() => window.openWhatsApp?.(), 0); return 'Abriendo el asistente de WhatsApp…'; },
    contacto: () => `correo    <a class="link" href="mailto:edgarjesus8@yahoo.com">edgarjesus8@yahoo.com</a>
teléfono  <a class="link" href="tel:+525632378049">56 3237 8049</a>`,
    cv: () => { const a = document.createElement('a'); a.href = 'Edgar_Mancilla_CV.pdf'; a.target = '_blank'; a.rel = 'noopener'; a.click(); return 'Abriendo Edgar_Mancilla_CV.pdf en una pestaña nueva…'; },
  };
  const ALIAS = { wa: 'whatsapp', whats: 'whatsapp', ai: 'ia', help: 'ayuda', clear: 'limpiar', projects: 'proyectos', contact: 'contacto', sobre: 'whoami', quien: 'whoami', 'quién': 'whoami' };
  const SECTIONS = { inicio: 'inicio', sobre: 'sobre-mi', proyectos: 'proyectos', demos: 'demos', laboratorio: 'demos', calidad: 'calidad', logros: 'logros', trayectoria: 'trayectoria', contacto: 'contacto' };

  function print(cmd, html) {
    const pre = document.createElement('pre');
    pre.innerHTML = `<code><span class="t-prompt">edgar@portafolio:~$</span> ${escHTML(cmd)}${html ? '\n' + html : ''}</code>`;
    screen.append(pre);
    screen.scrollTop = screen.scrollHeight;
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    history.push(cmd); pointer = history.length;
    const [word, ...rest] = cmd.toLowerCase().split(/\s+/);
    const name = ALIAS[word] || word;
    if (name === 'limpiar') { screen.innerHTML = ''; return; }
    if (name === 'abrir') {
      const id = SECTIONS[rest[0]];
      if (!id) return print(cmd, `<span class="t-err">¿Qué sección?</span> Prueba: ${Object.keys(SECTIONS).filter((k) => k !== 'laboratorio').join(', ')}`);
      print(cmd, `Abriendo ${rest[0]}…`);
      document.getElementById(id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (OUT[name]) return print(cmd, OUT[name]());
    print(cmd, `<span class="t-err">comando no encontrado:</span> ${escHTML(word)}. Escribe <span class="t-cmd">ayuda</span>.`);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { pointer = Math.max(0, pointer - 1); input.value = history[pointer]; e.preventDefault(); }
    if (e.key === 'ArrowDown' && history.length) { pointer = Math.min(history.length, pointer + 1); input.value = history[pointer] || ''; e.preventDefault(); }
    if (e.key === 'Tab' && input.value) {
      const hit = [...Object.keys(OUT), 'limpiar', 'abrir'].find((k) => k.startsWith(input.value.toLowerCase()));
      if (hit) { input.value = hit; e.preventDefault(); }
    }
  });
  $$('[data-run]').forEach((b) => b.addEventListener('click', () => run(b.dataset.run)));
  // un clic en la pantalla enfoca la línea de comandos (sin robar la selección de texto)
  screen.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus({ preventScroll: true }); });
}

// ---------- proyectos: línea del tiempo ----------
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const START = { y: 2021, m: 10 };            // noviembre 2021 (mes base 0)
  const now = new Date();
  const idx = (y, m) => (y - START.y) * 12 + (m - START.m);
  const TOTAL = idx(now.getFullYear(), now.getMonth());
  const label = (i) => { const t = START.m + i; return `${MES[t % 12]} ${START.y + Math.floor(t / 12)}`; };

  const JOBS = [
    {
      id: 'dale', company: 'Dale Desarrollos', role: 'Desarrollador', from: idx(2021, 10), to: idx(2023, 5),
      acts: ['Proyectos pequeños en JavaScript, Python y Java para uso de la empresa', 'Desarrollo de un control de inventario con Java', 'Soporte y consultas en base de datos con MySQL', 'Herramientas para el trabajo de todos los días'],
      stack: ['Java', 'Python', 'JavaScript', 'MySQL'],
    },
    {
      id: 'afore', company: 'Afore Azteca', group: 'Grupo Salinas', role: 'Desarrollador Front End', from: idx(2023, 7), to: idx(2024, 6),
      acts: ['Sistemas web en Angular con TypeScript', 'Integración de APIs y servicios externos', 'Optimización del rendimiento y la seguridad', 'Pruebas funcionales y corrección de errores', 'Despliegues con Jenkins y vulnerabilidades en cero en Checkmarx'],
      stack: ['Angular', 'TypeScript', 'Jenkins', 'Checkmarx'],
    },
    {
      id: 'banco', company: 'Banco Azteca', group: 'Grupo Salinas', role: 'Líder de Desarrollo Front End', from: idx(2024, 6), to: TOTAL,
      acts: ['Entré como desarrollador y me asignaron el liderazgo del equipo', 'Desarrollo en React e integración de APIs', 'SonarQube en cero: bugs, vulnerabilidades y código duplicado', 'Despliegues en AWS a QA y producción', 'Contratos YAML en Swagger, UX en Figma y tareas en Jira'],
      stack: ['React', 'AWS', 'SonarQube', 'GitLab', 'Swagger', 'Figma', 'Jira'],
    },
  ];
  const PROJECTS = [
    { id: 'inventario', job: 'dale', at: idx(2022, 5), name: 'Control de inventario', kind: 'Herramienta interna en Java' },
    { id: 'afore', job: 'afore', at: idx(2024, 0), name: 'Sistemas web del Afore', kind: 'Angular' },
    { id: 'reporteria', job: 'banco', at: idx(2024, 8), name: 'Reportería', kind: 'Reportes multiempresa', img: 'reporteria.webp', demo: 'demo-reporteria' },
    { id: 'usuario', job: 'banco', at: idx(2024, 9), name: 'Usuario Único', kind: 'Back-office de usuarios', img: 'usuario-unico.webp', demo: 'demo-usuario' },
    { id: 'monedas', job: 'banco', at: idx(2025, 2), name: 'Tienda de Monedas', kind: 'Configurador de app móvil', img: 'tienda-monedas.webp', demo: 'demo-monedas' },
    { id: 'elektravales', job: 'banco', at: idx(2026, 9), name: 'Elektravales', kind: 'Migración y modernización', img: 'elektravales.webp', demo: 'demo-elektravales' },
  ];

  const root = $('.tl');
  const bars = $('[data-bars]'), marks = $('[data-marks]'), years = $('[data-years]');
  const range = $('[data-range]'), when = $('[data-when]'), cursor = $('[data-cursor]'), detail = $('[data-detail]');
  const pct = (i) => (i / TOTAL) * 100;

  // pista: empresas
  for (const j of JOBS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tl__job'; b.dataset.job = j.id;
    b.style.left = pct(j.from) + '%'; b.style.width = pct(j.to - j.from) + '%';
    b.innerHTML = `<span>${j.company}</span><small>${label(j.from)} – ${j.to === TOTAL ? 'hoy' : label(j.to)}</small>`;
    b.setAttribute('aria-label', `${j.company}, ${j.role}, ${label(j.from)} a ${j.to === TOTAL ? 'hoy' : label(j.to)}`);
    b.addEventListener('click', (e) => go(Math.min(j.to, Math.max(j.from, +range.value >= j.from && +range.value <= j.to ? +range.value : j.from + 1)), null, e.detail === 0));
    bars.append(b);
  }
  // marcas: proyectos
  for (const p of PROJECTS) {
    const m = document.createElement('button');
    m.type = 'button'; m.className = 'tl__mark'; m.dataset.project = p.id;
    m.style.left = pct(p.at) + '%';
    if (pct(p.at) > 92) m.classList.add('is-end');
    if (pct(p.at) < 8) m.classList.add('is-start');
    m.innerHTML = `<span>${p.name}</span><i aria-hidden="true"></i>`;
    m.addEventListener('click', (e) => go(p.at, p.id, e.detail === 0));
    marks.append(m);
  }
  // años
  for (let y = START.y + 1; y <= now.getFullYear(); y++) {
    const s = document.createElement('span'); s.textContent = y; s.style.left = pct(idx(y, 0)) + '%'; years.append(s);
  }

  range.min = 0; range.max = TOTAL; range.value = TOTAL;
  const jobAt = (i) => JOBS.find((j) => i >= j.from && i <= j.to) || JOBS.reduce((a, j) => (j.to < i ? j : a), JOBS[0]);

  let current = null, swapT;
  function render(job, focusProject) {
    $('[data-role]').textContent = job.role;
    $('[data-where]').textContent = `${job.company}${job.group ? ', ' + job.group : ''} · ${label(job.from)} – ${job.to === TOTAL ? 'hoy' : label(job.to)}`;
    $('[data-acts]').innerHTML = job.acts.map((a) => `<li>${a}</li>`).join('');
    $('[data-stack]').innerHTML = job.stack.map((s) => `<span>${s}</span>`).join('');
    $('[data-projects]').innerHTML = PROJECTS.filter((p) => p.job === job.id).map((p) => `
      <article class="tl__proj${p.id === focusProject ? ' is-on' : ''}">
        <figure>${p.img ? `<img src="assets/proyectos/${p.img}" alt="Captura de ${p.name}" loading="lazy">` : 'Sin captura pública'}</figure>
        <div><b>${p.name}</b><p>${p.kind}, ${label(p.at)}</p>${p.demo ? `<a class="link link-plain" href="#${p.demo}">Probar la demo</a>` : ''}</div>
      </article>`).join('');
  }

  function go(i, projectId = null, instant = false) {
    i = Math.max(0, Math.min(TOTAL, i));
    range.value = i;
    when.textContent = label(i);
    root.classList.toggle('is-instant', instant || reduce);
    cursor.style.transform = `translateX(${(cursor.parentElement.clientWidth * pct(i)) / 100}px)`;
    const job = jobAt(i);
    const near = projectId || (PROJECTS.find((p) => p.job === job.id && Math.abs(p.at - i) <= 1) || {}).id;
    document.querySelectorAll('.tl__job').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.job === job.id)));
    document.querySelectorAll('.tl__mark').forEach((m) => m.classList.toggle('is-on', m.dataset.project === near));
    const key = job.id + '|' + near;
    if (key === current) return;
    const firstPaint = current === null;
    current = key;
    clearTimeout(swapT);
    if (firstPaint || instant || reduce) return render(job, near);
    detail.classList.add('is-swapping');
    swapT = setTimeout(() => { render(job, near); detail.classList.remove('is-swapping'); }, 110);
  }

  range.addEventListener('input', () => go(+range.value, null, true));
  // pasos: saltan de etapa en etapa (empresas y proyectos, en orden)
  const STOPS = [...new Set([...JOBS.map((j) => j.from + 1), ...PROJECTS.map((p) => p.at), TOTAL])].sort((a, b) => a - b);
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', (e) => {
    const dir = +b.dataset.step, v = +range.value;
    const next = dir > 0 ? STOPS.find((s) => s > v) : [...STOPS].reverse().find((s) => s < v);
    if (next !== undefined) go(next, (PROJECTS.find((p) => p.at === next) || {}).id || null, e.detail === 0);
  }));
  addEventListener('resize', () => go(+range.value, null, true));
  go(TOTAL, null, true);
})();

// ---------- demo: dispersiones (Elektravales) ----------
{
  const root = $('[data-demo="dispersiones"]');
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const data = [
    { folio: 'EV-20481', monto: 46000, vigencia: '27/10/2027', estatus: 'Disponible' },
    { folio: 'EV-20480', monto: 10499, vigencia: '27/10/2027', estatus: 'Confirmado' },
    { folio: 'EV-20479', monto: 18999, vigencia: '26/11/2026', estatus: 'Disponible' },
    { folio: 'EV-20477', monto: 85994, vigencia: '26/10/2027', estatus: 'Confirmado' },
    { folio: 'EV-20476', monto: 1000, vigencia: '26/10/2027', estatus: 'Disponible' },
    { folio: 'EV-20475', monto: 2000, vigencia: '26/10/2027', estatus: 'Disponible' },
  ];
  let filter = 'todos';
  const selected = new Set();
  const tbody = $('[data-rows]', root);
  const all = $('[data-all]', root);
  const cancel = $('[data-cancel]', root);
  const badge = (s) => `<span class="ui-badge ${s === 'Disponible' ? 'ui-badge--ok' : s === 'Cancelado' ? 'ui-badge--warn' : 'ui-badge--off'}">${s}</span>`;

  function render() {
    const rows = data.filter((d) => filter === 'todos' || d.estatus === filter);
    tbody.innerHTML = rows.map((d) => `
      <tr class="${selected.has(d.folio) ? 'is-selected' : ''}">
        <td><input type="checkbox" aria-label="Seleccionar ${d.folio}" data-folio="${d.folio}" ${selected.has(d.folio) ? 'checked' : ''} ${d.estatus === 'Cancelado' ? 'disabled' : ''}></td>
        <td>${d.folio}</td><td class="num">${money.format(d.monto)}</td><td>${d.vigencia}</td><td>${badge(d.estatus)}</td>
      </tr>`).join('');
    $('[data-count]', root).textContent = `(${rows.length})`;
    const selectable = rows.filter((d) => d.estatus !== 'Cancelado');
    all.checked = selectable.length > 0 && selectable.every((d) => selected.has(d.folio));
    all.indeterminate = !all.checked && selectable.some((d) => selected.has(d.folio));
    $('[data-selected]', root).textContent = `${selected.size} ${selected.size === 1 ? 'seleccionada' : 'seleccionadas'}`;
    cancel.disabled = selected.size === 0;
  }
  $$('[data-filter]', root).forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    $$('[data-filter]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  tbody.addEventListener('change', (e) => {
    const f = e.target.dataset.folio; if (!f) return;
    e.target.checked ? selected.add(f) : selected.delete(f);
    render();
  });
  all.addEventListener('change', () => {
    data.filter((d) => (filter === 'todos' || d.estatus === filter) && d.estatus !== 'Cancelado')
      .forEach((d) => (all.checked ? selected.add(d.folio) : selected.delete(d.folio)));
    render();
  });
  cancel.addEventListener('click', () => {
    data.forEach((d) => { if (selected.has(d.folio)) d.estatus = 'Cancelado'; });
    selected.clear();
    render();
  });
  render();
}

// ---------- demo: configuración que recibe el SDK (Tienda de Monedas) ----------
{
  const root = $('[data-demo="monedas"]');
  const code = $('[data-json]', root);
  const field = (n) => $(`[data-field="${n}"]`, root);
  let last = {};
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function render() {
    const cfg = {
      canal: field('canal').value,
      moneda: field('moneda').value,
      comision: Number(field('comision').value),
      venta: field('venta').checked,
      compra: true,
    };
    $('[data-out="comision"]', root).textContent = `${cfg.comision.toFixed(1)} %`;
    const lines = Object.entries(cfg).map(([k, v], i, arr) => {
      const val = typeof v === 'string' ? `<span class="s">"${esc(v)}"</span>` : `<span class="n">${v}</span>`;
      const changed = last[k] !== undefined && last[k] !== v && !reduceMotion;
      return `  <span class="${changed ? 'flash' : ''}"><span class="k">"${k}"</span>: ${val}${i < arr.length - 1 ? ',' : ''}</span>`;
    });
    code.innerHTML = `{\n${lines.join('\n')}\n}`;
    last = cfg;
  }
  root.addEventListener('input', render);
  root.addEventListener('change', render);
  render();
}

// ---------- demo: ficha de usuario (Usuario Único) ----------
{
  const root = $('[data-demo="usuario"]');
  const tabs = $$('[role="tab"]', root);
  function select(tab, focus = false) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
    });
  });
  const fix = $('[data-fix]', root);
  fix.addEventListener('click', () => {
    const doc = $('[data-doc]', root);
    doc.textContent = 'Solicitado';
    doc.className = 'ui-badge';
    fix.disabled = true;
    fix.textContent = 'Enviado';
    const li = document.createElement('li');
    li.className = 'is-new';
    li.innerHTML = '<span>Se solicitó de nuevo la INE, reverso</span><span class="nums">Hoy</span>';
    $('[data-hist]', root).append(li);
    $('[data-status]', root).textContent = 'Esperando documento';
  });
}

// ---------- demo: reportes con interruptor (Reportería) ----------
{
  const root = $('[data-demo="reportes"]');
  const list = $('[data-reports]', root);
  const brands = { TP: '#e5007e', EKT: '#d6001c', SA: '#0f9d8a' };
  const reports = [
    { kind: 'auto', co: 'TP', name: 'Conciliación diaria', who: 'Totalplay, cada día 06:00', on: true },
    { kind: 'auto', co: 'EKT', name: 'Ventas por sucursal', who: 'Elektra, cada lunes', on: true },
    { kind: 'auto', co: 'SA', name: 'Transferencias', who: 'SuperApp Baz, cada hora', on: true },
    { kind: 'auto', co: 'EKT', name: 'Devoluciones', who: 'Elektra, fin de mes', on: false },
    { kind: 'manual', co: 'SA', name: 'Pagos de servicios', who: 'SuperApp Baz, bajo demanda', on: true },
    { kind: 'manual', co: 'TP', name: 'Cargos rechazados', who: 'Totalplay, bajo demanda', on: false },
    { kind: 'manual', co: 'EKT', name: 'Apartados vencidos', who: 'Elektra, bajo demanda', on: true },
  ];
  let kind = 'auto';
  function render() {
    const rows = reports.filter((r) => r.kind === kind);
    list.innerHTML = rows.map((r) => `
      <li>
        <span class="co" style="background:${brands[r.co]}" aria-hidden="true">${r.co}</span>
        <span class="who"><span>${r.name}</span><small>${r.who}</small></span>
        <button type="button" class="switch" role="switch" aria-checked="${r.on}" aria-label="${r.name}" data-name="${r.name}"></button>
      </li>`).join('');
    $('[data-active]', root).textContent = `${rows.filter((r) => r.on).length} de ${rows.length}`;
  }
  list.addEventListener('click', (e) => {
    const sw = e.target.closest('.switch'); if (!sw) return;
    const r = reports.find((x) => x.name === sw.dataset.name);
    r.on = !r.on;
    sw.setAttribute('aria-checked', String(r.on));
    const rows = reports.filter((x) => x.kind === kind);
    $('[data-active]', root).textContent = `${rows.filter((x) => x.on).length} de ${rows.length}`;
  });
  $$('[data-kind]', root).forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    $$('[data-kind]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  render();
}

// ---------- quality gate: el mismo resultado en cada proyecto ----------
$('[data-gate]')?.addEventListener('change', () => {
  const m = $('.ui-metrics');
  m.classList.remove('is-refresh');
  void m.offsetWidth;
  if (!reduceMotion) m.classList.add('is-refresh');
});

// ---------- asistente de WhatsApp: unas preguntas, un mensaje listo, y a WhatsApp ----------
{
  const PHONE = '525632378049';
  const CV = 'Edgar_Mancilla_CV.pdf';
  const panel = $('#wa-panel');
  const log = $('[data-wa-log]', panel);
  const controls = $('[data-wa-controls]', panel);
  const launcher = $('.wa-launcher');
  const waLink = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);

  const NAME = { key: 'nombre', ask: '¿Cómo te llamas?', input: 'Tu nombre' };
  const FLOWS = {
    vacante: {
      steps: [
        { ...NAME, ask: 'Qué bien. ¿Cómo te llamas?' },
        { key: 'empresa', ask: '¿De qué empresa me escribes?', input: 'Empresa' },
        { key: 'puesto', ask: '¿Qué puesto es?', options: ['Front End', 'Líder Front End', 'Full Stack', 'Otro'] },
        { key: 'modalidad', ask: '¿En qué modalidad?', options: ['Remoto', 'Híbrido', 'Presencial'] },
      ],
      message: (d) => `Hola Edgar, soy ${d.nombre} de ${d.empresa}. Vi tu portafolio y tengo una vacante de ${d.puesto === 'Otro' ? 'desarrollo' : d.puesto}, en modalidad ${{ Remoto: 'remota', Híbrido: 'híbrida', Presencial: 'presencial' }[d.modalidad]}. ¿Podemos platicar?`,
    },
    freelance: {
      steps: [
        NAME,
        { key: 'tipo', ask: '¿Qué tipo de proyecto tienes en mente?', options: ['Sitio web', 'Sistema interno', 'Migración o modernización', 'Otro'] },
        { key: 'tiempo', ask: '¿Para cuándo lo necesitas?', options: ['Lo antes posible', 'En 1 a 3 meses', 'Solo estoy explorando'] },
      ],
      message: (d) => `Hola Edgar, soy ${d.nombre}. Vi tu portafolio y me interesa un proyecto freelance: ${d.tipo === 'Otro' ? 'algo a la medida' : lower(d.tipo)}. Tiempo: ${lower(d.tiempo)}. ¿Podemos platicar?`,
    },
    otra: {
      steps: [
        NAME,
        { key: 'texto', ask: 'Cuéntame en una o dos líneas qué necesitas.', input: 'Tu mensaje', long: true },
      ],
      message: (d) => `Hola Edgar, soy ${d.nombre}. ${d.texto}`,
    },
  };
  const START = [
    ['Tengo una vacante', () => runFlow('vacante')],
    ['Proyecto freelance', () => runFlow('freelance')],
    ['Ver tu CV', openCV],
    ['Probar las demos', goDemos],
    ['Otra consulta', () => runFlow('otra')],
  ];

  let started = false;
  let closeTimer;

  function say(text, me = false) {
    const b = document.createElement('p');
    b.className = 'wa__msg' + (me ? ' wa__msg--me' : '') + (reduceMotion ? '' : ' is-new');
    b.textContent = text;
    log.append(b);
    log.scrollTop = log.scrollHeight;
  }
  const toBottom = () => requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
  function focusFirst() { requestAnimationFrame(() => { if (!panel.hidden && launcher.getAttribute('aria-expanded') === 'true') $('button, input, textarea, a', controls)?.focus({ preventScroll: true }); }); }

  function options(list) {
    controls.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'wa__options';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Opciones');
    for (const [label, fn] of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'wa__opt'; b.textContent = label;
      b.addEventListener('click', () => { say(label, true); fn(label); });
      wrap.append(b);
    }
    controls.append(wrap);
    toBottom();
    focusFirst();
  }

  function input(step, done) {
    controls.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'wa__form';
    const field = document.createElement(step.long ? 'textarea' : 'input');
    field.className = step.long ? 'wa__text' : 'wa__input';
    field.placeholder = step.input;
    field.setAttribute('aria-label', step.input);
    field.maxLength = step.long ? 300 : 60;
    if (!step.long) field.autocomplete = step.key === 'nombre' ? 'name' : step.key === 'empresa' ? 'organization' : 'off';
    const send = document.createElement('button');
    send.type = 'submit'; send.className = 'wa__send'; send.disabled = true;
    send.setAttribute('aria-label', 'Responder');
    send.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    field.addEventListener('input', () => { send.disabled = field.value.trim().length < 2; });
    if (step.long) field.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = field.value.trim();
      if (v.length < 2) return;
      say(v, true);
      done(v);
    });
    form.append(field, send);
    controls.append(form);
    toBottom();
    focusFirst();
  }

  function runFlow(id) {
    const flow = FLOWS[id];
    const data = {};
    let i = 0;
    const next = () => {
      if (i >= flow.steps.length) return finish(flow.message(data));
      const step = flow.steps[i++];
      say(step.ask);
      const save = (v) => { data[step.key] = v; next(); };
      step.options ? options(step.options.map((o) => [o, () => save(o)])) : input(step, save);
    };
    next();
  }

  function finish(message) {
    say('Listo, este es tu mensaje. Puedes editarlo antes de enviarlo.');
    controls.innerHTML = '';
    const text = document.createElement('textarea');
    text.className = 'wa__text'; text.value = message; text.setAttribute('aria-label', 'Mensaje para WhatsApp');
    const send = document.createElement('a');
    send.className = 'wa__send'; send.target = '_blank'; send.rel = 'noopener'; send.href = waLink(message);
    send.innerHTML = '<svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"/></svg><span>Enviar por WhatsApp</span>';
    text.addEventListener('input', () => { send.href = waLink(text.value.trim() || message); });
    send.addEventListener('click', () => say('Abriendo WhatsApp en una pestaña nueva…'));
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'wa__restart'; again.textContent = 'Empezar de nuevo';
    again.addEventListener('click', restart);
    controls.append(text, send, again);
    toBottom();
    requestAnimationFrame(() => { if (launcher.getAttribute('aria-expanded') === 'true') send.focus({ preventScroll: true }); });
  }

  function openCV() {
    window.open(CV, '_blank', 'noopener');
    say('Te lo abrí en una pestaña nueva. ¿Algo más?');
    options(START);
  }
  function goDemos() {
    say('Te llevo a las demos.');
    setTimeout(() => { close(); document.getElementById('demos')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }, reduceMotion ? 0 : 350);
  }
  function restart() {
    log.innerHTML = '';
    say('Hola, soy Edgar. ¿En qué te puedo ayudar?');
    options(START);
  }

  function open(instant = false) {
    clearTimeout(closeTimer);
    if (!started) { started = true; restart(); }
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    panel.classList.remove('is-closing');
    // con teclado (o movimiento reducido al mínimo) aparece sin animación
    panel.classList.toggle('is-animating', !instant);
    if (instant) panel.classList.add('is-open');
    else requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
    focusFirst();
  }
  function close(returnFocus = false) {
    launcher.setAttribute('aria-expanded', 'false');
    panel.classList.add('is-closing');
    panel.classList.remove('is-open');
    closeTimer = setTimeout(() => { panel.hidden = true; panel.classList.remove('is-animating', 'is-closing'); }, panel.classList.contains('is-animating') ? 140 : 0);
    if (returnFocus) launcher.focus({ preventScroll: true });
  }
  const isOpen = () => !panel.hidden && panel.classList.contains('is-open');

  $$('[data-wa-open]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const keyboard = e.detail === 0;
    if (a === launcher && isOpen()) close(keyboard); else open(keyboard);
  }));
  $('[data-wa-close]', panel).addEventListener('click', () => close(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(true); });
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !panel.contains(e.target) && !e.target.closest('[data-wa-open]')) close();
  });

  window.openWhatsApp = open;
}

// ---------- enlaces que llegarán después ----------
$$('[data-pendiente]').forEach((a) => a.addEventListener('click', (e) => { if (a.getAttribute('href') === '#') e.preventDefault(); }));
