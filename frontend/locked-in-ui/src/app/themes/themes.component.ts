import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { GoldStreakService } from '../gold-streak.service';
import { UserPreferencesService } from '../user-preferences.service';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';

// Define types for better type safety
interface Theme {
  path: string;
  name: string;
  premium: boolean;
  category: string;
  isLive: boolean;
  goldCost?: number;
  unlocked?: boolean;
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
    CommonModule,
    TutorialModalComponent
  ],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.css'
})
export class ThemesComponent implements OnInit {
  // Tutorial
  showTutorial: boolean = false;
  tutorialSteps: TutorialStep[] = [];

  // Available theme categories
  categories: Category[] = [
    { id: 'all', name: 'All', icon: 'assets/images/nav/theme.jpg' },
    { id: 'custom', name: 'Custom', icon: 'assets/images/nav/two-coins.png' },
    { id: 'aesthetic', name: 'Aesthetic', icon: 'assets/images/nav/star-flag.png' },
    { id: 'chill', name: 'Chill', icon: 'assets/images/nav/sun-cloud.png' },
    { id: 'study', name: 'Study', icon: 'assets/images/nav/alarm-clock.png' },
    { id: 'anime', name: 'Anime', icon: 'assets/images/nav/checklist.png' }
  ];

  // Updated allThemes array with dynamic pricing and unlock status
  allThemes: Theme[] = [
    // ── Free live themes (starter page) ──
    { path: 'assets/videos/witch.gif',         name: 'Witch',          premium: false, category: 'anime',      isLive: true,  unlocked: true },
    { path: 'assets/videos/lain.gif',           name: 'Lain',           premium: false, category: 'anime',      isLive: true,  unlocked: true },
    { path: 'assets/videos/cafe.gif',           name: 'Cafe',           premium: false, category: 'study',      isLive: true,  unlocked: true },
    { path: 'assets/videos/sky-view-pink.gif',  name: 'Sky Pink',       premium: false, category: 'chill',      isLive: true,  unlocked: true },
    { path: 'assets/videos/cyberpunk.gif',      name: 'Cyberpunk',      premium: false, category: 'aesthetic',  isLive: true,  unlocked: true },
    { path: 'assets/videos/castle.gif',         name: 'Castle',         premium: false, category: 'chill',      isLive: true,  unlocked: true },
    { path: 'assets/videos/nakedwhy.gif',       name: 'Retro Girl',     premium: false, category: 'aesthetic',  isLive: true,  unlocked: true },
    { path: 'assets/videos/vending.gif',        name: 'Vending Machine',premium: false, category: 'aesthetic',  isLive: true,  unlocked: true },

    // ── Free static themes ──
    { path: 'assets/images/themes/city.jpg',       name: 'Retro Room',     premium: false, category: 'aesthetic', isLive: false, unlocked: true },
    { path: 'assets/images/themes/house-roshi.jpg',name: 'Mountain View',  premium: false, category: 'chill',     isLive: false, unlocked: true },

    // ── Premium live themes ──
    { path: 'assets/videos/city2.gif',          name: 'City Overview',  premium: true, category: 'aesthetic',  isLive: true,  goldCost: 100,  unlocked: false },
    { path: 'assets/videos/museum-fish.gif',    name: 'Aquarium',       premium: true, category: 'chill',      isLive: true,  goldCost: 100,  unlocked: false },
    { path: 'assets/videos/pink-monitor.gif',   name: 'Pink Setup',     premium: true, category: 'aesthetic',  isLive: true,  goldCost: 120,  unlocked: false },
    { path: 'assets/videos/gamer-monitors.gif', name: 'Gamer Setup',    premium: true, category: 'aesthetic',  isLive: true,  goldCost: 120,  unlocked: false },
    { path: 'assets/videos/rooftopgamer.gif',   name: 'Rooftop Gamer',  premium: true, category: 'study',      isLive: true,  goldCost: 150,  unlocked: false },
    { path: 'assets/videos/girlflowers.gif',    name: 'Girl & Flowers', premium: true, category: 'chill',      isLive: true,  goldCost: 180,  unlocked: false },
    { path: 'assets/videos/p-road.gif',         name: 'Night Drive',    premium: true, category: 'aesthetic',  isLive: true,  goldCost: 200,  unlocked: false },
    { path: 'assets/videos/japan.gif',          name: 'Japan Street',   premium: true, category: 'aesthetic',  isLive: true,  goldCost: 200,  unlocked: false },
    { path: 'assets/videos/yumenikki.mp4',      name: 'Yume Nikki',     premium: true, category: 'custom',     isLive: true,  goldCost: 300,  unlocked: false },
    { path: 'assets/videos/cathargic_day.gif',  name: 'Cathartic Day',  premium: true, category: 'chill',      isLive: true,  goldCost: 350,  unlocked: false },
    { path: 'assets/videos/VA11HALLA.gif',      name: 'VA-11 HALL-A',   premium: true, category: 'custom',     isLive: true,  goldCost: 400,  unlocked: false },
    { path: 'assets/videos/tokyo.gif',          name: 'Tokyo',          premium: true, category: 'anime',      isLive: true,  goldCost: 500,  unlocked: false },
    { path: 'assets/videos/scottpill.gif',      name: 'Scott Pill',     premium: true, category: 'aesthetic',  isLive: true,  goldCost: 800,  unlocked: false },

    // ── Premium live themes (new) ──
    { path: 'assets/videos/aquareum.gif',           name: 'Aquareum',     premium: true, category: 'chill',     isLive: true,  goldCost: 150, unlocked: false },
    { path: 'assets/videos/boat.gif',               name: 'Boat',         premium: true, category: 'chill',     isLive: true,  goldCost: 120, unlocked: false },
    { path: 'assets/videos/gif38bit-restaurant.gif',name: 'Pixel Diner',  premium: true, category: 'aesthetic', isLive: true,  goldCost: 200, unlocked: false },
    { path: 'assets/videos/mario.gif',              name: 'Mario',        premium: true, category: 'custom',    isLive: true,  goldCost: 250, unlocked: false },
    { path: 'assets/videos/zelda.gif',              name: 'Zelda',        premium: true, category: 'custom',    isLive: true,  goldCost: 300, unlocked: false },

    // ── Premium static themes ──
    { path: 'assets/images/themes/lo-fi.jpg',        name: '-9',           premium: true, category: 'study',     isLive: false, goldCost: 60,  unlocked: false },
    { path: 'assets/images/themes/rei.webp',        name: 'Rei',          premium: true, category: 'anime',     isLive: false, goldCost: 100, unlocked: false },
    { path: 'assets/images/themes/abstractwell.webp',name: 'Abstract Well',premium: true, category: 'aesthetic', isLive: false, goldCost: 150, unlocked: false },
    { path: 'assets/images/themes/bones.webp',      name: 'Bones',        premium: true, category: 'aesthetic', isLive: false, goldCost: 150, unlocked: false },
    { path: 'assets/images/themes/flcl.webp',       name: 'FLCL',         premium: true, category: 'anime',     isLive: false, goldCost: 200, unlocked: false },
    { path: 'assets/images/themes/isolation.jpg',   name: 'Isolation',    premium: true, category: 'chill',     isLive: false, goldCost: 120, unlocked: false },
    { path: 'assets/images/themes/lol.jpg',         name: 'League',       premium: true, category: 'custom',    isLive: false, goldCost: 200, unlocked: false },
    { path: 'assets/images/themes/poke.jpg',        name: 'Pokémon',      premium: true, category: 'anime',     isLive: false, goldCost: 200, unlocked: false },
    { path: 'assets/images/themes/smoker.jpg',      name: 'Smoker',       premium: true, category: 'chill',     isLive: false, goldCost: 150, unlocked: false },
  ];

