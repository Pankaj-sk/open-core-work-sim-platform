import React from 'react';
import { Clock, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
}

const EventTimeline: React.FC = () => {
  const events: Event[] = [
    {
      id: '1',
      type: 'simulation_start',
      message: 'Simulation started - Team meeting scenario',
      timestamp: '12:00 PM',
      status: 'completed'
    },
    {
      id: '2',
      type: 'agent_joined',
      message: 'Sarah Johnson (Manager) joined the conversation',
      timestamp: '12:01 PM',
      status: 'completed'
    },
    {
      id: '3',
      type: 'user_message',
      message: 'User sent a message about project timeline',
      timestamp: '12:02 PM',
      status: 'completed'
    },
    {
      id: '4',
      type: 'agent_response',
      message: 'Sarah Johnson is formulating a response...',
      timestamp: '12:03 PM',
      status: 'in-progress'
    },
    {
      id: '5',
      type: 'artifact_generated',
      message: 'Meeting minutes will be generated',
      timestamp: '12:05 PM',
      status: 'pending'
    }
  ];

  const getEventIcon = (type: string, status: string) => {
    switch (type) {
      case 'simulation_start':
        return <Play size={16} className="text-green-600" />;
      case 'agent_joined':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'user_message':
        return <CheckCircle size={16} className="text-primary-600" />;
      case 'agent_response':
        return status === 'in-progress' ? <Pause size={16} className="text-yellow-600" /> : <CheckCircle size={16} className="text-green-600" />;
      case 'artifact_generated':
        return <CheckCircle size={16} className="text-purple-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500';
      case 'in-progress': return 'border-yellow-500';
      case 'pending': return 'border-gray-300';
      case 'error': return 'border-red-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="text-primary-600" size={20} />
        <h2 className="text-xl font-semibold text-gray-900">Simulation Timeline</h2>
      </div>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.status)}`}>
              {getEventIcon(event.type, event.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{event.message}</p>
              <p className="text-xs text-gray-500 mt-1">{event.timestamp}</p>
            </div>
            {index < events.length - 1 && (
              <div className="absolute left-4 w-0.5 h-8 bg-gray-200 ml-3 mt-8"></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Simulation Status:</span>
          <span className="font-medium text-green-600">Active</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Duration:</span>
          <span className="font-medium">5 minutes</span>
        </div>
      </div>
    </div>
  );
};

export default EventTimeline; 