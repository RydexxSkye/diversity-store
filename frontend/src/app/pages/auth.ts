import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API, Auth } from '../core';

@Component({
  standalone: true, selector: 'app-auth', imports: [FormsModule, RouterLink],
  template: `
<section class="auth">
  <a routerLink="/" class="back">‹ Menú principal</a>
  <img src="assets/logo.png" class="logo big" alt="Diversity Store">
  <h2>{{ admin ? 'ADMINISTRADOR' : (mode==='login' ? 'Iniciar sesión' : 'Crea tu cuenta') }}</h2>

  @if (step()==='form') {
    <form (ngSubmit)="submit()">
      @if (mode==='register') {
        @if (admin) {
  <input name="n" [(ngModel)]="f.nombres" placeholder="Nombres" required>
  <input name="a" [(ngModel)]="f.apellidos" placeholder="Apellidos" required>
  <input name="ac" [(ngModel)]="f.adminCode" placeholder="Código de administrador" required>
} @else {
  <input name="n" [(ngModel)]="f.nombres" placeholder="Nombres" required>
  <input name="a" [(ngModel)]="f.apellidos" placeholder="Apellidos" required>
  <input name="t" [(ngModel)]="f.telefono" maxlength="9" inputmode="numeric" placeholder="Teléfono (9 dígitos)" required>
  <input name="fn" type="date" [(ngModel)]="f.fecha_nacimiento" required>
}
      }
      <input name="e" type="email" [(ngModel)]="f.email" placeholder="Correo electrónico" required>
      <input name="p" type="password" [(ngModel)]="f.password" maxlength="12" placeholder="Contraseña (8-12 caracteres)" required>
      @if (mode==='register' && !admin) {
        <input name="p2" type="password" [(ngModel)]="p2" maxlength="12" placeholder="Confirma tu contraseña" required>
        <label class="chk"><input type="checkbox" name="ac2" [(ngModel)]="f.acepta"> Acepto los Términos y Condiciones de uso (obligatorio)</label>
      }
      @if (err()) { <p class="error">{{ err() }}</p> }
      <button class="btn" [disabled]="busy()">{{ busy() ? 'Espera un momento…' : (mode==='login' ? 'Ingresar' : 'Crear') }}</button>
      @if (mode==='login' && !admin) { <a routerLink="/recuperar">¿Olvidaste tu contraseña? Recupérala</a> }
      @if (mode==='login') { <a routerLink="{{ admin ? '/admin/registro' : '/registro' }}">¿No tienes cuenta? Regístrate</a> }
    </form>
  } @else if (step()==='verify') {
    <form (ngSubmit)="verify()">
      <h3>VALIDACIÓN</h3><p>Introduce el código de 6 dígitos que enviamos a {{ masked() }}</p>
      <input class="code" name="c" [(ngModel)]="code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" required>
      @if (err()) { <p class="error">{{ err() }}</p> }
      <button class="btn" [disabled]="busy()">CONTINUAR</button>
      <a (click)="resend()">Volver a enviar</a>
    </form>
  } @else {
    <h3>¡TODO LISTO! ✔</h3><p>Tu cuenta se ha creado correctamente. Redirigiendo para iniciar sesión…</p>
  }
</section>`
})
export class AuthPage {
  http = inject(HttpClient); auth = inject(Auth); router = inject(Router);
  d = inject(ActivatedRoute).snapshot.data; admin = this.d['admin']; mode: 'login' | 'register' = this.d['mode'];
  step = signal<'form' | 'verify' | 'done'>('form'); err = signal(''); busy = signal(false);
  f: any = { dni: '', email: '', password: '', nombres: '', apellidos: '', telefono: '', fecha_nacimiento: '', adminCode: '', acepta: false };
  p2 = ''; code = ''; purpose: 'register' | 'login' = 'login';
  masked = () => this.f.email.replace(/^(.{3}).*(@.*)$/, '$1*********$2');
  fail = (e: any) => { this.busy.set(false); this.err.set(e.error?.error || 'Error de conexión'); };

  lookup() {
    if (!this.admin || this.f.dni.length !== 8) return;
    this.http.get<any>(`${API}/auth/dni/${this.f.dni}`, { headers: { 'x-admin-code': this.f.adminCode } }).subscribe({
      next: r => { this.f.nombres = r.nombres; this.f.apellidos = r.apellidos; this.err.set(''); }, error: this.fail });
  }
  submit() {
    this.err.set('');
    if (this.mode === 'register' && !this.admin && this.f.password !== this.p2) return void this.err.set('Las contraseñas no coinciden');
    this.busy.set(true);
    if (this.mode === 'login') {
      this.http.post<any>(API + '/auth/login', { email: this.f.email, password: this.f.password }).subscribe({
        next: r => { this.busy.set(false); if (r.token) return this.finish(r); this.purpose = 'login'; this.step.set('verify'); }, error: this.fail });
    } else {
            const body = this.admin
    ? {
        nombres: this.f.nombres,
        apellidos: this.f.apellidos,
        email: this.f.email,
        password: this.f.password,
        adminCode: this.f.adminCode,
        role: 'admin'
      }
    : {
        nombres: this.f.nombres,
        apellidos: this.f.apellidos,
        email: this.f.email,
        password: this.f.password,
        telefono: this.f.telefono,
        fecha_nacimiento: this.f.fecha_nacimiento,
        acepta: this.f.acepta,
        role: 'client'
      };

  this.http.post<any>(API + '/auth/register', body).subscribe({
    next: () => {
      this.busy.set(false);
      this.purpose = 'register';
      this.step.set('verify');
    },
    error: this.fail
  });
    }
  }
  verify() {
    this.busy.set(true);
    this.http.post<any>(API + '/auth/verify', { email: this.f.email, code: this.code, purpose: this.purpose }).subscribe({
      next: r => { this.busy.set(false); if (this.purpose === 'login') return this.finish(r);
        this.step.set('done'); setTimeout(() => this.router.navigate([this.admin ? '/admin/login' : '/login']), 2000); }, error: this.fail });
  }
  resend() { this.http.post(API + '/auth/resend', { email: this.f.email, purpose: this.purpose }).subscribe({ next: () => this.err.set('Código reenviado'), error: this.fail }); }
  finish(r: any) {
    if (this.admin && r.user.role !== 'admin') return void this.err.set('Esta cuenta no es de administrador');
    this.auth.set(r); this.router.navigate([r.user.role === 'admin' ? '/admin' : '/']);
  }
}
