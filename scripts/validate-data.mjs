#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(scriptDirectory, "../data/conjugations.js");
const analysisPath = resolve(scriptDirectory, "../data/curriculum-analysis.js");
const sandbox = { window: {} };
vm.runInNewContext(await readFile(dataPath, "utf8"), sandbox);
vm.runInNewContext(await readFile(analysisPath, "utf8"), sandbox);
const data = sandbox.window.SPANISH_CONJUGATIONS;
const analysis = sandbox.window.SPANISH_CURRICULUM_ANALYSIS;

assert.ok(data, "Conjugation data did not load.");
assert.equal(data.verbs.length, 200, "Expected exactly 200 verbs.");
assert.equal(new Set(data.verbs.map((verb) => verb.id)).size, 200, "Verb ids must be unique.");
assert.equal(data.persons.length, 5, "Expected five Latin American person groups.");
assert.equal(data.tenses.length, 7, "Expected seven meaning-based tenses.");

for (const verb of data.verbs) {
  assert.equal(Object.keys(verb.forms).length, 7, `${verb.id} must have seven tenses.`);
  for (const tense of data.tenses) {
    const forms = verb.forms[tense.id];
    assert.equal(forms.length, 5, `${verb.id}.${tense.id} must have five forms.`);
    forms.forEach((form, index) => {
      assert.equal(typeof form, "string", `${verb.id}.${tense.id}[${index}] must be text.`);
      assert.ok(form.trim() && form !== "-", `${verb.id}.${tense.id}[${index}] is empty.`);
      assert.equal(/<[^>]+>/.test(form), false, `${verb.id}.${tense.id}[${index}] contains markup.`);
    });
  }
}

const byVerb = Object.fromEntries(data.verbs.map((verb) => [verb.id, verb.forms]));
const checks = {
  "ser.now": ["soy", "eres", "es", "somos", "son"],
  "ser.past_event": ["fui", "fuiste", "fue", "fuimos", "fueron"],
  "ser.background": ["era", "eras", "era", "éramos", "eran"],
  "estar.hope": ["esté", "estés", "esté", "estemos", "estén"],
  "tener.would": ["tendría", "tendrías", "tendría", "tendríamos", "tendrían"],
  "hacer.past_event": ["hice", "hiciste", "hizo", "hicimos", "hicieron"],
  "hacer.has_happened": ["he hecho", "has hecho", "ha hecho", "hemos hecho", "han hecho"],
  "decir.past_event": ["dije", "dijiste", "dijo", "dijimos", "dijeron"],
  "ir.now": ["voy", "vas", "va", "vamos", "van"],
  "ir.background": ["iba", "ibas", "iba", "íbamos", "iban"],
  "ver.background": ["veía", "veías", "veía", "veíamos", "veían"],
  "dar.hope": ["dé", "des", "dé", "demos", "den"],
  "saber.now": ["sé", "sabes", "sabe", "sabemos", "saben"],
  "poner.had_happened": ["había puesto", "habías puesto", "había puesto", "habíamos puesto", "habían puesto"],
  "venir.past_event": ["vine", "viniste", "vino", "vinimos", "vinieron"],
  "oír.past_event": ["oí", "oíste", "oyó", "oímos", "oyeron"],
  "leer.past_event": ["leí", "leíste", "leyó", "leímos", "leyeron"],
  "dormir.past_event": ["dormí", "dormiste", "durmió", "dormimos", "durmieron"],
  "morir.has_happened": ["he muerto", "has muerto", "ha muerto", "hemos muerto", "han muerto"],
  "escribir.has_happened": ["he escrito", "has escrito", "ha escrito", "hemos escrito", "han escrito"],
  "abrir.has_happened": ["he abierto", "has abierto", "ha abierto", "hemos abierto", "han abierto"],
  "volver.has_happened": ["he vuelto", "has vuelto", "ha vuelto", "hemos vuelto", "han vuelto"],
  "valer.would": ["valdría", "valdrías", "valdría", "valdríamos", "valdrían"],
  "enviar.now": ["envío", "envías", "envía", "enviamos", "envían"],
  "detener.past_event": ["detuve", "detuviste", "detuvo", "detuvimos", "detuvieron"],
  "conducir.past_event": ["conduje", "condujiste", "condujo", "condujimos", "condujeron"],
  "incluir.past_event": ["incluí", "incluiste", "incluyó", "incluimos", "incluyeron"],
  "resolver.has_happened": ["he resuelto", "has resuelto", "ha resuelto", "hemos resuelto", "han resuelto"],
  "construir.hope": ["construya", "construyas", "construya", "construyamos", "construyan"],
  "repetir.past_event": ["repetí", "repetiste", "repitió", "repetimos", "repitieron"],
};

for (const [key, expected] of Object.entries(checks)) {
  const [verb, tense] = key.split(".");
  assert.deepEqual(Array.from(byVerb[verb][tense]), expected, `Unexpected forms for ${key}.`);
}

assert.ok(analysis, "Curriculum analysis data did not load.");
assert.equal(analysis.candidates.length, 2000, "Expected exactly 2,000 scored candidates.");
assert.equal(new Set(analysis.candidates.map((candidate) => candidate.lemma)).size, 2000, "Candidate lemmas must be unique.");
assert.deepEqual([...analysis.candidates.map((candidate) => candidate.sourceRank)].sort((left, right) => left - right), Array.from({ length: 2000 }, (_, index) => index + 1));
for (const candidate of analysis.candidates) {
  assert.ok(candidate.meaning && candidate.meaning !== "meaning unavailable", `${candidate.lemma} must have an English gloss.`);
  assert.ok(candidate.score >= 0 && candidate.score <= 100, `${candidate.lemma} score is outside 0–100.`);
  const componentTotal = Object.values(candidate.scores).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(componentTotal - candidate.score) <= 0.21, `${candidate.lemma} components do not sum to its score.`);
}
const scoredByLemma = Object.fromEntries(analysis.candidates.map((candidate) => [candidate.lemma, candidate]));
assert.ok(scoredByLemma.viajar.score > scoredByLemma.averiguar.score, "Learner evidence should prioritize viajar over averiguar.");
assert.ok(scoredByLemma.limpiar.score > scoredByLemma.disculpar.score, "The combined score should prioritize limpiar over disculpar.");
assert.ok(scoredByLemma.haber.scores.fit < scoredByLemma.hablar.scores.fit, "Special-construction verbs should receive a drill-fit penalty.");

console.log(`Validated ${data.verbs.length} training verbs, ${data.verbs.length * 7 * 5} forms, and ${analysis.candidates.length} scored candidates.`);
