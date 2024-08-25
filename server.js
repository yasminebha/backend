const express = require('express');
const cors = require('cors');
const { CohereClient } = require("cohere-ai");
const shortid = require('shortid');
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
      message: `Please generate a complete form in the following JSON format:
       here are the question type that you may use : multiple-choice , one-choice , short answer , rating , email , phone, file upload,yes or no ;
      here some explanation about the types :
      multiple choice and one choice : have label and options 
      short answer , emeil , phone , rating, file upload , yes or no : have only label
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
      based on the following description: ${prompt}`
    });
    
    const chatbotMessage = response.chatHistory.find(msg => msg.role === 'CHATBOT').message;

    // Extract the JSON structure from the chatbot's message
    const jsonMatch = chatbotMessage.match(/```json\n([\s\S]+)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const formStructure = JSON.parse(jsonMatch[1]);
      
      // Transform the options array to include a key-value pair
      formStructure.questions.forEach((question) => {
        if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
          question.options = question.options.map(option => ({
            key: shortid.generate(), // Generate a unique key
            value: option // Set the value to the original option text
          }));
        }
      });

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
