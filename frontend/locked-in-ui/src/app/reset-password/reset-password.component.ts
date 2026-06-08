import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private api = `${environment.apiUrl}/home/auth`;

  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  done = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.error = 'Invalid or missing reset link.';
  }

  submit(): void {
    this.error = '';
    if (this.newPassword.length < 8) { this.error = 'Password must be at least 8 characters.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.error = 'Passwords do not match.'; return; }
    this.loading = true;
    this.http.post<{ message: string }>(`${this.api}/reset-password`, {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => { this.loading = false; this.done = true; },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message ?? 'Invalid or expired reset link.';
      }
    });
  }

  goLogin(): void { this.router.navigate(['/login']); }
}
