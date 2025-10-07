const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
let users = [];

app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  if (users.find(u => u.username === username))
    return res.json({ status: false, error: "Username sudah terdaftar" });

  const apikey = crypto.randomBytes(8).toString("hex");
  const user = { username, email, password, apikey, ip: req.ip };
  users.push(user);
  res.json({ status: true, message: "Berhasil daftar!" });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ status: false, error: "Username / Password salah" });
  res.json({ status: true, apikey: user.apikey, user });
});

app.get("/api/admin/users", (req, res) => {
  const apikey = req.query.apikey;
  const admin = users.find(u => u.apikey === apikey);
  if (!admin) return res.json({ status: false, error: "Apikey tidak valid" });
  res.json({ status: true, users });
});

app.use(express.static("public"));
app.listen(3000, () => console.log("Server running http://localhost:3000"));

// Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Global Helpers
global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.apikey = process.env.APIKEY || null;
global.totalreq = 0;

// Settings
const settings = {
  creatorName: "IKY RESTAPI",
  apiTitle: "Iky API's",
  channelLink: "https://wa.me/6283139882434", 
  githubLink: "https://wa.me/6283139882434", 
  contactLink: "https://wa.me/6283139882434"
};


// Global JSON Response Wrapper
app.use((req, res, next) => {
  global.totalreq += 1;

  const originalJson = res.json;
  res.json = function (data) {
    if (
      typeof data === 'object' &&
      req.path !== '/endpoints' &&
      req.path !== '/set'
    ) {
      return originalJson.call(this, {
        creator: settings.creatorName || "Created Using Iky",
        ...data
      });
    }
    return originalJson.call(this, data);
  };

  next();
});

app.get('/set', (req, res) => res.json(settings));

// Dynamic route loader with sorted categories and endpoints
let totalRoutes = 0;
let rawEndpoints = {};
const apiFolder = path.join(__dirname, 'api');

fs.readdirSync(apiFolder).forEach(file => {
  const fullPath = path.join(apiFolder, file);
  if (file.endsWith('.js')) {
    try {
      const routes = require(fullPath);
      const handlers = Array.isArray(routes) ? routes : [routes];

      handlers.forEach(route => {
        const { name, desc, category, path: routePath, run } = route;

        if (name && desc && category && routePath && typeof run === 'function') {
          const cleanPath = routePath.split('?')[0];
          app.get(cleanPath, run);

          if (!rawEndpoints[category]) rawEndpoints[category] = [];
          rawEndpoints[category].push({ name, desc, path: routePath });

          totalRoutes++;
          console.log(chalk.hex('#55efc4')(`✔ Loaded: `) + chalk.hex('#ffeaa7')(`${cleanPath} (${file})`));
        } else {
          console.warn(chalk.bgRed.white(` ⚠ Skipped invalid route in ${file}`));
        }
      });

    } catch (err) {
      console.error(chalk.bgRed.white(` ❌ Error in ${file}: ${err.message}`));
    }
  }
});

const endpoints = Object.keys(rawEndpoints)
  .sort((a, b) => a.localeCompare(b))
  .reduce((sorted, category) => {
    sorted[category] = rawEndpoints[category].sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, {});

app.get('/endpoints', (req, res) => {
  res.json(endpoints);
});

app.get('/', (req, res) => {
  try {
  res.sendFile(path.join(__dirname, 'index.html'));
  } catch (err) {
  console.log(err)
  }
});

// Start Server
app.listen(PORT, () => {
 console.log(chalk.white(`• Server is running http://localhost:${PORT}`))
});

module.exports = app;