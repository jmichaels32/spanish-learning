# Third-party notices

The conjugation dataset in `data/conjugations.js` was generated with [`@jirimracek/conjugate-esp` 2.3.6](https://github.com/jirimracek/conjugate-esp), an MIT-licensed Spanish conjugation engine. Its project documents 14,456 tested verbs across 97 models, RAE-recognized vocabulary, regional forms, irregularities, participles, and 2010 orthography handling.

The application does not load that package at runtime. Generated forms are committed as an offline browser asset. The package remains a development dependency so the dataset can be reproduced and checked.
