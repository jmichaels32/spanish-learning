#!/usr/bin/env node

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const browserErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => browserErrors.push(error));
virtualConsole.on("error", (error) => browserErrors.push(error));

const dom = await JSDOM.fromFile(resolve(root, "index.html"), {
  resources: "usable",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.scrollTo = () => {};
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.crypto.randomUUID ??= () => `test-${Math.random().toString(36).slice(2)}`;
  },
});

await new Promise((resolveLoad, rejectLoad) => {
  const timer = setTimeout(() => rejectLoad(new Error("App load timed out.")), 5000);
  dom.window.addEventListener("load", () => {
    clearTimeout(timer);
    setTimeout(resolveLoad, 20);
  }, { once: true });
});

const { document } = dom.window;
assert.equal(dom.window.SPANISH_CONJUGATIONS.verbs.length, 2000);
assert.equal(document.querySelectorAll("[data-tense]").length, 7);
assert.equal(document.querySelectorAll("[data-person]").length, 5);
assert.equal(document.querySelectorAll("#verb-count-select option").length, 22);
assert.equal(document.querySelector("#verb-count-select option[value='200']").disabled, true);
assert.equal(document.querySelectorAll("#verb-count-select option:disabled").length, 19);
assert.match(document.querySelector("#tier-status").textContent, /0\/3,500 solid/);

document.querySelector("[data-action='toggle-all-tenses']").click();
document.querySelector("[data-tense='would']").click();
document.querySelector("[data-action='toggle-all-persons']").click();
document.querySelector("[data-person='el']").click();
document.querySelector("[data-action='start-conjugation']").click();

