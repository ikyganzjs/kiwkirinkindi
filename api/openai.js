const fetch = require("node-fetch");

// ======== CONFIG ======== //
const GROQ_API_KEYS = [
  "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"
];
const GROQ_API_KEY = GROQ_API_KEYS[Math.floor(Math.random() * GROQ_API_KEYS.length)];

// ======== MODEL LIST ======== //
const GROQ_MODELS = [
  "groq/compound",
  "groq/compound-mini",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-guard-4-12b",
  "meta-llama/llama-prompt-guard-2-22m",
  "meta-llama/llama-prompt-guard-2-86m",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b"
];

// ======== MAIN FUNCTION ======== //
async function askGroq(prompt, question, model = "groq/compound") {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: prompt || "You are a helpful assistant." },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq API Error");

    return data.choices?.[0]?.message?.content?.trim() || "No response from model.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Error while fetching response from Groq API.";
  }
}

// ======== ROUTES ======== //
module.exports = [
  // 1️⃣ Grok Chat — model bisa dipilih
  {
    name: "Grok AI Chat",
    desc: "AI Groq with multiple model support",
    category: "OpenAI",
    path: "/ai/grok?apikey=&question=&model=&prompt=",
    async run(req, res) {
      const { apikey, question, model, prompt } = req.query;

      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!question)
        return res.json({ status: false, error: "Parameter 'question' is required" });

      const selectedModel = GROQ_MODELS.includes(model) ? model : "groq/compound";

      try {
        const result = await askGroq(prompt, question, selectedModel);
        res.status(200).json({ status: true, model: selectedModel, result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message || "Internal server error" });
      }
    }
  },

{
    name: "Chat GPT",
    desc: "Ai chat gpt models",
    category: "Openai",
    path: "/ai/chatgpt?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
}, 

{
    name: "Gemini",
    desc: "Ai gemini models",
    category: "Openai",
    path: "/ai/gemini?apikey=&question=",
    async run(req, res) {
        const { apikey, question } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("Sekarang Kamu Adalah AI Model Gemini", question, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
}, 

{
  name: "GPT Prompt",
  desc: "Ai gpt prompt models",
  category: "Openai",
  path: "/ai/gpt?apikey=&prompt=&text=",

  async run(req, res) {
    const { text, prompt, apikey } = req.query;

    if (!text)
      return res.json({ status: false, error: "Text is required" });

    if (!apikey || !global.apikey?.includes(apikey))
      return res.json({ status: false, error: "Invalid API key" });
      
    try {
      const result = await askGroq(prompt, text, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
}

]
