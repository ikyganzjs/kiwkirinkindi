const { Client } = require("ssh2");
const stream = require("stream");

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

module.exports = {
  name: "AutoInstallPanel",
  desc: "Install panel Pterodactyl & Wings via SSH",
  category: "Install Panel",
  path: "/installpanel/autoinstallpanel?apikey=&host=&password=&domainpanel=&domainnode=&ram=",

  async run(req, res) {
    const { apikey, host, password, domainpanel, domainnode, ram } = req.query;

    // 🔒 Validasi API key
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    // ⚙️ Validasi parameter wajib
    if (!host || !password || !domainpanel || !domainnode || !ram) {
      return res.json({
        status: false,
        error:
          "Parameter wajib: host, password, domainpanel, domainnode, ram",
      });
    }

    // 🧠 Setup koneksi SSH
    const conn = new Client();
    const connSettings = {
      host,
      port: 22,
      username: "root",
      password,
    };

    const passwordPanel = "admin" + getRandom("");
    const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;

    // 🔴 Set header agar response bisa streaming log real-time
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    });
    res.write("🚀 Memulai proses instalasi Panel & Wings...\n\n");

    // Fungsi kirim log ke client
    const log = (text) => {
      console.log(text);
      res.write(text + "\n");
    };

    conn
      .on("ready", async () => {
        log(`✅ SSH Connected ke ${host}`);
        log(`⚙️ Menjalankan instalasi panel...`);

        // Jalankan instalasi panel
        conn.exec(commandPanel, (err, stream) => {
          if (err) {
            log("❌ Gagal menjalankan perintah install panel: " + err.message);
            return res.end();
          }

          stream
            .on("data", (data) => {
              const output = data.toString();
              log(output);

              // Otomatisisi input CLI berdasarkan output
              if (output.includes("Input 0-6")) stream.write("0\n");
              if (output.includes("(y/N)")) stream.write("y\n");
              if (output.includes("Database username")) stream.write("admin\n");
              if (output.includes("Password for the initial admin account"))
                stream.write(passwordPanel + "\n");
              if (output.includes("Select timezone"))
                stream.write("Asia/Jakarta\n");
              if (output.includes("Set the FQDN"))
                stream.write(domainpanel + "\n");
              if (output.includes("Email address for the initial admin account"))
                stream.write("admin@gmail.com\n");
              if (output.includes("Please read the Terms of Service"))
                stream.write("y\n");
              if (output.includes("(A)gree/(C)ancel:")) stream.write("A\n");
            })
            .on("close", async () => {
              log(`✅ Instalasi panel selesai!`);
              log(`⚙️ Memulai instalasi Wings...`);

              // Instalasi Wings setelah panel selesai
              conn.exec(
                `bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)`,
                (err2, stream2) => {
                  if (err2) {
                    log("❌ Gagal install Wings: " + err2.message);
                    return res.end();
                  }

                  stream2
                    .on("data", (data) => {
                      const out = data.toString();
                      log(out);
                      if (out.includes("Masukkan nama lokasi:"))
                        stream2.write("Singapore\n");
                      if (out.includes("Masukkan domain:"))
                        stream2.write(domainnode + "\n");
                      if (out.includes("Masukkan RAM"))
                        stream2.write(ram + "\n");
                      if (out.includes("Masukkan Locid:"))
                        stream2.write("1\n");
                    })
                    .on("close", async () => {
                      log("🎉 Instalasi Wings selesai!");
                      log("\n==============================");
                      log("✅ *DETAIL PANEL KAMU:*");
                      log(`• Username: admin`);
                      log(`• Password: ${passwordPanel}`);
                      log(`• Domain Panel: ${domainpanel}`);
                      log(`• Domain Node: ${domainnode}`);
                      log(`• RAM: ${ram} MB`);
                      log("==============================\n");
                      res.end("✅ Proses instalasi selesai sepenuhnya.\n");
                      conn.end();
                    });
                }
              );
            })
            .stderr.on("data", (data) => {
              log("[STDERR] " + data.toString());
            });
        });
      })
      .on("error", (err) => {
        log("❌ Gagal konek SSH: " + err.message);
        res.end();
      })
      .connect(connSettings);
  },
};