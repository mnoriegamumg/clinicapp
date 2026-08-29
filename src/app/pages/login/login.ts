import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.group({
    email: 'admin@prosamed.com',
    password: '12345678',
    rememberMe: true,
  });

  loginError = '';
  isLoading = false;

  submit(): void {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginError = 'Completa tu correo y contraseña.';
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isLoading = true;

    this.authService.login(email, password).pipe(
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: () => void this.router.navigate(['/calendario']),
      error: () => this.loginError = 'No se pudo iniciar sesión. Verifica tus datos o la conexión con el servidor.',
    });
  }
}
