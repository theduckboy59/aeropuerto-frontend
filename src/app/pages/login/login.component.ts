import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  email = '';
  password = '';

 constructor(private auth: AuthService, private router: Router) {}

  login() {
  this.auth.login({
    email: this.email,
    password: this.password
  }).subscribe({
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