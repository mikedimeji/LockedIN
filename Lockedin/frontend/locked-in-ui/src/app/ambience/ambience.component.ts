import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AmbienceEffect {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-ambience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ambience.component.html',
  styleUrls: ['./ambience.component.css']
})
export class AmbienceComponent implements OnInit, OnDestroy {
  @Output() closePanel = new EventEmitter<void>();
  
  // Available ambience effects
  effects: AmbienceEffect[] = [
    { id: 'rain', name: 'Rain', icon: '💧', enabled: false },
    { id: 'snow', name: 'Snow', icon: '❄️', enabled: false }
  ];
  
  // UI state
  activeTab: 'sounds' | 'animations' = 'animations';
  isVisible: boolean = true;
  isStaticBackground: boolean = true;

  // Add these properties
  warningMessage: string = '';
  isEffectsDisabled: boolean = false;

  // Snow effect properties
  private snowflakes: HTMLElement[] = [];
  private raindrops: HTMLElement[] = [];
  private snowfallInterval: any;
  private rainfallInterval: any;
  
  constructor() {}

  ngOnInit(): void {
    this.checkBackgroundType();
    // Load saved settings from localStorage
    this.loadSettings();
    
    // Apply active effects
    this.applyEffects();

    // Apply active effects only if we have a static background
    if (this.isStaticBackground) {
      this.applyEffects();
      this.warningMessage = '';
      this.isEffectsDisabled = false;
    } else {
      this.warningMessage = 'Ambience effects are only available with static backgrounds.';
      this.isEffectsDisabled = true;
    }
  }

  ngOnDestroy(): void {
    // Important: DON'T clear effects here
    // We only want to hide the UI, not stop the effects
  }

  /**
   * Close the panel without clearing effects
   */
  close(): void {
    this.closePanel.emit();
    // Note: We don't call clearAllEffects() here
    // Effects should persist even when panel is closed
  }

  /**
   * Switch between tabs
   */
  setActiveTab(tab: 'sounds' | 'animations'): void {
    this.activeTab = tab;
  }

  /**
   * Check if the current background is a static image or a video/GIF
   */
  private checkBackgroundType(): void {
    // Check if the current theme is a video or animated GIF
    const videoElement = document.querySelector('.background-video') as HTMLVideoElement;
    const gifElement = document.querySelector('.gif-background') as HTMLElement;
    
    // If either video or gif element exists and is visible, we're not using a static background
    if ((videoElement && (videoElement as HTMLElement).offsetParent !== null) || 
        (gifElement && gifElement.offsetParent !== null)) {
      this.isStaticBackground = false;
      console.log('Dynamic background detected - ambience effects disabled');
    } else {
      this.isStaticBackground = true;
      console.log('Static background detected - ambience effects available');
    }
  }


/**
   * Toggle an effect on or off
   */
toggleEffect(effectId: string): void {
  // Only allow toggling if we have a static background
  if (!this.isStaticBackground) {
    console.log('Cannot toggle effects with dynamic background');
    return;
  }
  
  const effect = this.effects.find(e => e.id === effectId);
  if (effect) {
    effect.enabled = !effect.enabled;
    this.saveSettings();
    this.applyEffects();
  }
}

  /**
   * Reset all effects to disabled state
   */
  resetAll(): void {
    this.effects.forEach(effect => effect.enabled = false);
    this.saveSettings();
    this.clearAllEffects();
  }

  /**
   * Save current settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('ambienceEffects', JSON.stringify(this.effects));
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const savedEffects = localStorage.getItem('ambienceEffects');
    if (savedEffects) {
      const parsedEffects = JSON.parse(savedEffects) as AmbienceEffect[];
      
      // Update only the enabled status from saved settings
      parsedEffects.forEach(savedEffect => {
        const effect = this.effects.find(e => e.id === savedEffect.id);
        if (effect) {
          effect.enabled = savedEffect.enabled;
        }
      });
    }
  }

  /**
   * Apply all enabled effects
   */
  private applyEffects(): void {
    // Clear existing effects first
    this.clearAllEffects();
    console.log('Cleared previous effects');
    
    // Apply each enabled effect
    this.effects.forEach(effect => {
      if (effect.enabled) {
        console.log(`Applying effect: ${effect.id}`);
        if (effect.id === 'snow') {
          this.startSnowfall();
        } else if (effect.id === 'rain') {
          this.startRainfall();
        }
      }
    });
  }

