import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const CoachIntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: 'coach', text: "Hi! I'm your AI Coach. I'm here to help you design the best career roadmap for your goals. Would you like me to generate a personalized roadmap for you? Feel free to ask me anything before we start!" }
  ]);
  const [input, setInput] = useState('');
  const [waitingForGenerate, setWaitingForGenerate] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    // Simulate coach response
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'coach', text: "Great question! I'll be happy to answer any doubts before we begin." }]);
    }, 800);
    setInput('');
  };

  const handleGenerate = () => {
    setWaitingForGenerate(true);
    setTimeout(() => {
      navigate('/roadmap-generation');
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Meet Your Coach</h1>
        </div>
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'coach' ? 'justify-start' : 'justify-end'}`}>
              <div className={`rounded-lg px-4 py-2 ${msg.sender === 'coach' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'}`}>{msg.text}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ask your coach..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={waitingForGenerate}
          />
          <Button onClick={handleSend} disabled={waitingForGenerate || !input.trim()}><MessageCircle className="w-4 h-4" /></Button>
        </div>
        <Button className="w-full" onClick={handleGenerate} disabled={waitingForGenerate}>
          <ArrowRight className="w-4 h-4 mr-2" /> OK, generate my roadmap
        </Button>
      </div>
    </div>
  );
};

export default CoachIntroPage;
