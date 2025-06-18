import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AmbienceEffect {
  id: string;
  name: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AmbienceService {
  
  // Observable sources
  private effectsSource = new BehaviorSubject<AmbienceEffect[]>([
    { id: 'rain', name: 'Rain', enabled: false },
    { id: 'snow', name: 'Snow', enabled: false }
  ]);
  
  // Observable streams
  effects$ = this.effectsSource.asObservable();
  
  constructor() {
    this.loadSettings();
  }
  
  /**
   * Toggle an effect on or off
   */
  toggleEffect(effectId: string): void {
    const currentEffects = this.effectsSource.value;
    const updatedEffects = currentEffects.map(effect => {
      if (effect.id === effectId) {
        return { ...effect, enabled: !effect.enabled };
      }
      return effect;
    });
    
    this.updateEffects(updatedEffects);
  }
  
  /**
   * Reset all effects to disabled state
   */
  resetAllEffects(): void {
    const resetEffects = this.effectsSource.value.map(effect => ({
      ...effect,
      enabled: false
    }));
    
    this.updateEffects(resetEffects);
  }
  
  /**
   * Check if a specific effect is enabled
   */
  isEffectEnabled(effectId: string): boolean {
    const effect = this.effectsSource.value.find(e => e.id === effectId);
    return effect ? effect.enabled : false;
  }
  
  /**
   * Update effects and save settings
   */
  private updateEffects(effects: AmbienceEffect[]): void {
    this.effectsSource.next(effects);
    this.saveSettings();
  }
  
  /**
   * Save current settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('ambienceEffects', JSON.stringify(this.effectsSource.value));
  }
  
  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const savedEffects = localStorage.getItem('ambienceEffects');
    if (savedEffects) {
      try {
        const parsedEffects = JSON.parse(savedEffects) as AmbienceEffect[];
        
        // Update enabled status from saved settings while preserving current structure
        const currentEffects = this.effectsSource.value;
        const updatedEffects = currentEffects.map(currentEffect => {
          const savedEffect = parsedEffects.find(e => e.id === currentEffect.id);
          if (savedEffect) {
            return { ...currentEffect, enabled: savedEffect.enabled };
          }
          return currentEffect;
        });
        
        this.effectsSource.next(updatedEffects);
      } catch (error) {
        console.error('Error loading ambience settings:', error);
      }
    }
  }
}