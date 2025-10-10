const axios = require("axios");

async function getUserByUsername(username) {
  const url = `https://users.roblox.com/v1/users/by-username/${encodeURIComponent(username)}`;
  const res = await axios.get(url, { headers: { "User-Agent": "Roblox-Stalk-Script" } });
  return res.data; // { id, name, displayName, created, ... }
}

async function getUserById(id) {
  const url = `https://users.roblox.com/v1/users/${encodeURIComponent(id)}`;
  const res = await axios.get(url, { headers: { "User-Agent": "Roblox-Stalk-Script" } });
  return res.data;
}

async function getAvatarUrl(id, size = 150) {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(id)}&size=${size}x${size}&format=Png&isCircular=false`;
  const res = await axios.get(url);
  if (res.data && res.data.data && res.data.data[0] && res.data.data[0].imageUrl) return res.data.data[0].imageUrl;
  return null;
}

async function getPresence(id) {
  // returns presence info array; if fails, returns null
  try {
    const url = `https://presence.roblox.com/v1/presence/users?userIds=${encodeURIComponent(id)}`;
    const res = await axios.get(url, { headers: { "User-Agent": "Roblox-Stalk-Script" } });
    if (res.data && res.data.length) return res.data[0]; // contains userId, presenceType, rootPlaceId, userLocation, lastLocation
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  name: "Roblox Stalk",
  desc: "Stalking Roblox Account",
  category: "Stalker",
  path: "/robloxstalk?apikey=",
  /**
   * Query params:
   * - apikey (required)
   * - username OR id (required one of them)
   *
   * Example:
   * /robloxstalk?apikey=KEY&username=someUser
   * /robloxstalk?apikey=KEY&id=123456
   */
  async run(req, res) {
    const { apikey, username, id } = req.query;

    if (!apikey || !global.apikey || !global.apikey.includes(apikey))
      return res.status(401).json({ status: false, error: "Apikey invalid" });

    if (!username && !id)
      return res.status(400).json({ status: false, error: "Parameter 'username' or 'id' is required" });

    try {
      // 1) get basic user info
      let user;
      if (username) {
        user = await getUserByUsername(username);
      } else {
        user = await getUserById(id);
      }

      if (!user || !user.id)
        return res.status(404).json({ status: false, error: "User not found" });

      const userId = user.id;

      // 2) avatar
      const avatar = await getAvatarUrl(userId).catch(() => null);

      // 3) presence (online/offline + place info)
      const presence = await getPresence(userId).catch(() => null);

      // build result object
      const result = {
        id: userId,
        username: user.name || username || null,
        displayName: user.displayName || null,
        created: user.created || null,
        description: user.description || user.blurb || null, // some endpoints use 'description' or 'blurb'
        avatar: avatar,
        presence: presence, // raw presence object (may be null)
        raw: user, // full user object from Roblox (useful for downstream)
      };

      return res.status(200).json({ status: true, result });
    } catch (error) {
      // helpful error message but avoid leaking too much
      return res.status(500).json({
        status: false,
        error: error && error.message ? error.message : "Internal error",
      });
    }
  },
};
