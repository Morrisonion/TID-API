const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const NUS_URL = "https://morrisonion.github.io/TID-API/data/nus-titles.json";
const UDB_URL = "https://morrisonion.github.io/TID-API/data/udb-titles.json";

const TITLE_ID_PRE = "000400000";
const TITLE_ID_POST = "00";
const TITLE_ID_MIN = 0x300;
const TITLE_ID_MAX = 0xF7FFF;

let nusData = {};
let udbData = {};
let loaded = false;

function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function generateRandomTitleID() {
  while (true) {
    const gameID = pad(
      parseInt(Math.random() * (TITLE_ID_MAX - TITLE_ID_MIN + 1) + TITLE_ID_MIN)
        .toString(16)
        .toUpperCase(),
      5
    );
    const randomID = TITLE_ID_PRE + gameID + TITLE_ID_POST;
    if (!(randomID in nusData) && !(randomID in udbData)) {
      return randomID;
    }
  }
}

async function loadAll() {
  try {
    const [nusRes, udbRes] = await Promise.all([
      fetch(NUS_URL).then((r) => r.json()),
      fetch(UDB_URL).then((r) => r.json()),
    ]);

    nusData = nusRes;
    udbData = udbRes;

    loaded = true;
    console.log(
      "Loaded: nus=" + Object.keys(nusData).length +
      " udb=" + Object.keys(udbData).length
    );
  } catch (err) {
    console.error("Load failed:", err.message);
    loaded = true;
  }
}

app.get("/", (req, res) => {
  if (!loaded) {
    return res.status(503).type("text/plain").send("Loading...");
  }
  res.type("text/plain").send(generateRandomTitleID());
});

app.get("/tid", (req, res) => {
  if (!loaded) {
    return res.status(503).type("text/plain").send("Loading...");
  }
  res.type("text/plain").send(generateRandomTitleID());
});

app.listen(PORT, () => {
  console.log("TID-API running on port " + PORT);
  loadAll();
});