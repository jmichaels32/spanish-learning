#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { Conjugator } = require("@jirimracek/conjugate-esp");
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/conjugations.js");
const curriculumPath = resolve(scriptDirectory, "../data/curriculum-analysis.js");
const TRAINING_VERB_COUNT = 2000;
const SENSE_RESULT_INDEX = new Map([
  ["aforar", 1],
  ["apostar", 1],
  ["atentar", 1],
  ["atorar", 1],
  ["auxiliar", 1],
  ["derrocar", 1],
  ["follar", 1],
]);
const ACCEPTED_VARIANT_INDEXES = new Map([
  ["adecuar", [0, 1]],
  ["erguir", [0, 1]],
  ["evacuar", [0, 1]],
  ["freír", [0, 1]],
  ["paliar", [0, 1]],
  ["placer", [0, 1]],
  ["predecir", [0, 1]],
  ["pudrir", [0, 1]],
  ["roer", [0, 1, 2]],
  ["yacer", [0, 1, 2]],
]);

const curriculumSandbox = { window: {} };
vm.runInNewContext(await readFile(curriculumPath, "utf8"), curriculumSandbox);
const candidates = curriculumSandbox.window.SPANISH_CURRICULUM_ANALYSIS?.candidates;
if (!Array.isArray(candidates) || candidates.length !== TRAINING_VERB_COUNT) {
  throw new Error("Build curriculum analysis first; expected exactly 2,000 tier-ready candidates.");
}

const TENSE_PATHS = {
  now: ["Indicativo", "Presente"],
  past_event: ["Indicativo", "PreteritoIndefinido"],
  background: ["Indicativo", "PreteritoImperfecto"],
  would: ["Indicativo", "CondicionalSimple"],
  hope: ["Subjuntivo", "Presente"],
  has_happened: ["Indicativo", "PreteritoPerfecto"],
  had_happened: ["Indicativo", "PreteritoPluscuamperfecto"],
};

// Canarias selects tú + ustedes, the same person system used by most learners
// of Latin American Spanish. We collapse ustedes/ellos because their forms match.
const PERSON_INDEXES = [0, 1, 2, 3, 5];
const conjugator = new Conjugator("2010");

function getMainResult(infinitive) {
  const results = conjugator.conjugateSync(infinitive, "canarias");
  if (typeof results === "string" || !Array.isArray(results) || !results.length) {
    throw new Error(`Could not conjugate ${infinitive}: ${String(results)}`);
  }
  return results[SENSE_RESULT_INDEX.get(infinitive) ?? 0]
    ?? results.find((result) => !result.info.defective)
    ?? results[0];
}

const verbs = candidates.map(({ lemma: infinitive, meaning }, index) => {
  const result = getMainResult(infinitive);
  const forms = Object.fromEntries(
    Object.entries(TENSE_PATHS).map(([tenseId, [mood, tense]]) => {
      const table = result.conjugation[mood]?.[tense];
      if (!Array.isArray(table) || table.length !== 6) {
        throw new Error(`${infinitive} is missing ${mood}.${tense}.`);
      }
      const selected = PERSON_INDEXES.map((personIndex) => table[personIndex]);
      if (selected.some((form) => !form || form === "-")) {
        throw new Error(`${infinitive} has an unavailable ${mood}.${tense} form.`);
      }
      return [tenseId, selected];
    }),
  );
  const variantIndexes = ACCEPTED_VARIANT_INDEXES.get(infinitive) ?? [];
  const variantResults = variantIndexes.map((variantIndex) => conjugator.conjugateSync(infinitive, "canarias")[variantIndex]).filter(Boolean);
  const accepted = {};
  if (variantResults.length > 1) {
    for (const [tenseId, [mood, tense]] of Object.entries(TENSE_PATHS)) {
      const byPerson = PERSON_INDEXES.map((personIndex) => [...new Set(variantResults.map((variant) => variant.conjugation[mood][tense][personIndex]).filter((form) => form && form !== "-"))]);
      if (byPerson.some((choices) => choices.length > 1)) accepted[tenseId] = byPerson;
    }
  }
  return {
    id: infinitive,
    infinitive,
    meaning,
    rank: index + 1,
    forms,
    ...(Object.keys(accepted).length ? { accepted } : {}),
  };
});

const payload = {
  meta: {
    language: "es",
    region: "Latin American Spanish (tú + ustedes)",
    orthography: "RAE 2010",
    source: "@jirimracek/conjugate-esp 2.3.6",
    sourceUrl: "https://github.com/jirimracek/conjugate-esp",
    curriculum: "20 cumulative tiers of 100 pedagogically scored verbs",
    generated: new Date().toISOString().slice(0, 10),
  },
  persons: [
    { id: "yo", label: "yo" },
    { id: "tu", label: "tú" },
    { id: "el", label: "él / ella / usted" },
    { id: "nosotros", label: "nosotros / nosotras" },
    { id: "ellos", label: "ellos / ellas / ustedes" },
  ],
  tenses: [
    { id: "now", cue: "now", formalName: "present" },
    { id: "past_event", cue: "past event", formalName: "preterite" },
    { id: "background", cue: "background", formalName: "imperfect" },
    { id: "would", cue: "would", formalName: "conditional" },
    { id: "hope", cue: "hope", formalName: "present subjunctive" },
    { id: "has_happened", cue: "has happened", formalName: "present perfect" },
    { id: "had_happened", cue: "had happened", formalName: "pluperfect" },
  ],
  verbs,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/build-conjugations.mjs. Do not edit by hand.\nwindow.SPANISH_CONJUGATIONS = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8",
);
console.log(`Wrote ${verbs.length} verbs and ${verbs.length * 7 * 5} recall forms to ${outputPath}`);
