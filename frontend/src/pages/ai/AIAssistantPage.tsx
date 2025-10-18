import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bot,
  Send,
  Lightbulb,
  Recycle,
  Leaf,
  AlertTriangle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickPrompts = [
  {
    icon: Recycle,
    title: 'Recycling Tips',
    prompt: 'Give me tips on how to properly recycle different types of materials.',
    color: 'bg-green-100 text-green-800'
  },
  {
    icon: Leaf,
    title: 'Composting Guide',
    prompt: 'How can I start composting at home? What materials are suitable for composting?',
    color: 'bg-emerald-100 text-emerald-800'
  },
  {
    icon: AlertTriangle,
    title: 'Reduce Contamination',
    prompt: 'What are common mistakes that lead to waste contamination and how can I avoid them?',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    icon: Lightbulb,
    title: 'Waste Reduction',
    prompt: 'What are some effective ways to reduce household waste generation?',
    color: 'bg-blue-100 text-blue-800'
  }
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiService.getAIAdvice({ prompt });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get AI advice. Please try again.');

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-brand-100 mb-4">
            <Bot className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">AI Waste Management Assistant</h1>
          <p className="text-ink-700 mt-2">
            Get personalized advice on waste management, recycling, and sustainability
          </p>
        </div>

        {/* Quick Prompts */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-200 p-6">
          <h2 className="text-lg font-medium text-ink-900 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Quick Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickPrompts.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${prompt.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink-900">{prompt.title}</h3>
                      <p className="text-sm text-ink-700 mt-1 line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-200 flex flex-col h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-ink-900 mb-2">Start a conversation</h3>
                <p className="text-ink-700">
                  Ask me anything about waste management, recycling, or sustainability!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-900'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ink-100 text-ink-900 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-ink-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about waste management, recycling tips, or sustainability..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <h3 className="font-medium text-brand-900 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-brand-800 space-y-1">
            <li>• Be specific about your waste management challenges</li>
            <li>• Ask about local recycling guidelines and facilities</li>
            <li>• Request step-by-step guides for composting or reducing waste</li>
            <li>• Ask about sustainable alternatives to common household items</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
