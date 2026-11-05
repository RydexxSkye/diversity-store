import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API } from '../core';

@Component({
  standalone: true, selector: 'app-recover', imports: [FormsModule, RouterLink],
  template: `
<section class="auth">
  <a routerLink="/login" class="back">‹ Atrás</a>
  <img src="assets/logo.png" class="logo big" alt="Diversity Store">
  <h2>Recupera tu contraseña</h2>
  @if (step()==='email') {
    <form (ngSubmit)="send()">
      <p>Te enviaremos un código único de validación a tu bandeja de entrada.</p>
      <input name="e" type="email" autocomplete="email" [(ngModel)]="email" placeholder="Correo electrónico" required>
      @if (err()) { <p class="error">{{ err() }}</p> }
      <button class="btn" [disabled]="busy()">Enviar código</button>
    </form>
  } @else if (step()==='code') {
    <form (ngSubmit)="reset()">
      <h3>Comprueba tu bandeja de entrada</h3>
      <p>Introduce el código de 6 dígitos y tu nueva contraseña. ¿No llegó? Revisa spam.</p>
      <input class="code" name="c" autocomplete="one-time-code" [(ngModel)]="code" maxlength="6" inputmode="numeric" placeholder="000000" required>
      <input name="p" type="password" autocomplete="new-password" [(ngModel)]="password" maxlength="12" placeholder="Nueva contraseña (8-12 caracteres)" required>
      @if (err()) { <p class="error">{{ err() }}</p> }
      <button class="btn" [disabled]="busy()">Crear contraseña</button>
      <a (click)="resend()">Reenviar código</a>
    </form>
  } @else {
    <h3>¡TODO LISTO! ✔</h3>
    <p>Cambiaste tu contraseña con éxito.</p>
    <a routerLink="/login" class="btn">Iniciar sesión</a>
  }
</section>`
})
export class Recover {
  http = inject(HttpClient); router = inject(Router);
  step = signal<'email' | 'code' | 'done'>('email'); err = signal(''); busy = signal(false);
  email = ''; code = ''; password = '';
  fail = (e: any) => { this.busy.set(false); this.err.set(e.error?.error || 'Error de conexión'); };
  send() {
    this.busy.set(true); this.err.set('');
    this.http.post(API + '/auth/forgot', { email: this.email }).subscribe({ next: () => { this.busy.set(false); this.step.set('code'); }, error: this.fail });
  }
  reset() {
    this.busy.set(true); this.err.set('');
    this.http.post(API + '/auth/reset', { email: this.email, code: this.code, password: this.password }).subscribe({ next: () => { this.busy.set(false); this.step.set('done'); }, error: this.fail });
  }
  resend() { this.http.post(API + '/auth/resend', { email: this.email, purpose: 'reset' }).subscribe({ next: () => this.err.set('Código reenviado'), error: this.fail }); }
}