const verbId = document.querySelector("#conjugation-question-title").textContent;
const verb = dom.window.SPANISH_CONJUGATIONS.verbs.find((candidate) => candidate.id === verbId);
assert.ok(verb, "Conjugation question should use a known verb.");
const answerInput = document.querySelector("#conjugation-answer");
answerInput.value = verb.forms.would[2];
document.querySelector("#conjugation-answer-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
assert.match(document.querySelector("#conjugation-feedback").textContent, /Correct/);
document.querySelector("[data-action='exit-conjugation']").click();

document.querySelector(".main-nav [data-screen='stats']").click();
assert.equal(document.querySelectorAll(".verb-stats-row").length, 200);
assert.equal(document.querySelectorAll(".verb-stats-row.is-locked").length, 100);
assert.match(document.querySelector("#stats-practiced-forms").textContent, /1\/70,000/);
assert.match(document.querySelector("#hardest-combinations").textContent, new RegExp(verbId));
assert.match(document.querySelector("#stats-tier-status").textContent, /Tier 1 unlocked permanently/);
assert.equal(dom.window.SPANISH_CURRICULUM_ANALYSIS.candidates.length, 2000);
assert.equal(document.querySelectorAll(".histogram-bar").length, 20);
assert.equal(document.querySelectorAll(".candidate-row").length, 200);
assert.match(document.querySelector("#curriculum-lab-summary").textContent, /2,000candidate verbs/);

const curriculumSearch = document.querySelector("#curriculum-search");
curriculumSearch.value = "limpiar";
curriculumSearch.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
assert.equal(document.querySelectorAll(".candidate-row").length, 1);
assert.match(document.querySelector("#curriculum-candidate-list").textContent, /limpiar/);
curriculumSearch.value = "";
curriculumSearch.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
document.querySelector("[data-curriculum-scope='1000']").click();
assert.match(document.querySelector("#curriculum-lab-summary").textContent, /1,000candidate verbs/);
const curriculumCutoff = document.querySelector("#curriculum-cutoff");
curriculumCutoff.value = "60";
curriculumCutoff.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
assert.match(document.querySelector("#curriculum-cutoff-summary").textContent, /108 at or above/);
const aboveCutoff = document.querySelector("#curriculum-above-cutoff");
aboveCutoff.checked = true;
aboveCutoff.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
assert.equal(document.querySelectorAll(".candidate-row").length, 108);

const completedItems = {};
for (const completedVerb of dom.window.SPANISH_CONJUGATIONS.verbs.slice(0, 100)) {
  for (const tense of dom.window.SPANISH_CONJUGATIONS.tenses) {
    for (const person of dom.window.SPANISH_CONJUGATIONS.persons) {
      completedItems[`${completedVerb.id}:${tense.id}:${person.id}`] = { attempts: 3, correct: 3, streak: 3, lastSeen: 1 };
    }
  }
}
const completedBackup = {
  version: 1,
  conjugation: { items: completedItems, totalAnswers: 10500, totalCorrect: 10500, tier2Unlocked: false },
  vocabulary: { decks: [], stats: {}, totalAnswers: 0, totalCorrect: 0 },
  settings: { verbCount: 100, sessionLength: 20 },
};
dom.window.confirm = () => true;
const backupInput = document.querySelector("#backup-import");
Object.defineProperty(backupInput, "files", { configurable: true, value: [{ text: async () => JSON.stringify(completedBackup) }] });
backupInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
await new Promise((resolveImport) => setTimeout(resolveImport, 20));
assert.equal(document.querySelector("#verb-count-select option[value='200']").disabled, false);
assert.match(document.querySelector("#tier-status").textContent, /Tier 3 unlocks permanently/);
document.querySelector(".main-nav [data-screen='stats']").click();
assert.match(document.querySelector("#stats-tier-status").textContent, /Tier 2 unlocked permanently/);

document.querySelector(".main-nav [data-screen='conjugation']").click();
const verbCountSelect = document.querySelector("#verb-count-select");
verbCountSelect.value = "200";
verbCountSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
document.querySelector("[data-action='start-conjugation']").click();
const tier2VerbId = document.querySelector("#conjugation-question-title").textContent;
const tier2Verb = dom.window.SPANISH_CONJUGATIONS.verbs.find((candidate) => candidate.id === tier2VerbId);
assert.ok(tier2Verb.rank > 100, "Unlocked practice should introduce an unseen Tier 2 verb before solid Tier 1 forms.");
document.querySelector("[data-action='exit-conjugation']").click();

const completedTwoTierItems = { ...completedItems };
for (const completedVerb of dom.window.SPANISH_CONJUGATIONS.verbs.slice(100, 200)) {
  for (const tense of dom.window.SPANISH_CONJUGATIONS.tenses) {
    for (const person of dom.window.SPANISH_CONJUGATIONS.persons) {
      completedTwoTierItems[`${completedVerb.id}:${tense.id}:${person.id}`] = { attempts: 3, correct: 3, streak: 3, lastSeen: 1 };
    }
  }
}
const completedTwoTierBackup = {
  ...completedBackup,
  conjugation: { items: completedTwoTierItems, totalAnswers: 21000, totalCorrect: 21000, highestUnlockedTier: 2 },
  settings: { ...completedBackup.settings, verbCount: 200 },
};
Object.defineProperty(backupInput, "files", { configurable: true, value: [{ text: async () => JSON.stringify(completedTwoTierBackup) }] });
backupInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
await new Promise((resolveImport) => setTimeout(resolveImport, 20));
assert.equal(document.querySelector("#verb-count-select option[value='300']").disabled, false);
assert.equal(document.querySelector("#verb-count-select option[value='400']").disabled, true);
assert.match(document.querySelector("#tier-status").textContent, /Tier 4 unlocks permanently/);

document.querySelector(".main-nav [data-screen='vocabulary']").click();
const deckName = document.querySelector("#new-deck-name");
deckName.value = "Smoke deck";
document.querySelector("#create-deck-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
const importBox = document.querySelector("#vocab-import");
importBox.value = "la meta\tgoal; objective";
document.querySelector("#import-vocab-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
assert.match(document.querySelector("#selected-deck-summary").textContent, /1 words/);
document.querySelector("[data-action='start-vocabulary']").click();

let completionReached = false;
for (let answerNumber = 0; answerNumber < 45; answerNumber += 1) {
  const direction = document.querySelector("#vocabulary-direction").textContent;
  document.querySelector("#vocabulary-answer").value = direction.startsWith("English") ? "la meta" : "goal";
  document.querySelector("#vocabulary-answer-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  assert.match(document.querySelector("#vocabulary-feedback").textContent, /Correct|Completed/);
  if (document.querySelector("#vocabulary-feedback").textContent.includes("Completed")) {
    completionReached = true;
    break;
  }
  document.querySelector("[data-action='next-vocabulary']").click();
}
assert.equal(completionReached, true, "A word should complete after 20 correct recalls in each direction.");
document.querySelector("[data-action='exit-vocabulary']").click();
assert.match(document.querySelector("#selected-deck-summary").textContent, /1 completed/);

document.querySelector("[data-action='start-vocabulary']").click();
document.querySelector("#vocabulary-answer").value = "definitely wrong";
document.querySelector("#vocabulary-answer-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
assert.match(document.querySelector("#vocabulary-feedback").textContent, /resets to 0\/20/);
document.querySelector("[data-action='exit-vocabulary']").click();
assert.match(document.querySelector("#selected-deck-summary").textContent, /0 completed/);

assert.deepEqual(browserErrors, [], `Browser errors: ${browserErrors.map((error) => error.message).join("; ")}`);
dom.window.close();
console.log("Smoke-tested conjugation and vocabulary recall flows.");
