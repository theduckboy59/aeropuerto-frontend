import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  show = false;

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword(): void {
    this.show = !this.show;
  }

  login() {
    this.auth
      .login({
        email: this.email,
        password: this.password
      })
      .subscribe({
        next: (res: any) => {
          console.log('OK:', res);
          this.auth.saveToken(res.token);
          this.router.navigate(['/menu']);
        },
        error: (err) => {
          console.log('ERROR:', err);
          alert('Error login');
        }
      });
  }
}
