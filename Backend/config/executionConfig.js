// Code Execution Configuration
// This config manages which execution services are used and their priorities

// Force load environment variables at module import time
require('dotenv').config();

const EXECUTION_CONFIG = {
  // Primary execution service (real code execution)
  primary: {
    service: 'judge0', // 'judge0', 'docker', 'mock'
    enabled: true,
    priority: 1
  },

  // AI analysis service (for code insights)
  aiAnalysis: {
    service: 'groq', // 'gemini', 'openai', 'groq', 'huggingface'
    enabled: true,
    priority: 2,
    fallback: true // Use as fallback if primary fails
  },

  // Service configurations
  services: {
    judge0: {
      name: 'Judge0 CE',
      description: 'Free real code execution service',
      rateLimit: '100 requests/hour',
      cost: 'Free',
      languages: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'],
      features: ['real_execution', 'performance_metrics', 'memory_usage'],
      requiredEnv: [], // No API key required
      endpoint: 'https://api.judge0.ce'
    },

    docker: {
      name: 'Docker Container',
      description: 'Self-hosted code execution',
      rateLimit: 'Unlimited',
      cost: 'Infrastructure',
      languages: ['javascript', 'python', 'java', 'cpp', 'c'],
      features: ['real_execution', 'performance_metrics', 'memory_usage', 'full_control'],
      requiredEnv: ['DOCKER_HOST'],
      endpoint: 'local'
    },

    gemini: {
      name: 'Google Gemini',
      description: 'Free AI code analysis',
      rateLimit: '60 requests/minute',
      cost: 'Free',
      languages: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'],
      features: ['code_analysis', 'complexity_analysis', 'bug_detection', 'suggestions'],
      requiredEnv: ['GEMINI_API_KEY'],
      endpoint: 'https://generativelanguage.googleapis.com'
    },

    openai: {
      name: 'OpenAI GPT-4',
      description: 'Premium AI code analysis',
      rateLimit: '3500 requests/hour',
      cost: '$0.03 per 1K tokens',
      languages: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'],
      features: ['code_analysis', 'complexity_analysis', 'bug_detection', 'suggestions'],
      requiredEnv: ['OPENAI_API_KEY'],
      endpoint: 'https://api.openai.com'
    },

    groq: {
      name: 'Groq',
      description: 'Fast AI code analysis',
      rateLimit: '30 requests/minute',
      cost: 'Free',
      languages: ['javascript', 'python', 'java', 'cpp', 'c'],
      features: ['code_analysis', 'complexity_analysis', 'bug_detection'],
      requiredEnv: ['GROQ_API_KEY'],
      endpoint: 'https://api.groq.com'
    },

    huggingface: {
      name: 'Hugging Face',
      description: 'Free AI models',
      rateLimit: 'Variable',
      cost: 'Free',
      languages: ['javascript', 'python', 'java'],
      features: ['code_analysis', 'multiple_models'],
      requiredEnv: ['HUGGINGFACE_API_KEY'],
      endpoint: 'https://api-inference.huggingface.co'
    },

    mock: {
      name: 'Mock Execution',
      description: 'Simulated execution for development',
      rateLimit: 'Unlimited',
      cost: 'Free',
      languages: ['javascript', 'python', 'java', 'cpp', 'c'],
      features: ['simulated_results', 'random_pass_fail'],
      requiredEnv: [],
      endpoint: 'local'
    }
  },

  // Execution strategy
  strategy: {
    mode: 'ai_only', // 'primary_only', 'ai_only', 'hybrid'
    fallback: true, // Use fallback services if primary fails
    retryAttempts: 2,
    timeoutMs: 30000 // 30 seconds
  },

  // Response format
  responseFormat: {
    includeExecutionMetrics: true,
    includeAIAnalysis: true,
    includeSuggestions: true,
    includeComplexityAnalysis: true
  }
};

// Get active service configuration
function getActiveService() {
  const primaryService = EXECUTION_CONFIG.services[EXECUTION_CONFIG.primary.service];
  const aiAnalysisService = EXECUTION_CONFIG.services[EXECUTION_CONFIG.aiAnalysis.service];
  
  return {
    primary: primaryService,
    aiAnalysis: aiAnalysisService,
    strategy: EXECUTION_CONFIG.strategy,
    responseFormat: EXECUTION_CONFIG.responseFormat
  };
}

// Check if service is properly configured
function isServiceConfigured(serviceName) {
  const service = EXECUTION_CONFIG.services[serviceName];
  if (!service) return false;
  
  // Check if required environment variables are set
  return service.requiredEnv.every(envVar => process.env[envVar]);
}

// Get available services
function getAvailableServices() {
  return Object.keys(EXECUTION_CONFIG.services).filter(serviceName => 
    isServiceConfigured(serviceName)
  );
}

module.exports = {
  EXECUTION_CONFIG,
  getActiveService,
  isServiceConfigured,
  getAvailableServices
};
