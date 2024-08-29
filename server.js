const express = require('express');
const cors = require('cors');
const { CohereClient } = require("cohere-ai");
const shortid = require('shortid');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

app.post('/api/generate-form', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await cohere.chat({
      message: `
        Please generate a complete form based on the following description: "${prompt}" 
        in valid JSON format. Make sure the response contains the following structure:
        {
          "title": "Form Title",
          "description": "Form Description",
          "questions": [
            {
              "type": "multiple-choice", 
              "label": "Your question here", 
              "options": ["Option 1", "Option 2"]
            },
            {
              "type": "short-answer", 
              "label": "Your question here"
            }
            // ... more questions
          ]
        }
        Ensure that all keys and values are properly formatted as JSON, and no extra text is included.
        here are the question type that you may use : multiple-choice , one-choice , short answer , rating , email , phone, file upload,yes or no ;
        here some explanation about the types :
        multiple choice and one choice : have label and options 
        short answer , emeil , phone , rating, file upload , yes or no : have only label`
    });

    console.log("AI Response: ", response);

   
    let formStructure;
    try {
      formStructure = JSON.parse(response.text);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse form structure from AI response' });
    }
    if (!formStructure || !formStructure.title || !formStructure.questions) {
      return res.status(500).json({ error: 'Invalid form structure received from AI' });
    }

  
    formStructure.questions.forEach((question) => {
      if (['multiple-choice', 'one-choice'].includes(question.type) && Array.isArray(question.options)) {
        question.options = question.options.map(option => ({
          key: shortid.generate(),
          value: option
        }));
      }
    });

    res.status(200).json({ formStructure });

  } catch (error) {
    console.error('Error generating form structure:', error);
    res.status(500).json({ error: 'Error generating form structure' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
