const axios = require("axios");
const FormData = require("form-data");

/**
 * Scrape converter dari CloudConvert (tanpa API key)
 * @param {string} fileUrl - URL file yang akan dikonversi
 * @param {string} outputFormat - format output, contoh: "png", "pdf", "mp3"
 */
async function scrapeConvert(fileUrl, outputFormat) {
  try {
    // Step 1: Upload file ke CloudConvert (via import/url task publik)
    const importRes = await axios.post("https://cloudconvert.com/api/v1/import/url", {
      url: fileUrl,
    });

    const importTask = importRes.data;
    if (!importTask || !importTask.data?.id)
      throw new Error("Gagal import file ke CloudConvert");

    const inputId = importTask.data.id;

    // Step 2: Request konversi
    const convertRes = await axios.post("https://cloudconvert.com/api/v1/convert", {
      input: inputId,
      output_format: outputFormat,
    });

    const convertTask = convertRes.data;
    if (!convertTask || !convertTask.data?.id)
      throw new Error("Gagal membuat task konversi");

    // Step 3: Polling status sampai selesai
    const jobId = convertTask.data.id;
    let resultFile = null;

    for (let i = 0; i < 30; i++) {
      const check = await axios.get(`https://cloudconvert.com/api/v1/jobs/${jobId}`);
      const job = check.data;

      if (job.data.status === "finished") {
        resultFile = job.data.tasks.find((t) => t.operation === "export/url");
        break;
      }
      if (job.data.status === "error") throw new Error("Konversi gagal");
      await new Promise((r) => setTimeout(r, 3000)); // tunggu 3 detik
    }

    if (!resultFile) throw new Error("File hasil tidak ditemukan");

    const file = resultFile.result.files[0];
    return {
      status: true,
      filename: file.filename,
      size: file.size,
      download_url: file.url,
    };
  } catch (e) {
    return {
      status: false,
      error: e.message,
    };
  }
}

module.exports = {
  name: "CloudConvert Free Scraper",
  desc: "Convert file types tanpa API key",
  category: "Tools",
  path: "/api/tools/free?url=&output_format=",
  async run(req, res) {
    const { url, output_format } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter url wajib diisi!" });
    if (!output_format) return res.status(400).json({ status: false, message: "Parameter output_format wajib diisi!" });

    const result = await scrapeConvert(url, output_format);
    res.json({
      creator: "IKY RESTAPI",
      ...result,
    });
  },
};
