// 📄 PAGE: UserProfilePage.tsx - Shows all stored onboarding/user info
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataManager from '../utils/dataManager';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = DataManager.getUserSkillData();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No User Data Found</h2>
            <p className="mb-4">Please complete onboarding to view your profile.</p>
            <Button onClick={() => navigate('/onboarding')}>Start Onboarding</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Your Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Current Role:</strong> {user.currentRole}</div>
            <div><strong>Experience Level:</strong> {user.experienceLevel}</div>
            <div><strong>Current Skills:</strong> {user.currentSkills?.join(', ')}</div>
            <div><strong>Career Goals:</strong> {user.careerGoals?.join(', ')}</div>
            <div><strong>Improvement Areas:</strong> {user.improvementAreas?.join(', ')}</div>
            <div><strong>Workplace Challenges:</strong> {user.workplaceChallenges?.join(', ')}</div>
            <div><strong>Communication Concerns:</strong> {user.communicationConcerns?.join(', ')}</div>
            <div><strong>Preferred Learning Style:</strong> {user.preferredLearningStyle}</div>
            <div><strong>Available Time Per Week:</strong> {user.availableTimePerWeek}</div>
            <div><strong>Preferred Project Types:</strong> {user.preferredProjectTypes?.join(', ')}</div>
          </CardContent>
        </Card>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
};

export default UserProfilePage;
