const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/analyze', async (req, res) => {
  const { imageBase64 } = req.body;
  const API_KEY = process.env.OCR_KEY;

  if (!imageBase64) return res.status(400).json({ error: "No image provided" });

  try {
    const params = new URLSearchParams();
    params.append('apikey', API_KEY);
    params.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
    // Engine 2 is usually better for reading handwriting + printed text together
    params.append('OCREngine', '2'); 

    const response = await axios.post('https://api.ocr.space/parse/image', params);
    const rawText = response.data.ParsedResults?.[0]?.ParsedText || "";

    console.log("AI Saw:", rawText); // This helps you debug in Render Logs

    // --- ENHANCED PARSING ---
    
    // 1. Look for Level: Searches for "Level" or "Lv" followed by a Letter A-M
    const levelRegex = /(?:level|lv|lvl)\s*([a-m])/i;
    const levelMatch = rawText.match(levelRegex) || rawText.match(/\b([A-M])\b/i);

    // 2. Look for Book: Searches for "Book" or "No" followed by 1-2 digits
    const bookRegex = /(?:book|no|bk)\s*(\d{1,2})/i;
    const bookMatch = rawText.match(bookRegex) || rawText.match(/\b(\d{1,2})\b/);

    res.json({
      rawText: rawText,
      extracted: {
        level: levelMatch ? levelMatch[1].toUpperCase() : "",
        book: bookMatch ? bookMatch[1] : ""
      }
    });

  } catch (error) {
    res.status(500).json({ error: "OCR Failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brain listening on ${PORT}`));