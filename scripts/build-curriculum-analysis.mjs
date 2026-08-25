#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { Conjugator } = require("@jirimracek/conjugate-esp");
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/curriculum-analysis.js");
const conjugationsPath = resolve(scriptDirectory, "../data/conjugations.js");

const SOURCES = {
  subtitles: "https://raw.githubusercontent.com/doozan/spanish_data/master/frequency.csv",
  dictionary: "https://raw.githubusercontent.com/doozan/spanish_data/master/es-en.data",
  learner: "https://cental.uclouvain.be/cefrlex/static/resources/es/ELELex.tsv",
  web: "https://raw.githubusercontent.com/LCR-ADS-Lab/TAALES_ES/main/escowax01_pos_freq.txt",
};

const TENSE_PATHS = {
  now: ["Indicativo", "Presente"],
  past_event: ["Indicativo", "PreteritoIndefinido"],
  background: ["Indicativo", "PreteritoImperfecto"],
  would: ["Indicativo", "CondicionalSimple"],
  hope: ["Subjuntivo", "Presente"],
  has_happened: ["Indicativo", "PreteritoPerfecto"],
  had_happened: ["Indicativo", "PreteritoPluscuamperfecto"],
};
const PERSON_INDEXES = [0, 1, 2, 3, 5];
const AUX_PRESENT = ["he", "has", "ha", "hemos", "han"];
const AUX_IMPERFECT = ["había", "habías", "había", "habíamos", "habían"];
const EARLY_LEVEL_WEIGHTS = [1, 0.8, 0.55, 0.3, 0.15];
const DRILL_PENALTIES = new Map([
  ["haber", [10, "auxiliary and often impersonal"]],
  ["gustar", [45, "usually used with an indirect object"]],
  ["encantar", [50, "often used with an indirect object"]],
  ["importar", [55, "frequent sense is usually third-person"]],
  ["interesar", [55, "often used with an indirect object"]],
  ["molestar", [65, "often used with an indirect object"]],
  ["doler", [35, "normally used with an indirect object"]],
  ["faltar", [50, "frequent sense is usually third-person"]],
  ["sobrar", [45, "frequent sense is usually third-person"]],
  ["ocurrir", [30, "normally third-person in its frequent sense"]],
  ["suceder", [30, "normally third-person in its frequent sense"]],
  ["acontecer", [25, "normally third-person"]],
  ["llover", [10, "weather verb"]],
  ["nevar", [10, "weather verb"]],
  ["granizar", [10, "weather verb"]],
  ["amanecer", [35, "often impersonal"]],
  ["anochecer", [25, "often impersonal"]],
  ["atardecer", [25, "often impersonal"]],
  ["soler", [35, "defective verb with restricted tense use"]],
  ["arrepentir", [35, "normally pronominal: arrepentirse"]],
  ["quejar", [30, "normally pronominal: quejarse"]],
  ["atrever", [35, "normally pronominal: atreverse"]],
  ["equivocar", [55, "frequent learner sense is pronominal"]],
  ["enterar", [50, "frequent learner sense is pronominal"]],
]);
const REDUNDANCY_GROUPS = [
  ["usar", "utilizar", "emplear"],
  ["empezar", "comenzar", "iniciar", "principiar"],
  ["terminar", "acabar", "finalizar", "concluir"],
  ["entender", "comprender"],
  ["volver", "regresar", "retornar"],
  ["lograr", "conseguir", "alcanzar"],
  ["suceder", "ocurrir", "acontecer"],
  ["permitir", "autorizar"],
  ["elegir", "escoger", "seleccionar"],
  ["ayudar", "auxiliar"],
  ["arreglar", "reparar", "componer"],
  ["comprar", "adquirir"],
  ["mostrar", "exhibir"],
  ["necesitar", "requerir"],
  ["contestar", "responder"],
  ["continuar", "proseguir"],
  ["hallar", "encontrar"],
  ["colocar", "poner"],
  ["quitar", "remover", "eliminar"],
  ["aceptar", "admitir"],
  ["lanzar", "tirar", "arrojar"],
  ["guardar", "conservar"],
];

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return response.text();
}

function unquote(value) {
  return value.replace(/^"|"$/g, "").replace(/""/g, '"');
}

