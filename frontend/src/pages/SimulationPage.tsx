import React from 'react';
import RoleSelector from '../components/RoleSelector';
import ChatWindow from '../components/ChatWindow';
import EventTimeline from '../components/EventTimeline';
import ArtifactCard from '../components/ArtifactCard';

const SimulationPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workplace Simulation</h1>
        <p className="text-gray-600">Practice your skills in realistic workplace scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Role Selection and Timeline */}
        <div className="lg:col-span-1 space-y-8">
          <RoleSelector />
          <EventTimeline />
        </div>

        {/* Right Column - Chat and Artifacts */}
        <div className="lg:col-span-2 space-y-8">
          <ChatWindow />
          <ArtifactCard />
        </div>
      </div>
    </div>
  );
};

export default SimulationPage; 