import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SpotifyAuthService } from "./spotifyAuth";
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser, NgForOf, NgIf } from "@angular/common";

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
export class SpotifyPlayerComponent implements OnInit {
  accessToken: string | null = null;
  deviceId: string | null = null;
  isPlaying: boolean = false;

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
        this.loadSpotifyPlayer();
      },
      error: (error) => console.error('Error getting access token', error)
    });
  }

  loadSpotifyPlayer() {
    const script = document.createElement('script');
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);
  }

  initializeSpotifyPlayer() {
    if (!window.Spotify) {
      console.error('Spotify Web Playback SDK is not loaded.');
      return;
    }

    const player = new window.Spotify.Player({
      name: 'My Spotify Player',
      getOAuthToken: (cb: (token: string) => void) => cb(this.accessToken!),
      volume: 0.5
    });

    player.addListener('initialization_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to initialize', message);
    });

    player.addListener('authentication_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to authenticate', message);
    });

    player.addListener('account_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to validate Spotify account', message);
    });

    player.addListener('playback_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to perform playback', message);
    });

    player.addListener('ready', ({ device_id }: SpotifyPlayerReady) => {
      this.deviceId = device_id;
      console.log('Ready with Device ID', device_id);
      this.transferPlaybackHere();
    });

    player.addListener('not_ready', ({ device_id }: SpotifyPlayerReady) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
      if (state) {
        this.isPlaying = !state.paused;
      }
    });

    player.connect().then((success: boolean) => {
      if (success) {
        console.log('The Web Playback SDK successfully connected to Spotify!');
        console.log('Device ID:', this.deviceId);  // Add this line
      }
    });
  }

  transferPlaybackHere() {
    if (this.deviceId && this.accessToken) {
      console.log('Attempting to transfer playback. Device ID:', this.deviceId);
      this.spotifyAuth.transferPlayback(this.deviceId, this.accessToken).subscribe({
        next: () => console.log('Playback transferred to the web player'),
        error: (error) => console.error('Error transferring playback', error)
      });
    } else {
      console.error('Cannot transfer playback. Device ID or Access Token is missing.');
    }
  }

  searchResults: any[] = [];

  searchTracks(query: string) {
    if (this.accessToken) {
      this.spotifyAuth.searchTracks(query, this.accessToken).subscribe({
        next: (results) => {
          this.searchResults = results.tracks.items;
        },
        error: (error) => console.error('Error searching tracks', error)
      });
    }
  }

  playTrack(uri: string) {
    if (this.accessToken && this.deviceId) {
      console.log('Attempting to play track:', uri);
      this.spotifyAuth.playTrack(uri, this.accessToken, this.deviceId).subscribe({
        next: () => console.log('Track playback started'),
        error: (error) => console.error('Error playing track', error)
      });
    } else {
      console.error('Cannot play track. Access Token or Device ID is missing.');
    }
  }


  pausePlayback() {
    if (this.accessToken) {
      this.spotifyAuth.pausePlayback(this.accessToken).subscribe();
    }
  }

  nextTrack() {
    if (this.accessToken) {
      this.spotifyAuth.nextTrack(this.accessToken).subscribe();
    }
  }

  previousTrack() {
    if (this.accessToken) {
      this.spotifyAuth.previousTrack(this.accessToken).subscribe();
    }
  }
}
