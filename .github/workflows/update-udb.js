const fs = require("fs");
const path = require("path");

const OWNER = "Universal-Team";
const REPO = "db";
const APPS_PATH = "source/apps";
const OUT = path.join(__dirname, "..", "data", "udb-titles.json");
const TOKEN = process.env.GITHUB_TOKEN;

function pad(n, w, z) {
  z = z || "0";
  n = String(n);
  return n.length >= w ? n : new Array(w - n.length + 1).join(z) + n;
}

function uidToTitleId(uid) {
  return "00040000" + pad(Number(uid).toString(16).toUpperCase(), 6) + "00";
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: "Bearer " + TOKEN } : {},
  });
  if (!res.ok) throw new Error(url + " -> HTTP " + res.status);
  return res.json();
}

async function main() {
  const listUrl =
    "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + APPS_PATH;

  const files = await getJson(listUrl);
  const out = {};
  let skipped = 0;

  for (const file of files) {
    if (file.type !== "file" || !file.name.endsWith(".json")) continue;

    let data;
    try {
      data = await getJson(file.download_url);
    } catch (e) {
      console.warn("Skip " + file.name + ": " + e.message);
      continue;
    }

    if (!Array.isArray(data.unique_ids) || data.unique_ids.length === 0) {
      skipped++;
      continue;
    }

    const name = data.github || null;
    if (!name) {
      skipped++;
      continue;
    }

    for (const uid of data.unique_ids) {
      const titleId = uidToTitleId(uid);
      out[titleId] = { name: name };
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(
    "Wrote " + Object.keys(out).length + " UDB titles (skipped " + skipped + ")."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
