const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = "https://api.titledb.com/v0/";
const NUS_INFO_URL = "https://dantheman827.github.io/nus-info/titles.json";
const TIDS_URL = "https://dantheman827.github.io/3ds-tids/data.json";

const TITLE_ID_PRE = "000400000";
const TITLE_ID_POST = "00";
const TITLE_ID_MIN = 0x300;
const TITLE_ID_MAX = 0xF7FFF;

let apiData = {};
let eShopData = {};
let titleIdListData = {};
let loaded = false;

function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function unshortenTitleID(titleID) {
  if (typeof titleID !== "string") return "";
  const capture = titleID.match(/([a-f0-9]+)\s*$/i);
  if (!capture) return "";
  titleID = capture[1];
  if (titleID.length <= 8) {
    if (titleID.length <= 6) titleID = titleID + TITLE_ID_POST;
    titleID = TITLE_ID_PRE.substr(0, 8) + pad(titleID, 8);
  }
  return pad(titleID, 16);
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
    if (!(randomID in apiData) && !(randomID in eShopData) && !(randomID in titleIdListData)) {
      return randomID;
    }
  }
}

async function loadAll() {
  try {
    const [apiRes, nusRes, tidsRes] = await Promise.all([
      fetch(API_URL).then((r) => r.json()),
      fetch(NUS_INFO_URL).then((r) => r.json()),
      fetch(TIDS_URL).then((r) => r.json()),
    ]);

    apiRes.forEach((value) => {
      apiData[value.titleid] = value;
    });

    for (const key in nusRes) {
      if (nusRes[key].platform_device === "CTR") {
        eShopData[key] = nusRes[key];
      }
    }

    tidsRes.forEach((value) => {
      value.titleid = unshortenTitleID(value.titleid);
      titleIdListData[value.titleid] = value;
    });

    loaded = true;
    console.log("Loaded: api=" + Object.keys(apiData).length + " eshop=" + Object.keys(eShopData).length + " tids=" + Object.keys(titleIdListData).length);
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
