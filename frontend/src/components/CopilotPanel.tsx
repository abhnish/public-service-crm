import React, { useState } from 'react';
import { copilotAPI, utilityAPI } from '../services/api';
import { Ward, Department } from '../services/api';

interface CopilotResponse {
  analysis: string;
  recommendations: string[];
  citations: string[];
  source: 'llm' | 'fallback';
  llmEnabled: boolean;
  dataContext: {
    totalComplaints: number;
    analysisScope: string;
  };
}

const CopilotPanel: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [wardId, setWardId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Sample questions for quick testing
  const sampleQuestions = [
    "What are the main issues in our city right now?",
    "Which ward has the most complaints and why?",
    "How is our resolution time performance?",
    "What departments need more resources?",
    "Are there any trends in recent complaints?"
  ];

  React.useEffect(() => {
    // Load wards and departments
    const fetchData = async () => {
      try {
        const [wardsResponse, departmentsResponse] = await Promise.all([
          utilityAPI.getWards(),
          utilityAPI.getDepartments()
        ]);
        setWards(wardsResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const scope: any = {};
      if (wardId) scope.wardId = parseInt(wardId);
      if (departmentId) scope.departmentId = parseInt(departmentId);
      if (dateFrom) scope.dateFrom = dateFrom;
      if (dateTo) scope.dateTo = dateTo;

      const response = await copilotAPI.analyze({
        question: question.trim(),
        scope: Object.keys(scope).length > 0 ? scope : undefined
      });

      setResponse(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (sampleQuestion: string) => {
    setQuestion(sampleQuestion);
  };

  const clearForm = () => {
    setQuestion('');
    setWardId('');
    setDepartmentId('');
    setDateFrom('');
    setDateTo('');
    setResponse(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Governance Copilot</h2>
        <p className="text-gray-600">Ask questions about municipal data and get AI-powered insights</p>
        
        {response?.llmEnabled && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            ✅ AI Assistant is enabled (Gemini API)
          </div>
        )}
        
        {response && !response.llmEnabled && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⚠️ AI Assistant using fallback analysis (LLM disabled)
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ask about municipal data, trends, performance, etc..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
              Ward (Optional)
            </label>
            <select
              id="ward"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Wards</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department (Optional)
            </label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date From (Optional)
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date To (Optional)
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Get Insights'}
          </button>
          
          <button
            type="button"
            onClick={clearForm}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Sample Questions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Try Sample Questions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sampleQuestions.map((sampleQuestion, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuestion(sampleQuestion)}
              className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-blue-600 hover:text-blue-800"
            >
              {sampleQuestion}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800">Analyzing municipal data...</p>
          </div>
        </div>
      )}

      {/* Response Display */}
      {response && !isLoading && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Analysis</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{response.analysis}</p>
            <div className="mt-2 text-sm text-blue-600">
              Source: {response.source === 'llm' ? 'AI Analysis' : 'Rule-based Analysis'} | 
              Data Context: {response.dataContext.totalComplaints} complaints | 
              Scope: {response.dataContext.analysisScope}
            </div>
          </div>

          {response.recommendations.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1">
                {response.recommendations.map((rec, index) => (
                  <li key={index} className="text-green-800">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {response.citations.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Sources</h3>
              <div className="flex flex-wrap gap-2">
                {response.citations.map((citation, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                  >
                    {citation}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
