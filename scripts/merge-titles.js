const fs = require("fs");
const path = require("path");

const NUS = path.join(__dirname, "..", "data", "nus-titles.json");
const UDB = path.join(__dirname, "..", "data", "udb-titles.json");
const OUT = path.join(__dirname, "..", "titles.json");

const nus = JSON.parse(fs.readFileSync(NUS, "utf8"));
const udb = JSON.parse(fs.readFileSync(UDB, "utf8"));

const merged = {};

for (const key in nus) merged[key] = nus[key];
for (const key in udb) {
  if (!(key in merged)) merged[key] = udb[key];
}

const sorted = {};
Object.keys(merged).sort().forEach((k) => {
  sorted[k] = merged[k];
});

fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2));
console.log("Wrote " + Object.keys(sorted).length + " merged titles.");