  /**
   * Clear all active effects
   */
  private clearAllEffects(): void {
    // Clear snowfall
    if (this.snowfallInterval) {
      clearInterval(this.snowfallInterval);
      this.snowfallInterval = null;
    }
    
    // Clear rainfall
    if (this.rainfallInterval) {
      clearInterval(this.rainfallInterval);
      this.rainfallInterval = null;
    }
    
    // Remove all snowflakes
    this.snowflakes.forEach(flake => {
      if (flake && flake.parentNode) {
        flake.parentNode.removeChild(flake);
      }
    });
    this.snowflakes = [];
    
    // Remove all raindrops
    this.raindrops.forEach(drop => {
      if (drop && drop.parentNode) {
        drop.parentNode.removeChild(drop);
      }
    });
    this.raindrops = [];
    
    // Remove containers if they exist
    const snowContainer = document.getElementById('snow-container');
    if (snowContainer && snowContainer.parentNode) {
      snowContainer.parentNode.removeChild(snowContainer);
    }
    
    const rainContainer = document.getElementById('rain-container');
    if (rainContainer && rainContainer.parentNode) {
      rainContainer.parentNode.removeChild(rainContainer);
    }
  }

/**
 * Start the snowfall effect
 */
private startSnowfall(): void {
  // Create a container for the snowflakes if it doesn't exist
  let snowContainer = document.getElementById('snow-container');
  if (!snowContainer) {
    snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    snowContainer.style.position = 'fixed';
    snowContainer.style.top = '0';
    snowContainer.style.left = '0';
    snowContainer.style.width = '100%';
    snowContainer.style.height = '100%';
    snowContainer.style.pointerEvents = 'none';
    // Change back to a positive z-index to ensure visibility
    snowContainer.style.zIndex = '50'; 
    snowContainer.style.overflow = 'hidden';
    document.body.appendChild(snowContainer);
    console.log('Snowfall container created');
  }
  
  // Create initial batch of snowflakes for immediate effect
  for (let i = 0; i < 50; i++) {
    if (snowContainer) {
      this.createSnowflake(snowContainer, true);
    }
  }
  
  // Start creating snowflakes at an interval
  this.snowfallInterval = setInterval(() => {
    if (snowContainer) {
      this.createSnowflake(snowContainer);
    }
  }, 100); // More frequent interval for better effect
  
  console.log('Snowfall effect started');
}

  /**
   * Create a single snowflake with direct animation
   */
  private createSnowflake(container: HTMLElement, isInitial: boolean = false): void {
    // Create snowflake element
    const snowflake = document.createElement('div');
    
    // Random properties for natural movement
    const size = Math.random() * 5 + 3; // Size between 3px and 8px
    const startPositionX = Math.random() * window.innerWidth;
    const startPositionY = isInitial ? Math.random() * window.innerHeight : -10;
    const fallDuration = Math.random() * 8 + 7; // Fall duration between 7s and 15s
    
    // Apply direct styles - ensure visibility with higher opacity
    snowflake.style.position = 'absolute';
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.borderRadius = '50%';
    // Use brighter white color and stronger shadow
    snowflake.style.backgroundColor = '#ffffff';
    snowflake.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
    snowflake.style.left = `${startPositionX}px`;
    snowflake.style.top = `${startPositionY}px`;
    // Increase minimum opacity for better visibility
    snowflake.style.opacity = (Math.random() * 0.5 + 0.5).toString(); 
    snowflake.style.pointerEvents = 'none';
    
    // Add to container and track for cleanup
    container.appendChild(snowflake);
    this.snowflakes.push(snowflake);
    
    // Manual animation for better browser compatibility
    const startTime = Date.now();
    const endTime = startTime + (fallDuration * 1000);
    const destinationY = window.innerHeight + 10;
    const horizontalMovement = (Math.random() * 100) - 50; // Move between -50px and 50px horizontally
    
    const animateSnowflake = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / (endTime - startTime));
      
      // Calculate vertical position
      const currentY = startPositionY + (progress * (destinationY - startPositionY));
      
