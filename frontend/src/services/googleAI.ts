// Google AI Service for SimWorld AI Coach
import { GoogleGenerativeAI } from '@google/generative-ai';

interface UserProfile {
  name: string;
  experienceLevel: string;
  careerGoals: string[];
  currentSkills: string[];
  improvementAreas: string[];
  workplaceChallenges: string[];
  communicationConcerns: string[];
  availableTimePerWeek: string;
  preferredLearningStyle: string;
  preferredProjectTypes: string[];
}

interface ProjectRequest {
  userProfile: UserProfile;
  projectType: 'communication' | 'leadership' | 'technical' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  focusAreas: string[];
}

class GoogleAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private readonly fallbackResponses = {
    coach: "I'm here to help you develop your professional skills. Let me analyze your goals and create a personalized plan for you.",
    roadmap: "Based on your profile, I'll create a comprehensive development roadmap with targeted projects.",
    project: "Let me design a custom project that matches your experience level and goals."
  };

  constructor() {
    this.initializeAI();
  }

  private initializeAI() {
    const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
    
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('✅ Google AI initialized successfully');
      } catch (error) {
        console.warn('⚠️ Google AI initialization failed, using fallback responses:', error);
        this.genAI = null;
        this.model = null;
      }
    } else {
      console.warn('⚠️ No Google AI API key found, using fallback responses');
    }
  }

  // Generate AI coach responses using Google Gemini
  async generateCoachResponse(userMessage: string, userProfile: UserProfile, conversationHistory: string[] = []): Promise<string> {
    if (!this.model) {
      return this.generateFallbackCoachResponse(userMessage, userProfile);
    }

    try {
      const systemPrompt = `You are an experienced AI Career Coach and mentor for SimWorld, a professional development platform. Your role is to:

1. **Analyze the user's profile and provide personalized guidance**
2. **Be supportive, encouraging, and professional**
3. **Give specific, actionable advice based on their goals and challenges**
4. **Help them understand their development roadmap and projects**
5. **Answer questions about career growth and skill building**

**User Profile:**
- Name: ${userProfile.name}
- Experience Level: ${userProfile.experienceLevel}
- Career Goals: ${userProfile.careerGoals.join(', ')}
- Current Skills: ${userProfile.currentSkills.join(', ')}
- Areas to Improve: ${userProfile.improvementAreas.join(', ')}
- Workplace Challenges: ${userProfile.workplaceChallenges.join(', ')}
- Available Time: ${userProfile.availableTimePerWeek} hours/week
- Learning Style: ${userProfile.preferredLearningStyle}

**Guidelines:**
- Keep responses conversational and encouraging
- Reference their specific goals and challenges
- Provide actionable next steps
- Use emojis sparingly but effectively
- Format responses with clear sections when helpful
- Be concise but comprehensive
- Focus on their professional growth journey

**Recent conversation context:**
${conversationHistory.slice(-3).join('\n')}

**User's current message:** "${userMessage}"

Respond as their personal AI mentor with specific guidance based on their profile:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      
      return text || this.generateFallbackCoachResponse(userMessage, userProfile);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.generateFallbackCoachResponse(userMessage, userProfile);
    }
  }

  // Generate personalized roadmap using Google AI
  async generatePersonalizedRoadmap(userProfile: UserProfile): Promise<any> {
    if (!this.model) {
      return this.generateFallbackRoadmap(userProfile);
    }

    try {
      const roadmapPrompt = `As an expert career development coach, create a comprehensive 3-project skill development roadmap for this professional:

**User Profile:**
- Name: ${userProfile.name}
- Experience: ${userProfile.experienceLevel} level
- Goals: ${userProfile.careerGoals.join(', ')}
- Current Skills: ${userProfile.currentSkills.join(', ')}
- Improvement Areas: ${userProfile.improvementAreas.join(', ')}
- Challenges: ${userProfile.workplaceChallenges.join(', ')}
- Time Available: ${userProfile.availableTimePerWeek} hours/week
- Learning Style: ${userProfile.preferredLearningStyle}

Create a JSON roadmap with this exact structure:
{
  "title": "Personalized roadmap title",
  "description": "2-3 sentence description of the journey",
  "totalDuration": "X weeks",
  "projects": [
    {
      "id": "unique-id",
      "title": "Project Title",
      "description": "Detailed description (2-3 sentences)",
      "targetSkills": ["skill1", "skill2", "skill3", "skill4"],
      "duration": "X weeks",
      "difficulty": "Beginner/Intermediate/Advanced",
      "scenarios": ["scenario1", "scenario2", "scenario3", "scenario4"],
      "learningObjectives": ["objective1", "objective2", "objective3", "objective4"],
      "successMetrics": ["metric1", "metric2", "metric3", "metric4"],
      "aiPersonas": {
        "manager": {
          "name": "Manager Name",
          "personality": "personality description",
          "focus": "focus area"
        },
        "colleagues": [
          {
            "name": "Colleague Name",
            "personality": "personality",
            "role": "job role"
          }
        ]
      }
    }
  ],
  "milestones": [
    {
      "week": 2,
      "title": "Milestone title",
      "expectedSkills": ["skill1", "skill2"],
      "assessmentType": "assessment description"
    }
  ]
}

**Requirements:**
1. Design projects that progress from foundational to advanced skills
2. Each project should directly address their stated goals and challenges
3. Scenarios should be realistic workplace situations they might face
4. AI personas should have diverse personalities and represent real workplace dynamics
5. Projects should build on each other logically
6. Match difficulty to their experience level
7. Consider their available time per week
8. Include specific, measurable success metrics

Return ONLY the JSON, no additional text.`;

      const result = await this.model.generateContent(roadmapPrompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean the response to extract JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const roadmap = JSON.parse(cleanedText);
        return roadmap;
      } catch (parseError) {
        console.error('Error parsing AI roadmap response:', parseError);
        return this.generateFallbackRoadmap(userProfile);
      }
    } catch (error) {
      console.error('Error generating AI roadmap:', error);
      return this.generateFallbackRoadmap(userProfile);
    }
  }

  // Generate custom project using Google AI
  async generateCustomProject(request: ProjectRequest): Promise<any> {
    if (!this.model) {
      return this.generateFallbackProject(request);
    }

    try {
      const projectPrompt = `Create a detailed workplace simulation project for professional skill development:

**User Requirements:**
- Experience Level: ${request.userProfile.experienceLevel}
- Project Type: ${request.projectType}
- Difficulty: ${request.difficulty}
- Duration: ${request.duration}
- Focus Areas: ${request.focusAreas.join(', ')}
- User Goals: ${request.userProfile.careerGoals.join(', ')}
- User Challenges: ${request.userProfile.workplaceChallenges.join(', ')}

Design a realistic project that includes:
1. Challenging but achievable scenarios
2. Diverse AI team members with distinct personalities
3. Clear learning objectives tied to their goals
4. Measurable success criteria
5. Real workplace situations they'll encounter

Return a detailed project object with scenarios, team dynamics, and progression milestones.`;

      const result = await this.model.generateContent(projectPrompt);
      const response = await result.response;
      const text = response.text();
      
      return { customProject: text };
    } catch (error) {
      console.error('Error generating custom project:', error);
      return this.generateFallbackProject(request);
    }
  }

  // Fallback responses when Google AI is not available
  private generateFallbackCoachResponse(userMessage: string, userProfile: UserProfile): string {
    const userName = userProfile.name || 'there';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('roadmap') || lowerMessage.includes('plan')) {
      return `Hi ${userName}! I'll create a personalized development roadmap based on your goals: ${userProfile.careerGoals.slice(0, 2).join(' and ')}. Your ${userProfile.experienceLevel} experience level and focus on ${userProfile.improvementAreas.slice(0, 2).join(', ')} will guide the project design.`;
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('scenario')) {
      return `Great question, ${userName}! I'll design practice scenarios that target your challenges with ${userProfile.workplaceChallenges.slice(0, 2).join(' and ')}. Each project will be tailored to your ${userProfile.experienceLevel} level.`;
    }

    if (lowerMessage.includes('skills') || lowerMessage.includes('assess')) {
      return `Based on your profile, ${userName}, I see you're strong in ${userProfile.currentSkills.slice(0, 2).join(' and ')}. Let's focus on developing ${userProfile.improvementAreas.slice(0, 2).join(' and ')} to achieve your goal of ${userProfile.careerGoals[0] || 'professional growth'}.`;
    }

    return `Hello ${userName}! I'm your AI Career Coach. I can help you with skill development, create personalized roadmaps, design practice scenarios, and provide career guidance. What would you like to work on today?`;
  }

  private generateFallbackRoadmap(userProfile: UserProfile): any {
    return {
      id: `roadmap-${Date.now()}`,
      title: `${userProfile.name}'s Professional Development Journey`,
      description: `A personalized roadmap focusing on ${userProfile.careerGoals.slice(0, 2).join(' and ')} through targeted skill building and practice scenarios.`,
      totalDuration: '9 weeks',
      projects: [
        {
          id: 'foundation-project',
          title: 'Communication Foundation',
          description: `Build essential communication skills focusing on ${userProfile.improvementAreas[0] || 'professional presence'}.`,
          targetSkills: ['Communication', 'Active Listening', 'Confidence', 'Professional Presence'],
          duration: '3 weeks',
          difficulty: userProfile.experienceLevel === 'entry' ? 'Beginner' : 'Intermediate',
          scenarios: [
            'Team meeting participation',
            'One-on-one with manager',
            'Client presentation',
            'Conflict resolution discussion'
          ],
          learningObjectives: [
            'Develop clear communication style',
            'Practice active listening',
            'Build professional confidence',
            'Handle difficult conversations'
          ],
          successMetrics: [
            'Complete 4 practice scenarios',
            'Receive positive feedback on communication',
            'Demonstrate improved confidence',
            'Successfully handle challenging conversations'
          ],
          aiPersonas: {
            manager: {
              name: 'Sarah Johnson',
              personality: 'Supportive yet challenging',
              focus: 'Communication development'
            },
            colleagues: [
              {
                name: 'Mike Chen',
                personality: 'Direct and analytical',
                role: 'Senior Analyst'
              }
            ]
          }
        }
      ],
      milestones: [
        {
          week: 3,
          title: 'Communication Confidence',
          expectedSkills: ['Clear Communication', 'Active Listening'],
          assessmentType: 'Scenario-based evaluation'
        }
      ]
    };
  }

  private generateFallbackProject(request: ProjectRequest): any {
    return {
      title: `${request.projectType} Development Project`,
      description: `A focused project to develop ${request.focusAreas.join(' and ')} skills.`,
      difficulty: request.difficulty,
      duration: request.duration,
      targetSkills: request.focusAreas
    };
  }

  // Check if Google AI is available
  isGoogleAIAvailable(): boolean {
    return this.model !== null;
  }
}

export default new GoogleAIService();
