import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.css'
})
export class ThemesComponent {
  themes: string[] = [
    'assets/videos/gif2-watering.gif',
    'assets/videos/gif38bit-restaurant.gif',
    'assets/videos/gif1-Coumputerstore.gif',
    'assets/videos/gif4-rainyfrog.gif',
    'assets/videos/yumenikki.mp4'
  ];

  selectedTheme: string = this.themes[0]; // Default theme

  constructor(private router: Router) {}

  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    // Store the selected theme in localStorage or a service
    localStorage.setItem('selectedTheme', theme);
    // Optionally, navigate to a different route or refresh
    window.location.reload();
  }
}
