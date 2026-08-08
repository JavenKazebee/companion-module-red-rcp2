For usage information in companion, see [HELP.md](https://github.com/JavenKazebee/companion-module-red-rcp2/blob/main/companion/HELP.md)

# About

This is a Bitfocus Companion module for RED cameras using RCP2 (Komodo and Komodo-X have been tested).

# Build

yarn format

npx tsc

yarn companion-module-build --dev

# Regenerating parameter coverage

`src/parameters.ts` is generated, not hand-written. It's produced from `data/rcp2-parameters.json` (a parsed copy of RED's official RCP2 API parameter manuals for Komodo, Komodo-X, and V-Raptor) by `scripts/generate-parameters.mjs`. If RED publishes updated documentation, update `data/rcp2-parameters.json` accordingly and rerun:

```
npm run generate:parameters
```
