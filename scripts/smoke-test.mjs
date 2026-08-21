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
assert.equal(dom.window.SPANISH_CONJUGATIONS.verbs.length, 100);
assert.equal(document.querySelectorAll("[data-tense]").length, 7);
assert.equal(document.querySelectorAll("[data-person]").length, 5);

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

document.querySelector(".main-nav [data-screen='stats']").click();
assert.equal(document.querySelectorAll(".verb-stats-row").length, 100);
assert.match(document.querySelector("#stats-practiced-forms").textContent, /1\/3,500/);
assert.match(document.querySelector("#hardest-combinations").textContent, new RegExp(verbId));

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
