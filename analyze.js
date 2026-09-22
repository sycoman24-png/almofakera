export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { prompt } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ error: "لم يتم إرسال نص للتحليل." });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                error: "مفتاح OpenAI غير موجود في Vercel Environment Variables."
            });
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-5.6-luna",
                input: prompt,
                max_output_tokens: 1500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data?.error?.message || "حدث خطأ أثناء الاتصال بـ OpenAI."
            });
        }

        let outputText = "";

        if (typeof data.output_text === "string") {
            outputText = data.output_text;
        }

        if (!outputText && Array.isArray(data.output)) {
            for (const item of data.output) {
                if (!Array.isArray(item.content)) continue;

                for (const content of item.content) {
                    if (typeof content.text === "string") {
                        outputText += content.text;
                    }
                }
            }
        }

        if (!outputText) {
            return res.status(500).json({
                error: "تم الاتصال بـ OpenAI ولكن لم يصل نص التحليل."
            });
        }

        return res.status(200).json({ text: outputText });
    } catch (error) {
        console.error("OpenAI API Error:", error);

        return res.status(500).json({
            error: error?.message || "حدث خطأ غير معروف."
        });
    }
}
