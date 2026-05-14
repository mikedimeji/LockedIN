import { Injectable } from '@angular/core';

export interface TutorialStep {
  title: string;
  description: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly STORAGE_KEY = 'tutorialsSeen';

  constructor() {
    this.initializeTutorials();
  }

  private initializeTutorials(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const initialState = {
        timer: false,
        planner: false,
        themes: false,
        stats: false,
        spotify: false,
        profile: false,
        settings: false
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialState));
    }
  }

  hasSeenTutorial(featureName: string): boolean {
    const tutorials = this.getTutorials();
    return tutorials[featureName] === true;
  }

  markTutorialAsSeen(featureName: string): void {
    const tutorials = this.getTutorials();
    tutorials[featureName] = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tutorials));
  }

  private getTutorials(): any {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  resetTutorial(featureName: string): void {
    const tutorials = this.getTutorials();
    tutorials[featureName] = false;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tutorials));
  }

  resetAllTutorials(): void {
    const tutorials = this.getTutorials();
    Object.keys(tutorials).forEach(key => {
      tutorials[key] = false;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tutorials));
  }

  getTutorialSteps(featureName: string): TutorialStep[] {
    const tutorials: { [key: string]: TutorialStep[] } = {
      timer: [
        {
          title: 'Welcome to Timer',
          description: 'Use the Pomodoro Technique to stay focused and productive. Work in focused intervals with short breaks.',
          image: 'assets/images/tutorial/tut1.png'
        },
        {
          title: 'Choose Your Duration',
          description: 'Select 25 minutes (classic pomodoro), 50 minutes (deep work), or set a custom duration for your session.',
          image: 'assets/images/tutorial/tut2.png'
        },
        {
          title: 'Earn Gold & Build Streaks',
          description: 'Complete sessions to earn gold coins and build your daily streak. The more consistent you are, the more you earn!',
          image: 'assets/images/tutorial/tut3.png'
        },
        {
          title: 'Hearts System',
          description: 'You have limited hearts. If you break focus or skip a session, you lose a heart. Manage them wisely!'
        }
      ],
      planner: [
        {
          title: 'Task Planner',
          description: 'Create and organize your study topics and tasks. Each task can have a custom number of pomodoro sessions.',
          image: 'assets/images/tutorial/taskstut1.png'
        },
        {
          title: 'Create Topics',
          description: 'Click "Create Topic" to add a new task. Give it a title, description, and set how many pomodoros you need.',
          image: 'assets/images/tutorial/taskstut2.png'
        },
        {
          title: 'Start Sessions',
          description: 'Click on any topic to start a timer session. Your progress is automatically tracked!',
          image: 'assets/images/tutorial/taskstut3.png'
        }
      ],
      themes: [
        {
          title: 'Customize Your Workspace',
          description: 'Choose from a variety of aesthetic themes to personalize your workspace.',
          image: 'assets/images/tutorial/themestut1.png'
        },
        {
          title: 'Live vs Static',
          description: 'Toggle between live animated backgrounds and static images. Use the switch at the top to change modes.',
          image: 'assets/images/tutorial/Themestut2.png'
        },
        {
          title: 'Premium Themes',
          description: 'Unlock premium themes using gold coins earned from completing pomodoro sessions. Build your collection!',
          image: 'assets/images/tutorial/Themestut3.png'
        }
      ],
      stats: [
        {
          title: 'Track Your Progress',
          description: 'View detailed statistics about your productivity, streaks, and achievements.',
          image: 'assets/tutorial/stats-overview.png'
        },
        {
          title: 'Streak System',
          description: 'Maintain daily streaks by completing at least one pomodoro session each day. Watch your longest streak grow!',
          image: 'assets/tutorial/stats-streak.png'
        },
        {
          title: 'Gold Earnings',
          description: 'See how much gold you\'ve earned and what you\'ve spent it on. Every completed session adds to your total.',
          image: 'assets/tutorial/stats-gold.png'
        },
        {
          title: 'Achievements',
          description: 'Unlock achievements as you hit milestones. Can you collect them all?',
          image: 'assets/tutorial/stats-achievements.png'
        }
      ],
      spotify: [
        {
          title: 'Music While You Work',
          description: 'Connect your Spotify account to play music during your focus sessions.',
          image: 'assets/tutorial/spotify-connect.png'
        },
        {
          title: 'Control Playback',
          description: 'Control your music without leaving the app. Play, pause, skip tracks, and adjust volume right here.',
          image: 'assets/tutorial/spotify-controls.png'
        }
      ],
      profile: [
        {
          title: 'Your Profile',
          description: 'Customize your profile with different avatars and track your overall progress.',
          image: 'assets/tutorial/profile-overview.png'
        },
        {
          title: 'Unlock Avatars',
          description: 'Use gold coins to unlock new profile pictures and express yourself!',
          image: 'assets/tutorial/profile-avatars.png'
        }
      ],
      settings: [
        {
          title: 'App Settings',
          description: 'Customize your experience with various settings and preferences.',
          image: 'assets/tutorial/settings-overview.png'
        }
      ]
    };

    return tutorials[featureName] || [];
  }
}
