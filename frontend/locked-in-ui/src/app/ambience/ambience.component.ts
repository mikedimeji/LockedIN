import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AmbienceEffect {
  id: string;
  name: string;
  icon: string;
  description: string;
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

  effects: AmbienceEffect[] = [
    { id: 'rain', name: 'Rain', icon: '🌧️', description: 'Soft lofi rainfall',  enabled: false },
    { id: 'snow', name: 'Snow', icon: '❄️',  description: 'Gentle snowfall',     enabled: false },
  ];

  activeTab: 'sounds' | 'animations' = 'animations';
  warningMessage = '';
  isEffectsDisabled = false;
  isStaticBackground = true;

  private snowflakes: HTMLElement[] = [];
  private raindrops:  HTMLElement[] = [];
  private snowfallInterval: any;
  private rainfallInterval: any;

  ngOnInit(): void {
    this.checkBackgroundType();
    this.loadSettings();
    if (this.isStaticBackground) {
      this.applyEffects();
    } else {
      this.warningMessage = 'Ambience effects are only available with static backgrounds.';
      this.isEffectsDisabled = true;
    }
  }

  ngOnDestroy(): void { /* effects persist when panel closes */ }

  close(): void { this.closePanel.emit(); }

  setActiveTab(tab: 'sounds' | 'animations'): void { this.activeTab = tab; }

  toggleEffect(effectId: string): void {
    if (!this.isStaticBackground) return;
    const effect = this.effects.find(e => e.id === effectId);
    if (effect) {
      effect.enabled = !effect.enabled;
      this.saveSettings();
      this.applyEffects();
    }
  }

  resetAll(): void {
    this.effects.forEach(e => e.enabled = false);
    this.saveSettings();
    this.clearAllEffects();
  }

  private checkBackgroundType(): void {
    const video = document.querySelector('.background-video') as HTMLElement;
    const gif   = document.querySelector('.gif-background')   as HTMLElement;
    this.isStaticBackground = !(
      (video && video.offsetParent !== null) ||
      (gif   && gif.offsetParent   !== null)
    );
  }

  private saveSettings(): void {
    localStorage.setItem('ambienceEffects', JSON.stringify(this.effects));
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('ambienceEffects');
    if (!saved) return;
    (JSON.parse(saved) as AmbienceEffect[]).forEach(s => {
      const e = this.effects.find(x => x.id === s.id);
      if (e) e.enabled = s.enabled;
    });
  }

  private applyEffects(): void {
    this.clearAllEffects();
    this.effects.forEach(e => {
      if (e.enabled) {
        if (e.id === 'snow') this.startSnowfall();
        if (e.id === 'rain') this.startRainfall();
      }
    });
  }

  private clearAllEffects(): void {
    clearInterval(this.snowfallInterval);
    clearInterval(this.rainfallInterval);
    this.snowfallInterval = null;
    this.rainfallInterval = null;
    [...this.snowflakes, ...this.raindrops].forEach(el => el.parentNode?.removeChild(el));
    this.snowflakes = [];
    this.raindrops  = [];
    document.getElementById('snow-container')?.remove();
    document.getElementById('rain-container')?.remove();
  }

  private makeContainer(id: string): HTMLElement {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '50', overflow: 'hidden'
      });
      document.body.appendChild(el);
    }
    return el;
  }

  // ─── Rain ───────────────────────────────────────────────────────────────
  // Soft lofi aesthetic: thin, straight, sparse, slow, translucent blue-white

  private startRainfall(): void {
    const c = this.makeContainer('rain-container');
    for (let i = 0; i < 30; i++) this.createRaindrop(c, true);
    this.rainfallInterval = setInterval(() => this.createRaindrop(c), 80);
  }

  private createRaindrop(container: HTMLElement, isInitial = false): void {
    const drop = document.createElement('div');
    const x    = Math.random() * window.innerWidth;
    const y0   = isInitial ? Math.random() * window.innerHeight : -14;
    const len  = Math.random() * 7  + 6;    // 6–13 px — short
    const dur  = Math.random() * 2  + 2;    // 2–4 s  — slow
    const op   = Math.random() * 0.25 + 0.15; // 0.15–0.40 — very soft

    Object.assign(drop.style, {
      position: 'absolute',
      width:  `${Math.random() * 0.5 + 0.4}px`, // 0.4–0.9 px
      height: `${len}px`,
      background: 'rgba(200, 225, 255, 1)',  // cool blue-white
      borderRadius: '0 0 2px 2px',
      left:    `${x}px`,
      top:     `${y0}px`,
      opacity: `${op}`,
      pointerEvents: 'none',
    });

    container.appendChild(drop);
    this.raindrops.push(drop);

    const t0 = Date.now(), t1 = t0 + dur * 1000;
    const destY = window.innerHeight + 14;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / (t1 - t0));
      drop.style.top = `${y0 + p * (destY - y0)}px`;
      if (p < 1) requestAnimationFrame(tick);
      else {
        drop.parentNode?.removeChild(drop);
        this.raindrops = this.raindrops.filter(d => d !== drop);
      }
    };
    requestAnimationFrame(tick);
  }

  // ─── Snow ───────────────────────────────────────────────────────────────

  private startSnowfall(): void {
    const c = this.makeContainer('snow-container');
    for (let i = 0; i < 40; i++) this.createSnowflake(c, true);
    this.snowfallInterval = setInterval(() => this.createSnowflake(c), 90);
  }

  private createSnowflake(container: HTMLElement, isInitial = false): void {
    const flake = document.createElement('div');
    const size  = Math.random() * 4  + 2;   // 2–6 px
    const x0    = Math.random() * window.innerWidth;
    const y0    = isInitial ? Math.random() * window.innerHeight : -8;
    const dur   = Math.random() * 10 + 8;   // 8–18 s — slow dreamy drift
    const drift = (Math.random() - 0.5) * 60;
    const op    = Math.random() * 0.45 + 0.45; // 0.45–0.9

    Object.assign(flake.style, {
      position:    'absolute',
      width:       `${size}px`,
      height:      `${size}px`,
      borderRadius:'50%',
      background:  '#fff',
      boxShadow:   '0 0 4px rgba(255,255,255,0.45)',
      left:        `${x0}px`,
      top:         `${y0}px`,
      opacity:     `${op}`,
      pointerEvents:'none',
    });

    container.appendChild(flake);
    this.snowflakes.push(flake);

    const t0 = Date.now(), t1 = t0 + dur * 1000;
    const destY = window.innerHeight + 8;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / (t1 - t0));
      flake.style.top  = `${y0 + p * (destY - y0)}px`;
      flake.style.left = `${x0 + drift * p + Math.sin(p * Math.PI * 5) * 14}px`;
      if (p < 1) requestAnimationFrame(tick);
      else {
        flake.parentNode?.removeChild(flake);
        this.snowflakes = this.snowflakes.filter(f => f !== flake);
      }
    };
    requestAnimationFrame(tick);
  }
}