function regularForms(infinitive) {
  const ending = infinitive.slice(-2);
  if (!["ar", "er", "ir", "ír"].includes(ending)) return null;
  const stem = infinitive.slice(0, -2);
  const verbClass = ending === "ar" ? "ar" : ending === "er" ? "er" : "ir";
  const presentEndings = verbClass === "ar" ? ["o", "as", "a", "amos", "an"] : verbClass === "er" ? ["o", "es", "e", "emos", "en"] : ["o", "es", "e", "imos", "en"];
  const pastEndings = verbClass === "ar" ? ["é", "aste", "ó", "amos", "aron"] : ["í", "iste", "ió", "imos", "ieron"];
  const backgroundEndings = verbClass === "ar" ? ["aba", "abas", "aba", "ábamos", "aban"] : ["ía", "ías", "ía", "íamos", "ían"];
  const hopeEndings = verbClass === "ar" ? ["e", "es", "e", "emos", "en"] : ["a", "as", "a", "amos", "an"];
  const participle = `${stem}${verbClass === "ar" ? "ado" : "ido"}`;
  return {
    now: presentEndings.map((suffix) => `${stem}${suffix}`),
    past_event: pastEndings.map((suffix) => `${stem}${suffix}`),
    background: backgroundEndings.map((suffix) => `${stem}${suffix}`),
    would: ["ía", "ías", "ía", "íamos", "ían"].map((suffix) => `${infinitive}${suffix}`),
    hope: hopeEndings.map((suffix) => `${stem}${suffix}`),
    has_happened: AUX_PRESENT.map((auxiliary) => `${auxiliary} ${participle}`),
    had_happened: AUX_IMPERFECT.map((auxiliary) => `${auxiliary} ${participle}`),
  };
}

function generatedForms(result) {
  return Object.fromEntries(Object.entries(TENSE_PATHS).map(([id, [mood, tense]]) => [id, PERSON_INDEXES.map((index) => result.conjugation[mood][tense][index])]));
}

function patternValue(infinitive, forms) {
  const baseline = regularForms(infinitive);
  if (!baseline) return { score: 100, changedForms: 35, changedTenses: 7 };
  let changedForms = 0;
  let changedTenses = 0;
  for (const tenseId of Object.keys(TENSE_PATHS)) {
    const changes = forms[tenseId].filter((form, index) => form !== baseline[tenseId][index]).length;
    changedForms += changes;
    if (changes) changedTenses += 1;
  }
  const score = 15 + 45 * ((changedForms / 35) ** 0.6) + 40 * (changedTenses / 7);
  return { score: Math.min(100, score), changedForms, changedTenses };
}

function normalizeLog(values, value) {
  const logs = values.map((number) => Math.log1p(number));
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  return max === min ? 0 : (Math.log1p(value) - min) / (max - min);
}

function parseGlosses(text, wanted) {
  const glosses = new Map();
  const sections = text.split("\n_____\n");
  for (const section of sections) {
    const lines = section.split("\n");
    const lemma = lines[0]?.trim();
    if (!wanted.has(lemma) || !lines.some((line) => line === "pos: v")) continue;
    const gloss = lines.find((line) => line.startsWith("  gloss: "))?.slice(9).replace(/{{[^}]+}}/g, "").replace(/\[|\]/g, "").trim();
    if (gloss && !glosses.has(lemma)) glosses.set(lemma, gloss);
  }
  return glosses;
}

const [subtitleText, learnerText, webText, dictionaryText, conjugationsText] = await Promise.all([
  download(SOURCES.subtitles),
  download(SOURCES.learner),
  download(SOURCES.web),
  download(SOURCES.dictionary),
  import("node:fs/promises").then(({ readFile }) => readFile(conjugationsPath, "utf8")),
]);

const subtitleRows = subtitleText.trim().split("\n").slice(1).map((line) => {
  const [count, lemma, partOfSpeech] = line.split(",", 3);
  return { lemma, count: Number(count), partOfSpeech };
}).filter(({ lemma, partOfSpeech }) => partOfSpeech === "v" && /^[a-záéíóúüñ]+r$/u.test(lemma));

const conjugator = new Conjugator("2010");
const candidates = [];
for (const row of subtitleRows) {
  const results = conjugator.conjugateSync(row.lemma, "canarias");
  if (!Array.isArray(results) || !results.length) continue;
  const result = results.find((candidate) => !candidate.info.defective) ?? results[0];
  try {
    const forms = generatedForms(result);
    if (Object.values(forms).some((values) => values.some((value) => !value || value === "-"))) continue;
    candidates.push({ ...row, result, forms });
  } catch {
    continue;
  }
  if (candidates.length === 2000) break;
}
if (candidates.length !== 2000) throw new Error(`Expected 2,000 valid candidates, found ${candidates.length}.`);

const candidateSet = new Set(candidates.map(({ lemma }) => lemma));
const webCounts = new Map();
for (const line of webText.trim().split("\n").slice(1)) {
  const [taggedLemma, count] = line.split("\t");
  const marker = taggedLemma.indexOf("_VERB");
  if (marker < 1) continue;
  const lemma = taggedLemma.slice(0, marker).toLocaleLowerCase("es");
  if (candidateSet.has(lemma)) webCounts.set(lemma, (webCounts.get(lemma) ?? 0) + Number(count));
}

