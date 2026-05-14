import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { PlannerComponent } from '../planner/planner.component';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    PlannerComponent,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {
  private apiUrl = `${environment.apiUrl}/home/auth`;
  invalidLogin: boolean = false;
  loginSuccess: boolean = false;
  username: string = "";
  password: string = "";
  errorMessage: string = 'Invalid username or password';
  successMessage: string = 'Login successful';
  email: string = "";
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router,private authService: AuthService) { }

  ngOnInit() {
    if (this.isBrowser()) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decodedToken: any = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp > currentTime) {
            this.authService.onLoginComplete();
            this.router.navigateByUrl('/planner');
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username');
        }
      }
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private notifyAppToRefreshData(): void {
    const refreshEvent = new CustomEvent('userDataRefreshNeeded', {
      bubbles: true,
      composed: true,
      detail: { source: 'login' }
    });
    document.dispatchEvent(refreshEvent);
    
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      appRoot.setAttribute('data-refresh-needed', Date.now().toString());
    }
  }

  handleLogin() {
    this.isLoading = true;
    
    const bodyData = {
      email: this.email,
      password: this.password
    };
    

    this.http.post<{ token?: string, refreshToken?: string, username?: string, message?: string }>(`${this.apiUrl}/Authenticate`, bodyData)
      .subscribe({
        next: (resultData) => {
          console.log(resultData);

          if (resultData.token && resultData.refreshToken) {
            console.log("Login successful, navigating to /timer");
            this.loginSuccess = true;
            if (this.isBrowser()) {
              localStorage.setItem('authToken', resultData.token);
              localStorage.setItem('refreshToken', resultData.refreshToken);
              localStorage.setItem('lastActivityTime', Date.now().toString());
              
              if (resultData.username) {
                localStorage.setItem('username', resultData.username);
              }
            }

            this.authService.onLoginComplete();
            this.notifyAppToRefreshData();
            window.location.href = '/timer';
          } else {
            this.isLoading = false; 
            this.invalidLogin = true;
            this.errorMessage = resultData.message || "Incorrect Email or Password";
          }
        },
        error: (error) => {
            console.error("Error occurred during login:", error);
            this.isLoading = false; 
            this.invalidLogin = true;
            
            // Use backend message if available
            if (error.error?.message) {
              this.errorMessage = error.error.message;
            } else if (error.status === 401) {
              this.errorMessage = "Invalid email or password";
            } else if (error.status === 0) {
              this.errorMessage = "Unable to connect to server";
            } else {
              this.errorMessage = "An error occurred while connecting to the server";
            }
          }
      });
  }

  onBackdropClick(event: MouseEvent): void {
  // Navigate to timer when clicking the dark background
  this.router.navigate(['/timer']);
}
}





