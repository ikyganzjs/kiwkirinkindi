// ml-stalk-fixed.js
const axios = require("axios");

/**
 * Try one kiosgamer request with given payload.
 * Returns { ok: true, data } or throws { code:'KIOS_ERR', resp }
 */
async function tryKios(payload) {
  const url = "https://kiosgamer.co.id/api/auth/player_id_login";
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://kiosgamer.co.id",
    "Referer": "https://kiosgamer.co.id/",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
  };

  try {
    const resp = await axios.post(url, payload, { headers, timeout: 15000 });
    // If response looks like an error object with "error" field
    if (resp.data && (resp.data.error || resp.data.status === "error")) {
      const e = new Error("kios-error");
      e.code = "KIOS_ERR";
      e.resp = resp.data;
      throw e;
    }
    return { ok: true, data: resp.data };
  } catch (err) {
    // Normalize axios errors
    const wrapped = new Error("kios-request-failed");
    wrapped.code = err.code || err.response?.status || "KIOS_REQ_FAIL";
    wrapped.resp = err.response?.data || err.message;
    throw wrapped;
  }
}

/**
 * Try MobileLegends direct API fallback
 */
async function tryMobileLegends(id) {
  const url = "https://api.mobilelegends.com/base/player_info";
  const payload = {
    player_id: id.toString(),
    app_id: 20007,
    channel_id: 1,
    language: "id"
  };
  const headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://www.mobilelegends.com",
    "referer": "https://www.mobilelegends.com/",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  };

  try {
    const resp = await axios.post(url, payload, { headers, timeout: 15000 });
    return { ok: true, data: resp.data };
  } catch (err) {
    const e = new Error("ml-api-failed");
    e.resp = err.response?.data || err.message;
    throw e;
  }
}

/**
 * Main: tries kiosgamer with several payload variants, then fallback
 */
async function mlstalk(id) {
  if (!id) throw new Error("Id player diperlukan");

  // common payload base
  const base = {
    app_id: 20007,
    login_id: id.toString()
  };

  // try several zone_id variants (common patterns)
  const zoneCandidates = ["ID", "", "0", "1"];

  let lastKiosError = null;
  for (const z of zoneCandidates) {
    const payload = { ...base };
    if (z !== "") payload.zone_id = z; // only add when not empty to test both with and without
    try {
      const ok = await tryKios(payload);
      // success
      return { source: "kiosgamer", result: ok.data, used_payload: payload };
    } catch (kerr) {
      // store last error for debug, continue trying
      lastKiosError = { payload: (z !== "" ? { ...payload } : { ...base }), err: kerr };
      // if server explicitly returned an "error_params" inside kerr.resp, break and fallback
      const resp = kerr.resp;
      if (resp && ((typeof resp === "object" && (resp.error === "error_params" || resp.code === "error_params")) || String(resp).includes("error_params"))) {
        // stop trying other zone ids; we know params are wrong / blocked
        break;
      }
      // otherwise continue trying other zone candidates
    }
  }

  // If we reach here, kiosgamer attempts failed — try MobileLegends API fallback
  try {
    const ml = await tryMobileLegends(id);
    return { source: "mobilelegends", result: ml.data, debug_kios: lastKiosError };
  } catch (mlerr) {
    // Both failed — throw aggregated error with debug
    const e = new Error("both-failed");
    e.detail = {
      kios_last: lastKiosError,
      mobilelegends_err: mlerr.resp || mlerr.message
    };
    throw e;
  }
}

module.exports = {
  name: "ML Stalk",
  desc: "Stalking Mobile Legends account (tries kiosgamer then MobileLegends API) — improved params handling + debug",
  category: "Stalker",
  path: "/stalk/ml?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;

    if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid" });
    }
    if (!id) {
      return res.status(400).json({ status: false, error: "Id player diperlukan!" });
    }

    try {
      const out = await mlstalk(id);
      return res.status(200).json({
        status: true,
        creator: "IKY RESTAPI",
        source: out.source,
        result: out.result,
        used_payload: out.used_payload || null,
        debug_kios: out.debug_kios || null
      });
    } catch (err) {
      // useful debug info for troubleshooting
      const debug = err.detail || err.detail?.kios_last || err.detail?.mobilelegends_err || err.detail || null;
      return res.status(500).json({
        status: false,
        creator: "IKY RESTAPI",
        error: "Gagal mengambil data ML",
        message: err.message,
        debug
      });
    }
  }
};
