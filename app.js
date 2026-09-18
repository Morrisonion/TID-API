var TID = (function () {
  var API_URL = "https://api.titledb.com/v0/";
  var NUS_INFO_BASE = "https://dantheman827.github.io/nus-info/";
  var TIDS_URL = "https://dantheman827.github.io/3ds-tids/data.json";
  var NUS_INFO_URL = NUS_INFO_BASE + "titles.json";

  var TITLE_ID_PRE = "000400000";
  var TITLE_ID_POST = "00";
  var TITLE_ID_MAX = 0xF7FFF;
  var TITLE_ID_MIN = 0x300;

  var THEME_KEY = "tid-api-theme";

  var apiData = {};
  var eShopData = {};
  var titleIdListData = {};

  var loadedBits = 0;
  var ALL_BITS = 1 | 2 | 4;
  var loaded = false;
  var pendingCallbacks = [];

  function pad(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  function unshortenTitleID(titleID) {
    if (typeof titleID !== "string") return "";
    var capture = titleID.match(/([a-f0-9]+)\s*$/i);
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
    var middle = parseInt(titleID.substring(8, 14), 16);
    if (isNaN(middle)) return false;
    if (middle < TITLE_ID_MIN || middle > TITLE_ID_MAX) return false;
    return true;
  }

  function setLoadedBit(bit) {
    loadedBits = loadedBits | bit;
    if ((loadedBits & ALL_BITS) === ALL_BITS) {
      loaded = true;
      var cbs = pendingCallbacks.slice();
      pendingCallbacks = [];
      for (var i = 0; i < cbs.length; i++) cbs[i]();
    }
  }

  function onReady(cb) {
    if (loaded) return cb();
    pendingCallbacks.push(cb);
  }

  function generateRandomTitleID() {
    while (true) {
      var gameID = pad(
        parseInt(Math.random() * (TITLE_ID_MAX - TITLE_ID_MIN + 1) + TITLE_ID_MIN)
          .toString(16)
          .toUpperCase(),
        5
      );
      var randomID = TITLE_ID_PRE + gameID + TITLE_ID_POST;
      if (
        !(randomID in apiData) &&
        !(randomID in eShopData) &&
        !(randomID in titleIdListData)
      ) {
        return randomID;
      }
    }
  }

  function checkTitleID(raw) {
    var titleID = unshortenTitleID(String(raw || "").toUpperCase());

    if (!isValidTitleID(titleID)) {
      return { status: "invalid", titleid: titleID };
    }
    if (titleID in eShopData) {
      return { status: "eshop", titleid: titleID, name: eShopData[titleID].name || null };
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

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function applyTheme(theme) {
    if (theme === "light") document.body.classList.add("theme-light");
    else document.body.classList.remove("theme-light");
  }

  function loadTheme() {
    applyTheme(safeGet(THEME_KEY) || "dark");
  }

  function toggleTheme() {
    var isLight = document.body.classList.contains("theme-light");
    var next = isLight ? "dark" : "light";
    applyTheme(next);
    safeSet(THEME_KEY, next);
  }

  function copyText(text, btn) {
    if (!text || text === "—" || text === "…") return;
    var done = function () {
      var original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = original; }, 1200);
    };
    var fallback = function () {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function loadAllData() {
    $.getJSON(API_URL, function (data) {
      $.each(data, function (key, value) {
        apiData[value.titleid] = value;
      });
      setLoadedBit(1);
    }).fail(function () {
      console.error("TID-API: titledb failed");
      setLoadedBit(1);
    });

    $.getJSON(NUS_INFO_URL, function (data) {
      $.each(data, function (key, value) {
        if (value.platform_device === "CTR") {
          eShopData[key] = value;
        }
      });
      setLoadedBit(2);
    }).fail(function () {
      console.error("TID-API: nus-info failed");
      setLoadedBit(2);
    });

    $.getJSON(TIDS_URL, function (data) {
      $.each(data, function (key, value) {
        value.titleid = unshortenTitleID(value.titleid);
        titleIdListData[value.titleid] = value;
      });
      setLoadedBit(4);
    }).fail(function () {
      console.error("TID-API: 3ds-tids failed");
      setLoadedBit(4);
    });
  }

  function renderTid() {
    loadAllData();
    var el = document.getElementById("out");
    if (!el) return;
    onReady(function () {
      el.textContent = generateRandomTitleID();
    });
  }

  function init() {
    loadTheme();
    loadAllData();

    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    var tidOutput = document.getElementById("tidOutput");
    var checkInput = document.getElementById("checkInput");
    var checkResult = document.getElementById("checkResult");

    if (!tidOutput) return;

    function loadTid() {
      tidOutput.textContent = "…";
      onReady(function () {
        tidOutput.textContent = generateRandomTitleID();
      });
    }

    document.getElementById("tidGenBtn").addEventListener("click", loadTid);
    document.getElementById("tidCopyBtn").addEventListener("click", function (e) {
      copyText(tidOutput.textContent, e.target);
    });

    function showResult(html, type) {
      checkResult.className = "result show " + (type || "");
      checkResult.innerHTML = html;
    }

    function runCheck() {
      var value = checkInput.value.trim();
      if (!value) {
        showResult('<div class="title">Please enter a Title ID.</div>', "warning");
        return;
      }
      showResult('<div class="title">Checking…</div>', "");
      onReady(function () {
        var data = checkTitleID(value);

        if (data.status === "invalid") {
          showResult('<div class="title">Invalid Title ID</div><div class="sub">' + data.titleid + "</div>", "danger");
        } else if (data.status === "free") {
          showResult('<div class="title">Valid &amp; unused</div><div class="sub">' + data.titleid + " – not found in titledb or nus-info.</div>", "success");
        } else if (data.status === "eshop") {
          showResult('<div class="title">eShop / NUS</div><div class="sub">' + data.titleid + (data.name ? " – " + data.name : "") + "</div>", "success");
        } else if (data.status === "titledb") {
          var html = '<div class="title">' + (data.name || "Unknown") + '</div><div class="sub">' + data.titleid + (data.author ? " – " + data.author : "") + "</div>";
          if (data.image) html += '<img src="' + data.image + '" alt="">';
          showResult(html, "success");
        } else if (data.status === "tids") {
          showResult('<div class="title">' + (data.name || "Unknown") + '</div><div class="sub">' + data.titleid + (data.author ? " – " + data.author : "") + "</div>", "success");
        }
      });
    }

    document.getElementById("checkBtn").addEventListener("click", runCheck);
    checkInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") runCheck();
    });

    loadTid();
  }

  $(document).ready(function () {
    if (document.getElementById("tidOutput")) init();
  });

  return {
    renderTid: renderTid,
    generateRandomTitleID: generateRandomTitleID,
    isValidTitleID: isValidTitleID,
    checkTitleID: checkTitleID,
  };
})();