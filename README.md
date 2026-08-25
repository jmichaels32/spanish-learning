# De Memoria

A dependency-free, local-first Spanish recall trainer. It has two focused modes:

- **Conjugations:** meaning cue + person + infinitive → typed Spanish form
- **Vocabulary:** bidirectional typed translation using one personal word collection

## Conjugation curriculum

The app contains 2,000 scored, full-grid-compatible verbs and 70,000 explicit forms: seven meaning cues × five Latin American person groups × 2,000 verbs.

The curriculum has 20 cumulative tiers of 100. Tier 1 is the top 100, Tier 2 is the top 200, and so on through Tier 20 (top 2,000). A verb becomes tier-ready after five correct recalls spanning at least three meaning cues and three person groups. The next tier unlocks when all 100 verbs are ready and accuracy across the latest 200 answers from that tier is at least 90%. Unlocks are permanent; each larger pool retains difficult earlier forms for review.

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

The **Stats** screen exposes that working record: overall accuracy, attempted and solid combinations, the hardest practiced verb–cue–person combinations, and a searchable, tier-filterable table of all 2,000 curriculum verbs with lock status.

Its **Curriculum cutoff lab** explains the ranking used by all 20 tiers with a transparent exploratory formula: multi-context frequency (35 points), CEFR-graded learner exposure (30), conjugation-pattern value (20), five-person drill suitability (10), and distinctiveness (5). Special-construction or defective verbs that would make the complete grid misleading are recorded as exclusions and replaced by the next eligible scored verbs.

## Vocabulary collection

Add cards individually with an English prompt and the Spanish translation you want to learn. The quick-add form is optimized for repeat entry: enter the English word, press Enter to move to Spanish, then press Enter again to save. One-tap Spanish accent keys are available below the answer field.

The collapsible bulk importer also accepts tab-separated pairs, one per line:

```text
la meta	goal; objective
lograr	to achieve; to accomplish
```

Semicolons define accepted alternatives. A word is completed only after reaching 20 consecutive correct answers independently in both directions—at least 40 correct recalls. A later review miss resets the tested direction and returns the word to active practice.

Backups made by older versions are migrated automatically: words from every former deck are combined into **My vocabulary**, with directional progress preserved.

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
npm run build
npm test
```

The generator uses the Latin American-compatible `canarias` person system from `@jirimracek/conjugate-esp`, then collapses identical `ustedes`/`ellos` forms into one learning group. Sense-specific overrides resolve homographic verbs such as `apostar`, and the grader accepts documented alternative paradigms such as `adecuo`/`adecúo`. Tests validate all 70,000 fields and spot-check high-risk irregular paradigms.

The curriculum-analysis generator downloads its documented open research inputs and produces `data/curriculum-analysis.js`. It is an offline development step; the published app reads the checked-in result and makes no runtime data requests.

See [DATA_AUDIT.md](DATA_AUDIT.md) for the accuracy checks and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source details.
