// Free AI Code Evaluation Service
const { GoogleGenerativeAI } = require('@google/generative-ai');

class FreeAIExecutor {
  constructor() {
    // Initialize Gemini (Free tier: 60 requests/minute)
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async evaluateWithGemini(code, problemDescription, testCases) {
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const prompt = `
        You are a code evaluation expert. Analyze this solution:

        PROBLEM: ${problemDescription}
        
        INPUT: ${testCase.input}
        EXPECTED OUTPUT: ${testCase.expectedOutput}
        
        USER CODE:
        \`\`\`javascript
        ${code}
        \`\`\`
        
        Please evaluate:
        1. Does this code solve the problem correctly?
        2. What would be the output for the given input?
        3. What is the time complexity?
        4. What is the space complexity?
        5. Are there any bugs or edge cases missed?
        6. How would you rate this solution (0-100)?
        
        Respond in JSON format:
        {
          "correct": true/false,
          "output": "actual output",
          "timeComplexity": "O(n)",
          "spaceComplexity": "O(1)",
          "explanation": "brief explanation",
          "score": 85,
          "suggestions": ["suggestion1", "suggestion2"]
        }
        `;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          correct: false,
          output: "AI evaluation failed",
          timeComplexity: "Unknown",
          spaceComplexity: "Unknown",
          explanation: "Could not parse AI response",
          score: 0,
          suggestions: []
        };

        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: evaluation.output,
          passed: evaluation.correct,
          executionTime: 0, // AI can't measure real time
          memoryUsage: 0,   // AI can't measure real memory
          aiEvaluation: {
            timeComplexity: evaluation.timeComplexity,
            spaceComplexity: evaluation.spaceComplexity,
            explanation: evaluation.explanation,
            score: evaluation.score,
            suggestions: evaluation.suggestions
          }
        });
      } catch (error) {
        console.error('Gemini API Error:', error);
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'AI evaluation failed',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  // Alternative: Hugging Face (Free but slower)
  async evaluateWithHuggingFace(code, problemDescription, testCases) {
    const axios = require('axios');
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const prompt = `
        Evaluate this JavaScript code for the problem: ${problemDescription}
        Input: ${testCase.input}
        Expected: ${testCase.expectedOutput}
        
        Code:
        ${code}
        
        Does this code work correctly? What's the output? Rate 0-100.
        `;

        const response = await axios.post(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
          {
            inputs: prompt,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.1
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const aiResponse = response.data[0]?.generated_text || '';
        
        // Simple parsing (you'd want better parsing in production)
        const score = aiResponse.match(/\b(\d{1,3})\b.*?\/.*?100/) ? 
          parseInt(aiResponse.match(/\b(\d{1,3})\b.*?\/.*?100/)[1]) : 50;
        
        const passed = aiResponse.toLowerCase().includes('correct') || 
                      aiResponse.toLowerCase().includes('works');

        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: aiResponse.includes('Output:') ? 
            aiResponse.split('Output:')[1].trim().split('\n')[0] : 'Unknown',
          passed,
          executionTime: 0,
          memoryUsage: 0,
          aiEvaluation: {
            explanation: aiResponse.substring(0, 200) + '...',
            score,
            model: 'HuggingFace/Mistral-7B'
          }
        });
      } catch (error) {
        console.error('HuggingFace API Error:', error);
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'AI evaluation failed',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  // Alternative: Groq (Free, Fast)
  async evaluateWithGroq(code, problemDescription, testCases) {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a code evaluation expert. Always respond with valid JSON."
            },
            {
              role: "user",
              content: `
              Evaluate this JavaScript solution:
              
              Problem: ${problemDescription}
              Input: ${testCase.input}
              Expected: ${testCase.expectedOutput}
              
              Code:
              ${code}
              
              Return JSON:
              {
                "correct": true/false,
                "output": "actual output",
                "score": 85,
                "explanation": "brief explanation",
                "timeComplexity": "O(n)",
                "spaceComplexity": "O(1)"
              }
              `
            }
          ],
          model: "mixtral-8x7b-32768",
          temperature: 0.1,
          max_tokens: 200
        });

        const evaluation = JSON.parse(completion.choices[0].message.content);

        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: evaluation.output,
          passed: evaluation.correct,
          executionTime: 0,
          memoryUsage: 0,
          aiEvaluation: {
            timeComplexity: evaluation.timeComplexity,
            spaceComplexity: evaluation.spaceComplexity,
            explanation: evaluation.explanation,
            score: evaluation.score,
            model: 'Groq/Mixtral-8x7b'
          }
        });
      } catch (error) {
        console.error('Groq API Error:', error);
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'AI evaluation failed',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = FreeAIExecutor;
