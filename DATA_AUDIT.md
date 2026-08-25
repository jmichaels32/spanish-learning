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

- exactly 200 unique verbs
- all seven requested forms for every verb
- all five Latin American person groups for every form
- 7,000 nonempty, markup-free answers
- hand-specified paradigms for high-risk irregulars and participles
- browser-level conjugation, Tier 2 unlocking, and vocabulary recall flows
- exactly 2,000 uniquely ranked curriculum candidates with complete component scores and English glosses
- vocabulary completion only after 20 consecutive correct answers in each direction
- a later vocabulary miss returning a completed word to active practice

## Independent comparison

On August 20, 2026, all generated forms were compared with the independently maintained [Fred Jehle Spanish Verb Database](https://github.com/ghidinelli/fred-jehle-spanish-verbs):

- 6,405 forms available in both datasets matched exactly
- 595 forms were not available for comparison in that dataset
- 0 compared forms disagreed

This comparison is an additional audit, not a runtime or build dependency.

## Curriculum constraints

- `vos` and `vosotros` are intentionally excluded from this first Latin American curriculum.
- Typically impersonal or syntactically inverted targets such as `haber`, `gustar`, and `ocurrir` are excluded from the drill list even though some are frequent words. This avoids presenting uncommon person–verb pairings as ordinary usage.
- The English cues (“now,” “background,” “hope,” and so on) are retrieval anchors. The interface explicitly avoids presenting them as exhaustive rules for tense choice.

## Frequency coverage estimate

The app describes the full curriculum as covering roughly 78% of verb use. This estimate comes from comparing its 200 lemmas with the open `frequency.csv` dataset in [`doozan/spanish_data`](https://github.com/doozan/spanish_data), derived from subtitle frequency data and tagged by part of speech:

- Tier 1 curated 100: 70.1% of verb tokens in that dataset
- Full curated 200: 78.1% of verb tokens in that dataset
- Strict corpus top 200: 84.7% of verb tokens in that dataset
- Full curriculum overlap with the strict top 200: 180 verbs

The strict list's advantage is driven heavily by auxiliary `haber`, which alone contributes about 5.3 percentage points in this corpus but is intentionally unsuitable for the app's ordinary five-person lexical drill. Coverage varies with corpus, dialect, genre, and whether auxiliaries or syntactically unusual verbs are treated as drill targets. The percentage is therefore presented as an estimate, not a universal language statistic.

## Exploratory pedagogical score

`scripts/build-curriculum-analysis.mjs` produces a review dataset of 2,000 valid verb lemmas. It does not automatically change the 200 training verbs. The candidate pool starts from subtitle frequency, rejects lemmas for which the conjugator cannot produce all requested forms, and assigns up to 100 points:

- **35 frequency:** 55% subtitle-frequency signal and 45% ESCOW web-corpus signal, log normalized within the candidate pool
- **30 learner exposure:** A1–C1 verb appearances in ELELex textbooks and simplified readers, with earlier levels weighted more heavily
- **20 conjugation value:** number and breadth of forms that differ from the regular `-ar`, `-er`, or `-ir` paradigm
- **10 drill fit:** normally 10, with documented penalties for auxiliaries, impersonal/weather verbs, special experiencer constructions, and strongly pronominal uses
- **5 distinctiveness:** normally 5, with a small explicit penalty for members of manually listed near-synonym groups

The UI exposes every component, evidence notes, current curriculum rank, conversational rank, histogram bin, and cutoff result. This score is a decision aid, not an objective measure of when a verb “should” be learned. In particular, regular but concrete verbs can rank below irregular verbs because conjugation-pattern value is deliberately worth 20 points. Missing ELELex evidence receives zero learner-exposure points rather than an inferred value.
