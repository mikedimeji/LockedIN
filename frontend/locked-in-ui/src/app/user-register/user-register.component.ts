import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [
    HttpClientModule,
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent {
  invalidRegister: boolean = false;
  RegisterSuccess: boolean = false;
  username: string = "";
  password: string = "";
  email: string = "";
  errorMessage: string = '';
  successMessage: string = 'Register account successful';

  constructor(private http: HttpClient, private router: Router) {}

  validatePassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  }

  handleRegister() {
    if (!this.validatePassword(this.password)) {
      this.invalidRegister = true;
      this.errorMessage = 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.';
      return;
    }

    let bodyData = {
      "username": this.username,
      "email": this.email,
      "password": this.password,
    };

    this.http.post<{ token?: string, refreshToken?: string, username?: string, message?: string }>("https://lockedin-backend.onrender.com/api/home/auth/register", bodyData).subscribe(
      (resultData: any) => {
        console.log(resultData);
        if (resultData.token && resultData.refreshToken) {
          localStorage.setItem('authToken', resultData.token);
          localStorage.setItem('refreshToken', resultData.refreshToken);
          
          // Store username if available
          if (resultData.username) {
            localStorage.setItem('username', resultData.username);
          }
          
          this.RegisterSuccess = true;
          this.router.navigateByUrl('/');
        } else if (resultData.message === "Email Taken") {
          this.invalidRegister = true;
          this.errorMessage = "This email is already registered. Use a different email or log in.";
        }
      },
      (error: any) => {
        console.error("An error occurred connecting to the server or servers are temporarily down", error);
        this.invalidRegister = true;
        this.errorMessage = "An error occurred. Please try again later.";
      }
    );
  }

  closeRegisterScreen() {
    // Navigate back to home or login screen
    this.router.navigateByUrl('/');
  }
}

