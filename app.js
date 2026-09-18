var TID = (function () {
  const API_URL = "https://api.titledb.com/v0/";
  const NUS_INFO_BASE = "https://dantheman827.github.io/nus-info/";
  const TIDS_URL = "https://dantheman827.github.io/3ds-tids/data.json";
  const NUS_INFO_URL = NUS_INFO_BASE + "titles.json";

  const TITLE_ID_PRE = "000400000";
  const TITLE_ID_POST = "00";
  const TITLE_ID_MAX = 0xF7FFF;
  const TITLE_ID_MIN = 0x300;

  const THEME_KEY = "tid-api-theme";

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
    titleID = pad(titleID, 16);
    return titleID;
  }

  function isValidTitleID(titleID) {
    titleID = unshortenTitleID(titleID);
    if (titleID.length !== 16) return false;
    if (titleID.substring(0, 8) !== "00040000") return false;
    if (titleID.substring(14) !== "00") return false;
    const middle = parseInt(titleID.substring(8, 14), 16);
    if (isNaN(middle)) return false;
    if (middle < TITLE_ID_MIN || middle > TITLE_ID_MAX) return false;
    return true;
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
      if (
        !(randomID in apiData) &&
        !(randomID in eShopData) &&
        !(randomID in titleIdListData)
      ) {
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
    } catch (err) {
      console.error("TID-API: Failed to load data", err);
    }
  }

  function checkTitleID(raw) {
    const titleID = unshortenTitleID(String(raw || "").toUpperCase());

    if (!isValidTitleID(titleID)) {
      return { status: "invalid", titleid: titleID };
    }
    if (titleID in eShopData) {
      return {
        status: "eshop",
        titleid: titleID,
        name: eShopData[titleID].name || null,
      };
    }
    if (titleID in apiData) {
      return {
        status: "titledb",
        titleid: titleID,
        name: apiData[titleID].name,
        author: apiData[titleID].author,
        image: "https://api.titledb.com/images/" + titleID + ".png",
      };
    }
    if (titleID in titleIdListData) {
      return {
        status: "tids",
        titleid: titleID,
        name: titleIdListData[titleID].name,
        author: titleIdListData[titleID].author,
      };
    }
    return { status: "free", titleid: titleID };
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(saved);
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains("theme-light");
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  function copyText(text, btn) {
    if (!text || text === "—" || text === "…") return;
    const done = () => {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = original), 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    }
  }

  function waitForLoad(cb) {
    if (loaded) return cb();
    const wait = setInterval(() => {
      if (loaded) {
        clearInterval(wait);
        cb();
      }
    }, 50);
  }

  function renderTid() {
    const el = document.getElementById("out");
    if (!el) return;
    waitForLoad(() => {
      el.textContent = generateRandomTitleID();
    });
  }

  function init() {
    loadTheme();
    loadAll();

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    const tidOutput = document.getElementById("tidOutput");
    const checkInput = document.getElementById("checkInput");
    const checkResult = document.getElementById("checkResult");

    if (!tidOutput) return;

    function loadTid() {
      tidOutput.textContent = "…";
      waitForLoad(() => {
        tidOutput.textContent = generateRandomTitleID();
      });
    }

    document.getElementById("tidGenBtn").addEventListener("click", loadTid);
    document.getElementById("tidCopyBtn").addEventListener("click", (e) => {
      copyText(tidOutput.textContent, e.target);
    });

    function showResult(html, type) {
      checkResult.className = "result show " + (type || "");
      checkResult.innerHTML = html;
    }

    function runCheck() {
      const value = checkInput.value.trim();
      if (!value) {
        showResult('<div class="title">Please enter a Title ID.</div>', "warning");
        return;
      }
      showResult('<div class="title">Checking…</div>', "");
      waitForLoad(() => {
        const data = checkTitleID(value);

        if (data.status === "invalid") {
          showResult(
            '<div class="title">Invalid Title ID</div><div class="sub">' +
              data.titleid +
              "</div>",
            "danger"
          );
        } else if (data.status === "free") {
          showResult(
            '<div class="title">Valid &amp; unused</div><div class="sub">' +
              data.titleid +
              " – not found in titledb or nus-info.</div>",
            "success"
          );
        } else if (data.status === "eshop") {
          showResult(
            '<div class="title">eShop / NUS</div><div class="sub">' +
              data.titleid +
              (data.name ? " – " + data.name : "") +
              "</div>",
            "success"
          );
        } else if (data.status === "titledb") {
          let html =
            '<div class="title">' +
            (data.name || "Unknown") +
            '</div><div class="sub">' +
            data.titleid +
            (data.author ? " – " + data.author : "") +
            "</div>";
          if (data.image) {
            html += '<img src="' + data.image + '" alt="">';
          }
          showResult(html, "success");
        } else if (data.status === "tids") {
          showResult(
            '<div class="title">' +
              (data.name || "Unknown") +
              '</div><div class="sub">' +
              data.titleid +
              (data.author ? " – " + data.author : "") +
              "</div>",
            "success"
          );
        }
      });
    }

    document.getElementById("checkBtn").addEventListener("click", runCheck);
    checkInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runCheck();
    });

    loadTid();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    renderTid: renderTid,
    generateRandomTitleID: generateRandomTitleID,
    isValidTitleID: isValidTitleID,
    checkTitleID: checkTitleID,
  };
})();