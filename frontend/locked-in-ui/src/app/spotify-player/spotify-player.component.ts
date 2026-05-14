import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID, NgZone } from '@angular/core';
import { SpotifyAuthService } from "./spotifyAuth";
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser, NgForOf, NgIf } from "@angular/common";
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { takeUntil, retryWhen, delay, take } from 'rxjs/operators';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';

declare global {
  interface Window { Spotify: any; }
}

interface SpotifyPlayerError {
  message: string;
}

interface SpotifyPlayerReady {
  device_id: string;
}

interface SpotifyPlayerState {
  paused: boolean;
}

interface TrackInfo {
  name: string;
  artist: string;
  duration: number;
  uri: string;
  albumArt?: string;
}

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [HttpClientModule, NgIf, NgForOf, TutorialModalComponent],
  templateUrl: './spotify-player.component.html',
  styleUrls: ['./spotify-player.component.css']
})
export class SpotifyPlayerComponent implements OnInit, OnDestroy {
  // Tutorial
  showTutorial: boolean = false;
  tutorialSteps: TutorialStep[] = [];
  
  accessToken: string | null = null;
  deviceId: string | null = null;
  isPlaying: boolean = false;
  searchResults: any[] = [];
  errorMessage: string = '';
  private player: any;
  private destroy$ = new Subject<void>();
  private retryAttempts = new BehaviorSubject<number>(0);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;
  dragging = false;
  offsetX = 0;
  offsetY = 0;
  currentPlaybackPosition: number = 0;
  playerPosition = { x: 0, y: 0 };
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  isExpanded: boolean = false;
  currentPlaylist: any = null;
  private readonly PLAYLIST_ID = '4gZBb5gHqjAtPbghcNTVZW';
  initialTrackId: string = '2pn1zRkKjBmumnDPJTznsO';
  defaultTrackInfo: TrackInfo = {
    name: 'Real and Ideal',
    artist: 'ALSU TEAM',
    duration: 0,
    uri: `spotify:track:${this.initialTrackId}`,
    albumArt: undefined
  };

  volume: number = 0.5;
  progressPercentage: number = 0;
  trackDuration: number = 0;
  currentTrackInfo: TrackInfo = this.defaultTrackInfo;
  private progressInterval: any = null;

  constructor(
    private spotifyAuth: SpotifyAuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private tutorialService: TutorialService
  ) {}

