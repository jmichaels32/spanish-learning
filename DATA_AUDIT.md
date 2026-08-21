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
