import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { PlannerComponent } from '../planner/planner.component';

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

  constructor(private http: HttpClient, private router: Router) { }

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
            this.router.navigateByUrl('/planner');
          } else {
            // If token is expired, remove it
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          // If token decoding fails, remove the invalid token
          localStorage.removeItem('authToken');
        }
      }
    }
  }

  // Check if the environment is a browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  handleLogin() {
    // Check if there's an existing token and skip the login process if valid
    if (this.isBrowser()) {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.router.navigateByUrl('/timer');
        return;
      }
    }

    const bodyData = {
      email: this.email,
      password: this.password
    };

    // Call the login API
    this.http.post<{ token?: string, refreshToken?: string, message?: string }>("http://localhost:8080/api/home/auth/Authenticate", bodyData)
      .subscribe((resultData) => {
        console.log(resultData);

        //add && resultData.refreshToken when ready to if clause
        if (resultData.token && resultData.refreshToken) {
          // Successful login, store JWT token
          console.log("Login successful, navigating to /timer");
          this.loginSuccess = true;
          if (this.isBrowser()) {
            localStorage.setItem('authToken', resultData.token);
            localStorage.setItem('refreshToken', resultData.refreshToken);
          }

          // Redirect to timer page
          this.router.navigateByUrl('/timer');
        } else {
          // Handle errors (e.g., invalid email/password)
          this.invalidLogin = true;
          this.errorMessage = resultData.message || "Incorrect Email or Password";
        }
      }, (error) => {
        console.error("Error occurred during login:", error);
        this.invalidLogin = true;
        this.errorMessage = "An error occurred while connecting to the server.";
      });
  }
}





