(function (root) {
  'use strict';

  const content = root.EGE_CONTENT || (typeof require !== 'undefined' ? require('./content.js') : null);
  const { TOPICS, QUESTIONS, ALL_QUESTIONS = QUESTIONS } = content;
  // Keep archived duplicate IDs readable for existing local histories; only the
  // curated, deduplicated QUESTIONS bank is available for new sessions.
  const questionMap = new Map(ALL_QUESTIONS.map(question => [question.id, question]));
  const topicMap = new Map(TOPICS.map(topic => [topic.id, topic]));
  const STORAGE_KEY = 'egreso-studio-v1';

  function emptyStore() {
    return { version: 1, history: [], attempts: {}, active: null };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1 || !Array.isArray(saved.history)) return emptyStore();
      return Object.assign(emptyStore(), saved);
    } catch {
      return emptyStore();
    }
  }

  function save(store) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* El modo local sigue funcionando sin persistencia. */ }
    return store;
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function selectByFamily(pool, count) {
    const groups = new Map();
    shuffle(pool).forEach(question => {
      const family = question.family || `${question.topic}:${question.concept || question.id}`;
      if (!groups.has(family)) groups.set(family, []);
      groups.get(family).push(question);
    });
    const rounds = shuffle([...groups.values()]);
    const selected = [];
    while (selected.length < count && rounds.length) {
      for (let index = rounds.length - 1; index >= 0; index--) {
        const question = rounds[index].pop();
        if (question) selected.push(question.id);
        if (!rounds[index].length) rounds.splice(index, 1);
      }
    }
    return selected.slice(0, count);
  }

  function createSession(store, config) {
    let ids;
    if (config.questionIds) {
      ids = config.questionIds.filter(id => questionMap.has(id));
    } else if (config.mode === 'global') {
      // Keep the official 300-question distribution while drawing from the larger bank.
      ids = shuffle(TOPICS.flatMap(topic => {
        const pool = QUESTIONS.filter(question => question.topic === topic.id);
        return selectByFamily(pool, Math.min(topic.count, pool.length));
      }));
    } else {
      const pool = QUESTIONS.filter(question => question.topic === config.topicId);
      ids = selectByFamily(pool, Math.min(config.count || 10, pool.length));
    }
    if (!ids.length) throw new Error('No hay reactivos disponibles para esta configuración.');

    const now = Date.now();
    const timed = Boolean(config.timed);
    const minutes = Math.max(1, Math.min(600, Number(config.minutes) || 30));
    const topic = config.topicId ? topicMap.get(config.topicId) : null;
    const session = {
      id: `s-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: config.title || (config.mode === 'global' ? 'Simulacro global' : topic ? topic.short : 'Práctica de errores'),
      mode: config.mode,
      topicId: config.topicId || null,
      questionIds: ids,
      answers: {},
      flagged: [],
      current: 0,
      immediate: Boolean(config.immediate),
      timed,
      minutes: timed ? minutes : null,
      startedAt: now,
      endsAt: timed ? now + minutes * 60000 : null,
      finishedAt: null
    };
    store.active = session;
    save(store);
    return session;
  }

  function answer(store, questionId, optionIndex) {
    const session = store.active;
    if (!session || !session.questionIds.includes(questionId)) return;
    if (session.immediate && Object.prototype.hasOwnProperty.call(session.answers, questionId)) return;
    if (!questionMap.get(questionId).options[optionIndex]) return;
    session.answers[questionId] = optionIndex;
    save(store);
  }

  function navigate(store, index) {
    if (!store.active) return;
    store.active.current = Math.max(0, Math.min(store.active.questionIds.length - 1, index));
    save(store);
  }

  function toggleFlag(store, questionId) {
    const session = store.active;
    if (!session) return;
    session.flagged = session.flagged.includes(questionId)
      ? session.flagged.filter(id => id !== questionId)
      : [...session.flagged, questionId];
    save(store);
  }

  function discard(store) {
    store.active = null;
    save(store);
  }

  function resultFor(session) {
    const rows = session.questionIds.map(id => {
      const question = questionMap.get(id);
      const selected = Object.prototype.hasOwnProperty.call(session.answers, id) ? session.answers[id] : null;
      return { question, selected, correct: selected === question.answer, unanswered: selected === null };
    });
    const correct = rows.filter(row => row.correct).length;
    const unanswered = rows.filter(row => row.unanswered).length;
    const incorrect = rows.length - correct - unanswered;
    const perTopic = {};
    rows.forEach(row => {
      const id = row.question.topic;
      if (!perTopic[id]) perTopic[id] = { total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      perTopic[id].total++;
      if (row.correct) perTopic[id].correct++;
      else if (row.unanswered) perTopic[id].unanswered++;
      else perTopic[id].incorrect++;
    });
    return {
      rows, correct, incorrect, unanswered, total: rows.length,
      score: rows.length ? Math.round(correct / rows.length * 1000) / 10 : 0,
      perTopic,
      elapsedSeconds: Math.max(0, Math.round(((session.finishedAt || Date.now()) - session.startedAt) / 1000))
    };
  }

  function finish(store) {
    const session = store.active;
    if (!session) return null;
    session.finishedAt = Date.now();
    const result = resultFor(session);
    const record = {
      id: session.id,
      title: session.title,
      mode: session.mode,
      topicId: session.topicId,
      questionIds: [...session.questionIds],
      answers: { ...session.answers },
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      minutes: session.minutes,
      timed: session.timed,
      immediate: session.immediate,
      score: result.score,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      total: result.total,
      elapsedSeconds: result.elapsedSeconds
    };
    store.history.unshift(record);
    store.history = store.history.slice(0, 100);
    Object.entries(result.perTopic).forEach(([topicId, stats]) => {
      if (!store.attempts[topicId]) store.attempts[topicId] = { total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      Object.keys(stats).forEach(key => { store.attempts[topicId][key] += stats[key]; });
    });
    store.active = null;
    save(store);
    return record;
  }

  function progress(store) {
    const total = Object.values(store.attempts).reduce((sum, topic) => sum + topic.total, 0);
    const correct = Object.values(store.attempts).reduce((sum, topic) => sum + topic.correct, 0);
    return {
      total, correct,
      accuracy: total ? Math.round(correct / total * 1000) / 10 : 0,
      exams: store.history.length,
      errors: Math.max(0, total - correct)
    };
  }

  function errorIds(store, topicId) {
    const seen = new Set();
    const ids = [];
    store.history.forEach(record => {
      record.questionIds.forEach(id => {
        const question = questionMap.get(id);
        const selected = record.answers[id];
        if ((!topicId || question.topic === topicId) && selected !== question.answer && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      });
    });
    return ids;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const api = { STORAGE_KEY, questionMap, topicMap, load, save, shuffle, selectByFamily, createSession, answer, navigate, toggleFlag, discard, resultFor, finish, progress, errorIds, formatTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EGE_ENGINE = api;
})(typeof window !== 'undefined' ? window : globalThis);
