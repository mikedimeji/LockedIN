import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
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

  handleLogin() {
    const bodyData = {
      email: this.email,
      password: this.password
    };

    this.http.post<{ message: string }>("http://localhost:8080/api/home/auth/Authenticate", bodyData)
      .subscribe((resultData) => {
        console.log(resultData);

        if (resultData.message === "This email is not registered with an account") {
          alert("Email does not exist");
        } else if (resultData.message === "Login Success") {
          this.loginSuccess = true;
          this.router.navigateByUrl('/home');
        } else {
          alert("Incorrect Email or Password");
        }
      });
  }
}

