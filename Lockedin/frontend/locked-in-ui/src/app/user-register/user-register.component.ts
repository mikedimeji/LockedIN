import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule, NgIf} from "@angular/common";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {Router} from "@angular/router";

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

  constructor(private http: HttpClient, private router: Router) {
  }

  validatePassword(password: string): boolean {

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  }

  handleRegister() {

    //password logic
    if (!this.validatePassword(this.password)){
      this.invalidRegister = true;
      this.errorMessage = 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.';
      return;
    }
    //username logic
    let bodyData = {
      "username" : this.username,
      "email" : this.email,
      "password" : this.password,
    };
    this.http.post("http://localhost:8080/api/home/auth/register", bodyData, {responseType: 'text'}).subscribe((resultData: any) =>
    {
      console.log(resultData);
      this.RegisterSuccess = true;

      if (resultData.message == "Email Taken"){
        alert("this Email is already registered with an account, use a different email or log in");
      }

      else if(resultData.message == "Account Created"){
        this.RegisterSuccess = true;
        this.router.navigateByUrl('/log-in');

      }

    });

  }
}
