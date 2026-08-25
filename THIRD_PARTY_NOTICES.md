# Third-party notices

The conjugation dataset in `data/conjugations.js` was generated with [`@jirimracek/conjugate-esp` 2.3.6](https://github.com/jirimracek/conjugate-esp), an MIT-licensed Spanish conjugation engine. Its project documents 14,456 tested verbs across 97 models, RAE-recognized vocabulary, regional forms, irregularities, participles, and 2010 orthography handling.

The application does not load that package at runtime. Generated forms are committed as an offline browser asset. The package remains a development dependency so the dataset can be reproduced and checked.

## Curriculum analysis sources

`data/curriculum-analysis.js` is a derived, offline dataset built from:

- [`doozan/spanish_data`](https://github.com/doozan/spanish_data): subtitle-derived lemma frequency and Wiktionary-based English glosses. The repository documents CC BY / CC BY-SA source licensing and attribution.
- [ELELex](https://cental.uclouvain.be/cefrlex/elelex/download/), Centre de traitement automatique du langage (CENTAL), UCLouvain: Spanish learner-material frequencies by CEFR level, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- [`LCR-ADS-Lab/TAALES_ES`](https://github.com/LCR-ADS-Lab/TAALES_ES): ESCOW14 Spanish web-corpus frequency data distributed with TAALES Español under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Cite Díez-Ortega, M., & Kyle, K. (2023), “Measuring the development of lexical richness of L2 Spanish: A longitudinal learner corpus study,” *Studies in Second Language Acquisition*.

The derived curriculum-analysis dataset is provided for this noncommercial learning tool under CC BY-NC-SA 4.0. It is checked into the repository so the browser makes no requests to those sources at runtime.
