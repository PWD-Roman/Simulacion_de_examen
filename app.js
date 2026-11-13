(function () {
  'use strict';

  const { TOPICS, QUESTIONS } = window.EGE_CONTENT;
  const Engine = window.EGE_ENGINE;
  const Calculator = window.EGE_CALCULATOR;
  const I18n = window.EGE_I18N;
  const main = document.getElementById('main-content');
  const dialog = document.getElementById('app-dialog');
  const dialogContent = document.getElementById('dialog-content');
  let store = Engine.load();
  let timerInterval = null;
  let reviewFilter = 'wrong';
  let toastTimeout = null;
  let calcPreset = null;
  let language = localStorage.getItem('egreso-language') === 'en' ? 'en' : 'es';
  const breakShown = new Set();

  const icons = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z"/>',
    practice: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    timer: '<circle cx="12" cy="14" r="8"/><path d="M12 14V9M9 2h6M17 5l2-2"/>',
    calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    devices: '<rect x="2" y="3" width="15" height="12" rx="2"/><path d="M7 21h6M10 15v6"/><rect x="17" y="8" width="5" height="12" rx="1"/>',
    git: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M8 7h4a6 6 0 0 1 6 6v-2"/>',
    ux: '<path d="M12 2a10 10 0 1 0 10 10c0-1.7-1.3-3-3-3h-2a2 2 0 0 1-2-2V5a3 3 0 0 0-3-3z"/><circle cx="7.5" cy="10.5" r=".7"/><circle cx="9" cy="16" r=".7"/><circle cx="14" cy="16" r=".7"/>',
    network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>',
    ai: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h6v6H9zM9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1-9.9A7 7 0 0 1 21 11a4 4 0 0 1-3.5 8z"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    back: '<path d="M19 12H5M10 7l-5 5 5 5"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    flag: '<path d="M5 22V3M5 4h12l-2 4 2 4H5"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'
  };

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`;
  }

  function hydrateIcons(scope = document) {
    scope.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function localized(value) { return I18n.text(value, language); }
  function displayQuestion(question) {
    return I18n.question(question, language);
  }
  function topicName(id) { return localized(Engine.topicMap.get(id)?.short || id); }
  function questionCount(topicId) { return QUESTIONS.filter(question => question.topic === topicId).length; }
  function go(route) { location.hash = route; }
  function percent(value, total) { return total ? Math.round(value / total * 100) : 0; }

  function toast(message) {
    const element = document.getElementById('toast');
    clearTimeout(toastTimeout);
    element.textContent = message;
    I18n.localize(element, language);
    element.classList.add('show');
    toastTimeout = setTimeout(() => element.classList.remove('show'), 2600);
  }

  function showDialog(content) {
    dialogContent.innerHTML = content;
    hydrateIcons(dialogContent);
    I18n.localize(dialogContent, language);
    dialog.showModal();
  }

  function closeDialog() { dialog.close(); }

  function updateShell(route) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route || (route === 'tema' && item.dataset.route === 'repasar')));
    const progress = Engine.progress(store);
    document.getElementById('sidebar-answered').textContent = progress.total;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
  }

  function pageHeading(eyebrow, title, description, action = '') {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
  }

  function continueCard() {
    if (!store.active) return '';
    const answered = Object.keys(store.active.answers).length;
    return `<div class="continue-card"><div><h3>${localized('Continúa donde lo dejaste')}</h3><p>${escapeHtml(localized(store.active.title))} · ${answered} ${localized('de')} ${store.active.questionIds.length} ${localized('respondidas')}</p></div><button class="btn btn-primary" data-action="resume">${localized('Volver al examen')} ${icon('arrow')}</button></div>`;
  }

  function renderHome() {
    const progress = Engine.progress(store);
    const latest = store.history[0];
    const distribution = TOPICS.map(topic => `<div class="distribution-row"><button data-action="open-topic" data-topic="${topic.id}">${localized(topic.short)}</button><div class="progress-track"><div class="progress-fill" style="width:${topic.percent / 15 * 100}%"></div></div><span>${topic.count}</span></div>`).join('');
    const latestHtml = latest ? `<div class="card" style="margin-top:20px"><div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:15px"><div><span class="eyebrow" style="margin-bottom:6px">${localized('Último resultado')}</span><strong>${escapeHtml(latest.title)}</strong><div class="small muted">${new Date(latest.finishedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long' })} · ${latest.correct}/${latest.total} ${localized('Aciertos')}</div></div><button class="btn btn-secondary btn-sm" data-action="view-result" data-id="${latest.id}">${localized('Ver análisis')}</button></div></div>` : '';
    main.innerHTML = `
      ${continueCard()}
      <section class="hero">
        <div class="hero-copy"><div class="eyebrow">Preparación dirigida por la guía</div><h1>Comprende. Practica.<br><em>Llega preparado.</em></h1><p>Domina los temas del Examen General de Egreso con práctica aplicada, explicaciones y simulacros que siguen la distribución de la guía.</p><div class="hero-actions"><button class="btn btn-lime" data-action="start-global">Iniciar simulacro ${icon('arrow')}</button><button class="btn" style="background:rgba(255,255,255,.09);color:white" data-route="practica">Practicar un tema</button></div></div>
        <div class="hero-visual"><div class="hero-orbit"></div><div class="hero-number"><strong>${QUESTIONS.length}</strong><span>reactivos de práctica</span></div></div>
      </section>
      <div class="notice">${icon('info')}<span><strong>Alcance fiel a la guía.</strong> Esta herramienta trabaja únicamente sus áreas y recomendaciones. La propia guía indica que es metodológica y no representa el 100% del contenido del examen oficial.</span></div>
      <section class="stat-grid">
        <div class="stat-card"><div class="stat-card-top">Precisión global<span class="stat-icon">${icon('target')}</span></div><strong class="stat-value">${progress.total ? progress.accuracy + '%' : '—'}</strong><span class="stat-note">${progress.correct} aciertos acumulados</span></div>
        <div class="stat-card"><div class="stat-card-top">Reactivos resueltos<span class="stat-icon">${icon('practice')}</span></div><strong class="stat-value">${progress.total}</strong><span class="stat-note">en sesiones finalizadas</span></div>
        <div class="stat-card"><div class="stat-card-top">Sesiones<span class="stat-icon">${icon('history')}</span></div><strong class="stat-value">${progress.exams}</strong><span class="stat-note">prácticas y simulacros</span></div>
        <div class="stat-card"><div class="stat-card-top">Por reforzar<span class="stat-icon">${icon('book')}</span></div><strong class="stat-value">${progress.errors}</strong><span class="stat-note">errores y pendientes</span></div>
      </section>
      <div class="dashboard-grid">
        <section class="card"><div class="card-header"><h2>Mapa del examen</h2><span class="small muted">Reactivos por área</span></div><div class="card-body">${distribution}<div class="small muted" style="margin-top:18px">Parte I: 140 · Parte II: 160 · Total: 300</div></div></section>
        <div><section class="card"><div class="card-header"><h2>Estrategia de estudio</h2></div><div class="card-body"><div class="strategy-list">
          <div class="strategy"><span class="strategy-number">01</span><div><h4>No memorices, simula</h4><p>Haz pruebas de escritorio y diagnostica el resultado paso a paso.</p></div></div>
          <div class="strategy"><span class="strategy-number">02</span><div><h4>Dibuja los datos</h4><p>Visualiza tablas, clústeres y modelos antes de elegir.</p></div></div>
          <div class="strategy"><span class="strategy-number">03</span><div><h4>Domina las matemáticas</h4><p>Practica prefijos, máscaras, optimización y métricas.</p></div></div>
          <div class="strategy"><span class="strategy-number">04</span><div><h4>Lee el escenario completo</h4><p>Conecta arquitectura, necesidad y decisión antes de responder.</p></div></div>
          <div class="strategy"><span class="strategy-number">05</span><div><h4>Gestiona la fatiga</h4><p>Pausa 30–60 segundos cada 25–30 preguntas o 30–40 minutos.</p></div></div>
        </div></div></section>${latestHtml}</div>
      </div>`;
  }

  function renderTopics() {
    main.innerHTML = `${pageHeading('Biblioteca de estudio', 'Repasa los 13 temas', 'Conceptos, procedimientos y puntos de decisión organizados exactamente según las áreas de la guía.', '<button class="btn btn-secondary" href="examen.pdf" data-action="open-pdf">'+icon('file')+' Guía original</button>')}
      <div class="topic-grid">${TOPICS.map(topic => `<article class="card topic-card"><div class="topic-top"><span class="topic-icon">${icon(topic.icon)}</span><span class="topic-count">${questionCount(topic.id)} ${localized('disponibles')} · ${topic.count} ${localized('en examen')} · ${topic.percent}%</span></div><h2>${localized(topic.name)}</h2><p>${localized(topic.description)}</p><div class="topic-actions"><button class="btn btn-primary btn-sm" data-action="open-topic" data-topic="${topic.id}">${localized('Repasar')} ${icon('arrow')}</button><button class="btn btn-secondary btn-sm" data-action="practice-topic" data-topic="${topic.id}">${localized('Practicar')}</button></div></article>`).join('')}</div>`;
  }

  function renderTopic(topicId) {
    const topic = Engine.topicMap.get(topicId);
    if (!topic) { go('repasar'); return; }
    main.innerHTML = `<button class="text-button" data-route="repasar" style="margin-bottom:18px;display:flex;align-items:center;gap:7px">${icon('back')} Todos los temas</button>
      <section class="card topic-detail-head"><span class="topic-icon">${icon(topic.icon)}</span><div><span class="block-label">${localized('Parte')} ${topic.block} · ${topic.count} ${localized('reactivos')} ${localized('en la distribución')} · ${questionCount(topic.id)} ${localized('disponibles')}</span><h1>${localized(topic.name)}</h1><p>${localized(topic.description)}</p></div></section>
      <div class="lesson-layout"><div>${topic.sections.map(section => `<section class="card lesson-section"><h2>${localized(section.title)}</h2><p>${localized(section.body)}</p><ul>${section.bullets.map(item => `<li>${localized(item)}</li>`).join('')}</ul></section>`).join('')}</div>
      <aside class="lesson-side"><div class="card"><div class="card-header"><h3>${localized('Convierte el repaso en práctica')}</h3></div><div class="card-body"><p class="small muted">${localized('La guía recomienda resultados aplicados, no definiciones aisladas.')}</p><button class="btn btn-primary" data-action="practice-topic" data-topic="${topic.id}">${icon('practice')} ${localized('Práctica guiada')}</button><button class="btn btn-secondary" data-action="exam-topic" data-topic="${topic.id}">${icon('timer')} ${localized('Examen de este tema')}</button>${topic.id === 'redes' ? `<button class="btn btn-secondary" data-route="calculadora">${icon('calculator')} ${localized('Calculadora IPv4')}</button>` : ''}</div></div><div class="notice notice-blue">${icon('info')}<span>${localized('Resuelve primero por tu cuenta. Después compara el procedimiento, no solo la letra correcta.')}</span></div></aside></div>`;
  }

  function renderPractice(topicId = '', forceExam = false) {
    const selected = Engine.topicMap.has(topicId) ? topicId : 'programacion';
    const topic = Engine.topicMap.get(selected);
    main.innerHTML = `${pageHeading('Entrenamiento por área', 'Práctica por tema', 'Elige retroalimentación inmediata para aprender o modo examen para medirte contra reloj.')}
      <form id="practice-form" class="setup-grid">
        <section class="card setup-card">
          <fieldset><legend>${localized('1. Selecciona el área')}</legend><select class="select" name="topic" id="practice-topic">${TOPICS.map(item => `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${localized(item.name)} · ${questionCount(item.id)} ${localized('disponibles')}</option>`).join('')}</select></fieldset>
          <fieldset><legend>2. Elige la modalidad</legend><div class="segmented"><label><input type="radio" name="mode" value="guided" ${!forceExam ? 'checked' : ''}><span>Práctica guiada · explicación inmediata</span></label><label><input type="radio" name="mode" value="exam" ${forceExam ? 'checked' : ''}><span>Examen por tema · resultado al final</span></label></div></fieldset>
          <fieldset><legend>3. Número de reactivos</legend><label class="field-label" for="practice-count" style="font-weight:400;color:var(--muted)">Entre 1 y <span id="practice-max">${questionCount(selected)}</span></label><input class="text-input" id="practice-count" name="count" type="number" min="1" max="${questionCount(selected)}" value="${Math.min(10, questionCount(selected))}" required></fieldset>
          <fieldset id="time-field"><legend>4. Tiempo de práctica</legend><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end"><div><label class="field-label" for="practice-minutes">Minutos</label><input class="text-input" id="practice-minutes" name="minutes" type="number" min="1" max="600" value="20"></div><label class="check-row" style="padding-bottom:12px"><input type="checkbox" name="timed" ${forceExam ? 'checked' : ''}>Activar cronómetro</label></div><span class="form-help">El tiempo es configurable y no representa una duración oficial indicada por la guía.</span></fieldset>
        </section>
        <aside class="card setup-summary"><div class="setup-summary-top"><h2>Tu sesión</h2><p>Una selección aleatoria del banco del área, sin repetir reactivos dentro de la sesión.</p></div><dl class="summary-list"><div class="summary-row"><dt>Área</dt><dd id="summary-topic">${topic.short}</dd></div><div class="summary-row"><dt>Reactivos</dt><dd id="summary-count">${Math.min(10, questionCount(selected))}</dd></div><div class="summary-row"><dt>Modalidad</dt><dd id="summary-mode">${forceExam ? 'Examen por tema' : 'Práctica guiada'}</dd></div><div class="summary-row"><dt>Explicaciones</dt><dd id="summary-feedback">${forceExam ? 'Al finalizar' : 'Después de responder'}</dd></div></dl><button class="btn btn-primary" type="submit">Comenzar sesión ${icon('arrow')}</button></aside>
      </form>`;

    const form = document.getElementById('practice-form');
    const topicSelect = document.getElementById('practice-topic');
    const countInput = document.getElementById('practice-count');
    const updateSummary = () => {
      const current = Engine.topicMap.get(topicSelect.value);
      const count = Math.max(1, Math.min(Number(countInput.value) || 1, questionCount(current.id)));
      const exam = form.elements.mode.value === 'exam';
      document.getElementById('summary-topic').textContent = localized(current.short);
      document.getElementById('summary-count').textContent = count;
      document.getElementById('summary-mode').textContent = localized(exam ? 'Examen por tema' : 'Práctica guiada');
      document.getElementById('summary-feedback').textContent = localized(exam ? 'Al finalizar' : 'Después de responder');
    };
    topicSelect.addEventListener('change', () => {
      const current = Engine.topicMap.get(topicSelect.value);
      countInput.max = questionCount(current.id);
      countInput.value = Math.min(Number(countInput.value), questionCount(current.id));
      document.getElementById('practice-max').textContent = questionCount(current.id);
      updateSummary();
    });
    countInput.addEventListener('input', updateSummary);
    form.querySelectorAll('[name="mode"]').forEach(input => input.addEventListener('change', () => {
      const exam = form.elements.mode.value === 'exam';
      form.elements.timed.checked = exam;
      updateSummary();
    }));
    form.elements.timed.addEventListener('change', updateSummary);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const topicIdValue = data.get('topic');
      const current = Engine.topicMap.get(topicIdValue);
      const count = Math.max(1, Math.min(Number(data.get('count')) || 1, questionCount(current.id)));
      const guided = data.get('mode') === 'guided';
      Engine.createSession(store, { mode: guided ? 'practice' : 'topic', topicId: topicIdValue, count, immediate: guided, timed: data.get('timed') === 'on', minutes: data.get('minutes') });
      go('examen');
    });
  }

  function renderGlobalSetup() {
    const rows = TOPICS.map(topic => `<tr><td>${localized(topic.short)}</td><td>${localized('Parte')} ${topic.block}</td><td>${topic.count}</td></tr>`).join('');
    main.innerHTML = `${pageHeading('Simulación completa', 'Simulacro global', '300 reactivos distribuidos como indica la guía: 140 de Desarrollo y Arquitectura y 160 de Infraestructura, Datos y Operaciones.')}
      ${continueCard()}
      <form id="global-form" class="setup-grid">
        <section class="card setup-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:20px"><div><h2 style="margin:0;font-family:var(--font-display)">Condiciones del simulacro</h2><p class="small muted" style="margin:5px 0 0">Los reactivos aparecen mezclados para alternar bloques de cálculo y casos lógicos.</p></div><span class="topic-icon">${icon('timer')}</span></div>
          <fieldset><legend>Duración de práctica</legend><div class="form-row"><div><label class="field-label" for="global-minutes" style="font-weight:400;color:var(--muted)">Minutos para 300 reactivos</label><input class="text-input" id="global-minutes" name="minutes" type="number" min="10" max="600" value="300" required></div><div class="notice notice-warning" style="margin:0;padding:11px">${icon('info')}<span>La guía no especifica un tiempo oficial.</span></div></div></fieldset>
          <fieldset><legend>Dinámica</legend><div class="strategy-list"><div class="strategy"><span class="strategy-number">1</span><div><h4>Respuestas editables</h4><p>Puedes navegar, marcar dudas y cambiar respuestas hasta finalizar.</p></div></div><div class="strategy"><span class="strategy-number">2</span><div><h4>Entrega automática</h4><p>Al agotarse el tiempo, la sesión se finaliza con lo respondido.</p></div></div><div class="strategy"><span class="strategy-number">3</span><div><h4>Análisis completo</h4><p>Al terminar verás aciertos, errores, pendientes y explicación por reactivo.</p></div></div></div></fieldset>
          <label class="check-row"><input type="checkbox" required><span>Entiendo que este es un entrenamiento basado en la distribución temática, no una copia del examen oficial.</span></label>
        </section>
        <aside class="card setup-summary"><div class="setup-summary-top"><h2>Distribución exacta</h2><p>La cantidad por área coincide con los reactivos señalados en la guía.</p></div><div style="padding:12px 20px;max-height:365px;overflow:auto"><table class="distribution-table"><thead><tr><th>Área</th><th>Bloque</th><th>Reactivos</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2"><strong>Total</strong></td><td><strong>300</strong></td></tr></tfoot></table></div><div style="padding:10px 26px 0"><div class="summary-row"><dt>Duración elegida</dt><dd id="global-summary-time">300 min</dd></div></div><button class="btn btn-primary" type="submit">Iniciar 300 reactivos ${icon('play')}</button></aside>
      </form>`;
    const form = document.getElementById('global-form');
    form.elements.minutes.addEventListener('input', () => { document.getElementById('global-summary-time').textContent = `${form.elements.minutes.value || 0} min`; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      Engine.createSession(store, { mode: 'global', timed: true, minutes: form.elements.minutes.value });
      go('examen');
    });
  }

  function renderExam() {
    const session = store.active;
    if (!session) { go('simulacro'); return; }
    if (session.timed && Date.now() >= session.endsAt) { finishExam(true); return; }
    document.body.classList.add('exam-active');
    const sourceQuestion = Engine.questionMap.get(session.questionIds[session.current]);
    const question = displayQuestion(sourceQuestion);
    const topic = Engine.topicMap.get(question.topic);
    const selected = Object.prototype.hasOwnProperty.call(session.answers, question.id) ? session.answers[question.id] : null;
    const locked = session.immediate && selected !== null;
    const answered = Object.keys(session.answers).length;
    const flagged = session.flagged.includes(question.id);
    const letters = ['A', 'B', 'C', 'D'];
    const options = question.options.map((option, index) => {
      let state = selected === index ? 'selected' : '';
      if (locked && index === question.answer) state = 'correct';
      if (locked && selected === index && index !== question.answer) state = 'incorrect';
      const status = locked && index === question.answer ? icon('check') : locked && selected === index ? icon('x') : '';
      return `<button class="option ${state}" data-action="answer" data-option="${index}" ${locked ? 'disabled' : ''}><span class="option-letter">${letters[index]}</span><span>${escapeHtml(option)}</span><span class="option-status">${status}</span></button>`;
    }).join('');
    const feedback = locked ? `<div class="feedback ${selected === question.answer ? 'correct' : 'incorrect'}"><h3>${selected === question.answer ? icon('check') + localized('Respuesta correcta') : icon('x') + localized('Respuesta incorrecta')}</h3><p><strong>${localized('Respuesta correcta:')} ${escapeHtml(question.options[question.answer])}.</strong></p><p style="margin-top:7px">${question.explanation}</p></div>` : '';
    const palette = session.questionIds.map((id, index) => `<button class="palette-button ${Object.prototype.hasOwnProperty.call(session.answers, id) ? 'answered' : ''} ${index === session.current ? 'current' : ''} ${session.flagged.includes(id) ? 'flagged' : ''}" data-action="navigate" data-index="${index}" aria-label="Ir a reactivo ${index + 1}">${index + 1}</button>`).join('');

    main.innerHTML = `<div class="exam-shell"><header class="exam-header"><div class="exam-title">${escapeHtml(localized(session.title))}<small>${localized(session.immediate ? 'Práctica con explicación inmediata' : 'Examen · explicaciones al finalizar')}</small></div><div class="exam-progress"><div class="exam-progress-label"><span>${answered} ${localized('respondidas')}</span><span>${session.questionIds.length} ${localized('total')}</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent(answered, session.questionIds.length)}%"></div></div></div><div class="exam-timer"><div class="timer-value" id="exam-timer">${icon('timer')}<span>${session.timed ? Engine.formatTime((session.endsAt - Date.now()) / 1000) : localized('Sin límite')}</span></div><button class="btn btn-secondary btn-sm language-toggle" type="button">${language === 'es' ? 'English' : 'Español'}</button><button class="btn btn-secondary btn-sm" data-action="finish">${localized('Finalizar')}</button></div></header>
      <div class="exam-body"><section class="question-card"><div class="question-meta"><span class="topic-pill">${topicName(topic.id)}</span><span>${question.concept}</span><span class="question-number">${localized('Reactivo')} ${session.current + 1} ${localized('de')} ${session.questionIds.length}</span></div><h1 class="question-prompt">${escapeHtml(question.prompt)}</h1><div class="options">${options}</div>${feedback}<div class="question-actions"><button class="btn btn-ghost btn-sm flag-button ${flagged ? 'active' : ''}" data-action="flag">${icon('flag')} ${localized(flagged ? 'Marcada para revisar' : 'Marcar para revisar')}</button><div class="question-actions-right"><button class="btn btn-secondary" data-action="previous" ${session.current === 0 ? 'disabled' : ''}>${icon('back')} ${localized('Anterior')}</button><button class="btn btn-primary" data-action="next">${localized(session.current === session.questionIds.length - 1 ? 'Volver al inicio' : 'Siguiente')} ${icon('arrow')}</button></div></div></section>
      <aside class="exam-panel"><div class="card panel-card palette-panel"><h3>${localized('Navegación')}</h3><div class="question-palette">${palette}</div><div class="palette-legend"><span><i class="legend-dot answered"></i>${localized('Respondida')}</span><span><i class="legend-dot"></i>${localized('Pendiente')}</span></div></div><div class="exam-side-actions">${question.calculator ? `<button class="btn btn-secondary" data-action="question-calculator">${icon('calculator')} ${localized('Abrir calculadora')}</button>` : ''}<button class="btn btn-secondary" data-action="save-exit">${icon('back')} ${localized('Guardar y salir')}</button></div><div class="notice small" style="margin-top:14px">${icon('info')}<span>${localized('Cada 25–30 reactivos, haz una pausa breve: mira lejos y mueve cuello, hombros, muñecas y pies.')}</span></div></aside></div></div>`;
    if (session.timed) startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const session = store.active;
      if (!session || !session.timed) { clearInterval(timerInterval); return; }
      const remaining = Math.ceil((session.endsAt - Date.now()) / 1000);
      const timer = document.querySelector('#exam-timer span');
      if (timer) timer.textContent = Engine.formatTime(remaining);
      const timerBox = document.getElementById('exam-timer');
      if (timerBox) timerBox.classList.toggle('warning', remaining <= 300);
      if (remaining > 0 && remaining === session.minutes * 60 - 35 * 60) showBreakReminder('time');
      if (remaining <= 0) { clearInterval(timerInterval); finishExam(true); }
    }, 1000);
  }

  function showBreakReminder(key) {
    const id = `${store.active?.id}-${key}`;
    if (breakShown.has(id)) return;
    breakShown.add(id);
    const banner = document.getElementById('break-banner');
    banner.innerHTML = `<button data-action="close-break" aria-label="Cerrar">×</button><strong>Pausa para recuperar agilidad mental</strong>La guía recomienda 30–60 segundos: mira lejos 20 segundos, rota cuello y hombros, y mueve muñecas y pies.`;
    I18n.localize(banner, language);
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 15000);
  }

  function finishExam(automatic = false) {
    clearInterval(timerInterval);
    const record = Engine.finish(store);
    if (!record) { go('inicio'); return; }
    document.body.classList.remove('exam-active');
    document.getElementById('break-banner').classList.remove('show');
    closeDialog();
    go(`resultado/${record.id}`);
    if (automatic) setTimeout(() => toast('El tiempo terminó. Se guardaron tus respuestas.'), 200);
  }

  function confirmFinish() {
    const session = store.active;
    if (!session) return;
    const unanswered = session.questionIds.length - Object.keys(session.answers).length;
    showDialog(`<div class="dialog-body"><span class="dialog-icon">${icon('flag')}</span><h2>¿Finalizar sesión?</h2><p>Después verás tu puntuación y la explicación de cada reactivo.</p><div class="dialog-stats"><span><strong>${Object.keys(session.answers).length}</strong> respondidas</span><span><strong>${unanswered}</strong> pendientes</span><span><strong>${session.flagged.length}</strong> marcadas</span></div><div class="dialog-actions"><button class="btn btn-secondary" data-action="close-dialog">Seguir respondiendo</button><button class="btn btn-primary" data-action="confirm-finish">Finalizar ahora</button></div></div>`);
  }

  function renderResult(id) {
    const record = store.history.find(item => item.id === id);
    if (!record) { go('progreso'); return; }
    const result = Engine.resultFor(record);
    const filtered = result.rows.filter(row => reviewFilter === 'all' || (reviewFilter === 'correct' ? row.correct : !row.correct));
    const topicResults = Object.entries(result.perTopic).map(([topicId, stats]) => `<div class="topic-result"><div class="topic-result-head"><strong>${topicName(topicId)}</strong><span>${stats.correct}/${stats.total} · ${percent(stats.correct, stats.total)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent(stats.correct, stats.total)}%"></div></div></div>`).join('');
    const review = filtered.length ? filtered.map((row, index) => {
      const state = row.correct ? 'correct' : 'incorrect';
      const question = displayQuestion(row.question);
      const selectedText = row.unanswered ? localized('Sin respuesta') : question.options[row.selected];
      return `<article class="card review-item"><button class="review-toggle" data-action="toggle-review"><span class="review-status ${state}">${icon(row.correct ? 'check' : 'x')}</span><span class="review-question">${escapeHtml(question.prompt)}<span class="review-meta">${topicName(row.question.topic)} · ${question.concept}</span></span>${icon('chevron')}</button><div class="review-content"><div class="answer-comparison"><div class="answer-box"><small>${localized('Tu respuesta')}</small><strong>${escapeHtml(selectedText)}</strong></div><div class="answer-box"><small>${localized('Respuesta correcta')}</small><strong>${escapeHtml(question.options[question.answer])}</strong></div></div><div class="explanation-box"><strong>${localized('¿Por qué?')}</strong>${question.explanation}</div></div></article>`;
    }).join('') : `<div class="card empty-state"><h2>No hay reactivos en este filtro</h2><p>Prueba otra categoría para revisar la sesión.</p></div>`;
    const wrongCount = result.incorrect + result.unanswered;
    main.innerHTML = `<section class="result-hero"><div class="score-ring" style="--score:${result.score}"><strong>${result.score}%</strong></div><div><div class="eyebrow">${localized('Resultado de la sesión')}</div><h1>${escapeHtml(record.title)}</h1><p>${new Date(record.finishedAt).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')} · ${Engine.formatTime(result.elapsedSeconds)} ${localized('de duración')}</p></div><div class="result-breakdown"><div><strong style="color:var(--lime)">${result.correct}</strong><span>${localized('Aciertos')}</span></div><div><strong>${result.incorrect}</strong><span>${localized('Errores')}</span></div><div><strong>${result.unanswered}</strong><span>${localized('Sin responder')}</span></div></div></section>
      <div class="results-grid"><section class="card"><div class="card-header"><h2>${localized('Desempeño por área')}</h2></div><div class="card-body">${topicResults}</div></section><section class="card"><div class="card-header"><h2>${localized('Siguiente paso')}</h2></div><div class="card-body"><p class="small muted">${localized('Convierte esta sesión en aprendizaje: revisa el procedimiento y vuelve a intentar solo lo que falló o quedó pendiente.')}</p><button class="btn btn-primary" style="width:100%" data-action="retry-result-errors" data-id="${record.id}" ${wrongCount ? '' : 'disabled'}>${icon('practice')} ${localized('Repetir')} ${wrongCount} ${localized(wrongCount === 1 ? 'error' : 'errores/pendientes')}</button><button class="btn btn-secondary" style="width:100%;margin-top:9px" data-route="practica">${localized('Nueva práctica')}</button><button class="btn btn-ghost" style="width:100%;margin-top:4px" data-route="inicio">${localized('Volver al inicio')}</button></div></section></div>
      <section class="review-section"><div class="review-header"><h2>${localized('Revisión de reactivos')}</h2><div class="filter-tabs"><button class="filter-tab ${reviewFilter === 'wrong' ? 'active' : ''}" data-action="filter-review" data-filter="wrong">${localized('Errores y pendientes')} · ${wrongCount}</button><button class="filter-tab ${reviewFilter === 'correct' ? 'active' : ''}" data-action="filter-review" data-filter="correct">${localized('Aciertos')} · ${result.correct}</button><button class="filter-tab ${reviewFilter === 'all' ? 'active' : ''}" data-action="filter-review" data-filter="all">${localized('Todos')} · ${result.total}</button></div></div>${review}</section>`;
  }

  let calculatorResult = null;

  function renderCalculator() {
    const preset = calcPreset || { ip: '192.168.10.37', prefix: 26 };
    calcPreset = null;
    const result = calculatorResult;
    const calcSteps = language === 'en'
      ? `<ol><li>Prefix /${result?.prefix} leaves 32 − ${result?.prefix} = ${result?.hostBits} host bits.</li><li>There are ${result?.total} total addresses. The conventional calculation subtracts the network and broadcast addresses, leaving ${result?.hosts} hosts.</li><li>Mask ${result?.mask} determines the block. The network is ${result?.network}; the block’s last address, ${result?.broadcast}, is the broadcast address.</li><li>The usable range excludes both endpoints: ${result?.firstHost} through ${result?.lastHost}.</li></ol>`
      : `<ol><li>El prefijo /${result?.prefix} deja 32 − ${result?.prefix} = ${result?.hostBits} bits para hosts.</li><li>Hay ${result?.total} direcciones totales. En el cálculo convencional se restan red y broadcast: ${result?.hosts} hosts.</li><li>La máscara ${result?.mask} determina el bloque. La red es ${result?.network} y el último valor del bloque, ${result?.broadcast}, es broadcast.</li><li>El rango válido excluye ambos extremos: ${result?.firstHost} a ${result?.lastHost}.</li></ol>`;
    const resultHtml = result && !result.error ? `<h2>${localized('Resultado para')} ${result.cidr}</h2><div class="calc-grid"><div class="calc-cell highlight"><small>${localized('Dirección de red')}</small><strong>${result.network}</strong></div><div class="calc-cell highlight"><small>Broadcast</small><strong>${result.broadcast}</strong></div><div class="calc-cell"><small>${localized('Máscara de subred')}</small><strong>${result.mask}</strong></div><div class="calc-cell"><small>${localized('Máscara wildcard')}</small><strong>${result.wildcard}</strong></div><div class="calc-cell"><small>${localized('Primer host válido')}</small><strong>${result.firstHost}</strong></div><div class="calc-cell"><small>${localized('Último host válido')}</small><strong>${result.lastHost}</strong></div><div class="calc-cell"><small>${localized('Hosts utilizables')}</small><strong>${result.hosts}</strong></div><div class="calc-cell"><small>${localized('Bits prestados')}</small><strong>${result.borrowedLabel}</strong></div></div><div class="binary-strip">${localized('Máscara binaria')} · ${result.maskBinary}</div>${result.note ? `<div class="notice notice-warning">${icon('info')}<span>${localized(result.note)}</span></div>` : ''}<div class="calc-steps"><h3>${localized('Procedimiento')}</h3>${calcSteps}</div>` : `<div class="calc-empty"><div>${icon('calculator')}<h3>${localized('Completa el cálculo')}</h3><p>${localized('Introduce una dirección y un prefijo para obtener red, broadcast, rango de hosts y bits prestados.')}</p></div></div>`;
    main.innerHTML = `${pageHeading('Herramienta de redes', 'Calculadora de subnetting IPv4', 'Comprueba tus pruebas de escritorio. Los ejercicios de redes incluyen acceso directo a esta herramienta.')}
      <div class="calculator-layout"><form class="card calculator-card" id="calculator-form"><div class="form-row"><div class="form-group"><label class="field-label" for="calc-ip">Dirección IPv4</label><input class="text-input" id="calc-ip" name="ip" value="${escapeHtml(preset.ip)}" placeholder="192.168.10.37" inputmode="decimal" required></div><div class="form-group"><label class="field-label" for="calc-prefix">Prefijo</label><div class="input-prefix"><span>/</span><input class="text-input" id="calc-prefix" name="prefix" type="number" min="0" max="32" value="${preset.prefix}" required></div></div></div><span class="form-help" style="margin-bottom:18px">Usa la notación CIDR: una IPv4 y un prefijo entre /0 y /32.</span><button class="btn btn-primary" type="submit" style="width:100%">${icon('calculator')} Calcular subred</button><div id="calc-error">${result?.error ? `<div class="calc-error">${result.error}</div>` : ''}</div><div class="notice notice-blue" style="margin-top:20px">${icon('info')}<span>El cálculo de hosts usa la regla convencional 2<sup>(32 − prefijo)</sup> − 2, coherente con los ejercicios de esta aplicación.</span></div></form><section class="card calc-result">${resultHtml}</section></div>
      <div class="card" style="margin-top:20px"><div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap"><div><strong>¿Quieres aplicarlo sin ver la respuesta primero?</strong><p class="small muted" style="margin:4px 0 0">Practica máscaras, bits prestados, red, broadcast y rangos válidos.</p></div><button class="btn btn-secondary" data-action="practice-topic" data-topic="redes">Practicar redes ${icon('arrow')}</button></div></div>`;
    const form = document.getElementById('calculator-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const ip = data.get('ip'), prefix = data.get('prefix');
      calculatorResult = Calculator.calculate(ip, prefix);
      calcPreset = { ip, prefix };
      renderCalculator();
      if (!calculatorResult.error) toast('Subred calculada. Revisa el procedimiento paso a paso.');
    });
  }

  function renderProgress() {
    const progress = Engine.progress(store);
    const topicProgress = TOPICS.map(topic => {
      const stats = store.attempts[topic.id] || { total: 0, correct: 0 };
      const accuracy = percent(stats.correct, stats.total);
      return `<div class="progress-topic"><div class="progress-topic-top"><strong>${topic.short}</strong><span>${stats.total ? accuracy + '%' : 'Sin datos'}</span></div><div class="progress-track"><div class="progress-fill" style="width:${accuracy}%"></div></div><small>${stats.correct || 0} aciertos de ${stats.total || 0} resueltos</small></div>`;
    }).join('');
    const history = store.history.length ? `<div class="history-list">${store.history.map(record => `<article class="card history-item"><span class="history-icon">${icon(record.mode === 'global' ? 'timer' : 'practice')}</span><div><h3>${escapeHtml(record.title)}</h3><p>${new Date(record.finishedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} · ${record.total} reactivos · ${Engine.formatTime(record.elapsedSeconds)}</p></div><strong class="history-score">${record.score}%</strong><button class="btn btn-secondary btn-sm" data-action="view-result" data-id="${record.id}">Revisar</button></article>`).join('')}</div>` : `<div class="card empty-state"><span class="topic-icon">${icon('chart')}</span><h2>Tu primer resultado aparecerá aquí</h2><p>Finaliza una práctica o simulacro para ver precisión, historial y áreas que necesitas reforzar.</p><button class="btn btn-primary" data-route="practica">Comenzar una práctica</button></div>`;
    const errors = Engine.errorIds(store).length;
    main.innerHTML = `${pageHeading('Analítica local', 'Mi progreso', 'Tus resultados se guardan en este navegador. Usa los errores para decidir qué repasar después.', errors ? `<button class="btn btn-primary" data-action="retry-all-errors">${icon('practice')} Repasar ${errors} errores</button>` : '')}
      ${continueCard()}<section class="stat-grid"><div class="stat-card"><div class="stat-card-top">Precisión global<span class="stat-icon">${icon('target')}</span></div><strong class="stat-value">${progress.total ? progress.accuracy + '%' : '—'}</strong><span class="stat-note">${progress.correct} aciertos</span></div><div class="stat-card"><div class="stat-card-top">Resueltos<span class="stat-icon">${icon('practice')}</span></div><strong class="stat-value">${progress.total}</strong><span class="stat-note">en sesiones finalizadas</span></div><div class="stat-card"><div class="stat-card-top">Por reforzar<span class="stat-icon">${icon('book')}</span></div><strong class="stat-value">${progress.errors}</strong><span class="stat-note">errores y pendientes</span></div><div class="stat-card"><div class="stat-card-top">Sesiones<span class="stat-icon">${icon('history')}</span></div><strong class="stat-value">${progress.exams}</strong><span class="stat-note">historial disponible</span></div></section>
      <section class="card" style="margin-bottom:20px"><div class="card-header"><h2>Precisión por tema</h2><span class="small muted">Sobre reactivos respondidos</span></div><div class="card-body"><div class="progress-topic-grid">${topicProgress}</div></div></section>
      <section><div class="page-heading" style="margin:28px 0 15px"><div><h1 style="font-size:22px">Historial de sesiones</h1></div></div>${history}</section>
      ${store.history.length ? `<section class="card danger-zone"><div><h3>Borrar progreso local</h3><p>Elimina el historial, las estadísticas y cualquier sesión activa de este navegador.</p></div><button class="btn btn-danger btn-sm" data-action="reset-progress">${icon('trash')} Borrar datos</button></section>` : ''}`;
  }

  function confirmReset() {
    showDialog(`<div class="dialog-body"><span class="dialog-icon" style="background:var(--red-soft);color:var(--red)">${icon('trash')}</span><h2>¿Borrar todo el progreso?</h2><p>Se eliminarán historial, estadísticas y sesión activa. Esta acción no se puede deshacer.</p><div class="dialog-actions"><button class="btn btn-secondary" data-action="close-dialog">Cancelar</button><button class="btn btn-danger" data-action="confirm-reset">Sí, borrar datos</button></div></div>`);
  }

  function render() {
    clearInterval(timerInterval);
    const [route = 'inicio', param] = location.hash.slice(1).split('/');
    document.body.classList.toggle('exam-active', route === 'examen');
    updateShell(route);
    if (route === 'inicio') renderHome();
    else if (route === 'repasar') renderTopics();
    else if (route === 'tema') renderTopic(param);
    else if (route === 'practica') renderPractice(param);
    else if (route === 'examen-tema') renderPractice(param, true);
    else if (route === 'simulacro') renderGlobalSetup();
    else if (route === 'examen') renderExam();
    else if (route === 'resultado') renderResult(param);
    else if (route === 'calculadora') renderCalculator();
    else if (route === 'progreso') renderProgress();
    else { go('inicio'); return; }
    hydrateIcons(main);
    document.documentElement.lang = language;
    I18n.localize(document.body, language);
    document.title = language === 'en' ? 'Egreso Studio | Graduation Exam Prep' : 'Egreso Studio';
    document.querySelectorAll('.language-toggle').forEach(button => {
      button.textContent = language === 'es' ? 'English' : 'Español';
      button.setAttribute('aria-label', language === 'es' ? 'Cambiar idioma' : 'Change language');
    });
    document.querySelector('meta[name="description"]').content = language === 'en'
      ? 'Study, practice, and mock exams based on the General Graduation Exam topic guide.'
      : 'Estudio, práctica y simulacros del Examen General de Egreso basados en la guía temática.';
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.language-toggle')) {
      language = language === 'es' ? 'en' : 'es';
      localStorage.setItem('egreso-language', language);
      render();
      return;
    }
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) { go(routeButton.dataset.route); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'resume') go('examen');
    else if (action === 'start-global') go('simulacro');
    else if (action === 'open-topic') go(`tema/${button.dataset.topic}`);
    else if (action === 'practice-topic') go(`practica/${button.dataset.topic}`);
    else if (action === 'exam-topic') go(`examen-tema/${button.dataset.topic}`);
    else if (action === 'open-pdf') window.open('examen.pdf', '_blank', 'noopener');
    else if (action === 'view-result') { reviewFilter = 'wrong'; go(`resultado/${button.dataset.id}`); }
    else if (action === 'answer') {
      const session = store.active;
      const questionId = session.questionIds[session.current];
      Engine.answer(store, questionId, Number(button.dataset.option));
      renderExam();
      const answered = Object.keys(session.answers).length;
      if (answered > 0 && answered % 30 === 0) showBreakReminder(answered);
    }
    else if (action === 'navigate') { Engine.navigate(store, Number(button.dataset.index)); renderExam(); }
    else if (action === 'previous') { Engine.navigate(store, store.active.current - 1); renderExam(); }
    else if (action === 'next') { Engine.navigate(store, (store.active.current + 1) % store.active.questionIds.length); renderExam(); }
    else if (action === 'flag') { Engine.toggleFlag(store, store.active.questionIds[store.active.current]); renderExam(); }
    else if (action === 'finish') confirmFinish();
    else if (action === 'confirm-finish') finishExam();
    else if (action === 'save-exit') { go('inicio'); toast('Sesión guardada. Puedes continuar cuando quieras.'); }
    else if (action === 'question-calculator') {
      const question = Engine.questionMap.get(store.active.questionIds[store.active.current]);
      calculatorResult = null;
      calcPreset = question.network;
      go('calculadora');
    }
    else if (action === 'filter-review') { reviewFilter = button.dataset.filter; renderResult(location.hash.split('/')[1]); }
    else if (action === 'toggle-review') button.closest('.review-item').classList.toggle('open');
    else if (action === 'retry-result-errors') {
      const record = store.history.find(item => item.id === button.dataset.id);
      const ids = Engine.resultFor(record).rows.filter(row => !row.correct).map(row => row.question.id);
      if (ids.length) { Engine.createSession(store, { mode: 'retry', title: `Repaso de errores · ${record.title}`, questionIds: ids, immediate: true }); go('examen'); }
    }
    else if (action === 'retry-all-errors') {
      const ids = Engine.errorIds(store);
      if (ids.length) { Engine.createSession(store, { mode: 'retry', title: 'Repaso acumulado de errores', questionIds: ids, immediate: true }); go('examen'); }
    }
    else if (action === 'reset-progress') confirmReset();
    else if (action === 'confirm-reset') {
      store = { version: 1, history: [], attempts: {}, active: null };
      Engine.save(store);
      closeDialog();
      toast('Progreso local eliminado.');
      render();
    }
    else if (action === 'close-dialog') closeDialog();
    else if (action === 'close-break') document.getElementById('break-banner').classList.remove('show');
  });

  document.getElementById('menu-toggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    document.getElementById('menu-toggle').setAttribute('aria-expanded', sidebar.classList.contains('open'));
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  window.addEventListener('hashchange', render);
  hydrateIcons();
  if (!location.hash) history.replaceState(null, '', '#inicio');
  render();
})();
