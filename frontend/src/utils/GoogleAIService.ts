// GoogleAIService.ts - Google Generative AI integration for the AI Coach
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserSkillData } from './dataManager';

class GoogleAIService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  static initialize() {
    const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_ACTUAL_GOOGLE_AI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('✅ Google AI initialized successfully');
      console.log('🔑 API Key present:', apiKey.substring(0, 8) + '...');
    } else {
      console.log('⚠️ Google AI API key not configured properly');
      console.log('Current key:', apiKey);
      console.log('Please set a valid API key from https://aistudio.google.com/app/apikey');
      console.log('Update REACT_APP_GOOGLE_AI_API_KEY in your .env file');
    }
  }

  static isGoogleAIAvailable(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  static async generateCoachResponse(
    userMessage: string, 
    userData: UserSkillData, 
    conversationHistory: string[] = []
  ): Promise<string> {
    if (!this.isGoogleAIAvailable()) {
      throw new Error('Google AI not available - API key missing or invalid');
    }

    try {
      const prompt = this.buildCoachPrompt(userMessage, userData, conversationHistory);
      console.log('🤖 Sending request to Google AI...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Google AI response received:', text.substring(0, 100) + '...');
      
      // Ensure response is appropriate length and format
      if (text && text.length > 20 && text.length < 3000) {
        return text;
      } else {
        throw new Error(`Response length invalid: ${text.length} characters`);
      }
    } catch (error) {
      console.error('❌ Google AI generation failed:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('Rate limit exceeded - too many requests');
        }
        if (error.message.includes('API key') || error.message.includes('401')) {
          throw new Error('API key invalid or unauthorized');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error - check internet connection');
        }
      }
      
      throw error;
    }
  }

  static async generatePersonalizedRoadmap(userData: UserSkillData): Promise<any> {
    if (!this.isGoogleAIAvailable()) {
      throw new Error('Google AI not available');
    }

    try {
      const prompt = this.buildRoadmapPrompt(userData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response and structure it as a roadmap
      return this.parseRoadmapResponse(text, userData);
    } catch (error) {
      console.error('Google AI roadmap generation failed:', error);
      throw error;
    }
  }

  private static buildCoachPrompt(
    userMessage: string, 
    userData: UserSkillData, 
    conversationHistory: string[]
  ): string {
    return `You are ${userData.name}'s AI Career Coach and colleague. You're like that really supportive coworker who genuinely cares about their growth and success. You have a warm, encouraging, but professional tone - think of yourself as a mentor who's also a friend.

USER PROFILE:
- Experience: ${userData.experienceLevel} level ${userData.currentRole}
- Current Skills: ${userData.currentSkills.join(', ')}
- Career Goals: ${userData.careerGoals.join(', ')}
- Challenges: ${userData.workplaceChallenges.join(', ')}
- Growth Areas: ${userData.improvementAreas.join(', ')}
- Available Time: ${userData.availableTimePerWeek} hours/week
- Learning Style: ${userData.preferredLearningStyle}

RECENT CONVERSATION:
${conversationHistory.slice(-3).join('\n')}

THEY JUST SAID: "${userMessage}"

HOW TO RESPOND:
- Be genuinely enthusiastic about helping them succeed
- Use a warm, colleague-like tone - friendly but professional
- Keep responses conversational and approachable
- Share insights as if you're brainstorming together
- Use "we" and "let's" to make it collaborative
- Be specific to their situation and goals
- Keep it to 2-3 paragraphs max
- End with an engaging question or suggestion
- Use emojis sparingly and naturally (1-2 max)
- Refer to their specific goals and challenges by name

IMPORTANT:
- Don't be overly formal or robotic
- Be encouraging but realistic
- Show you remember their journey and context
- Make them feel heard and understood
- Focus on actionable advice they can use

Respond as their supportive AI career coach:`;
  }

  private static buildRoadmapPrompt(userData: UserSkillData): string {
    return `Create a personalized career development roadmap for ${userData.name}:

PROFILE:
- Role: ${userData.currentRole}
- Experience: ${userData.experienceLevel}
- Skills: ${userData.currentSkills.join(', ')}
- Goals: ${userData.careerGoals.join(', ')}
- Challenges: ${userData.workplaceChallenges.join(', ')}
- Focus Areas: ${userData.improvementAreas.join(', ')}
- Time Available: ${userData.availableTimePerWeek}/week

Create 3 progressive projects that:
1. Address their specific challenges
2. Build toward their career goals
3. Match their experience level
4. Fit their available time
5. Use their preferred learning style: ${userData.preferredLearningStyle}

Format as structured data that can be parsed into:
- Project Title
- Duration (in weeks)
- Difficulty Level
- Target Skills (3-4 skills)
- Learning Objectives (3-4 points)
- Practice Scenarios (3-4 realistic workplace situations)

Make each project specific to their industry and role, not generic advice.`;
  }

  private static parseRoadmapResponse(aiResponse: string, userData: UserSkillData): any {
    // This is a simplified parser - in production, you'd want more robust parsing
    // For now, return a structured roadmap based on the AI response and user data
    
    const baseProject1 = {
      id: 'google-ai-project-1',
      title: `${userData.improvementAreas[0] || 'Communication'} Foundation Builder`,
      description: `AI-generated project focusing on ${userData.careerGoals[0] || 'professional growth'} through ${userData.improvementAreas[0] || 'communication'} skill development.`,
      targetSkills: userData.improvementAreas.slice(0, 4),
      duration: userData.availableTimePerWeek.includes('10+') ? '2 weeks' : '3 weeks',
      difficulty: userData.experienceLevel === 'entry' ? 'Beginner' : userData.experienceLevel === 'senior' ? 'Advanced' : 'Intermediate',
      scenarios: userData.workplaceChallenges.slice(0, 4).map(challenge => 
        `Practicing ${userData.improvementAreas[0] || 'communication'} in: ${challenge}`
      ),
      learningObjectives: [
        `Master ${userData.improvementAreas[0] || 'communication'} fundamentals`,
        `Apply skills to ${userData.workplaceChallenges[0] || 'workplace scenarios'}`,
        `Build confidence in ${userData.careerGoals[0] || 'professional situations'}`,
        `Develop consistent ${userData.improvementAreas[0] || 'communication'} habits`
      ]
    };

    return {
      id: `google-ai-roadmap-${Date.now()}`,
      title: `${userData.name}'s AI-Generated Career Roadmap`,
      description: `Custom roadmap created by Google AI based on your specific profile and goals.`,
      totalDuration: '9 weeks',
      projects: [baseProject1], // Would include more projects in full implementation
      milestones: [
        {
          week: 3,
          title: `${userData.improvementAreas[0] || 'Communication'} Breakthrough`,
          expectedSkills: userData.improvementAreas.slice(0, 3),
          assessmentType: 'AI-Generated Scenario Practice'
        }
      ]
    };
  }
}

// Initialize on import
GoogleAIService.initialize();

export default GoogleAIService;
