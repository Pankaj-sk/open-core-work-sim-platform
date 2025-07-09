// Data Management Utility for SimWorld MVP
// Handles localStorage data operations and reset functionality

export interface UserSkillData {
  // Personal Information
  name: string;
  email: string;
  
  // Current Skills & Experience
  currentRole: string;
  experienceLevel: string; // 'entry', 'junior', 'mid', 'senior'
  currentSkills: string[]; // Array of current skills
  
  // Goals & Areas for Improvement
  careerGoals: string[]; // What they want to achieve
  improvementAreas: string[]; // What they want to improve
  preferredLearningStyle: string; // 'hands-on', 'guided', 'independent'
  
  // Challenges & Pain Points
  workplaceChallenges: string[]; // What they struggle with
  communicationConcerns: string[]; // Specific communication areas
  
  // Learning Preferences
  availableTimePerWeek: string; // '1-3', '4-6', '7-10', '10+' hours
  preferredProjectTypes: string[]; // Types of projects they want to practice
  
  // Metadata
  completedAt: string;
  version: string;
}

export interface UserProgress {
  completedProjects: number;
  currentProject: string | null;
  skillsImproved: string[];
  nextGoal: string;
  coachFeedback: string;
  totalHoursSpent: number;
  conversationsCompleted: number;
  lastActiveDate: string;
}

export class DataManager {
  private static readonly STORAGE_KEYS = {
    ONBOARDING_COMPLETE: 'hasCompletedOnboarding',
    USER_SKILL_DATA: 'userSkillData',
    USER_PROGRESS: 'userProgress',
    COMPLETED_PROJECTS_COUNT: 'completedProjectsCount',
    CURRENT_PROJECT_ID: 'currentProjectId',
    CURRENT_PROJECT_CONTEXT: 'currentProjectContext',
    COACH_CHAT_HISTORY: 'coachChatHistory',
    APP_VERSION: 'appVersion'
  };

  private static readonly CURRENT_VERSION = '1.0.0';

  // Reset all application data
  static resetAllData(): void {
    console.log('🧹 Resetting all SimWorld data...');
    
    // Clear all localStorage items
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any cached conversation data
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('call-') || 
          key.startsWith('conversation-') || 
          key.startsWith('project-') ||
          key.startsWith('chat-')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ All data cleared successfully');
  }

  // Check if user has completed onboarding
  static hasCompletedOnboarding(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  }

  // Mark onboarding as complete
  static completeOnboarding(skillData: UserSkillData): void {
    localStorage.setItem(this.STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    localStorage.setItem(this.STORAGE_KEYS.USER_SKILL_DATA, JSON.stringify(skillData));
    localStorage.setItem(this.STORAGE_KEYS.APP_VERSION, this.CURRENT_VERSION);
    
    // Initialize progress
    const initialProgress: UserProgress = {
      completedProjects: 0,
      currentProject: null,
      skillsImproved: [],
      nextGoal: skillData.careerGoals[0] || 'Build workplace communication skills',
      coachFeedback: 'Welcome! I\'m excited to help you develop your professional skills.',
      totalHoursSpent: 0,
      conversationsCompleted: 0,
      lastActiveDate: new Date().toISOString()
    };
    
    localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(initialProgress));
    localStorage.setItem(this.STORAGE_KEYS.COMPLETED_PROJECTS_COUNT, '0');
  }

  // Get user skill data
  static getUserSkillData(): UserSkillData | null {
    const data = localStorage.getItem(this.STORAGE_KEYS.USER_SKILL_DATA);
    return data ? JSON.parse(data) : null;
  }

  // Get user progress
  static getUserProgress(): UserProgress | null {
    const data = localStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
    return data ? JSON.parse(data) : null;
  }

  // Update user progress
  static updateUserProgress(updates: Partial<UserProgress>): void {
    const currentProgress = this.getUserProgress();
    if (currentProgress) {
      const updatedProgress = { ...currentProgress, ...updates };
      updatedProgress.lastActiveDate = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(updatedProgress));
    }
  }

  // Check if app needs data migration
  static needsMigration(): boolean {
    const storedVersion = localStorage.getItem(this.STORAGE_KEYS.APP_VERSION);
    return storedVersion !== this.CURRENT_VERSION;
  }

  // Export user data for backup
  static exportUserData(): string {
    const data = {
      version: this.CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      skillData: this.getUserSkillData(),
      progress: this.getUserProgress(),
      onboardingComplete: this.hasCompletedOnboarding()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import user data from backup
  static importUserData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.skillData) {
        localStorage.setItem(this.STORAGE_KEYS.USER_SKILL_DATA, JSON.stringify(data.skillData));
      }
      
      if (data.progress) {
        localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(data.progress));
      }
      
      if (data.onboardingComplete) {
        localStorage.setItem(this.STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      }
      
      localStorage.setItem(this.STORAGE_KEYS.APP_VERSION, this.CURRENT_VERSION);
      
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  // Get debug info
  static getDebugInfo(): object {
    return {
      version: this.CURRENT_VERSION,
      onboardingComplete: this.hasCompletedOnboarding(),
      hasSkillData: !!this.getUserSkillData(),
      hasProgress: !!this.getUserProgress(),
      storageUsed: this.getStorageUsage()
    };
  }

  private static getStorageUsage(): string {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return `${(total / 1024).toFixed(2)} KB`;
  }
}

export default DataManager;
