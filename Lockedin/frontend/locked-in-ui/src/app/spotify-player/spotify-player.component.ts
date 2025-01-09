import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { SpotifyAuthService } from "./spotifyAuth";
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser, NgForOf, NgIf } from "@angular/common";
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { takeUntil, retryWhen, delay, take } from 'rxjs/operators';

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

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [HttpClientModule, NgIf, NgForOf],
  templateUrl: './spotify-player.component.html',
  styleUrls: ['./spotify-player.component.css']
})
export class SpotifyPlayerComponent implements OnInit, OnDestroy {
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

  constructor(
    private spotifyAuth: SpotifyAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        this.getAccessToken(code);
      }
      
      // Load the Spotify SDK
      this.loadSpotifyPlayer();
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
        localStorage.setItem('spotify_access_token', response.access_token);
        localStorage.setItem('spotify_refresh_token', response.refresh_token);
        this.loadSpotifyPlayer();
      },
      error: (error) => {
        this.setError('Error getting access token: ' + error.message);
      }
    });
  }

  loadSpotifyPlayer() {
    if (isPlatformBrowser(this.platformId)) {
      if (!document.getElementById('spotify-player-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-player-script';
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        
        script.onload = () => {
          console.log('Spotify SDK script loaded');
          window.onSpotifyWebPlaybackSDKReady = () => {
            console.log('Spotify Web Playback SDK is ready');
            this.initializeSpotifyPlayer();
          };
        };
        
        script.onerror = () => this.setError('Failed to load Spotify SDK');
        document.body.appendChild(script);
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
    });

    this.player.addListener('not_ready', ({ device_id }: SpotifyPlayerReady) => {
      console.log('Device ID has gone offline', device_id);
    });

    this.player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
      if (state) {
        this.isPlaying = !state.paused;
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
    if (this.accessToken) {
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
            this.searchResults = results.tracks.items;
            this.errorMessage = '';
          },
          error: (error) => {
            if (error.status === 401) {
              this.refreshTokenAndRetry(() => this.searchTracks(query));
            } else {
              this.setError('Error searching tracks: ' + error.message);
            }
          }
        });
    }
  }

  playTrack(uri: string) {
    if (!this.accessToken || !this.deviceId) {
      this.setError('Missing Access Token or Device ID.');
      return;
    }

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
        },
        error: (error) => {
          if (error.status === 401) {
            this.refreshTokenAndRetry(() => this.playTrack(uri));
          } else if (error.status === 429) {
            this.handlePlaybackError('Rate limit exceeded. Please wait before trying again.');
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.player) {
      this.player.disconnect();
    }
  }
}