      // Calculate horizontal position with wiggle
      const wiggle = Math.sin(progress * Math.PI * 4) * 10;
      const currentX = startPositionX + (progress * horizontalMovement) + wiggle;
      
      // Update position
      snowflake.style.top = `${currentY}px`;
      snowflake.style.left = `${currentX}px`;
      
      // Continue animation or clean up
      if (progress < 1) {
        requestAnimationFrame(animateSnowflake);
      } else {
        if (snowflake.parentNode) {
          snowflake.parentNode.removeChild(snowflake);
          this.snowflakes = this.snowflakes.filter(flake => flake !== snowflake);
        }
      }
    };
    
    // Start animation
    requestAnimationFrame(animateSnowflake);
  }

  /**
 * Start the rainfall effect
 */
  private startRainfall(): void {
    // Create a container for the raindrops if it doesn't exist
    let rainContainer = document.getElementById('rain-container');
    if (!rainContainer) {
      rainContainer = document.createElement('div');
      rainContainer.id = 'rain-container';
      rainContainer.style.position = 'fixed';
      rainContainer.style.top = '0';
      rainContainer.style.left = '0';
      rainContainer.style.width = '100%';
      rainContainer.style.height = '100%';
      rainContainer.style.pointerEvents = 'none';
      // Change back to a positive z-index to ensure visibility
      rainContainer.style.zIndex = '50'; 
      rainContainer.style.overflow = 'hidden';
      document.body.appendChild(rainContainer);
      console.log('Rainfall container created');
    }
    
    // Create initial batch of raindrops for immediate effect
    for (let i = 0; i < 80; i++) {
      if (rainContainer) {
        this.createRaindrop(rainContainer, true);
      }
    }
    
    // Start creating raindrops at an interval
    this.rainfallInterval = setInterval(() => {
      if (rainContainer) {
        this.createRaindrop(rainContainer);
      }
    }, 50); // Faster interval for rain
    
    console.log('Rainfall effect started');
  }

  // Update in ambience.component.ts for the createRaindrop method

/**
 * Create a single raindrop with direct animation - updated with proper fallDuration
 */
private createRaindrop(container: HTMLElement, isInitial: boolean = false): void {
  // Create raindrop element
  const raindrop = document.createElement('div');
  
  // Random properties
  const startPositionX = Math.random() * window.innerWidth;
  const startPositionY = isInitial ? Math.random() * window.innerHeight : -20;
  const length = Math.random() * 15 + 15; // Length between 15px and 30px
  const fallDuration = Math.random() * 0.6 + 0.4; // Fall duration between 0.4s and 1s
  
  // Apply direct styles - WHITE color like in the example
  raindrop.style.position = 'absolute';
  raindrop.style.width = '1px'; // Thinner width like in the example
  raindrop.style.height = `${length}px`;
  // Changed to white color with high opacity to match the example
  raindrop.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  raindrop.style.left = `${startPositionX}px`;
  raindrop.style.top = `${startPositionY}px`;
  raindrop.style.opacity = (Math.random() * 0.3 + 0.7).toString();
  raindrop.style.transform = 'rotate(15deg)'; // Less slant to match example
  raindrop.style.pointerEvents = 'none';
  
  // Add to container and track for cleanup
  container.appendChild(raindrop);
  this.raindrops.push(raindrop);
  
  // Manual animation for better browser compatibility
  const startTime = Date.now();
  const endTime = startTime + (fallDuration * 1000);
  const destinationY = window.innerHeight + 20;
  
  const animateRaindrop = () => {
    const now = Date.now();
    const progress = Math.min(1, (now - startTime) / (endTime - startTime));
    
    // Calculate vertical position
    const currentY = startPositionY + (progress * (destinationY - startPositionY));
    
    // Update position
    raindrop.style.top = `${currentY}px`;
    
    // Continue animation or clean up
    if (progress < 1) {
      requestAnimationFrame(animateRaindrop);
    } else {
      if (raindrop.parentNode) {
        raindrop.parentNode.removeChild(raindrop);
        this.raindrops = this.raindrops.filter(drop => drop !== raindrop);
      }
    }
  };
  
  // Start animation
  requestAnimationFrame(animateRaindrop);
}
}
