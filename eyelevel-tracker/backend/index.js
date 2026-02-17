const express = require('express');
const axios = require('axios');
const app = express();

// Increase limit because images are large strings
app.use(express.json({ limit: '10mb' }));

app.post('/analyze', async (req, res) => {
  const { imageBase64 } = req.body;
  const API_KEY = process.env.OCR_KEY; // Managed in Render/Settings

  if (!imageBase64) {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    // Preparing the request for OCR.Space
    const params = new URLSearchParams();
    params.append('apikey', API_KEY);
    params.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
    params.append('OCREngine', '2'); // Engine 2 is great for printed text + marks
    params.append('isTable', 'true'); // Helps organize the result

    const response = await axios.post('https://api.ocr.space/parse/image', params);

    const result = response.data;
    
    if (result.IsErroredOnProcessing) {
      return res.status(500).json({ error: result.ErrorMessage });
    }

    // Extracting the text found by the AI
    const parsedText = result.ParsedResults[0].ParsedText;
    
    res.json({ rawText: parsedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brain active on port ${PORT}`));