// Real Code Execution Service
const axios = require('axios');

class CodeExecutor {
  constructor() {
    // Choose one of these services:
    this.service = 'judge0'; // or 'hackerearth', 'leetcode', etc.
  }

  // Option 1: Judge0 CE (Free, 100 requests/hour)
  async executeWithJudge0(code, language, testCases) {
    const JUDGE0_URL = 'https://api.judge0.ce/submissions';
    const languageMap = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54
    };

    const results = [];
    
    for (const testCase of testCases) {
      try {
        // Submit code to Judge0
        const response = await axios.post(`${JUDGE0_URL}?base64_encoded=true&wait=true`, {
          source_code: Buffer.from(code).toString('base64'),
          language_id: languageMap[language] || 63,
          stdin: Buffer.from(testCase.input).toString('base64'),
          expected_output: Buffer.from(testCase.expectedOutput).toString('base64'),
          cpu_time_limit: 2, // 2 seconds
          memory_limit: 128000, // 128MB
          max_output_size: 10240 // 10KB
        });

        const result = response.data;
        
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: Buffer.from(result.stdout || '', 'base64').toString(),
          passed: result.status.id === 3, // 3 = Accepted
          executionTime: result.time || 0,
          memoryUsage: result.memory || 0,
          error: result.status.description !== 'Accepted' ? result.status.description : null,
          compileError: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : null
        });
      } catch (error) {
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  // Option 2: Docker Container (Self-hosted, Full Control)
  async executeWithDocker(code, language, testCases) {
    const Docker = require('dockerode');
    const docker = new Docker();

    const languageConfigs = {
      javascript: {
        image: 'node:16-alpine',
        command: `node -e "${code.replace(/"/g, '\\"')}"`,
        timeout: 5000
      },
      python: {
        image: 'python:3.9-alpine',
        command: `python3 -c "${code.replace(/"/g, '\\"')}"`,
        timeout: 5000
      }
    };

    const config = languageConfigs[language] || languageConfigs.javascript;
    const results = [];

    for (const testCase of testCases) {
      try {
        const container = await docker.createContainer({
          Image: config.image,
          Cmd: ['sh', '-c', `echo "${testCase.input}" | ${config.command}`],
          WorkingDir: '/app',
          HostConfig: {
            Memory: 128 * 1024 * 1024, // 128MB limit
            CpuQuota: 50000, // CPU limit
            NetworkMode: 'none', // No network access
            ReadonlyRootfs: true, // Read-only filesystem
            Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=100m' }
          }
        });

        const startTime = Date.now();
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        
        let output = '';
        stream.on('data', (chunk) => {
          output += chunk.toString();
        });

        await container.start();
        
        // Wait for execution or timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            container.kill().then(resolve).catch(reject);
          }, config.timeout);

          container.wait().then(() => {
            clearTimeout(timeout);
            resolve();
          });
        });

        const executionTime = Date.now() - startTime;
        const containerInfo = await container.inspect();
        
        await container.remove();

        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: output.trim(),
          passed: output.trim() === testCase.expectedOutput.trim(),
          executionTime,
          memoryUsage: containerInfo.HostConfig.Memory / 1024 / 1024, // MB
          error: null
        });
      } catch (error) {
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsage: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  // Option 3: AI Code Evaluation (Advanced)
  async evaluateWithAI(code, problemDescription, testCases) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

    const results = [];
    
    for (const testCase of testCases) {
      try {
        const prompt = `
        Evaluate this code for the given problem:
        
        Problem: ${problemDescription}
        Input: ${testCase.input}
        Expected Output: ${testCase.expectedOutput}
        
        Code:
        ${code}
        
        Analyze:
        1. Does the code produce the correct output?
        2. What is the time complexity?
        3. What is the space complexity?
        4. Are there any bugs or edge cases missed?
        
        Respond with JSON:
        {
          "correct": true/false,
          "output": "actual output",
          "timeComplexity": "O(n)",
          "spaceComplexity": "O(1)",
          "explanation": "brief explanation",
          "score": 85
        }
        `;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1
        });

        const evaluation = JSON.parse(response.choices[0].message.content);

        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: evaluation.output,
          passed: evaluation.correct,
          executionTime: 0, // AI can't measure this
          memoryUsage: 0,   // AI can't measure this
          aiEvaluation: {
            timeComplexity: evaluation.timeComplexity,
            spaceComplexity: evaluation.spaceComplexity,
            explanation: evaluation.explanation,
            score: evaluation.score
          }
        });
      } catch (error) {
        results.push({
          testCaseIndex: testCase.index || 0,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
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

module.exports = CodeExecutor;
