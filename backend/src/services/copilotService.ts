import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache for responses (simple in-memory LRU)
const responseCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for admin requests
const requestTimes = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10;

interface AnalyticsSnapshot {
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  topWards: { id: number; name: string; count: number }[];
  topDepartments: { id: number; name: string; count: number }[];
  recentComplaints: Array<{
    id: number;
    description: string;
    status: string;
    wardId: number;
    departmentId: number;
    createdAt: string;
  }>;
  escalationTrend: number;
}

interface CopilotResponse {
  analysis: string;
  recommendations: string[];
  citations: string[];
  source: 'llm' | 'fallback';
}

// Simple deterministic fallback analysis
function generateFallbackAnalysis(question: string, context: AnalyticsSnapshot): CopilotResponse {
  const lowerQuestion = question.toLowerCase();
  const analysis: string[] = [];
  const recommendations: string[] = [];
  const citations: string[] = [];

  // Ward-related questions
  if (lowerQuestion.includes('ward') || lowerQuestion.includes('area')) {
    const topWard = context.topWards[0];
    if (topWard) {
      analysis.push(`Ward ${topWard.name} has the highest complaint volume with ${topWard.count} complaints.`);
      recommendations.push(`Investigate resource allocation in Ward ${topWard.name}`);
      recommendations.push(`Consider community outreach in high-complaint areas`);
      citations.push(`ward-${topWard.id}`);
    }
  }

  // Department-related questions
  if (lowerQuestion.includes('department') || lowerQuestion.includes('service')) {
    const topDept = context.topDepartments[0];
    if (topDept) {
      analysis.push(`${topDept.name} department handles the most complaints (${topDept.count}).`);
      recommendations.push(`Review staffing levels in ${topDept.name} department`);
      recommendations.push(`Analyze process efficiency in high-volume departments`);
      citations.push(`department-${topDept.id}`);
    }
  }

  // Performance-related questions
  if (lowerQuestion.includes('performance') || lowerQuestion.includes('resolution') || lowerQuestion.includes('time')) {
    analysis.push(`Average resolution time is ${context.avgResolutionTime.toFixed(1)} hours.`);
    if (context.avgResolutionTime > 24) {
      recommendations.push(`Implement SLA monitoring for overdue complaints`);
      recommendations.push(`Consider automated escalation for delayed cases`);
    } else {
      recommendations.push(`Maintain current resolution time standards`);
    }
    citations.push('performance-metrics');
  }

  // Trend-related questions
  if (lowerQuestion.includes('trend') || lowerQuestion.includes('increase') || lowerQuestion.includes('decrease')) {
    if (context.escalationTrend > 0) {
      analysis.push(`There is an upward trend in complaints with ${context.escalationTrend}% increase in recent period.`);
      recommendations.push(`Monitor complaint patterns closely`);
      recommendations.push(`Prepare contingency plans for continued volume increase`);
    } else {
      analysis.push(`Complaint volume is stable or decreasing.`);
      recommendations.push(`Continue effective current practices`);
    }
    citations.push('trend-analysis');
  }

  // General questions
  if (analysis.length === 0) {
    analysis.push(`Total of ${context.totalComplaints} complaints with ${context.resolvedComplaints} resolved (${((context.resolvedComplaints/context.totalComplaints)*100).toFixed(1)}% resolution rate).`);
    recommendations.push(`Focus on reducing average resolution time`);
    recommendations.push(`Implement proactive monitoring for high-volume areas`);
    recommendations.push(`Enhance citizen communication for complaint status`);
    citations.push('general-overview');
  }

  return {
    analysis: analysis.join(' '),
    recommendations,
    citations,
    source: 'fallback'
  };
}

// Rate limiting check
function checkRateLimit(adminId: string): boolean {
  const now = Date.now();
  const requests = requestTimes.get(adminId) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  validRequests.push(now);
  requestTimes.set(adminId, validRequests);
  return true;
}

// Cache key generation
function generateCacheKey(question: string, scope?: any): string {
  return `${question}:${JSON.stringify(scope || {})}`;
}

// Get cached response
function getCachedResponse(key: string): CopilotResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  if (cached) {
    responseCache.delete(key);
  }
  return null;
}

// Set cached response
function setCachedResponse(key: string, response: CopilotResponse): void {
  responseCache.set(key, { response, timestamp: Date.now() });
  
  // Clean old cache entries periodically
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of responseCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        responseCache.delete(k);
      }
    }
  }
}

// LLM-based analysis using Gemini
async function generateLLMAnalysis(question: string, context: AnalyticsSnapshot): Promise<CopilotResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Construct prompt with context
  const contextSummary = `
Municipal Data Summary:
- Total Complaints: ${context.totalComplaints}
- Resolved Complaints: ${context.resolvedComplaints} (${((context.resolvedComplaints/context.totalComplaints)*100).toFixed(1)}%)
- Average Resolution Time: ${context.avgResolutionTime.toFixed(1)} hours
- Top Wards: ${context.topWards.map(w => `${w.name} (${w.count})`).join(', ')}
- Top Departments: ${context.topDepartments.map(d => `${d.name} (${d.count})`).join(', ')}
- Recent Trend: ${context.escalationTrend > 0 ? 'Increasing' : 'Stable'} (${context.escalationTrend}%)
- Sample Recent Issues: ${context.recentComplaints.slice(0, 3).map(c => c.description.substring(0, 50) + '...').join(', ')}
  `;

  const prompt = `
You are an AI assistant for municipal administrators. Analyze the following question about city services and provide actionable insights.

CONTEXT:
${contextSummary}

QUESTION: ${question}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "analysis": "Detailed analysis of the situation based on the data",
  "recommendations": ["Specific, actionable recommendation 1", "Specific, actionable recommendation 2", "Specific, actionable recommendation 3"],
  "citations": ["data-source-1", "data-source-2"]
}

Focus on:
1. Data-driven insights
2. Practical recommendations for city administrators
3. Specific metrics and trends
4. Actionable next steps

Keep responses concise but comprehensive. Limit to 2-3 most relevant recommendations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        analysis: parsed.analysis || 'Analysis generated based on municipal data.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        source: 'llm'
      };
    }
    
    // Fallback if JSON parsing fails
    return {
      analysis: text.substring(0, 500),
      recommendations: ['Review detailed analysis for specific actions'],
      citations: ['llm-analysis'],
      source: 'llm'
    };
  } catch (error) {
    console.error('LLM analysis error:', error);
    throw error;
  }
}

// Main analysis function
export async function analyzeMunicipalData(
  question: string, 
  context: AnalyticsSnapshot,
  adminId?: string
): Promise<CopilotResponse> {
  // Rate limiting
  if (adminId && !checkRateLimit(adminId)) {
    throw new Error('Rate limit exceeded. Please wait before making another request.');
  }

  // Check cache
  const cacheKey = generateCacheKey(question);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  let response: CopilotResponse;

  try {
    // Try LLM analysis first
    if (process.env.GEMINI_API_KEY) {
      response = await generateLLMAnalysis(question, context);
    } else {
      throw new Error('LLM not available');
    }
  } catch (error) {
    console.warn('LLM analysis failed, using fallback:', error);
    // Fallback to rule-based analysis
    response = generateFallbackAnalysis(question, context);
  }

  // Cache the response
  setCachedResponse(cacheKey, response);

  // Log for debugging (without PII)
  console.log('Copilot analysis:', {
    questionLength: question.length,
    source: response.source,
    recommendationCount: response.recommendations.length
  });

  return response;
}
