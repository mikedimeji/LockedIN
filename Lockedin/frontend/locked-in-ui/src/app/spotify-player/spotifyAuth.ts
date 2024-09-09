import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthService {
  private clientId = '1591f7a8ddd548b7b67b7cc3a7d545f0';
  private clientSecret = 'd4984e8932b04277b3a5e613e069eef8';
  private redirectUri = 'http://localhost:4200/timer';
  private tokenEndpoint = 'https://accounts.spotify.com/api/token';
  private apiBase = 'https://api.spotify.com/v1';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getAuthUrl(): string {
    const scopes = 'user-read-playback-state user-modify-playback-state';
    return 'https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + this.clientId +
      '&scope=' + encodeURIComponent(scopes) +
      '&redirect_uri=' + encodeURIComponent(this.redirectUri);
  }

  getAccessToken(code: string): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      const body = new URLSearchParams();
      body.set('grant_type', 'authorization_code');
      body.set('code', code);
      body.set('redirect_uri', this.redirectUri);

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
      });

      return this.http.post(this.tokenEndpoint, body.toString(), { headers });
    } else {
      return of(null);
    }
  }

  searchTracks(query: string, token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`https://api.spotify.com/v1/search?q=${query}&type=track`, { headers });
  }

  transferPlayback(deviceId: string, accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiBase}/me/player`, {
      device_ids: [deviceId],
      play: true
    }, { headers });
  }

  playTrack(uri: string, accessToken: string, deviceId: string | null): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.apiBase}/me/player/play${deviceId ? '?device_id=' + deviceId : ''}`;
    return this.http.put(url, {
      uris: [uri]
    }, { headers });
  }


  pausePlayback(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiBase}/me/player/pause`, {}, { headers });
  }

  nextTrack(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiBase}/me/player/next`, {}, { headers });
  }

  previousTrack(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiBase}/me/player/previous`, {}, { headers });
  }
}

