# TID-API

A merged, always up-to-date database of Nintendo 3DS Title IDs

---

### https://morrisonion.github.io/TID-API/

![JS](https://img.shields.io/badge/JavaScript-F7DF1E?&logo=javascript&logoColor=black)
[![License](https://img.shields.io/badge/license-GPLv3-red)](https://github.com/Morrisonion/TID-API/raw/main/LICENSE)

---

## What this is

**TID-API** is not a Title ID generator. It is a static, hourly-refreshed database that combines every official Nintendo 3DS Title ID with every known homebrew Title ID from the Universal-DB, into one flat JSON file.

The generator that consumes this data lives at [CTR-TIDGenerator](https://github.com/Morrisonion/CTR-TIDGenerator).

---

## Endpoints

| File | URL | Updated |
|---|---|---|
| Merged (recommended) | `https://morrisonion.github.io/TID-API/titles.json` | hourly |
| NUS only | `https://morrisonion.github.io/TID-API/data/nus-titles.json` | manually |
| UDB only | `https://morrisonion.github.io/TID-API/data/udb-titles.json` | hourly |

---

## JSON format

All three files share the same flat schema:

```json
{
  "0004000000030000": "CTR-AKDJ - Shin Hikari Shinwa: Palutena no Kagami (JPN)",
  "00040000021A3900": "MaikelChan/SpaceCadetPinball"
}
```

Keys are 16-character uppercase hex Title IDs. Values are human-readable names.

---

## How it works

Two source databases are kept inside the repository:

- **`data/nus-titles.json`** – official eShop / NUS Title IDs, manually curated
- **`data/udb-titles.json`** – homebrew applications from the Universal-DB, generated hourly

Every hour, a GitHub Actions workflow:

1. Fetches the latest entries from [Universal-Team/db](https://github.com/Universal-Team/db).
2. Converts each entry's `unique_ids` into proper 16-character Title IDs and writes them to `data/udb-titles.json`.
3. Merges both source files into a single `titles.json` in the repository root.

All output is served as static JSON via GitHub Pages. No server, no runtime, no cold starts — just files.

---

## Title ID format

3DS Title IDs follow the structure `00040000` + `XXXXXX` + `00`, where `XXXXXX` is the Unique ID in hex. Converted UDB entries use this to transform the numeric `unique_ids` field into the standard format.

---

## Credits

- Inspired by [HomebrewTitleIDGenerator](https://github.com/StudioNameHere/HomebrewTitleIDGenerator)
- Generator: [CTR-TIDGenerator](https://github.com/Morrisonion/CTR-TIDGenerator)
- Homebrew data from [Universal-Team/db](https://github.com/Universal-Team/db)