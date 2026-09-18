$(document).ready(function() {
  var apiUrl = "https://api.titledb.com/v0/";
  var nusInfoBaseUrl = "https://dantheman827.github.io/nus-info/";
  var tidsURL = "https://dantheman827.github.io/3ds-tids/data.json";
  var nusInfoUrl = nusInfoBaseUrl + "titles.json";

  var loadedStatus = 0;
  var completelyLoaded = 1 | 2 | 4;
  var apiData = {};
  var eShopData = {};
  var titleIdListData = {};

  var titleIDPre = "000400000";
  var titleIDPost = "00";
  var titleIDMax = 0xF7FFF;
  var titleIDMin = 0x300;

  function setLoadedBit(bit) {
    loadedStatus = loadedStatus | bit;
    if ((loadedStatus & completelyLoaded) === completelyLoaded) {
      document.getElementById("out").textContent = generateID();
    }
  }

  $.getJSON(apiUrl, function(data) {
    $.each(data, function(key, value) {
      apiData[value.titleid] = value;
    });
    setLoadedBit(1);
  }).fail(function() {
    console.error("TID: titledb failed");
    setLoadedBit(1);
  });

  $.getJSON(nusInfoUrl, function(data) {
    $.each(data, function(key, value) {
      if (value.platform_device === "CTR") {
        eShopData[key] = value;
      }
    });
    setLoadedBit(2);
  }).fail(function() {
    console.error("TID: nus-info failed");
    setLoadedBit(2);
  });

  $.getJSON(tidsURL, function(data) {
    $.each(data, function(key, value) {
      value.titleid = unshortenTitleID(value.titleid);
      titleIdListData[value.titleid] = value;
    });
    setLoadedBit(4);
  }).fail(function() {
    console.error("TID: 3ds-tids failed");
    setLoadedBit(4);
  });

  function generateID() {
    while (true) {
      var gameID = pad(
        parseInt(Math.random() * (titleIDMax - titleIDMin + 1) + titleIDMin)
          .toString(16)
          .toUpperCase(),
        5
      );
      var randomID = titleIDPre + gameID + titleIDPost;

      if (
        !(randomID in apiData) &&
        !(randomID in eShopData) &&
        !(randomID in titleIdListData)
      ) {
        return randomID;
      } else {
        console && console.debug && console.debug("ID " + randomID + " exists.");
      }
    }
  }

  function unshortenTitleID(titleID) {
    var capture = titleID.match(/([a-f0-9]+)\s*$/i);

    if (!capture) {
      return "";
    }

    titleID = capture[1];

    if (titleID.length <= 8) {
      if (titleID.length <= 6) {
        titleID = titleID + titleIDPost;
      }
      titleID = titleIDPre.substr(0, 8) + pad(titleID, 8);
    }

    titleID = pad(titleID, 16);
    return titleID;
  }

  function pad(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
});
