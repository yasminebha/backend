const express = require('express');
const cors = require('cors');
const { CohereClient } = require("cohere-ai");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const cohere = new CohereClient({
  token: "IfwBAyVH2gqQ5zqWCWOMXSVWEIVXCXnnFWLH0Zck",
});

app.post('/api/generate-form', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await cohere.chat({
      // message: `Create a form structured in JSON format based on the following description: ${prompt}`,
      message: `Please generate a complete form in the following JSON format :
    {
  "title": "Customer Satisfaction Survey",
  "description": "We appreciate your feedback!",
  "questions": [
    {
      "type": "multiple-choice",
      "label": "How satisfied are you with our service?",
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      "type": "short-answer",
      "label": "What could we do to improve?"
    }
  ]
} 
  based on the following description: english test for beginners`
    });
    console.log(response);
    
    const chatbotMessage = response.chatHistory.find(msg => msg.role === 'CHATBOT').message;

    // Extract the JSON structure from the chatbot's message
    const jsonMatch = chatbotMessage.match(/```json\n([\s\S]+)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const formStructure = JSON.parse(jsonMatch[1]);
      res.status(200).json({ formStructure });
    } else {
      res.status(500).json({ error: 'Failed to parse form structure' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error generating form structure' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
