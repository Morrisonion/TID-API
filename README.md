# TID-API
API for randomized 3DS Title ID's
---
### https://tid-api.onrender.com
![JS](https://img.shields.io/badge/JavaScript-F7DF1E?&logo=javascript&logoColor=black)
[![License](https://img.shields.io/badge/license-GPLv3-red)](https://github.com/Morrisonion/TID-API/raw/main/LICENSE)
---
## How it works

**TID-API** generates random, unused Nintendo 3DS Title IDs on demand.

When the server starts, it fetches two public databases in parallel:

- **nus-titles** – official eShop / NUS title IDs, sourced from [`CTR-TID's-database`](https://github.com/Morrisonion/CTR-TID-s-database)
- **udb-titles** – homebrew applications from the Universal-DB, also compiled into [`CTR-TID's-database`](https://github.com/Morrisonion/CTR-TID-s-database)

Both databases are hosted as static JSON via GitHub Pages and refreshed hourly through GitHub Actions. All entries are stored in memory as lookup maps. A Title ID is considered **used** if it appears in either source.

Every request returns a freshly generated Title ID as `text/plain`. Generation works like this:

1. A random 5-character hex value is picked between `0x300` and `0xF7FFF`.
2. It is wrapped into the Title ID format: `000400000` + `XXXXX` + `00` → 16 hex characters.
3. If the result already exists in any of the loaded databases, the process repeats until an unused ID is found.

Because the generation runs server-side, the response contains the raw Title ID as plain text – no JavaScript, no HTML, no client-side rendering required. Crawlers, `curl`, and link previews all see the same value a browser would.

---
## Credits
- Inspired by [HomebrewTitleIDGenerator](https://github.com/StudioNameHere/HomebrewTitleIDGenerator)
- Title ID checking 