import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

// Define types for better type safety
interface Theme {
  path: string;
  name: string;
  premium: boolean;
  category: string;
  isLive: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.css'
})
export class ThemesComponent implements OnInit {
  // Available theme categories
  categories: Category[] = [
    { id: 'all', name: 'All', icon: 'assets/images/nav/theme.jpg' },
    { id: 'custom', name: 'Custom', icon: 'assets/images/nav/two-coins.png' },
    { id: 'aesthetic', name: 'Aesthetic', icon: 'assets/images/nav/star-flag.png' },
    { id: 'chill', name: 'Chill', icon: 'assets/images/nav/sun-cloud.png' },
    { id: 'study', name: 'Study', icon: 'assets/images/nav/alarm-clock.png' },
    { id: 'anime', name: 'Anime', icon: 'assets/images/nav/checklist.png' }
  ];

  // All available themes with metadata
  allThemes: Theme[] = [
    // Free themes - live
    { path: 'assets/videos/nakedwhy.gif', name: 'Retro Girl', premium: false, category: 'aesthetic', isLive: true },
    { path: 'assets/videos/witch.gif', name: 'Witch', premium: false, category: 'anime', isLive: true },
    { path: 'assets/videos/sky-view-pink.gif', name: 'Sky Pink', premium: false, category: 'chill', isLive: true },
    { path: 'assets/videos/cafe.gif', name: 'Cafe', premium: false, category: 'study', isLive: true },
    { path: 'assets/videos/castle.gif', name: 'Castle', premium: false, category: 'chill', isLive: true },
    { path: 'assets/videos/cyberpunk.gif', name: 'Cyberpunk', premium: false, category: 'aesthetic', isLive: true },
    { path: 'assets/videos/city2.gif', name: 'City-Overview', premium: false, category: 'aesthetic', isLive: true },
    
    // Premium themes - live
    { path: 'assets/videos/cathargic_day.gif', name: 'Cathargic Day', premium: false, category: 'chill', isLive: true },
    { path: 'assets/videos/scottpill.gif', name: 'Scott Pill', premium: true, category: 'aesthetic', isLive: true },
    { path: 'assets/videos/tokyo.gif', name: 'Tokyo', premium: true, category: 'anime', isLive: true },
    { path: 'assets/videos/yumenikki.mp4', name: 'Yume Nikki', premium: true, category: 'custom', isLive: true },
    
    // Static themes
    { path: 'assets/images/themes/city.jpg', name: 'Retro Room', premium: false, category: 'aesthetic', isLive: false },
    { path: 'assets/images/themes/house-roshi.jpg', name: 'Mountain View', premium: false, category: 'chill', isLive: false },
  ];

  // Themes that match the current filter
  filteredThemes: Theme[] = [];
  
  // Currently selected theme and category
  selectedTheme: string = ''; 
  selectedCategory: string = 'all';
  
  // Toggle for live/static wallpapers
  showLiveThemes: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load the currently selected theme from localStorage
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
    } else {
      // Set default theme if none is saved
      this.selectedTheme = this.allThemes[0].path;
    }

    // Check if there's a saved preference for live/static themes
    const showLive = localStorage.getItem('showLiveThemes');
    if (showLive !== null) {
      this.showLiveThemes = showLive === 'true';
    }

    // Initialize filtered themes
    this.applyFilters();
  }

  /**
   * Toggle between live and static themes
   */
  toggleLiveThemes(): void {
    this.showLiveThemes = !this.showLiveThemes;
    localStorage.setItem('showLiveThemes', this.showLiveThemes.toString());
    this.applyFilters();
  }

  /**
   * Filter themes by category
   */
  filterThemes(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  /**
   * Apply all active filters (category and live/static)
   */
  private applyFilters(): void {
    let result = [...this.allThemes];
    
    // Filter by category if not "all"
    if (this.selectedCategory !== 'all') {
      result = result.filter(theme => theme.category === this.selectedCategory);
    }
    
    // Filter by live/static preference
    result = result.filter(theme => theme.isLive === this.showLiveThemes);
    
    this.filteredThemes = result;
  }

  /**
   * Handle theme selection
   */
  changeTheme(theme: Theme): void {
    if (theme.premium) {
      // For premium themes, show notification
      alert(`"${theme.name}" is a premium theme. This would take you to the shop!`);
    } else {
      // For free themes, apply immediately
      this.selectedTheme = theme.path;
      localStorage.setItem('selectedTheme', theme.path);
      localStorage.setItem('isVideoBackground', String(theme.isLive));
      
      // If switching to a live theme, clear all ambience effects
      if (theme.isLive) {
        this.clearAmbienceEffects();
      }
      
      window.location.reload();
    }
  }

  

  /**
   * Check if a theme is currently selected
   */
  isSelected(themePath: string): boolean {
    return this.selectedTheme === themePath;
  }

  /**
 * Clear all ambience effects when switching to a live theme
 */
private clearAmbienceEffects(): void {
  // Get current ambience settings
  const savedEffects = localStorage.getItem('ambienceEffects');
  if (savedEffects) {
    try {
      const parsedEffects = JSON.parse(savedEffects);
      
      // Disable all effects
      parsedEffects.forEach((effect: any) => {
        effect.enabled = false;
      });
      
      // Save updated settings
      localStorage.setItem('ambienceEffects', JSON.stringify(parsedEffects));
    } catch (error) {
      console.error('Error clearing ambience effects:', error);
    }
  }
}
}
