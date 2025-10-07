const { Client } = require("ssh2");
const stream = require("stream");

module.exports = {
  name: "Uninstall Server Panel",
  desc: "Menghapus server panel Pterodactyl di VPS via SSH",
  category: "Install Panel",
  path: "/installpanel/uninstallpanel?apikey=&ip=&password=",

  async run(req, res) {
    const { apikey, ip, password } = req.query;

    // ✅ Cek API Key
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }

    // ⚠️ Cek parameter
    if (!ip || !password) {
  	  return res.status(400).json({ status: false, error: "Parameter ip & password wajib diisi" });
    }

    // ⚙️ Pengaturan koneksi SSH
    const connSettings = {
      host: ip,
      port: 22,
      username: "root",
      password: password,
    };

    const boostmysql = `\n`;
    const command = `bash <(curl -s https://pterodactyl-installer.se)`;
    const conn = new Client();

    // 💬 Set header streaming agar log tampil langsung di browser
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const send = (msg) => {
      console.log(msg);
      res.write(msg + "\n");
    };

    // ✨ Animasinya (biar kayak progress di startwings)
    const animasi = [
      "🔧 Menghapus konfigurasi Pterodactyl...",
      "🧹 Membersihkan database & file panel...",
      "⚙️ Menonaktifkan service yang berjalan...",
      "🔄 Proses pembersahan sistem...",
      "✅ Hampir selesai, mohon tunggu sebentar..."
    ];
    let step = 0;
    const animLoop = setInterval(() => {
      if (step < animasi.length) {
        send(animasi[step]);
        step++;
      } else {
        clearInterval(animLoop);
      }
    }, 5000);

    // 🚀 Saat koneksi SSH siap
    conn.on("ready", () => {
      send(`🚀 [SSH] Terhubung ke ${ip} — mulai proses *uninstall server panel*...\n`);

      conn.exec(command, (err, stream) => {
        if (err) {
          clearInterval(animLoop);
          send("❌ Gagal menjalankan perintah uninstall!");
          res.end();
          return;
        }

        // 🔄 Saat output dari SSH muncul
        stream.on("data", async (data) => {
          const log = data.toString();
          console.log("[SSH] " + log);

          // ✅ Cek teks untuk input otomatis
          if (log.includes("Input 0-6")) {
            stream.write("6\n");
          }
          if (log.includes("(y/N)")) {
            stream.write("y\n");
          }
          if (log.includes("* Choose the panel user")) {
            stream.write("\n");
          }
          if (log.includes("* Choose the panel database")) {
            stream.write("\n");
          }

          // 🔥 Jika pembersihan MySQL muncul
          if (log.includes("Remove all MariaDB databases?")) {
            stream.write("\x09\n"); // input tab / enter
          }
        });

        // ✅ Saat proses selesai
        stream.on("close", async (code, signal) => {
          clearInterval(animLoop);
          send("\n✅ *Berhasil uninstall server panel Pterodactyl!*");
          conn.end();
          res.end("\nSelesai ✅\n");
        });

        // ⚠️ Jika ada pesan error dari SSH
        stream.stderr.on("data", (data) => {
          send("[⚠️ STDERR] " + data.toString());
        });
      });
    });

    // ❌ Saat koneksi error
    conn.on("error", (err) => {
      clearInterval(animLoop);
      console.error("SSH Error:", err);
      send("❌ Gagal terhubung ke VPS! Periksa IP & password.");
      res.end();
    });

    // 🔌 Jalankan koneksi SSH
    conn.connect(connSettings);
  },
};
