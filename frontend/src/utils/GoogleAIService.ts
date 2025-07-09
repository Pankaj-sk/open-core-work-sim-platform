// GoogleAIService.ts - Google Generative AI integration for the AI Coach
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserSkillData } from './dataManager';

class GoogleAIService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  static initialize() {
    const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('✅ Google AI initialized successfully');
    } else {
      console.log('⚠️ Google AI API key not found, using fallback responses');
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
      throw new Error('Google AI not available');
    }

    try {
      const prompt = this.buildCoachPrompt(userMessage, userData, conversationHistory);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Ensure response is appropriate length and format
      if (text && text.length > 50 && text.length < 2000) {
        return text;
      } else {
        throw new Error('Response too short or too long');
      }
    } catch (error) {
      console.error('Google AI generation failed:', error);
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
    return `You are ${userData.name}'s personal career mentor and coach. You have a casual, friendly style that feels like talking to a real person, not an AI. Think of yourself as a mix between a supportive friend and an experienced professional who genuinely cares about their growth.

USER PROFILE:
- Experience: ${userData.experienceLevel} level as ${userData.currentRole}
- Skills they have: ${userData.currentSkills.join(', ')}
- What they want: ${userData.careerGoals.join(', ')}
- Their struggles: ${userData.workplaceChallenges.join(', ')}
- Areas to work on: ${userData.improvementAreas.join(', ')}
- Time available: ${userData.availableTimePerWeek} hours/week
- How they learn best: ${userData.preferredLearningStyle}

CHAT HISTORY:
${conversationHistory.join('\n')}

THEY JUST SAID: "${userMessage}"

HOW TO RESPOND:
- Be super conversational and casual - use "Hey", "So", "Look", "Honestly", etc.
- Share personal-sounding anecdotes like "I once had a colleague who..."
- Keep things brief and to the point - 2-3 short paragraphs max
- Use simple formatting with line breaks between thoughts
- Add 1-2 emojis that a real person would use, not excessive
- Use simple bullet points only when listing specific advice
- Always personalize with their name, goals and challenges
- End with a genuine-sounding question to continue the conversation
- If discussing roadmaps, sound excited and personally invested
- For skill assessment, be honest but supportive like a real mentor would be

IMPORTANT:
- Format your text with proper spacing and line breaks
- Use markdown sparingly (bold only for key points, not whole paragraphs)
- Never use technical language about AI or models

Now respond as their personal coach and mentor:`;
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
