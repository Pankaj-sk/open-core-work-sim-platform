import React, { useState, useEffect } from 'react';
import { Check, Users } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  difficulty: string;
}

interface RoleSelectorProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedAgent, onAgentChange }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Map role IDs to agent IDs
  const roleToAgentMap: { [key: string]: string } = {
    'manager': 'manager_001',
    'developer': 'developer_001', 
    'client': 'client_001',
    'hr': 'hr_001',
    'intern': 'intern_001',
    'qa': 'qa_001'
  };

  const availableRoles: Role[] = [
    {
      id: 'manager',
      name: 'Team Manager',
      description: 'Lead team meetings, manage deadlines, juggle priorities. "Let\'s circle back on this!"',
      difficulty: 'Medium'
    },
    {
      id: 'developer', 
      name: 'Senior Developer',
      description: 'Debug code, argue about architecture, explain tech stuff. "That\'s a code smell..."',
      difficulty: 'Medium'
    },
    {
      id: 'client',
      name: 'Client Representative',
      description: 'Push for results, question costs, mention competitors. "When will it be done?"',
      difficulty: 'Hard'
    },
    {
      id: 'hr',
      name: 'HR Specialist', 
      description: 'Navigate workplace politics, ensure compliance. "Let\'s take this offline..."',
      difficulty: 'Medium'
    },
    {
      id: 'intern',
      name: 'Software Intern',
      description: 'Ask questions, learn eagerly, bring fresh perspective. "Oh cool! 😅"',
      difficulty: 'Easy'
    },
    {
      id: 'qa',
      name: 'QA Engineer',
      description: 'Find bugs, think of edge cases, question everything. "Did we test for..."',
      difficulty: 'Medium'
    }
  ];

  const handleRoleToggle = (roleId: string) => {
    // For now, only allow one role selection (single chat partner)
    setSelectedRoles([roleId]);
    
    // Map role to agent and notify parent
    const agentId = roleToAgentMap[roleId];
    if (agentId) {
      onAgentChange(agentId);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="text-primary-600" size={20} />
        <h2 className="text-xl font-semibold text-gray-900">Choose Your Role</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableRoles.map((role) => (
          <div
            key={role.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedRoles.includes(role.id)
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleRoleToggle(role.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{role.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(role.difficulty)}`}>
                  {role.difficulty}
                </span>
              </div>
              {selectedRoles.includes(role.id) && (
                <Check className="text-primary-600" size={20} />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Selected roles: {selectedRoles.length > 0 ? selectedRoles.join(', ') : 'None'}
        </p>
      </div>
    </div>
  );
};

export default RoleSelector; 