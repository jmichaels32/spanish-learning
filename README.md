# De Memoria

A dependency-free, local-first Spanish recall trainer. It has two focused modes:

- **Conjugations:** meaning cue + person + infinitive → typed Spanish form
- **Vocabulary:** bidirectional typed translation using personal decks

## Conjugation curriculum

The app contains 100 practical verbs and 3,500 explicit forms: seven meaning cues × five Latin American person groups × 100 verbs.

| Meaning cue | Grammatical form |
| --- | --- |
| now | present indicative |
| past event | preterite |
| background | imperfect |
| would | conditional |
| hope | present subjunctive |
| has happened | present perfect |
| had happened | pluperfect |

The cues are memory anchors, not complete definitions of tense usage. Practice uses `tú` and `ustedes`; `vos` and `vosotros` are intentionally outside the first curriculum.

Questions are recall-only. An answer must include correct accent marks. Missing accents receive a specific “almost” message but count as incorrect. Selection prioritizes unseen forms and misses, then gradually reduces repetition as streaks improve.

The **Stats** screen exposes that working record: overall accuracy, attempted and solid combinations, the hardest practiced verb–cue–person combinations, and a searchable table of all 100 curriculum verbs.

## Vocabulary decks

Create a deck and paste tab-separated pairs, one per line:

```text
la meta	goal; objective
lograr	to achieve; to accomplish
```

Semicolons define accepted alternatives. A word is completed only after reaching 20 consecutive correct answers independently in both directions—at least 40 correct recalls. A later review miss resets the tested direction and returns the word to active practice.

## Run locally

The checked-in app needs no build or package installation:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. It can also be published directly with GitHub Pages.

All progress and vocabulary are stored in `localStorage`. Use **Data & backup** in the app to export a JSON backup before clearing browser data or changing devices.

## Rebuild and verify conjugation data

Node.js is only needed when regenerating or testing the checked-in dataset:

```bash
npm install
npm run build:data
npm test
```

The generator uses the Latin American-compatible `canarias` person system from `@jirimracek/conjugate-esp`, then collapses identical `ustedes`/`ellos` forms into one learning group. Tests validate all 3,500 fields and spot-check high-risk irregular paradigms.

See [DATA_AUDIT.md](DATA_AUDIT.md) for the accuracy checks and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source details.
