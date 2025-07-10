import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Clock, Users, Target, CheckCircle2, Star, Award, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { Button } from './ui/button';

interface ProjectCardProps {
  project: any;
  index: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  completedProjects: number;
  onStart: (id: string, index: number) => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'Advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, expanded, onToggle, completedProjects, onStart }) => (
  <Card className="overflow-hidden" aria-label={`Project ${project.title}`}> 
    <Collapsible open={expanded} onOpenChange={() => onToggle(project.id)}>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{index + 1}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{project.title || 'Untitled Project'}</CardTitle>
                <CardDescription>{project.description || '-'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Project Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Duration: {project.duration || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{Array.isArray(project.teamMembers) ? project.teamMembers.length : 0} team members</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{Array.isArray(project.targetSkills) ? project.targetSkills.length : 0} focus skills</span>
              </div>
            </div>
            {/* Target Skills */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Skills You'll Develop:</h4>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(project.targetSkills) && project.targetSkills.length > 0) ? project.targetSkills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                )) : <span className="text-gray-400">No skills listed.</span>}
              </div>
            </div>
            {/* Team Members */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Your AI Team:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Array.isArray(project.teamMembers) && project.teamMembers.length > 0) ? project.teamMembers.map((member: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div><strong>Personality:</strong> {member.personality}</div>
                      <div><strong>Work Style:</strong> {member.workingStyle}</div>
                    </div>
                  </div>
                )) : <div className="text-gray-400">No team members listed.</div>}
              </div>
            </div>
            {/* Project Objectives */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">What You'll Accomplish:</h4>
              <div className="space-y-2">
                {(Array.isArray(project.objectives) && project.objectives.length > 0) ? project.objectives.map((objective: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-gray-700">{objective}</span>
                  </div>
                )) : <div className="text-gray-400">No objectives listed.</div>}
              </div>
            </div>
            {/* Challenges */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Challenges You'll Navigate:</h4>
              <div className="space-y-2">
                {(Array.isArray(project.challenges) && project.challenges.length > 0) ? project.challenges.map((challenge: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-gray-700">{challenge}</span>
                  </div>
                )) : <div className="text-gray-400">No challenges listed.</div>}
              </div>
            </div>
            {/* Expected Outcomes */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Expected Growth:</h4>
              <div className="space-y-2">
                {(Array.isArray(project.expectedOutcomes) && project.expectedOutcomes.length > 0) ? project.expectedOutcomes.map((outcome: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span className="text-gray-700">{outcome}</span>
                  </div>
                )) : <div className="text-gray-400">No outcomes listed.</div>}
              </div>
            </div>
            {/* Action Button */}
            <div className="pt-4 border-t">
              {index === completedProjects ? (
                <Button onClick={() => onStart(project.id, index)} className="w-full" aria-label={`Start project ${project.title}`}>
                  <Play className="w-4 h-4 mr-2" />
                  Start This Project
                </Button>
              ) : index < completedProjects ? (
                <div className="text-center text-green-600">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-2" />
                  <p>Completed</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Clock className="w-4 h-4 mx-auto mb-2" />
                  <p>Available after completing previous projects</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
);

export default ProjectCard;
