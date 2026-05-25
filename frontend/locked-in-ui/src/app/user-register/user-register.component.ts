import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router,RouterOutlet, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [
    HttpClientModule,
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css'
})
export class UserRegisterComponent {
  private apiUrl = `${environment.apiUrl}/home/auth`;
  invalidRegister: boolean = false;
  RegisterSuccess: boolean = false;
  username: string = "";
  password: string = "";
  email: string = "";
  errorMessage: string = '';
  successMessage: string = 'Account created! Please log in.';
  isLoading: boolean = false;

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

    this.isLoading = true;

    let bodyData = {
      "username": this.username,
      "email": this.email,
      "password": this.password,
    };

    this.http.post<{ message?: string }>(`${this.apiUrl}/register`, bodyData).subscribe(
      (resultData: any) => {
        console.log(resultData);
        
        if (resultData.message === "User registered successfully" || !resultData.message || resultData.token) {
          localStorage.setItem('selectedTheme', 'assets/videos/witch.gif');
          localStorage.setItem('isVideoBackground', 'true');

          this.RegisterSuccess = true;
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigateByUrl('/login');
          }, 2000);
          
        } else if (resultData.message === "Email Taken") {
          this.isLoading = false;
          this.invalidRegister = true;
          this.errorMessage = "This email is already registered. Use a different email or log in.";
        } else {
          this.isLoading = false;
          this.invalidRegister = true;
          this.errorMessage = resultData.message || "Registration failed. Please try again.";
        }
      },
      (error: any) => {
          this.isLoading = false;
          this.invalidRegister = true;

          if (error.status === 409) {
            this.errorMessage = "That email or username is already taken.";
          } else if (error.status === 0) {
            this.errorMessage = "Something went wrong. Please try again.";
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = "Something went wrong. Please try again.";
          }
        }
    );
  }

  closeRegisterScreen() {
    this.router.navigateByUrl('/');
  }

  clearError() { this.invalidRegister = false; }

  onBackdropClick(_event: MouseEvent): void {
    this.router.navigate(['/timer']);
  }
}

