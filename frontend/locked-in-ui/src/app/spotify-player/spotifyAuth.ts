import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from "@angular/common";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthService {
  private clientId = '1591f7a8ddd548b7b67b7cc3a7d545f0';
  private apiBase = 'https://api.spotify.com/v1';
  private _accessToken: string | null = null;

  set accessToken(token: string | null) {
    this._accessToken = token;
  }

  get accessToken(): string | null {
    return this._accessToken;
  }

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getAuthUrl(): string {
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'app-remote-control'
    ].join(' ');

    return 'https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + this.clientId +
      '&scope=' + encodeURIComponent(scopes) +
      '&redirect_uri=' + encodeURIComponent(environment.spotifyRedirectUri);
  }

  // Token exchange goes through our backend — client secret never touches the browser
  getAccessToken(code: string): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) return of(null);
    return this.http.post(`${environment.apiUrl}/spotify/token`, {
      code,
      redirectUri: environment.spotifyRedirectUri
    });
  }

  refreshAccessToken(refreshToken: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/spotify/refresh`, {
      refreshToken
    });
  }

  // --- Playback API ---

  searchTracks(query: string, token: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any>(`${this.apiBase}/search?q=${query}&type=track`, { headers });
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
    return this.http.put(url, { uris: [uri] }, { headers });
  }

  makeAuthorizedRequest(url: string, method: string, body: any) {
    if (!this._accessToken) throw new Error('Access token is not set.');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this._accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http.request(method, url, { body, headers });
  }

  pausePlayback(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiBase}/me/player/pause`, {}, { headers });
  }

  getCurrentPlayback(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${accessToken}` });
    return this.http.get(`${this.apiBase}/me/player`, { headers });
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
