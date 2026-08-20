#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(scriptDirectory, "../data/conjugations.js");
const sandbox = { window: {} };
vm.runInNewContext(await readFile(dataPath, "utf8"), sandbox);
const data = sandbox.window.SPANISH_CONJUGATIONS;

assert.ok(data, "Conjugation data did not load.");
assert.equal(data.verbs.length, 100, "Expected exactly 100 verbs.");
assert.equal(new Set(data.verbs.map((verb) => verb.id)).size, 100, "Verb ids must be unique.");
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
};

for (const [key, expected] of Object.entries(checks)) {
  const [verb, tense] = key.split(".");
  assert.deepEqual(Array.from(byVerb[verb][tense]), expected, `Unexpected forms for ${key}.`);
}

console.log(`Validated ${data.verbs.length} verbs, ${data.tenses.length} tenses, and ${data.verbs.length * 7 * 5} forms.`);
