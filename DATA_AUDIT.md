# Conjugation data audit

Accuracy is treated as a product requirement because the generated forms are learning material.

## Production source

`scripts/build-conjugations.mjs` uses [`@jirimracek/conjugate-esp` 2.3.6](https://github.com/jirimracek/conjugate-esp) with:

- 2010 RAE orthography
- the `canarias` regional person system, which supplies `tú` and `ustedes`
- explicit checked-in output rather than runtime prediction

The source project documents 14,456 tested verbs, 97 conjugation models, irregular and defective verbs, alternate participles, regional systems, and orthographic changes.

## Automated repository checks

`npm test` verifies:

- exactly 2,000 unique verbs
- all seven requested forms for every verb
- all five Latin American person groups for every form
- 70,000 nonempty, markup-free canonical answers, plus validated accepted alternatives
- hand-specified paradigms for high-risk irregulars and participles
- browser-level conjugation, sequential tier unlocking/migration, and vocabulary recall flows
- tier gates requiring five correct recalls across three cues and three people for every verb, plus 90% accuracy in a 200-answer rolling window
- exactly 2,000 uniquely ranked curriculum candidates with complete component scores and English glosses
- vocabulary completion only after 20 consecutive correct answers in each direction
- a later vocabulary miss returning a completed word to active practice

## Independent comparison

On August 24, 2026, the expanded dataset was compared with every overlapping form in the independently maintained [Fred Jehle Spanish Verb Database](https://github.com/ghidinelli/fred-jehle-spanish-verbs):

- 18,865 forms were available in both datasets
- 18,842 matched exactly
- 18 differences were checked against the current RAE tables and were current orthography or accepted variants (`frio`, `hui`, `crie`, `freído`/`frito`, and `predeciría`/`prediría`)
- 5 differences were malformed `cepillar` pluperfect entries in the comparison database; the generated `había cepillado` paradigm is correct
- 51,135 forms were outside the comparison database's roughly 600-verb scope

The audit also exposed seven homographic model selections where the engine's first result did not match the curriculum gloss (`aforar`, `apostar`, `atentar`, `atorar`, `auxiliar`, `derrocar`, and `follar`). The generators now select the documented sense explicitly. This comparison is an additional audit, not a runtime or build dependency.

## Curriculum constraints

- `vos` and `vosotros` are intentionally excluded from this first Latin American curriculum.
- Typically impersonal or syntactically inverted targets such as `haber`, `gustar`, and `ocurrir` are excluded from the drill list even though some are frequent words. This avoids presenting uncommon person–verb pairings as ordinary usage.
- The English cues (“now,” “background,” “hope,” and so on) are retrieval anchors. The interface explicitly avoids presenting them as exhaustive rules for tense choice.

## Pedagogical score and tier order

`scripts/build-curriculum-analysis.mjs` produces the permanent 2,000-verb training order. The candidate pool starts from subtitle frequency, rejects lemmas for which the conjugator cannot produce all requested forms, excludes special-construction verbs from the standard grid, and assigns up to 100 points:

- **35 frequency:** 55% subtitle-frequency signal and 45% ESCOW web-corpus signal, log normalized within the candidate pool
- **30 learner exposure:** A1–C1 verb appearances in ELELex textbooks and simplified readers, with earlier levels weighted more heavily
- **20 conjugation value:** number and breadth of forms that differ from the regular `-ar`, `-er`, or `-ir` paradigm
- **10 drill fit:** full points are required for training eligibility; auxiliaries, impersonal/weather verbs, special experiencer constructions, and strongly pronominal uses are retained in exclusion metadata
- **5 distinctiveness:** normally 5, with a small explicit penalty for members of manually listed near-synonym groups

The UI exposes every component, evidence notes, curriculum rank, conversational rank, histogram bin, and cutoff result. Each consecutive 100 ranked verbs becomes one tier. This score is a structured learning heuristic, not an objective universal ordering. Regular but concrete verbs can rank below irregular verbs because conjugation-pattern value is deliberately worth 20 points. Missing ELELex evidence receives zero learner-exposure points rather than an inferred value.