const learnerRows = learnerText.trim().split("\n").map((line) => line.split("\t").map(unquote));
const learnerHeader = learnerRows.shift();
const learnerIndex = Object.fromEntries(learnerHeader.map((name, index) => [name, index]));
const learnerData = new Map();
for (const row of learnerRows) {
  const lemma = row[learnerIndex.word];
  if (!candidateSet.has(lemma) || !row[learnerIndex.tag].startsWith("V")) continue;
  const existing = learnerData.get(lemma) ?? { frequencies: [0, 0, 0, 0, 0], documents: [0, 0, 0, 0, 0] };
  ["a1", "a2", "b1", "b2", "c1"].forEach((level, index) => {
    existing.frequencies[index] += Number(row[learnerIndex[`level_freq@${level}`]]) || 0;
    existing.documents[index] += Number(row[learnerIndex[`nb_doc@${level}`]]) || 0;
  });
  learnerData.set(lemma, existing);
}

const glosses = parseGlosses(dictionaryText, candidateSet);
const subtitleCounts = candidates.map(({ count }) => count);
const allWebCounts = candidates.map(({ lemma }) => webCounts.get(lemma) ?? 0);
const learnerRawValues = candidates.map(({ lemma }) => {
  const data = learnerData.get(lemma);
  return data ? data.frequencies.reduce((sum, frequency, index) => sum + frequency * EARLY_LEVEL_WEIGHTS[index], 0) : 0;
});
const currentSandbox = { window: {} };
(await import("node:vm")).runInNewContext(conjugationsText, currentSandbox);
const currentRanks = new Map(currentSandbox.window.SPANISH_CONJUGATIONS.verbs.map(({ id, rank }) => [id, rank]));

const scored = candidates.map((candidate, index) => {
  const learner = learnerData.get(candidate.lemma);
  const learnerRaw = learnerRawValues[index];
  const conversationNorm = normalizeLog(subtitleCounts, candidate.count);
  const webCount = webCounts.get(candidate.lemma) ?? 0;
  const webNorm = normalizeLog(allWebCounts, webCount);
  const frequencyScore = (conversationNorm * 0.55 + webNorm * 0.45) * 100;
  const learnerScore = normalizeLog(learnerRawValues, learnerRaw) * 100;
  const pattern = patternValue(candidate.lemma, candidate.forms);
  const [fitScore, fitNote] = DRILL_PENALTIES.get(candidate.lemma) ?? [100, "ordinary five-person drill"];
  const earliestLevelIndex = learner?.documents.findIndex((count) => count >= 2) ?? -1;
  return {
    lemma: candidate.lemma,
    meaning: glosses.get(candidate.lemma) ?? "meaning unavailable",
    sourceRank: index + 1,
    currentRank: currentRanks.get(candidate.lemma) ?? null,
    subtitleCount: candidate.count,
    webCount,
    cefr: earliestLevelIndex >= 0 ? ["A1", "A2", "B1", "B2", "C1"][earliestLevelIndex] : null,
    learnerDocuments: learner ? learner.documents.reduce((sum, count) => sum + count, 0) : 0,
    model: candidate.result.info.model,
    changedForms: pattern.changedForms,
    changedTenses: pattern.changedTenses,
    fitNote,
    scores: {
      frequency: frequencyScore * 0.35,
      learner: learnerScore * 0.30,
      pattern: pattern.score * 0.20,
      fit: fitScore * 0.10,
      distinct: 5,
    },
  };
});

for (const group of REDUNDANCY_GROUPS) {
  const members = scored.filter(({ lemma }) => group.includes(lemma)).sort((left, right) => {
    const leftBase = left.scores.frequency + left.scores.learner + left.scores.pattern + left.scores.fit;
    const rightBase = right.scores.frequency + right.scores.learner + right.scores.pattern + right.scores.fit;
    return rightBase - leftBase;
  });
  members.forEach((member, index) => {
    member.scores.distinct = index === 0 ? 5 : index === 1 ? 3 : 1.5;
    if (index > 0) member.redundantWith = members[0].lemma;
  });
}

function rounded(number) {
  return Math.round(number * 10) / 10;
}

scored.forEach((candidate) => {
  Object.keys(candidate.scores).forEach((key) => { candidate.scores[key] = rounded(candidate.scores[key]); });
  candidate.score = rounded(Object.values(candidate.scores).reduce((sum, value) => sum + value, 0));
});
scored.sort((left, right) => right.score - left.score || left.sourceRank - right.sourceRank);
scored.forEach((candidate, index) => { candidate.scoreRank = index + 1; });

const payload = {
  meta: {
    generated: new Date().toISOString().slice(0, 10),
    candidatePool: 2000,
    candidateBasis: "Top 2,000 valid verb lemmas in the subtitle source",
    formula: { frequency: 35, learner: 30, pattern: 20, fit: 10, distinct: 5 },
    caveat: "Exploratory pedagogical score, not an objective language ranking.",
    sources: SOURCES,
  },
  candidates: scored,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `// Generated by scripts/build-curriculum-analysis.mjs. Do not edit by hand.\nwindow.SPANISH_CURRICULUM_ANALYSIS = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
console.log(`Wrote ${scored.length} scored verb candidates to ${outputPath}`);
