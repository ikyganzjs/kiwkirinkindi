const axios = require("axios");

/**
 * Try KiosGamer API (lebih lengkap) first.
 * If KiosGamer blocks (captcha / 403 / "geo.captcha" in response), throw special error to fallback.
 */
async function fetchFromKiosGamer(id) {
  const url = "https://kiosgamer.co.id/api/auth/player_id_login";
  const payload = {
    app_id: 20007, // ML app id di kiosgamer
    login_id: id.toString(),
  };

  const headers = {
    "authority": "kiosgamer.co.id",
    "accept": "application/json, text/plain, */*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/json",
    "origin": "https://kiosgamer.co.id",
    "referer": "https://kiosgamer.co.id/app/20007",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
    "cookie": "region=CO.ID; source=mb;"
  };

  try {
    const resp = await axios.post(url, payload, { headers, timeout: 15000 });
    // If response contains captcha redirect or captcha host, consider blocked
    const body = resp.data;
    if (!body) throw new Error("Empty response from KiosGamer");
    // some kiosgamer responses return object with url to captcha
    if (typeof body === "string" && body.includes("captcha")) {
      const e = new Error("KIOSGAMER_CAPTCHA");
      e.meta = { body };
      throw e;
    }
    // If API returns object that indicates failure with captcha url
    if (body.url && String(body.url).includes("captcha")) {
      const e = new Error("KIOSGAMER_CAPTCHA");
      e.meta = { body };
      throw e;
    }

    return { source: "kiosgamer", data: body };
  } catch (err) {
    // Normalize axios error
    const status = err.response?.status;
    // If 403/401/ captcha -> signal fallback
    if (status === 403 || (err.message && err.message.includes("CAPTCHA")) || err.message === "KIOSGAMER_CAPTCHA") {
      const e = new Error("KIOSGAMER_BLOCKED");
      e.meta = { originalError: err, status, respData: err.response?.data || err.meta?.body };
      throw e;
    }
    // For network/timeout or other errors, rethrow
    throw err;
  }
}

/**
 * Try Mobile Legends API (may be more stable for direct player info)
 */
async function fetchFromMobileLegends(id) {
  const url = "https://api.mobilelegends.com/base/player_info";
  const payload = {
    player_id: id.toString(),
    app_id: 20007,
    channel_id: 1,
    language: "id",
  };
  const headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://www.mobilelegends.com",
    "referer": "https://www.mobilelegends.com/",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  };

  const resp = await axios.post(url, payload, { headers, timeout: 15000 });
  if (!resp || !resp.data) throw new Error("Empty response from MobileLegends API");
  return { source: "mobilelegends", data: resp.data };
}

/**
 * Main wrapper: try kiosgamer first, fallback to mobilelegends if blocked/fails.
 */
async function mlstalk(id) {
  if (!id) throw new Error("Id player diperlukan");

  // try KiosGamer first
  try {
    const result = await fetchFromKiosGamer(id);
    return result;
  } catch (err) {
    // If kiosgamer specifically blocked (captcha) -> try fallback
    if (err.message === "KIOSGAMER_BLOCKED" || err.message === "KIOSGAMER_CAPTCHA" || err.response?.status === 403) {
      // fallback to MobileLegends API
      try {
        const fallback = await fetchFromMobileLegends(id);
        return fallback;
      } catch (err2) {
        // chain both errors for debugging
        const e = new Error("Both kiosgamer & mobilelegends failed");
        e.kiosError = err;
        e.mlError = err2;
        throw e;
      }
    }
    // For other errors from KiosGamer, still try fallback
    try {
      const fallback = await fetchFromMobileLegends(id);
      return fallback;
    } catch (err2) {
      const e = new Error("Both kiosgamer & mobilelegends failed");
      e.kiosError = err;
      e.mlError = err2;
      throw e;
    }
  }
}

module.exports = {
  name: "ML Stalk",
  desc: "Stalking Mobile Legends account",
  category: "Stalker",
  path: "/stalkml?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;

    if (!apikey || !global.apikey || !global.apikey.includes(apikey))
      return res.status(401).json({ status: false, error: "Apikey invalid" });

    if (!id)
      return res.status(400).json({ status: false, error: "Id player diperlukan!" });

    try {
      const result = await mlstalk(id);
      return res.status(200).json({
        status: true,
        creator: "IKY RESTAPI",
        source: result.source,
        result: result.data,
      });
    } catch (error) {
      // Helpful error payload for debugging (don't leak too much in production)
      const debug = {
        message: error.message,
        kiosgamer: error.kiosError ? {
          message: error.kiosError.message,
          status: error.kiosError.response?.status,
          data: error.kiosError.response?.data || error.kiosError.meta?.body
        } : undefined,
        mobilelegends: error.mlError ? {
          message: error.mlError.message,
          status: error.mlError.response?.status,
          data: error.mlError.response?.data
        } : undefined
      };

      return res.status(500).json({
        status: false,
        creator: "IKY RESTAPI",
        error: "Gagal mengambil data ML",
        debug
      });
    }
  }
};
