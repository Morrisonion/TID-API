# TID-API
API for randomized 3DS Title ID's
---
### https://tid-api.onrender.com
[![License](https://img.shields.io/badge/license-GPLv3-red)](https://github.com/Morrisonion/TID-API/raw/main/LICENSE)
---
## How it works

**TID-API** generates random, unused Nintendo 3DS Title IDs on demand.

When the server starts, it fetches three public databases in parallel:

- **titledb.com API** – homebrew applications and their Title IDs
- **nus-info** – official eShop / NUS title ID's (filtered to `platform_device == "CTR"`)

All entries are stored in memory as lookup maps. A Title ID is considered **used** if it appears in any of the three sources.

Every request returns a freshly generated Title ID as `text/plain`. Generation works like this:

1. A random 5-character hex value is picked between `0x300` and `0xF7FFF`.
2. It is wrapped into the Title ID format: `000400000` + `XXXXX` + `00` → 16 hex characters.
3. If the result already exists in any of the loaded databases, the process repeats until an unused ID is found.

Because the generation runs server-side, the response contains the raw Title ID as plain text – no JavaScript, no HTML, no client-side rendering required. Crawlers, `curl`, and link previews all see the same value a browser would.

---
## Credits
- Inspired by [HomebrewTitleIDGenerator](https://github.com/StudioNameHere/HomebrewTitleIDGenerator)
- Uses [nus-info](https://github.com/DanTheMan827/nus-info)
- API [TitleDB](titledb.com)