import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { PlannerComponent } from '../planner/planner.component';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    PlannerComponent,
  ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {
  invalidLogin: boolean = false;
  loginSuccess: boolean = false;
  username: string = "";
  password: string = "";
  errorMessage: string = 'Invalid username or password';
  successMessage: string = 'Login successful';
  email: string = "";

  constructor(private http: HttpClient, private router: Router,private authService: AuthService) { }

  ngOnInit() {
    // Check if we're in a browser environment
    if (this.isBrowser()) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Decode the token and check if it is expired
          const decodedToken: any = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
          if (decodedToken.exp > currentTime) {
            // If token is valid, redirect to planner

            this.authService.onLoginComplete();
            this.router.navigateByUrl('/planner');
          } else {
            // If token is expired, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username'); // Also remove username
          }
        } catch (error) {
          // If token decoding fails, remove the invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username'); // Also remove username
        }
      }
    }
  }

  // Check if the environment is a browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Method to notify the app to refresh user data
  private notifyAppToRefreshData(): void {
    // 1. Dispatch a custom event
    const refreshEvent = new CustomEvent('userDataRefreshNeeded', {
      bubbles: true,
      composed: true,
      detail: { source: 'login' }
    });
    document.dispatchEvent(refreshEvent);
    
    // 2. Alternative approach: Modify app-root to trigger Angular change detection
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      // Add a custom attribute that Angular can detect
      appRoot.setAttribute('data-refresh-needed', Date.now().toString());
    }
  }

  handleLogin() {
    const bodyData = {
      email: this.email,
      password: this.password
    };

    // Call the login API
    this.http.post<{ token?: string, refreshToken?: string, username?: string, message?: string }>("https://lockedin-backend.onrender.com/api/home/auth/Authenticate", bodyData)
      .subscribe({
        next: (resultData) => {
          console.log(resultData);

          if (resultData.token && resultData.refreshToken) {
            // Successful login, store JWT token
            console.log("Login successful, navigating to /timer");
            this.loginSuccess = true;
            if (this.isBrowser()) {
              localStorage.setItem('authToken', resultData.token);
              localStorage.setItem('refreshToken', resultData.refreshToken);
              // Also set last activity time
              localStorage.setItem('lastActivityTime', Date.now().toString());
              
              // Store username if available
              if (resultData.username) {
                localStorage.setItem('username', resultData.username);
              }
            }

            this.authService.onLoginComplete();
            
            // Notify app to refresh data
            this.notifyAppToRefreshData();
            
            // Redirect to timer page
            this.router.navigateByUrl('/timer');
          } else {
            // Handle errors (e.g., invalid email/password)
            this.invalidLogin = true;
            this.errorMessage = resultData.message || "Incorrect Email or Password";
          }
        },
        error: (error) => {
          console.error("Error occurred during login:", error);
          this.invalidLogin = true;
          this.errorMessage = "An error occurred while connecting to the server.";
        }
      });
  }
}