  // Themes that match the current filter
  filteredThemes: Theme[] = [];
  
  // Currently selected theme and category
  selectedTheme: string = ''; 
  selectedCategory: string = 'all';
  
  // Toggle for live/static wallpapers
  showLiveThemes: boolean = true;

  userGoldBalance: number = 0;

  //pagination
  currentPage: number = 0;
  themesPerPage: number = 10;
  paginatedThemes: Theme[] = [];
  totalPages: number = 0;

  constructor(
    private router: Router,
    private goldStreakService: GoldStreakService,
    private userPreferencesService: UserPreferencesService,
    private tutorialService: TutorialService
  ) {}

  ngOnInit(): void {
    // Check if tutorial should show
    if (!this.tutorialService.hasSeenTutorial('themes')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('themes');
      this.showTutorial = true;
    }

    const DEFAULT_THEME = 'assets/videos/witch.gif';
    if (this.userPreferencesService.getCurrentPreferences()) {
      // Load from backend service if available
      const prefs = this.userPreferencesService.getCurrentPreferences();
      this.selectedTheme = prefs?.selectedTheme || DEFAULT_THEME;
    } else {
      // Fallback to localStorage
      const savedTheme = localStorage.getItem('selectedTheme');
      this.selectedTheme = savedTheme || DEFAULT_THEME;
    }
    
    // Check if there's a saved preference for live/static themes
    const showLive = localStorage.getItem('showLiveThemes');
    if (showLive !== null) {
      this.showLiveThemes = showLive === 'true';
    }

    // Load user's gold balance
    this.loadUserGoldBalance();
    
    // Load user's unlocked themes from localStorage
    this.loadUnlockedThemes();

    // Initialize filtered themes
    this.applyFilters();
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) {
      this.tutorialService.markTutorialAsSeen('themes');
    }
    this.showTutorial = false;
  }

  onTutorialSkip(): void {
    this.showTutorial = false;
  }

  /**
   * Load user's current gold balance
   */
  private loadUserGoldBalance(): void {
    this.goldStreakService.getGoldBalance().subscribe({
      next: (response) => {
        this.userGoldBalance = response.goldBalance || 0;
      },
      error: (error) => {
        console.error('Error loading gold balance:', error);
        // Fallback to localStorage if API fails
        const savedGold = localStorage.getItem('userGoldBalance');
        this.userGoldBalance = savedGold ? parseInt(savedGold) : 0;
      }
    });
  }

  /**
   * Load user's unlocked themes from localStorage
   */
  private loadUnlockedThemes(): void {
    const unlockedThemes = localStorage.getItem('unlockedThemes');
    if (unlockedThemes) {
      try {
        const unlockedPaths = JSON.parse(unlockedThemes);
        this.allThemes.forEach(theme => {
          if (unlockedPaths.includes(theme.path)) {
            theme.unlocked = true;
          }
        });
      } catch (error) {
        console.error('Error loading unlocked themes:', error);
      }
    }
  }

  /**
   * Save unlocked themes to localStorage
   */
  private saveUnlockedThemes(): void {
    const unlockedPaths = this.allThemes
      .filter(theme => theme.unlocked)
      .map(theme => theme.path);
    localStorage.setItem('unlockedThemes', JSON.stringify(unlockedPaths));
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
   * Apply all active filters (category and live/static) and reset pagination
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
    
    // Reset to first page when filters change
    this.currentPage = 0;
    this.updatePagination();
  }

  changeTheme(theme: Theme): void {
    // Close tutorial immediately if it's open
    if (this.showTutorial) {
      this.tutorialService.markTutorialAsSeen('themes');
      this.showTutorial = false;
    }

    // If theme is free or already unlocked, apply it immediately
    if (!theme.premium || theme.unlocked) {
      this.selectedTheme = theme.path;
      
      // Save to backend if logged in
      this.userPreferencesService.updateSelectedTheme(theme.path, theme.isLive).subscribe({
        next: (prefs) => {
          console.log('Theme updated on backend:', prefs);
          
          // Update localStorage as backup
          localStorage.setItem('selectedTheme', theme.path);
          localStorage.setItem('isVideoBackground', String(theme.isLive));
          
          // If switching to a live theme, clear all ambience effects
          if (theme.isLive) {
            this.clearAmbienceEffects();
          }
          
          // Reload to apply the new theme
          window.location.reload();
        },
        error: (error) => {
          console.error('Error updating theme on backend:', error);
          
          // Fallback to localStorage
          localStorage.setItem('selectedTheme', theme.path);
          localStorage.setItem('isVideoBackground', String(theme.isLive));
          
          if (theme.isLive) {
            this.clearAmbienceEffects();
          }
          
          window.location.reload();
        }
      });
      
      return;
    }

    // Theme is premium and locked - handle purchase
    if (theme.premium && !theme.unlocked) {
      this.handleThemePurchase(theme);
    }
  }

  /**
   * Handle premium theme purchase with backend validation
   */
  private handleThemePurchase(theme: Theme): void {
    const goldCost = theme.goldCost || 500;
    
    // First, get fresh gold balance from backend to ensure accuracy
    this.goldStreakService.getGoldBalance().subscribe({
      next: (response) => {
        this.userGoldBalance = response.goldBalance || response.currentGold || 0;
        
        // Check if user has enough gold
        if (this.userGoldBalance < goldCost) {
          alert(`Insufficient gold! You need ${goldCost} gold but only have ${this.userGoldBalance}. Complete more pomodoros to earn gold!`);
          return;
        }

        // Confirm purchase
        const confirmPurchase = confirm(
          `Purchase "${theme.name}" for ${goldCost} gold?\n\nYour current balance: ${this.userGoldBalance} gold\nAfter purchase: ${this.userGoldBalance - goldCost} gold`
        );

        if (confirmPurchase) {
          this.purchaseTheme(theme, goldCost);
        }
      },
      error: (error) => {
        console.error('Error fetching gold balance:', error);
        alert('Unable to verify gold balance. Please try again.');
      }
    });
  }

  /**
   * Process the theme purchase with backend integration
   */
  private purchaseTheme(theme: Theme, goldCost: number): void {
    // Use the new backend purchase method
    this.userPreferencesService.purchaseTheme(theme.path, theme.name, goldCost).subscribe({
      next: (result) => {
        if (result.success) {
          // Spend gold via existing service
          this.goldStreakService.spendGold(goldCost).subscribe({
            next: (goldResponse) => {
              // Update local state
              this.userGoldBalance = result.remainingGold || goldResponse.goldBalance || (this.userGoldBalance - goldCost);
              theme.unlocked = true;
              
              // Update localStorage as backup
              localStorage.setItem('userGoldBalance', this.userGoldBalance.toString());
              this.saveUnlockedThemes();
              
              // Apply the newly purchased theme
              this.selectedTheme = theme.path;
              
              // Update backend with new selected theme
              this.userPreferencesService.updateSelectedTheme(theme.path, theme.isLive).subscribe({
                next: () => {
                  localStorage.setItem('selectedTheme', theme.path);
                  localStorage.setItem('isVideoBackground', String(theme.isLive));
                  
                  if (theme.isLive) {
                    this.clearAmbienceEffects();
                  }

                  // Mark tutorial as seen before reload
                  this.tutorialService.markTutorialAsSeen('themes');

                  alert(`Successfully purchased "${theme.name}"! Theme applied. Remaining gold: ${this.userGoldBalance}`);
                  window.location.reload();
                }
              });
            },
            error: (goldError) => {
              console.error('Error spending gold:', goldError);
              alert('Purchase completed but there was an error updating gold balance.');
            }
          });
        }
      },
      error: (error) => {
        console.error('Error purchasing theme:', error);
        alert('Purchase failed. Please try again.');
      }
    });
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

  /**
   * Update pagination based on current filtered themes
   */
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredThemes.length / this.themesPerPage);
    
    // Ensure current page is valid
    if (this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }
    
    // Calculate start and end indices for current page
    const startIndex = this.currentPage * this.themesPerPage;
    const endIndex = startIndex + this.themesPerPage;
    
    // Get themes for current page
    this.paginatedThemes = this.filteredThemes.slice(startIndex, endIndex);
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Check if we can go to next page
   */
  canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  /**
   * Check if we can go to previous page
   */
  canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Get array of page numbers for pagination dots
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
