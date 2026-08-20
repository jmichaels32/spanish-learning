#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { Conjugator } = require("@jirimracek/conjugate-esp");
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/conjugations.js");

// Ordered by practical learning priority. The first 20 and first 50 are
// intentionally useful starter sets; the full list provides broad coverage.
const VERBS = [
  ["ser", "to be (identity)"],
  ["estar", "to be (state/location)"],
  ["tener", "to have"],
  ["hacer", "to do / make"],
  ["poder", "to be able to / can"],
  ["decir", "to say / tell"],
  ["ir", "to go"],
  ["ver", "to see"],
  ["dar", "to give"],
  ["saber", "to know (facts/how)"],
  ["querer", "to want / love"],
  ["llegar", "to arrive"],
  ["pasar", "to pass / happen"],
  ["deber", "to owe / should"],
  ["poner", "to put"],
  ["parecer", "to seem"],
  ["quedar", "to remain / meet"],
  ["creer", "to believe / think"],
  ["hablar", "to speak"],
  ["llevar", "to carry / wear"],
  ["dejar", "to leave / let"],
  ["seguir", "to follow / continue"],
  ["encontrar", "to find"],
  ["llamar", "to call"],
  ["venir", "to come"],
  ["pensar", "to think"],
  ["salir", "to leave / go out"],
  ["volver", "to return"],
  ["tomar", "to take / drink"],
  ["conocer", "to know / meet"],
  ["vivir", "to live"],
  ["sentir", "to feel"],
  ["tratar", "to try / treat"],
  ["mirar", "to look / watch"],
  ["contar", "to count / tell"],
  ["empezar", "to begin"],
  ["esperar", "to wait / hope"],
  ["buscar", "to look for"],
  ["existir", "to exist"],
  ["entrar", "to enter"],
  ["trabajar", "to work"],
  ["escribir", "to write"],
  ["perder", "to lose"],
  ["producir", "to produce"],
  ["decidir", "to decide"],
  ["entender", "to understand"],
  ["pedir", "to ask for / order"],
  ["recibir", "to receive"],
  ["recordar", "to remember"],
  ["terminar", "to finish"],
  ["permitir", "to allow"],
  ["aparecer", "to appear"],
  ["conseguir", "to get / achieve"],
  ["comenzar", "to begin"],
  ["servir", "to serve"],
  ["sacar", "to take out"],
  ["necesitar", "to need"],
  ["mantener", "to maintain / keep"],
  ["comer", "to eat"],
  ["leer", "to read"],
  ["caer", "to fall"],
  ["cambiar", "to change"],
  ["presentar", "to present"],
  ["crear", "to create"],
  ["abrir", "to open"],
  ["considerar", "to consider"],
  ["oír", "to hear"],
  ["acabar", "to finish / end"],
  ["convertir", "to convert / become"],
  ["ganar", "to win / earn"],
  ["dormir", "to sleep"],
  ["traer", "to bring"],
  ["partir", "to leave / divide"],
  ["morir", "to die"],
  ["aceptar", "to accept"],
  ["beber", "to drink"],
  ["suponer", "to suppose"],
  ["comprender", "to understand"],
  ["lograr", "to achieve"],
  ["explicar", "to explain"],
  ["preguntar", "to ask"],
  ["tocar", "to touch / play"],
  ["reconocer", "to recognize"],
  ["estudiar", "to study"],
  ["aprender", "to learn"],
  ["nacer", "to be born"],
  ["dirigir", "to direct"],
  ["correr", "to run"],
  ["utilizar", "to use"],
  ["pagar", "to pay"],
  ["ayudar", "to help"],
  ["andar", "to walk / go around"],
  ["jugar", "to play"],
  ["escuchar", "to listen"],
  ["cumplir", "to fulfill / turn (age)"],
  ["ofrecer", "to offer"],
  ["descubrir", "to discover"],
  ["levantar", "to lift / raise"],
  ["intentar", "to try / attempt"],
  ["usar", "to use"],
];

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
  return results.find((result) => !result.info.defective) ?? results[0];
}

const verbs = VERBS.map(([infinitive, meaning], index) => {
  const result = getMainResult(infinitive);
  const forms = Object.fromEntries(
    Object.entries(TENSE_PATHS).map(([tenseId, [mood, tense]]) => {
      const table = result.conjugation[mood]?.[tense];
      if (!Array.isArray(table) || table.length !== 6) {
        throw new Error(`${infinitive} is missing ${mood}.${tense}.`);
      }
      return [tenseId, PERSON_INDEXES.map((personIndex) => table[personIndex])];
    }),
  );
  return { id: infinitive, infinitive, meaning, rank: index + 1, forms };
});

const payload = {
  meta: {
    language: "es",
    region: "Latin American Spanish (tú + ustedes)",
    orthography: "RAE 2010",
    source: "@jirimracek/conjugate-esp 2.3.6",
    sourceUrl: "https://github.com/jirimracek/conjugate-esp",
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
