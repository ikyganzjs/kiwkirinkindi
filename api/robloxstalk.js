const axios = require("axios");

async function getUserByUsername(username) {
  const url = `https://users.roblox.com/v1/users/by-username/${encodeURIComponent(username)}`;
  const res = await axios.get(url, { headers: { "User-Agent": "Roblox-Stalk" } });
  return res.data;
}

async function getUserById(id) {
  const url = `https://users.roblox.com/v1/users/${encodeURIComponent(id)}`;
  const res = await axios.get(url, { headers: { "User-Agent": "Roblox-Stalk" } });
  return res.data;
}

async function getAvatar(id) {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`;
  const res = await axios.get(url);
  return res.data?.data?.[0]?.imageUrl || null;
}

module.exports = {
  name: "Roblox Stalk",
  desc: "Stalking Roblox Account",
  category: "Stalker",
  path: "/robloxstalk?apikey=&username=&id=",
  async run(req, res) {
    const { apikey, username, id } = req.query;

    if (!apikey || !global.apikey?.includes(apikey))
      return res.status(401).json({ status: false, error: "Apikey invalid" });

    if (!username && !id)
      return res.status(400).json({ status: false, error: "Masukkan username atau id Roblox" });

    try {
      const user = username ? await getUserByUsername(username) : await getUserById(id);

      if (!user || !user.id)
        return res.status(404).json({ status: false, error: "User tidak ditemukan" });

      const avatar = await getAvatar(user.id);

      res.status(200).json({
        status: true,
        result: {
          id: user.id,
          username: user.name,
          displayName: user.displayName,
          created: user.created,
          description: user.description || "Tidak ada deskripsi",
          avatar,
        },
      });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  },
};
