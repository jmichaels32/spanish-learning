# De Memoria

A dependency-free, local-first Spanish recall trainer. It has two focused modes:

- **Conjugations:** meaning cue + person + infinitive → typed Spanish form
- **Vocabulary:** bidirectional typed translation using personal decks

## Conjugation curriculum

The app contains 200 practical verbs and 7,000 explicit forms: seven meaning cues × five Latin American person groups × 200 verbs.

Verbs 1–100 are Tier 1. Tier 2 (verbs 101–200) is already installed but remains locked until every Tier 1 verb–cue–person combination has a streak of three correct answers. The unlock is permanent; **All 200** then introduces Tier 2 while retaining difficult Tier 1 forms for review.

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

The **Stats** screen exposes that working record: overall accuracy, attempted and solid combinations, the hardest practiced verb–cue–person combinations, and a searchable table of all 200 curriculum verbs with Tier 2 lock status.

Its **Curriculum cutoff lab** scores 2,000 valid verb candidates with a transparent exploratory formula: multi-context frequency (35 points), CEFR-graded learner exposure (30), conjugation-pattern value (20), five-person drill suitability (10), and distinctiveness (5). An interactive histogram, score cutoff, source-scope toggle, component columns, and searchable candidate list support review before the actual 200-verb training order is changed.

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
npm run build:curriculum
npm test
```

The generator uses the Latin American-compatible `canarias` person system from `@jirimracek/conjugate-esp`, then collapses identical `ustedes`/`ellos` forms into one learning group. Tests validate all 7,000 fields and spot-check high-risk irregular paradigms.

The curriculum-analysis generator downloads its documented open research inputs and produces `data/curriculum-analysis.js`. It is an offline development step; the published app reads the checked-in result and makes no runtime data requests.

See [DATA_AUDIT.md](DATA_AUDIT.md) for the accuracy checks and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source details.
