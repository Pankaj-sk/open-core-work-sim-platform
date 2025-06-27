// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, CheckCircle } from 'lucide-react';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
}

function EventTimeline() {
  const [events] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, show empty state instead of hardcoded data
    // TODO: Implement real event fetching from backend API
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="text-primary-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Simulation Timeline</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string, status: string) => {
    switch (type) {
      case 'simulation_start':
        return React.createElement(Play, { size: 16, className: 'text-green-600' });
      case 'agent_joined':
        return React.createElement(CheckCircle, { size: 16, className: 'text-blue-600' });
      case 'user_message':
        return React.createElement(CheckCircle, { size: 16, className: 'text-primary-600' });
      case 'agent_response':
        return status === 'in-progress' 
          ? React.createElement(Pause, { size: 16, className: 'text-yellow-600' })
          : React.createElement(CheckCircle, { size: 16, className: 'text-green-600' });
      case 'artifact_generated':
        return React.createElement(CheckCircle, { size: 16, className: 'text-purple-600' });
      default:
        return React.createElement(Clock, { size: 16, className: 'text-gray-600' });
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

  return React.createElement('div', { className: 'card' },
    React.createElement('div', { className: 'flex items-center space-x-2 mb-6' },
      React.createElement(Clock, { className: 'text-primary-600', size: 20 }),
      React.createElement('h2', { className: 'text-xl font-semibold text-gray-900' }, 'Simulation Timeline')
    ),
    
    events.length === 0 ? (
      React.createElement('div', { className: 'text-center py-8' },
        React.createElement('div', { className: 'text-gray-500 mb-2' }, 'No simulation events yet'),
        React.createElement('p', { className: 'text-sm text-gray-400' }, 'Events will appear here as you interact with the simulation')
      )
    ) : (
      React.createElement('div', { className: 'space-y-4' },
        events.map((event, index) =>
          React.createElement('div', { key: event.id, className: 'flex items-start space-x-3' },
            React.createElement('div', { 
              className: `flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.status)}` 
            },
              getEventIcon(event.type, event.status)
            ),
            React.createElement('div', { className: 'flex-1 min-w-0' },
              React.createElement('p', { className: 'text-sm font-medium text-gray-900' }, event.message),
              React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, event.timestamp)
            ),
            index < events.length - 1 && React.createElement('div', { 
              className: 'absolute left-4 w-0.5 h-8 bg-gray-200 ml-3 mt-8' 
            })
          )
        )
      )
    ),
    
    React.createElement('div', { className: 'mt-6 p-4 bg-gray-50 rounded-lg' },
      React.createElement('div', { className: 'flex items-center justify-between text-sm' },
        React.createElement('span', { className: 'text-gray-600' }, 'Simulation Status:'),
        React.createElement('span', { className: 'font-medium text-gray-500' }, 'Ready')
      ),
      React.createElement('div', { className: 'flex items-center justify-between text-sm mt-1' },
        React.createElement('span', { className: 'text-gray-600' }, 'Duration:'),
        React.createElement('span', { className: 'font-medium' }, '0 minutes')
      )
    )
  );
}

export default EventTimeline; 