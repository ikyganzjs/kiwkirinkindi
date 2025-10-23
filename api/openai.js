const fetch = require("node-fetch");

const Apis = [
  "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"
];

const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

async function askGroq(prompt, question, model = "moonshotai/kimi-k2-instruct-0905") {
  try {
    const isChatModel = model.includes("instruct") || model.includes("chat") || model.includes("llama-3");

    const payload = isChatModel
      ? {
          model,
          messages: [
            { role: "system", content: prompt || "You are an AI assistant." },
            { role: "user", content: question }
          ]
        }
      : {
          model,
          input: [{ text: question }]
        };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Jika model adalah chat, ambil dari choices
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }

    // Jika model moderation / prompt guard
    if (data.results?.[0]) {
      return data.results[0];
    }

    // Jika respons ada di field lain
    if (data.output_text) {
      return data.output_text;
    }

    return "No response from model.";
  } catch (error) {
    console.error("Error from askGroq:", error);
    return "Error while fetching response.";
  }
}

module.exports = [
{
    name: "Grok V1",
    desc: "Ai grok v1 models",
    category: "Openai",
    path: "/ai/grokv1?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "compound-beta")

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
    name: "Grok V2",
    desc: "Ai grok v2 models",
    category: "Openai",
    path: "/ai/grokv2?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "groq/compound-mini")

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
    name: "Grok V3",
    desc: "Ai grok V3 models",
    category: "Openai",
    path: "/ai/grokv3?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "groq/compound")

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
    name: "Meta V1",
    desc: "Ai meta v1 models",
    category: "Openai",
    path: "/ai/metav1?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "llama-3.1-8b-instant")

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
    name: "Meta V2",
    desc: "Ai meta v2 models",
    category: "Openai",
    path: "/ai/metav2?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "llama-3.3-70b-versatile")

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
    name: "Meta V3",
    desc: "Ai meta v3 models",
    category: "Openai",
    path: "/ai/metav3?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "meta-llama/llama-4-maverick-17b-128e-instruct")

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
    name: "Meta V4",
    desc: "Ai meta v4 models",
    category: "Openai",
    path: "/ai/metav4?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "meta-llama/llama-4-scout-17b-16e-instruct")

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
    name: "Meta V5",
    desc: "AI Meta V5 moderation endpoint",
    category: "Openai",
    path: "/ai/metav5?apikey=&question=",
    async run(req, res) {
        try {
            const { apikey, question } = req.query;

            // Validasi API key
            if (!apikey || !global.apikey?.includes(apikey)) {
                return res.status(403).json({
                    creator: "IKY RESTAPI",
                    status: false,
                    error: "Apikey invalid"
                });
            }

            // Validasi parameter question
            if (!question) {
                return res.status(400).json({
                    creator: "IKY RESTAPI",
                    status: false,
                    error: "Parameter 'question' is required"
                });
            }

            // Jalankan model LLaMA Guard
            const result = await askGroq("", question, "meta-llama/llama-guard-4-12b");

            // Pastikan hasil model ada
            return res.status(200).json({
                creator: "IKY RESTAPI",
                status: true,
                result: result // ← tampilkan hasil sebenarnya dari model
            });
        } catch (err) {
            return res.status(500).json({
                creator: "IKY RESTAPI",
                status: false,
                error: err.message || "Internal Server Error"
            });
        }
    }
},

{
    name: "Meta V6",
    desc: "Ai meta v6 models",
    category: "Openai",
    path: "/ai/metav6?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "meta-llama/llama-prompt-guard-2-22m")

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
    name: "Meta V7",
    desc: "Ai meta v7 models",
    category: "Openai",
    path: "/ai/metav7?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "meta-llama/llama-prompt-guard-2-86m")

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
    name: "Moon V1",
    desc: "Ai moon v1 models",
    category: "Openai",
    path: "/ai/moonv1?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "moonshotai/kimi-k2-instruct")

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
    name: "Moon V2",
    desc: "Ai moon v2 models",
    category: "Openai",
    path: "/ai/moonv2?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "moonshotai/kimi-k2-instruct-0905")

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
    name: "Chat GPT V1",
    desc: "Ai chat gpt v1 models",
    category: "Openai",
    path: "/ai/chatgptv1?apikey=&question=",
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
    name: "Chat GPT V2",
    desc: "Ai chat gpt v2 models",
    category: "Openai",
    path: "/ai/chatgptv2?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "openai/gpt-oss-20b")

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
