(() => {
  "use strict";

  const corpus = window.SPANISH_CONJUGATIONS;
  if (!corpus?.verbs?.length) {
    document.body.innerHTML = "<main class='page-shell'><h1>Training data unavailable</h1><p>Refresh the page and make sure data/conjugations.js is present.</p></main>";
    return;
  }

  const STORAGE_KEY = "de-memoria-spanish-v1";
  const VOCAB_MASTERY_STREAK = 20;
  const CONJUGATION_SOLID_STREAK = 3;
  const ALL_TENSE_IDS = corpus.tenses.map((tense) => tense.id);
  const ALL_PERSON_IDS = corpus.persons.map((person) => person.id);

  const defaultState = {
    version: 1,
    conjugation: { items: {}, totalAnswers: 0, totalCorrect: 0 },
    vocabulary: { decks: [], stats: {}, totalAnswers: 0, totalCorrect: 0 },
    settings: {
      verbCount: 20,
      sessionLength: 20,
      tenses: ALL_TENSE_IDS,
      persons: ALL_PERSON_IDS,
      selectedDeckId: null,
      wordFilter: "active",
    },
  };

  let savedState = loadState();
  const conjugationSession = {
    active: false,
    target: 20,
    answered: 0,
    score: 0,
    current: null,
    previousId: null,
    locked: false,
    answers: [],
  };
  const vocabularySession = {
    active: false,
    answered: 0,
    score: 0,
    current: null,
    previousId: null,
    locked: false,
  };

  const elements = {
    screens: [...document.querySelectorAll("[data-screen-panel]")],
    navButtons: [...document.querySelectorAll(".main-nav [data-screen]")],
    conjugationHome: document.querySelector("#conjugation-home"),
    verbAnswerTotal: document.querySelector("#verb-answer-total"),
    verbAccuracy: document.querySelector("#verb-accuracy"),
    solidFormTotal: document.querySelector("#solid-form-total"),
    tenseOptions: document.querySelector("#tense-options"),
    personOptions: document.querySelector("#person-options"),
    cueGuide: document.querySelector("#cue-guide"),
    conjugationSetupMessage: document.querySelector("#conjugation-setup-message"),
    conjugationTrainer: document.querySelector("#conjugation-trainer"),
    conjugationProgressText: document.querySelector("#conjugation-progress-text"),
    conjugationProgress: document.querySelector("#conjugation-progress"),
    conjugationProgressBar: document.querySelector("#conjugation-progress span"),
    conjugationScore: document.querySelector("#conjugation-score"),
    conjugationCue: document.querySelector("#conjugation-cue"),
    conjugationPerson: document.querySelector("#conjugation-person"),
    conjugationMeaning: document.querySelector("#conjugation-meaning"),
    conjugationQuestionTitle: document.querySelector("#conjugation-question-title"),
    conjugationAnswerForm: document.querySelector("#conjugation-answer-form"),
    conjugationAnswer: document.querySelector("#conjugation-answer"),
    conjugationFeedback: document.querySelector("#conjugation-feedback"),
    conjugationNext: document.querySelector("#conjugation-next"),
    conjugationResults: document.querySelector("#conjugation-results"),
    conjugationResultTitle: document.querySelector("#conjugation-result-title"),
    conjugationResultScore: document.querySelector("#conjugation-result-score"),
    conjugationReview: document.querySelector("#conjugation-review"),
    vocabularyHome: document.querySelector("#vocabulary-home"),
    vocabWordTotal: document.querySelector("#vocab-word-total"),
    vocabMasteredTotal: document.querySelector("#vocab-mastered-total"),
    vocabAnswerTotal: document.querySelector("#vocab-answer-total"),
    deckList: document.querySelector("#deck-list"),
    deckWorkspace: document.querySelector("#deck-workspace"),
    emptyDeckWorkspace: document.querySelector("#empty-deck-workspace"),
    selectedDeckName: document.querySelector("#selected-deck-name"),
    selectedDeckSummary: document.querySelector("#selected-deck-summary"),
    vocabImport: document.querySelector("#vocab-import"),
    vocabImportMessage: document.querySelector("#vocab-import-message"),
    wordSearch: document.querySelector("#word-search"),
    wordList: document.querySelector("#word-list"),
    vocabularyTrainer: document.querySelector("#vocabulary-trainer"),
    vocabularyDeckLabel: document.querySelector("#vocabulary-deck-label"),
    vocabularySessionScore: document.querySelector("#vocabulary-session-score"),
    vocabularyDirection: document.querySelector("#vocabulary-direction"),
    vocabularyQuestionTitle: document.querySelector("#vocabulary-question-title"),
    vocabularyAnswerForm: document.querySelector("#vocabulary-answer-form"),
    vocabularyAnswer: document.querySelector("#vocabulary-answer"),
    vocabularyFeedback: document.querySelector("#vocabulary-feedback"),
    vocabularyNext: document.querySelector("#vocabulary-next"),
    statsPracticedForms: document.querySelector("#stats-practiced-forms"),
    statsSolidForms: document.querySelector("#stats-solid-forms"),
    statsOverallAccuracy: document.querySelector("#stats-overall-accuracy"),
    statsVerbsPracticed: document.querySelector("#stats-verbs-practiced"),
    hardestCombinations: document.querySelector("#hardest-combinations"),
    verbStatsSearch: document.querySelector("#verb-stats-search"),
    verbStatsSort: document.querySelector("#verb-stats-sort"),
    verbStatsList: document.querySelector("#verb-stats-list"),
    backupImport: document.querySelector("#backup-import"),
    backupMessage: document.querySelector("#backup-message"),
    conjugationSourceNote: document.querySelector("#conjugation-source-note"),
  };

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return JSON.parse(JSON.stringify(defaultState));
      return normalizeState(parsed);
    } catch {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function normalizeState(value) {
    const settings = value.settings ?? {};
    return {
      version: 1,
      conjugation: {
        items: value.conjugation?.items ?? {},
        totalAnswers: Number(value.conjugation?.totalAnswers) || 0,
        totalCorrect: Number(value.conjugation?.totalCorrect) || 0,
      },
      vocabulary: {
        decks: Array.isArray(value.vocabulary?.decks) ? value.vocabulary.decks : [],
        stats: value.vocabulary?.stats ?? {},
        totalAnswers: Number(value.vocabulary?.totalAnswers) || 0,
        totalCorrect: Number(value.vocabulary?.totalCorrect) || 0,
      },
      settings: {
        verbCount: [20, 50, 100].includes(Number(settings.verbCount)) ? Number(settings.verbCount) : 20,
        sessionLength: [10, 20, 50].includes(Number(settings.sessionLength)) ? Number(settings.sessionLength) : 20,
        tenses: validSelection(settings.tenses, ALL_TENSE_IDS),
        persons: validSelection(settings.persons, ALL_PERSON_IDS),
        selectedDeckId: settings.selectedDeckId ?? null,
        wordFilter: ["active", "completed", "all"].includes(settings.wordFilter) ? settings.wordFilter : "active",
      },
    };
  }

  function validSelection(saved, validValues) {
    if (!Array.isArray(saved)) return [...validValues];
    return [...new Set(saved.filter((value) => validValues.includes(value)))];
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    } catch {
      // Practice remains usable if storage is unavailable.
    }
  }

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeAnswer(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[¿?¡!.,]+$/g, "")
      .toLocaleLowerCase("es");
  }

  function withoutDiacritics(value) {
    return normalizeAnswer(value).normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function randomId(prefix) {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function percent(correct, total) {
    return total ? `${Math.round((correct / total) * 100)}%` : "—";
  }

  function showScreen(name) {
    elements.screens.forEach((screen) => {
      const active = screen.dataset.screenPanel === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });
    elements.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.screen === name));
    if (name === "conjugation" && !conjugationSession.active) renderConjugationHome();
    if (name === "vocabulary" && !vocabularySession.active) renderVocabularyHome();
    if (name === "stats") renderStats();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function getConjugationStats(itemId) {
    const stats = savedState.conjugation.items[itemId] ?? {};
    return {
      attempts: Number(stats.attempts) || 0,
      correct: Number(stats.correct) || 0,
      streak: Number(stats.streak) || 0,
      lastSeen: Number(stats.lastSeen) || 0,
    };
  }

  function renderConjugationHome() {
    const conjugation = savedState.conjugation;
    const solid = Object.values(conjugation.items).filter((stats) => Number(stats.streak) >= CONJUGATION_SOLID_STREAK).length;
    elements.verbAnswerTotal.textContent = conjugation.totalAnswers.toLocaleString();
    elements.verbAccuracy.textContent = percent(conjugation.totalCorrect, conjugation.totalAnswers);
    elements.solidFormTotal.textContent = solid.toLocaleString();

    elements.tenseOptions.innerHTML = corpus.tenses.map((tense) => {
      const selected = savedState.settings.tenses.includes(tense.id);
      return `<button class="choice-button${selected ? " is-selected" : ""}" type="button" data-tense="${h(tense.id)}" aria-pressed="${selected}"><strong>${h(tense.cue)}</strong><small>${h(tense.formalName)}</small></button>`;
    }).join("");
    elements.personOptions.innerHTML = corpus.persons.map((person) => {
      const selected = savedState.settings.persons.includes(person.id);
      return `<button class="choice-button${selected ? " is-selected" : ""}" type="button" data-person="${h(person.id)}" aria-pressed="${selected}"><strong>${h(person.label)}</strong></button>`;
    }).join("");
    elements.cueGuide.innerHTML = corpus.tenses.map((tense) => `<div class="cue-row"><strong>${h(tense.cue)}</strong><span>${h(tense.formalName)}</span></div>`).join("");
    renderSegmented("[data-verb-count]", savedState.settings.verbCount, "verbCount");
    renderSegmented("[data-session-length]", savedState.settings.sessionLength, "sessionLength");
  }

  function renderSegmented(selector, selectedValue, dataKey) {
    document.querySelectorAll(selector).forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset[dataKey]) === Number(selectedValue));
    });
  }

  function toggleSelection(kind, value) {
    const key = kind === "tense" ? "tenses" : "persons";
    const current = new Set(savedState.settings[key]);
    current.has(value) ? current.delete(value) : current.add(value);
    savedState.settings[key] = [...current];
    saveState();
    renderConjugationHome();
  }

  function toggleAll(kind) {
    const key = kind === "tense" ? "tenses" : "persons";
    const all = kind === "tense" ? ALL_TENSE_IDS : ALL_PERSON_IDS;
    savedState.settings[key] = savedState.settings[key].length === all.length ? [] : [...all];
    saveState();
    renderConjugationHome();
  }

  function conjugationPool() {
    const verbs = corpus.verbs.slice(0, savedState.settings.verbCount);
    const tenses = corpus.tenses.filter((tense) => savedState.settings.tenses.includes(tense.id));
    const persons = corpus.persons
      .map((person, index) => ({ ...person, index }))
      .filter((person) => savedState.settings.persons.includes(person.id));
    return verbs.flatMap((verb) => tenses.flatMap((tense) => persons.map((person) => ({
      id: `${verb.id}:${tense.id}:${person.id}`,
      verb,
      tense,
      person,
      correct: verb.forms[tense.id][person.index],
    }))));
  }

  function conjugationNeed(item) {
    const stats = getConjugationStats(item.id);
    if (!stats.attempts) return 115;
    const accuracy = stats.correct / stats.attempts;
    const recency = Math.min(20, Math.max(0, savedState.conjugation.totalAnswers - stats.lastSeen) / 8);
    return 42 + (1 - accuracy) * 45 + (stats.streak === 0 ? 35 : 0) - Math.min(stats.streak, 8) * 7 + recency;
  }

  function chooseConjugationQuestion() {
    const ranked = conjugationPool()
      .filter((item) => item.id !== conjugationSession.previousId)
      .map((item) => ({ item, need: conjugationNeed(item) + Math.random() * 16 }))
      .sort((left, right) => right.need - left.need);
    return ranked[0]?.item ?? conjugationPool()[0];
  }

  function startConjugationSession() {
    if (!savedState.settings.tenses.length || !savedState.settings.persons.length) {
      elements.conjugationSetupMessage.textContent = "Select at least one meaning cue and one person.";
      elements.conjugationSetupMessage.hidden = false;
      return;
    }
    elements.conjugationSetupMessage.hidden = true;
    Object.assign(conjugationSession, {
      active: true,
      target: savedState.settings.sessionLength,
      answered: 0,
      score: 0,
      current: null,
      previousId: null,
      locked: false,
      answers: [],
    });
    elements.conjugationHome.hidden = true;
    elements.conjugationResults.hidden = true;
    elements.conjugationTrainer.hidden = false;
    renderNextConjugation();
  }

  function renderNextConjugation() {
    const item = chooseConjugationQuestion();
    conjugationSession.current = item;
    conjugationSession.previousId = item.id;
    conjugationSession.locked = false;
    const currentNumber = conjugationSession.answered + 1;
    elements.conjugationProgressText.textContent = `${currentNumber} of ${conjugationSession.target}`;
    elements.conjugationProgress.setAttribute("aria-valuemax", conjugationSession.target);
    elements.conjugationProgress.setAttribute("aria-valuenow", currentNumber);
    elements.conjugationProgressBar.style.width = `${(currentNumber / conjugationSession.target) * 100}%`;
    elements.conjugationScore.textContent = `${conjugationSession.score} right`;
    elements.conjugationCue.textContent = item.tense.cue;
    elements.conjugationPerson.textContent = item.person.label;
    elements.conjugationMeaning.textContent = item.verb.meaning;
    elements.conjugationQuestionTitle.textContent = item.verb.infinitive;
    resetAnswerArea(elements.conjugationAnswer, elements.conjugationAnswerForm, elements.conjugationFeedback, elements.conjugationNext);
  }

  function resetAnswerArea(input, form, feedback, nextButton) {
    form.hidden = false;
    form.querySelector("button[type='submit']").hidden = false;
    input.disabled = false;
    input.value = "";
    input.className = "";
    feedback.hidden = true;
    feedback.className = "feedback";
    nextButton.hidden = true;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }

  function recordConjugation(correct) {
    const item = conjugationSession.current;
    const stats = getConjugationStats(item.id);
    savedState.conjugation.items[item.id] = {
      attempts: stats.attempts + 1,
      correct: stats.correct + (correct ? 1 : 0),
      streak: correct ? stats.streak + 1 : 0,
      lastSeen: savedState.conjugation.totalAnswers + 1,
    };
    savedState.conjugation.totalAnswers += 1;
    savedState.conjugation.totalCorrect += correct ? 1 : 0;
    saveState();
    return savedState.conjugation.items[item.id];
  }

  function answerConjugation(value) {
    if (conjugationSession.locked) return;
    conjugationSession.locked = true;
    const item = conjugationSession.current;
    const selected = normalizeAnswer(value);
    const correct = selected === normalizeAnswer(item.correct);
    const accentOnly = !correct && withoutDiacritics(selected) === withoutDiacritics(item.correct);
    const stats = recordConjugation(correct);
    conjugationSession.answered += 1;
    conjugationSession.score += correct ? 1 : 0;
    conjugationSession.answers.push({ item, selected: value.trim(), correct, accentOnly });
    elements.conjugationAnswer.disabled = true;
    elements.conjugationAnswer.classList.add(correct ? "is-correct" : "is-wrong");
    elements.conjugationFeedback.hidden = false;
    elements.conjugationFeedback.classList.add(correct ? "is-correct" : accentOnly ? "is-accent" : "is-wrong");
    elements.conjugationFeedback.innerHTML = correct
      ? `<strong>Correct.</strong><span>This exact form is now at a ${stats.streak}-answer streak.</span>`
      : accentOnly
        ? `<strong>Almost — the written accent matters.</strong><span>Correct answer: <b>${h(item.correct)}</b>. This counts as a miss.</span>`
        : `<strong>Not quite.</strong><span>Correct answer: <b>${h(item.correct)}</b>.</span>`;
    elements.conjugationAnswerForm.querySelector("button[type='submit']").hidden = true;
    elements.conjugationNext.hidden = false;
    elements.conjugationNext.textContent = conjugationSession.answered >= conjugationSession.target ? "See results →" : "Next prompt →";
    elements.conjugationNext.focus({ preventScroll: true });
  }

  function nextConjugation() {
    if (!conjugationSession.locked) return;
    elements.conjugationAnswerForm.querySelector("button[type='submit']").hidden = false;
    if (conjugationSession.answered >= conjugationSession.target) finishConjugationSession();
    else renderNextConjugation();
  }

  function finishConjugationSession() {
    conjugationSession.active = false;
    elements.conjugationTrainer.hidden = true;
    elements.conjugationResults.hidden = false;
    const accuracy = Math.round((conjugationSession.score / conjugationSession.target) * 100);
    elements.conjugationResultTitle.textContent = accuracy === 100 ? "Perfect recall." : accuracy >= 80 ? "Strong session." : "Keep building it.";
    elements.conjugationResultScore.textContent = `${conjugationSession.score} of ${conjugationSession.target} correct · ${accuracy}%`;
    const misses = conjugationSession.answers.filter((answer) => !answer.correct);
    elements.conjugationReview.innerHTML = misses.length
      ? `<p class="eyebrow">Review these forms</p>${misses.map(({ item, selected }) => `<div class="review-item"><strong>${h(item.verb.infinitive)} · ${h(item.tense.cue)} · ${h(item.person.label)}</strong><span>Your answer: ${h(selected || "(blank)")}</span><em>${h(item.correct)}</em></div>`).join("")}`
      : "";
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showConjugationHome() {
    conjugationSession.active = false;
    elements.conjugationTrainer.hidden = true;
    elements.conjugationResults.hidden = true;
    elements.conjugationHome.hidden = false;
    renderConjugationHome();
  }

  function allConjugationItems() {
    return corpus.verbs.flatMap((verb) => corpus.tenses.flatMap((tense) => corpus.persons.map((person, personIndex) => ({
      id: `${verb.id}:${tense.id}:${person.id}`,
      verb,
      tense,
      person,
      correct: verb.forms[tense.id][personIndex],
    }))));
  }

  function verbPerformance(verb) {
    const items = corpus.tenses.flatMap((tense) => corpus.persons.map((person) => ({
      id: `${verb.id}:${tense.id}:${person.id}`,
      stats: getConjugationStats(`${verb.id}:${tense.id}:${person.id}`),
    })));
    const attempts = items.reduce((total, item) => total + item.stats.attempts, 0);
    const correct = items.reduce((total, item) => total + item.stats.correct, 0);
    return {
      verb,
      attempts,
      correct,
      accuracy: attempts ? correct / attempts : null,
      practicedForms: items.filter((item) => item.stats.attempts > 0).length,
      solidForms: items.filter((item) => item.stats.streak >= CONJUGATION_SOLID_STREAK).length,
    };
  }

  function renderStats() {
    const practicedItems = allConjugationItems()
      .map((item) => ({ ...item, stats: getConjugationStats(item.id) }))
      .filter((item) => item.stats.attempts > 0);
    const solidForms = practicedItems.filter((item) => item.stats.streak >= CONJUGATION_SOLID_STREAK).length;
    const practicedVerbIds = new Set(practicedItems.map((item) => item.verb.id));
    elements.statsPracticedForms.textContent = `${practicedItems.length}/3,500`;
    elements.statsSolidForms.textContent = solidForms.toLocaleString();
    elements.statsOverallAccuracy.textContent = percent(savedState.conjugation.totalCorrect, savedState.conjugation.totalAnswers);
    elements.statsVerbsPracticed.textContent = `${practicedVerbIds.size}/100`;

    const hardest = [...practicedItems]
      .sort((left, right) => {
        const leftAccuracy = left.stats.correct / left.stats.attempts;
        const rightAccuracy = right.stats.correct / right.stats.attempts;
        return leftAccuracy - rightAccuracy
          || left.stats.streak - right.stats.streak
          || right.stats.attempts - left.stats.attempts
          || left.verb.rank - right.verb.rank;
      })
      .slice(0, 20);
    elements.hardestCombinations.innerHTML = hardest.length
      ? hardest.map((item) => {
          const accuracy = Math.round((item.stats.correct / item.stats.attempts) * 100);
          return `<article class="hardest-item"><div><strong>${h(item.verb.infinitive)} · ${h(item.tense.cue)} · ${h(item.person.label)}</strong><span>Answer: ${h(item.correct)} · streak ${item.stats.streak}</span></div><small>${accuracy}%<br>${item.stats.correct}/${item.stats.attempts}</small></article>`;
        }).join("")
      : '<p class="empty-list">Complete a conjugation session to build your difficulty ranking.</p>';
    renderVerbStats();
  }

  function renderVerbStats() {
    const query = normalizeAnswer(elements.verbStatsSearch.value);
    const sort = elements.verbStatsSort.value;
    const rows = corpus.verbs.map(verbPerformance).filter(({ verb }) => normalizeAnswer(`${verb.infinitive} ${verb.meaning}`).includes(query));
    rows.sort((left, right) => {
      if (sort === "name") return left.verb.infinitive.localeCompare(right.verb.infinitive, "es");
      if (sort === "progress") return right.solidForms - left.solidForms || right.practicedForms - left.practicedForms || left.verb.rank - right.verb.rank;
      if (sort === "difficulty") {
        if (left.accuracy === null && right.accuracy !== null) return 1;
        if (left.accuracy !== null && right.accuracy === null) return -1;
        if (left.accuracy !== right.accuracy) return (left.accuracy ?? 1) - (right.accuracy ?? 1);
        return left.solidForms - right.solidForms || right.attempts - left.attempts || left.verb.rank - right.verb.rank;
      }
      return left.verb.rank - right.verb.rank;
    });
    elements.verbStatsList.innerHTML = rows.length
      ? rows.map(({ verb, attempts, correct, accuracy, practicedForms, solidForms }) => `<article class="verb-stats-row"><div class="verb-name-cell"><span class="verb-rank">${verb.rank}</span><div><strong>${h(verb.infinitive)}</strong><small>${h(verb.meaning)}</small></div></div><div class="metric-cell"><strong>${practicedForms}/35</strong><small>unique forms</small></div><div class="metric-cell"><strong>${accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`}</strong><small>${attempts ? `${correct}/${attempts} answers` : "not started"}</small></div><div class="metric-cell"><strong>${solidForms}/35</strong><small>streak 3+</small></div></article>`).join("")
      : '<p class="empty-list">No verbs match that search.</p>';
  }

  function selectedDeck() {
    return savedState.vocabulary.decks.find((deck) => deck.id === savedState.settings.selectedDeckId) ?? null;
  }

  function getDirectionStats(deckId, wordId, direction) {
    const saved = savedState.vocabulary.stats[`${deckId}:${wordId}`]?.[direction] ?? {};
    return {
      attempts: Number(saved.attempts) || 0,
      correct: Number(saved.correct) || 0,
      streak: Number(saved.streak) || 0,
      lastSeen: Number(saved.lastSeen) || 0,
    };
  }

  function wordIsMastered(deckId, wordId) {
    return getDirectionStats(deckId, wordId, "en_es").streak >= VOCAB_MASTERY_STREAK
      && getDirectionStats(deckId, wordId, "es_en").streak >= VOCAB_MASTERY_STREAK;
  }

  function vocabularyTotals() {
    let words = 0;
    let mastered = 0;
    savedState.vocabulary.decks.forEach((deck) => {
      words += deck.words.length;
      mastered += deck.words.filter((word) => wordIsMastered(deck.id, word.id)).length;
    });
    return { words, mastered };
  }

  function ensureSelectedDeck() {
    if (!selectedDeck() && savedState.vocabulary.decks.length) {
      savedState.settings.selectedDeckId = savedState.vocabulary.decks[0].id;
      saveState();
    }
  }

  function renderVocabularyHome() {
    ensureSelectedDeck();
    const totals = vocabularyTotals();
    elements.vocabWordTotal.textContent = totals.words.toLocaleString();
    elements.vocabMasteredTotal.textContent = totals.mastered.toLocaleString();
    elements.vocabAnswerTotal.textContent = savedState.vocabulary.totalAnswers.toLocaleString();
    elements.deckList.innerHTML = savedState.vocabulary.decks.length
      ? savedState.vocabulary.decks.map((deck) => {
          const mastered = deck.words.filter((word) => wordIsMastered(deck.id, word.id)).length;
          return `<button class="deck-button${deck.id === savedState.settings.selectedDeckId ? " is-selected" : ""}" type="button" data-deck-id="${h(deck.id)}"><strong>${h(deck.name)}</strong><span>${deck.words.length} words · ${mastered} completed</span></button>`;
        }).join("")
      : '<p class="empty-list">No decks yet.</p>';

    const deck = selectedDeck();
    elements.deckWorkspace.hidden = !deck;
    elements.emptyDeckWorkspace.hidden = Boolean(deck);
    if (!deck) return;
    const mastered = deck.words.filter((word) => wordIsMastered(deck.id, word.id)).length;
    elements.selectedDeckName.textContent = deck.name;
    elements.selectedDeckSummary.textContent = `${deck.words.length} words · ${mastered} completed · ${deck.words.length - mastered} active`;
    const practiceButton = elements.deckWorkspace.querySelector("[data-action='start-vocabulary']");
    practiceButton.disabled = deck.words.length === 0;
    practiceButton.textContent = deck.words.length && mastered === deck.words.length ? "Review completed words" : "Practice active words";
    document.querySelectorAll("[data-word-filter]").forEach((button) => button.classList.toggle("is-selected", button.dataset.wordFilter === savedState.settings.wordFilter));
    renderWordList();
  }

  function renderWordList() {
    const deck = selectedDeck();
    if (!deck) return;
    const query = normalizeAnswer(elements.wordSearch.value);
    const filter = savedState.settings.wordFilter;
    const words = deck.words.filter((word) => {
      const mastered = wordIsMastered(deck.id, word.id);
      const matchesFilter = filter === "all" || (filter === "completed" ? mastered : !mastered);
      const haystack = normalizeAnswer([...word.spanish, ...word.english].join(" "));
      return matchesFilter && haystack.includes(query);
    });
    elements.wordList.innerHTML = words.length
      ? words.map((word) => {
          const enEs = getDirectionStats(deck.id, word.id, "en_es").streak;
          const esEn = getDirectionStats(deck.id, word.id, "es_en").streak;
          const mastered = wordIsMastered(deck.id, word.id);
          return `<article class="word-row"><strong>${h(word.spanish.join("; "))}</strong><span>${h(word.english.join("; "))}</span><div class="word-streaks"><small>EN → ES ${enEs}/20 · ES → EN ${esEn}/20</small><strong>${mastered ? "Completed" : `${Math.min(enEs, esEn)}/20 both-way floor`}</strong></div><button class="remove-word" type="button" data-remove-word="${h(word.id)}" aria-label="Remove ${h(word.spanish[0])}">×</button></article>`;
        }).join("")
      : '<p class="empty-list">No words in this view.</p>';
  }

  function createDeck(name) {
    const cleanName = String(name).trim();
    if (!cleanName) return;
    const deck = { id: randomId("deck"), name: cleanName, createdAt: Date.now(), words: [] };
    savedState.vocabulary.decks.push(deck);
    savedState.settings.selectedDeckId = deck.id;
    saveState();
    renderVocabularyHome();
  }

  function parseAliases(value) {
    return unique(value.split(";").map((part) => part.trim()).filter(Boolean));
  }

  function parseVocabulary(text) {
    const valid = [];
    const invalid = [];
    String(text).split(/\r?\n/).forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return;
      let parts = line.split("\t");
      if (parts.length < 2) parts = line.split(/\s+\|\s+/);
      if (parts.length < 2) parts = line.split(/\s+::\s+/);
      if (parts.length < 2) {
        invalid.push(index + 1);
        return;
      }
      const spanish = parseAliases(parts[0]);
      const english = parseAliases(parts.slice(1).join(" ").trim());
      if (!spanish.length || !english.length) invalid.push(index + 1);
      else valid.push({ spanish, english });
    });
    return { valid, invalid };
  }

  function importVocabulary(text) {
    const deck = selectedDeck();
    if (!deck) return;
    const parsed = parseVocabulary(text);
    let added = 0;
    let merged = 0;
    parsed.valid.forEach((incoming) => {
      const existing = deck.words.find((word) => normalizeAnswer(word.spanish[0]) === normalizeAnswer(incoming.spanish[0])
        && normalizeAnswer(word.english[0]) === normalizeAnswer(incoming.english[0]));
      if (existing) {
        existing.spanish = unique([...existing.spanish, ...incoming.spanish]);
        existing.english = unique([...existing.english, ...incoming.english]);
        merged += 1;
      } else {
        deck.words.push({ id: randomId("word"), spanish: incoming.spanish, english: incoming.english, createdAt: Date.now() });
        added += 1;
      }
    });
    saveState();
    elements.vocabImportMessage.textContent = `${added} added${merged ? ` · ${merged} duplicate${merged === 1 ? "" : "s"} merged` : ""}${parsed.invalid.length ? ` · lines ${parsed.invalid.join(", ")} skipped` : ""}.`;
    if (added || merged) elements.vocabImport.value = "";
    renderVocabularyHome();
  }

  function removeWord(wordId) {
    const deck = selectedDeck();
    const word = deck?.words.find((candidate) => candidate.id === wordId);
    if (!deck || !word || !window.confirm(`Remove “${word.spanish[0]}” from ${deck.name}?`)) return;
    deck.words = deck.words.filter((candidate) => candidate.id !== wordId);
    delete savedState.vocabulary.stats[`${deck.id}:${word.id}`];
    saveState();
    renderVocabularyHome();
  }

  function vocabDirectionNeed(deck, word, direction) {
    const stats = getDirectionStats(deck.id, word.id, direction);
    if (!stats.attempts) return 135;
    const accuracy = stats.correct / stats.attempts;
    return 100 - Math.min(stats.streak, VOCAB_MASTERY_STREAK) * 5 + (1 - accuracy) * 35 + (stats.streak === 0 ? 30 : 0);
  }

  function chooseVocabularyQuestion() {
    const deck = selectedDeck();
    if (!deck?.words.length) return null;
    const activeWords = deck.words.filter((word) => !wordIsMastered(deck.id, word.id));
    const words = activeWords.length ? activeWords : deck.words;
    let candidates = words.flatMap((word) => ["en_es", "es_en"].map((direction) => ({
      id: `${word.id}:${direction}`,
      word,
      direction,
      need: vocabDirectionNeed(deck, word, direction) + Math.random() * 18,
    })));
    const unfinishedDirections = candidates.filter(({ word, direction }) => getDirectionStats(deck.id, word.id, direction).streak < VOCAB_MASTERY_STREAK);
    if (unfinishedDirections.length) candidates = unfinishedDirections;
    const withoutPrevious = candidates.filter((candidate) => candidate.id !== vocabularySession.previousId);
    return (withoutPrevious.length ? withoutPrevious : candidates).sort((left, right) => right.need - left.need)[0] ?? null;
  }

  function startVocabularySession() {
    if (!selectedDeck()?.words.length) return;
    Object.assign(vocabularySession, { active: true, answered: 0, score: 0, current: null, previousId: null, locked: false });
    elements.vocabularyHome.hidden = true;
    elements.vocabularyTrainer.hidden = false;
    renderNextVocabulary();
  }

  function renderNextVocabulary() {
    const question = chooseVocabularyQuestion();
    if (!question) return;
    vocabularySession.current = question;
    vocabularySession.previousId = question.id;
    vocabularySession.locked = false;
    const deck = selectedDeck();
    const englishToSpanish = question.direction === "en_es";
    elements.vocabularyDeckLabel.textContent = deck.name;
    elements.vocabularySessionScore.textContent = `${vocabularySession.score} / ${vocabularySession.answered}`;
    elements.vocabularyDirection.textContent = englishToSpanish ? "English → Spanish" : "Spanish → English";
    elements.vocabularyQuestionTitle.textContent = (englishToSpanish ? question.word.english : question.word.spanish)[0];
    document.querySelectorAll("[data-vocab-accent]").forEach((button) => { button.hidden = !englishToSpanish; });
    resetAnswerArea(elements.vocabularyAnswer, elements.vocabularyAnswerForm, elements.vocabularyFeedback, elements.vocabularyNext);
  }

  function recordVocabulary(correct) {
    const deck = selectedDeck();
    const { word, direction } = vocabularySession.current;
    const key = `${deck.id}:${word.id}`;
    const current = getDirectionStats(deck.id, word.id, direction);
    const otherDirection = direction === "en_es" ? "es_en" : "en_es";
    savedState.vocabulary.stats[key] = {
      ...(savedState.vocabulary.stats[key] ?? {}),
      [otherDirection]: getDirectionStats(deck.id, word.id, otherDirection),
      [direction]: {
        attempts: current.attempts + 1,
        correct: current.correct + (correct ? 1 : 0),
        streak: correct ? current.streak + 1 : 0,
        lastSeen: savedState.vocabulary.totalAnswers + 1,
      },
    };
    savedState.vocabulary.totalAnswers += 1;
    savedState.vocabulary.totalCorrect += correct ? 1 : 0;
    saveState();
    return savedState.vocabulary.stats[key][direction];
  }

  function answerVocabulary(value) {
    if (vocabularySession.locked) return;
    vocabularySession.locked = true;
    const { word, direction } = vocabularySession.current;
    const accepted = direction === "en_es" ? word.spanish : word.english;
    const selected = normalizeAnswer(value);
    const correct = accepted.some((answer) => normalizeAnswer(answer) === selected);
    const accentOnly = !correct && direction === "en_es" && accepted.some((answer) => withoutDiacritics(answer) === withoutDiacritics(selected));
    const stats = recordVocabulary(correct);
    vocabularySession.answered += 1;
    vocabularySession.score += correct ? 1 : 0;
    const deck = selectedDeck();
    const nowMastered = wordIsMastered(deck.id, word.id);
    elements.vocabularyAnswer.disabled = true;
    elements.vocabularyAnswer.classList.add(correct ? "is-correct" : "is-wrong");
    elements.vocabularyFeedback.hidden = false;
    elements.vocabularyFeedback.classList.add(correct ? "is-correct" : accentOnly ? "is-accent" : "is-wrong");
    elements.vocabularyFeedback.innerHTML = correct
      ? `<strong>${nowMastered ? "Completed — known both ways." : "Correct."}</strong><span>This direction is at ${Math.min(stats.streak, VOCAB_MASTERY_STREAK)}/20 consecutive correct.</span>`
      : accentOnly
        ? `<strong>Almost — the accent matters.</strong><span>Accepted answer: <b>${h(accepted.join("; "))}</b>. This direction resets to 0/20.</span>`
        : `<strong>Not quite.</strong><span>Accepted answer: <b>${h(accepted.join("; "))}</b>. This direction resets to 0/20.</span>`;
    elements.vocabularyAnswerForm.querySelector("button[type='submit']").hidden = true;
    elements.vocabularyNext.hidden = false;
    elements.vocabularyNext.focus({ preventScroll: true });
    elements.vocabularySessionScore.textContent = `${vocabularySession.score} / ${vocabularySession.answered}`;
  }

  function nextVocabulary() {
    if (!vocabularySession.locked) return;
    elements.vocabularyAnswerForm.querySelector("button[type='submit']").hidden = false;
    renderNextVocabulary();
  }

  function exitVocabularySession() {
    vocabularySession.active = false;
    elements.vocabularyTrainer.hidden = true;
    elements.vocabularyHome.hidden = false;
    renderVocabularyHome();
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
    input.focus();
    input.setSelectionRange(start + text.length, start + text.length);
  }

  function safeFilename(value) {
    return String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "vocabulary";
  }

  function downloadFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportSelectedDeck() {
    const deck = selectedDeck();
    if (!deck) return;
    const text = deck.words.map((word) => `${word.spanish.join("; ")}\t${word.english.join("; ")}`).join("\n");
    downloadFile(`${safeFilename(deck.name)}.txt`, text, "text/plain;charset=utf-8");
  }

  function exportAllData() {
    const payload = { app: "De Memoria", exportedAt: new Date().toISOString(), data: savedState };
    downloadFile(`de-memoria-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
    elements.backupMessage.textContent = "Backup downloaded.";
  }

  async function importBackup(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const candidate = parsed.data ?? parsed;
      if (!candidate?.conjugation || !candidate?.vocabulary || !Array.isArray(candidate.vocabulary.decks)) throw new Error("This is not a De Memoria backup.");
      if (!window.confirm("Replace the progress and vocabulary currently saved in this browser with this backup?")) return;
      savedState = normalizeState(candidate);
      saveState();
      elements.backupMessage.textContent = "Backup imported successfully.";
      renderConjugationHome();
      renderVocabularyHome();
    } catch (error) {
      elements.backupMessage.textContent = `Import failed: ${error.message}`;
    } finally {
      elements.backupImport.value = "";
    }
  }

  document.addEventListener("click", (event) => {
    const screenButton = event.target.closest("[data-screen]");
    if (screenButton) {
      showScreen(screenButton.dataset.screen);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === "start-conjugation") startConjugationSession();
      else if (action === "next-conjugation") nextConjugation();
      else if (action === "exit-conjugation" || action === "conjugation-home") showConjugationHome();
      else if (action === "repeat-conjugation") startConjugationSession();
      else if (action === "toggle-all-tenses") toggleAll("tense");
      else if (action === "toggle-all-persons") toggleAll("person");
      else if (action === "start-vocabulary") startVocabularySession();
      else if (action === "next-vocabulary") nextVocabulary();
      else if (action === "exit-vocabulary") exitVocabularySession();
      else if (action === "export-deck") exportSelectedDeck();
      else if (action === "export-all") exportAllData();
      return;
    }

    const verbCountButton = event.target.closest("[data-verb-count]");
    if (verbCountButton) {
      savedState.settings.verbCount = Number(verbCountButton.dataset.verbCount);
      saveState();
      renderConjugationHome();
      return;
    }

    const lengthButton = event.target.closest("[data-session-length]");
    if (lengthButton) {
      savedState.settings.sessionLength = Number(lengthButton.dataset.sessionLength);
      saveState();
      renderConjugationHome();
      return;
    }

    const tenseButton = event.target.closest("[data-tense]");
    if (tenseButton) {
      toggleSelection("tense", tenseButton.dataset.tense);
      return;
    }

    const personButton = event.target.closest("[data-person]");
    if (personButton) {
      toggleSelection("person", personButton.dataset.person);
      return;
    }

    const accentButton = event.target.closest("[data-accent]");
    if (accentButton) {
      insertAtCursor(elements.conjugationAnswer, accentButton.dataset.accent);
      return;
    }

    const vocabAccentButton = event.target.closest("[data-vocab-accent]");
    if (vocabAccentButton) {
      insertAtCursor(elements.vocabularyAnswer, vocabAccentButton.dataset.vocabAccent);
      return;
    }

    const deckButton = event.target.closest("[data-deck-id]");
    if (deckButton) {
      savedState.settings.selectedDeckId = deckButton.dataset.deckId;
      saveState();
      renderVocabularyHome();
      return;
    }

    const filterButton = event.target.closest("[data-word-filter]");
    if (filterButton) {
      savedState.settings.wordFilter = filterButton.dataset.wordFilter;
      saveState();
      renderVocabularyHome();
      return;
    }

    const removeButton = event.target.closest("[data-remove-word]");
    if (removeButton) removeWord(removeButton.dataset.removeWord);
  });

  elements.conjugationAnswerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    answerConjugation(elements.conjugationAnswer.value);
  });

  elements.vocabularyAnswerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    answerVocabulary(elements.vocabularyAnswer.value);
  });

  document.querySelector("#create-deck-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.name;
    createDeck(input.value);
    input.value = "";
  });

  document.querySelector("#import-vocab-form").addEventListener("submit", (event) => {
    event.preventDefault();
    importVocabulary(elements.vocabImport.value);
  });

  elements.wordSearch.addEventListener("input", renderWordList);
  elements.verbStatsSearch.addEventListener("input", renderVerbStats);
  elements.verbStatsSort.addEventListener("change", renderVerbStats);
  elements.backupImport.addEventListener("change", () => {
    const [file] = elements.backupImport.files;
    if (file) importBackup(file);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (conjugationSession.active && conjugationSession.locked) {
      event.preventDefault();
      nextConjugation();
    } else if (vocabularySession.active && vocabularySession.locked) {
      event.preventDefault();
      nextVocabulary();
    }
  });

  elements.conjugationSourceNote.textContent = `${corpus.verbs.length} verbs · ${corpus.meta.region} · ${corpus.meta.orthography}. Forms were generated offline from ${corpus.meta.source} and checked by the repository validation suite.`;
  renderConjugationHome();
  renderVocabularyHome();
})();
