import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { TimerComponent } from './timer/timer.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ThemesComponent } from './themes/themes.component';
import {SpotifyPlayerComponent} from "./spotify-player/spotify-player.component";

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,
    HeaderComponent,
    TimerComponent,
    UserRegisterComponent,
    UserLoginComponent,
    ConfirmDialogComponent,
    RouterOutlet,
    RouterLink,
    ThemesComponent,
    SpotifyPlayerComponent,
  ]
})
export class AppComponent implements OnInit {
  selectedTheme: string = 'assets/videos/yumenikki.mp4'; // Default to video
  isVideoBackground: boolean = true; // Assume video by default
  isRegisterMode = false;
  isLoginMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const theme = localStorage.getItem('selectedTheme');
      if (theme) {
        this.selectedTheme = theme;
        this.isVideoBackground = theme.endsWith('.mp4');
      } else {
        this.selectedTheme = 'assets/videos/yumenikki.mp4';
        this.isVideoBackground = true;
      }
    }
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  showRegister() {
    this.router.navigate(['/register']);
  }

  showLogin() {
    this.router.navigate(['/login']);
  }
}