  ngOnInit() {
    // Check if tutorial should show
    if (!this.tutorialService.hasSeenTutorial('spotify')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('spotify');
      this.showTutorial = true;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.playerPosition = {
        x: window.innerWidth - 316,
        y: window.innerHeight - 220
      };

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        console.log('Authorization code received, exchanging for token...');
        this.getAccessToken(code);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const savedToken = localStorage.getItem('spotify_access_token');
        
        if (savedToken) {
          console.log('Found saved token, validating...');
          this.accessToken = savedToken;
          this.spotifyAuth.accessToken = savedToken;
          this.validateAndLoadPlayer();
        } else {
          console.log('No token found, user needs to log in');
        }
      }
    }
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) {
      this.tutorialService.markTutorialAsSeen('spotify');
    }
    this.showTutorial = false;
  }

  onTutorialSkip(): void {
    this.showTutorial = false;
  }

  private validateAndLoadPlayer() {
    this.spotifyAuth.getCurrentPlayback(this.accessToken!)
      .subscribe({
        next: () => {
          console.log('Token is valid, loading player...');
          this.loadSpotifyPlayer();
        },
        error: (error) => {
          if (error.status === 401) {
            console.log('Token expired, clearing and showing login...');
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            this.accessToken = null;
            this.spotifyAuth.accessToken = null;
          } else {
            console.log('Token valid but no active playback, loading player...');
            this.loadSpotifyPlayer();
          }
        }
      });
  }

  loadInitialTrack() {
    if (!this.accessToken || !this.deviceId) {
      console.log('Cannot load initial track yet - missing token or device');
      return;
    }
    
    console.log('Loading initial track: Real and Ideal');
    
    this.spotifyAuth.makeAuthorizedRequest(
      `https://api.spotify.com/v1/tracks/${this.initialTrackId}`,
      'GET',
      null
    ).subscribe({
      next: (track: any) => {
        console.log('Initial track info loaded:', track);
        this.currentTrackInfo = {
          name: track.name,
          artist: track.artists[0].name,
          duration: track.duration_ms,
          uri: track.uri,
          albumArt: track.album?.images?.[0]?.url
        };
      },
      error: (error) => {
        console.error('Error loading track info:', error);
      }
    });
  }

  startDragging(event: MouseEvent, element: HTMLElement) {
    this.isDragging = true;
    const rect = element.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    event.preventDefault();
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded && !this.currentPlaylist) {
      this.loadPlaylist();
    }
  }

  loadPlaylist() {
    if (!this.accessToken) return;
    
    this.spotifyAuth.makeAuthorizedRequest(
      `https://api.spotify.com/v1/playlists/${this.PLAYLIST_ID}`,
      'GET',
      null
    ).subscribe({
      next: (playlist: any) => {
        this.currentPlaylist = playlist;
      },
      error: (error) => {
        this.setError('Error loading playlist: ' + error.message);
      }
    });
  }
  
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  stopDragging() {
    this.isDragging = false;
  }
  
  onDragging(event: MouseEvent) {
    if (this.isDragging) {
      this.playerPosition = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y
      };
      this.playerPosition.x = Math.max(0, Math.min(window.innerWidth - 320, this.playerPosition.x));
      this.playerPosition.y = Math.max(0, Math.min(window.innerHeight - 400, this.playerPosition.y));
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.spotifyAuth.pausePlayback(this.spotifyAuth.accessToken!)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => {
            this.isPlaying = false;
            console.log('Playback paused');
          },
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.togglePlayPause());
            } else {
              this.setError('Error pausing playback: ' + error.message);
            }
          },
        });
    } else {
      const body = this.currentPlaybackPosition
        ? { position_ms: this.currentPlaybackPosition }
        : null;
  
      const url = `https://api.spotify.com/v1/me/player/play`;
  
      this.spotifyAuth
        .makeAuthorizedRequest(url, 'PUT', body)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => {
            this.isPlaying = true;
            console.log('Playback resumed');
          },
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.togglePlayPause());
            } else {
              this.setError('Error resuming playback: ' + error.message);
            }
          },
        });
    }
  }

  login() {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = this.spotifyAuth.getAuthUrl();
    }
  }

  getAccessToken(code: string) {
    this.spotifyAuth.getAccessToken(code).subscribe({
      next: (response) => {
        this.accessToken = response.access_token;
        this.spotifyAuth.accessToken = response.access_token;
        localStorage.setItem('spotify_access_token', response.access_token);
        localStorage.setItem('spotify_refresh_token', response.refresh_token);
        this.loadSpotifyPlayer();
        this.loadPlaylist();
      },
      error: (error) => {
        this.setError('Error getting access token: ' + error.message);
      }
    });
  }

  loadSpotifyPlayer() {
    if (isPlatformBrowser(this.platformId)) {
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Spotify Web Playback SDK is ready');
        this.ngZone.run(() => {
          this.initializeSpotifyPlayer();
        });
      };

      if (!document.getElementById('spotify-player-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-player-script';
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        
        script.onload = () => {
          console.log('Spotify SDK script loaded');
        };
        
        script.onerror = () => this.setError('Failed to load Spotify SDK');
        document.body.appendChild(script);
      } else if (window.Spotify) {
        console.log('Spotify SDK already loaded, initializing...');
        this.initializeSpotifyPlayer();
      }
    }
  }

  initializeSpotifyPlayer() {
    if (!window.Spotify) {
      this.setError('Spotify Web Playback SDK is not loaded.');
      return;
    }

    this.player = new window.Spotify.Player({
      name: 'My Spotify Player',
      getOAuthToken: (cb: (token: string) => void) => {
        if (this.accessToken) {
          cb(this.accessToken);
        } else {
          this.refreshTokenAndRetry(() => cb(this.accessToken!));
        }
      },
      volume: 0.5,
    });

    this.setupPlayerListeners();
    this.connectPlayer();
  }

  private setupPlayerListeners() {
    this.player.addListener('initialization_error', ({ message }: SpotifyPlayerError) => {
      this.setError('Failed to initialize: ' + message);
    });
  
    this.player.addListener('authentication_error', ({ message }: SpotifyPlayerError) => {
      this.handleAuthError(message);
    });
  
    this.player.addListener('account_error', ({ message }: SpotifyPlayerError) => {
      this.setError('Failed to validate Spotify account: ' + message);
    });
  
    this.player.addListener('playback_error', ({ message }: SpotifyPlayerError) => {
      this.handlePlaybackError(message);
    });
  
    this.player.addListener('ready', ({ device_id }: SpotifyPlayerReady) => {
      this.deviceId = device_id;
      console.log('Ready with Device ID', device_id);
      this.transferPlaybackHere();
      
      setTimeout(() => {
        this.loadInitialTrack();
      }, 1000);
    });
  
    this.player.addListener('not_ready', ({ device_id }: SpotifyPlayerReady) => {
      console.log('Device ID has gone offline', device_id);
    });
  
    this.player.addListener('player_state_changed', (state: any) => {
      if (state) {
        this.isPlaying = !state.paused;
        this.currentPlaybackPosition = state.position;
        
        if (state.track_window && state.track_window.current_track) {
          const track = state.track_window.current_track;
          
          this.currentTrackInfo = {
            name: track.name,
            artist: track.artists[0].name,
            duration: track.duration_ms,
            uri: track.uri,
            albumArt: track.album?.images?.[0]?.url
          };
          
          console.log('Current track updated:', this.currentTrackInfo);
        }
      }
    });
  }

  private connectPlayer() {
    this.player.connect().then((success: boolean) => {
      if (success) {
        console.log('The Web Playback SDK successfully connected to Spotify!');
      } else {
        this.setError('Failed to connect to Spotify.');
      }
    });
  }

  transferPlaybackHere() {
    if (this.deviceId && this.accessToken) {
      console.log('Attempting to transfer playback. Device ID:', this.deviceId);
      this.spotifyAuth.transferPlayback(this.deviceId, this.accessToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => console.log('Playback transferred to the web player'),
          error: (error) => this.setError('Error transferring playback: ' + error.message)
        });
    } else {
      this.setError('Cannot transfer playback. Device ID or Access Token is missing.');
    }
  }

  searchTracks(query: string) {
    if (!query || query.trim() === '') {
      console.log('Empty search query');
      return;
    }
    
    if (this.accessToken) {
      this.errorMessage = 'Searching...';
      
      this.spotifyAuth.searchTracks(query, this.accessToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: (results) => {
            if (results && results.tracks && results.tracks.items) {
              this.searchResults = results.tracks.items;
              console.log(`Found ${this.searchResults.length} tracks`);
              this.errorMessage = '';
            } else {
              this.searchResults = [];
              this.setError('No results found');
            }
          },
          error: (error) => {
            console.error('Search error:', error);
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.searchTracks(query));
            } else {
              this.setError('Error searching tracks: ' + error.message);
            }
            this.searchResults = [];
          }
        });
    } else {
      this.setError('Please log in to search tracks');
    }
  }

  playTrack(uri: string) {
    if (!this.accessToken || !this.deviceId) {
      this.setError('Missing Access Token or Device ID.');
      return;
    }

    this.errorMessage = 'Loading track...';

    this.spotifyAuth.playTrack(uri, this.accessToken, this.deviceId)
      .pipe(
        retryWhen(errors => 
          errors.pipe(
            delay(this.RETRY_DELAY),
            take(3)
          )
        )
      )
      .subscribe({
        next: () => {
          console.log('Track playback started.');
          this.errorMessage = '';
          this.isPlaying = true;
        },
        error: (error) => {
          console.error('Play track error:', error);
          if (error.status === 401) {
            this.refreshTokenAndRetry(() => this.playTrack(uri));
          } else if (error.status === 429) {
            this.handlePlaybackError('Rate limit exceeded. Please wait before trying again.');
          } else if (error.status === 404) {
            console.log('404 error playing track (common with free accounts)');
            this.errorMessage = 'Playback requires Spotify Premium';
            setTimeout(() => this.errorMessage = '', 3000);
          } else {
            this.setError('Error playing track: ' + error.message);
          }
        }
      });
  }

  pausePlayback() {
    if (this.accessToken) {
      this.spotifyAuth.pausePlayback(this.accessToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => this.errorMessage = '',
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.pausePlayback());
            } else {
              this.setError('Error pausing playback: ' + error.message);
            }
          }
        });
    }
  }

  resumePlayback() {
    if (this.deviceId && this.spotifyAuth.accessToken) {
      const url = `https://api.spotify.com/v1/me/player/play`;
      const body = {
        position_ms: this.currentPlaybackPosition,
        device_ids: [this.deviceId],
      };
  
      this.spotifyAuth
        .makeAuthorizedRequest(url, 'PUT', JSON.stringify(body))
        .subscribe({
          next: () =>
            console.log(
              'Playback resumed from position:',
              this.currentPlaybackPosition
            ),
          error: (err) => this.setError('Error resuming playback: ' + err.message),
        });
    } else {
      this.setError(
        'Cannot resume playback. Ensure device ID and access token are available.'
      );
    }
  }

  nextTrack() {
    if (this.accessToken) {
      this.spotifyAuth.nextTrack(this.accessToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => this.errorMessage = '',
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.nextTrack());
            } else {
              this.setError('Error skipping to next track: ' + error.message);
            }
          }
        });
    }
  }

  previousTrack() {
    if (this.accessToken) {
      this.spotifyAuth.previousTrack(this.accessToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: () => this.errorMessage = '',
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.previousTrack());
            } else {
              this.setError('Error going to previous track: ' + error.message);
            }
          }
        });
    }
  }

  private handleAuthError(message: string) {
    this.setError('Authentication error: ' + message);
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (refreshToken) {
      this.refreshTokenAndRetry();
    } else {
      this.login();
    }
  }

  private handlePlaybackError(message: string) {
    const attempts = this.retryAttempts.value;
    if (attempts < this.MAX_RETRY_ATTEMPTS) {
      this.retryAttempts.next(attempts + 1);
      timer(this.RETRY_DELAY * Math.pow(2, attempts))
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshTokenAndRetry();
        });
    } else {
      this.setError(`Playback failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${message}`);
    }
  }

  private refreshTokenAndRetry(callback?: () => void) {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (refreshToken) {
      this.spotifyAuth.refreshAccessToken(refreshToken)
        .pipe(
          retryWhen(errors => 
            errors.pipe(
              delay(this.RETRY_DELAY),
              take(3)
            )
          )
        )
        .subscribe({
          next: (response) => {
            this.accessToken = response.access_token;
            this.spotifyAuth.accessToken = response.access_token;
            localStorage.setItem('spotify_access_token', this.accessToken || '');
            if (response.refresh_token) {
              localStorage.setItem('spotify_refresh_token', response.refresh_token);
            }
            this.retryAttempts.next(0);
            this.errorMessage = '';
            if (callback) callback();
          },
          error: (error) => {
            this.setError('Failed to refresh token. Please log in again.');
            this.login();
          }
        });
    }
  }

  private setError(message: string) {
    this.errorMessage = message;
    console.error(message);
    
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 3000);
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    
    if (parent) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'album-art');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('width', '48');
      svg.setAttribute('height', '48');
      
      svg.innerHTML = `
        <rect width="100" height="100" fill="#1E3A8A"/>
        <rect y="65" width="100" height="35" fill="#0284C7"/>
        <circle cx="25" cy="35" r="10" fill="#FBBF24"/>
        <path d="M0 65 L30 40 L45 55 L70 30 L100 65" fill="#0369A1"/>
      `;
      
      parent.prepend(svg);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.player) {
      this.player.disconnect();
    }
  }
}
