import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API, Auth } from '../core';

@Component({
  standalone: true, selector: 'app-account', imports: [FormsModule, RouterLink],
  template: `
<header class="top">
  <a routerLink="/" class="btn ghost">‹ Atrás</a>
  <img src="assets/logo.png" class="logo" alt="Diversity Store">
  <nav><span class="hide-sm">Hola, {{ first() }}</span><a (click)="auth.logout(); router.navigate(['/'])">SALIR</a></nav>
</header>
<section class="acc">
  @if (u) {
    <h2>Datos personales</h2>
    <p class="muted">Administra tu nombre e información de contacto. Estos datos son privados y no se mostrarán a otros usuarios.</p>
    <div class="fields">
      @for (f of fields; track f.k) {
        <label>{{ f.l }}
          <div class="fld">
            <input [(ngModel)]="u[f.k]" [readonly]="edit()!==f.k" [class.ro]="edit()!==f.k" [maxLength]="f.k==='telefono'?9:80">
            @if (edit()===f.k) { <button class="icon sm" (click)="edit.set('')" title="Cancelar">✕</button> }
            @else { <button class="icon sm" (click)="edit.set(f.k)" title="Editar">✎</button> }
          </div>
        </label>
      }
      <label>DNI <div class="fld"><input [value]="u.dni" readonly class="ro"><span class="lock">🔒</span></div></label>
      <label>Correo <div class="fld"><input [value]="u.email" readonly class="ro"><span class="lock">🔒</span></div></label>
    </div>
    @if (msg()) { <p [class]="ok() ? 'okmsg' : 'error'">{{ msg() }}</p> }
    <button class="btn" (click)="save()">Guardar cambios</button>

    <h3>Autenticación en dos pasos</h3>
    <p class="muted">Te pediremos un código enviado a tu correo cada vez que inicies sesión.</p>
    <div class="card twofa">
      <div><b>✉ Autenticación por correo electrónico</b><p class="muted">{{ u.role==='admin' ? 'Obligatoria para administradores.' : (u.two_fa ? 'Activada' : 'Desactivada') }}</p></div>
      <label class="switch"><input type="checkbox" [checked]="u.two_fa" [disabled]="u.role==='admin'" (change)="toggle2fa($any($event.target).checked)"><span></span></label>
    </div>
  } @else { <p class="muted">Cargando…</p> }
</section>`
})
export class Account implements OnInit {
  http = inject(HttpClient); auth = inject(Auth); router = inject(Router);
  u: any = null; edit = signal(''); msg = signal(''); ok = signal(false);
  fields = [{ k: 'nombres', l: 'Nombres' }, { k: 'apellidos', l: 'Apellidos' }, { k: 'telefono', l: 'Teléfono' }, { k: 'direccion', l: 'Dirección' }, { k: 'region', l: 'Región' }];
  first = () => (this.auth.user()?.nombres || '').split(' ')[0];
  ngOnInit() {
    if (!this.auth.user()) return void this.router.navigate(['/login']);
    this.http.get<any>(API + '/auth/me').subscribe({ next: r => (this.u = r), error: () => { this.auth.logout(); this.router.navigate(['/login']); } });
  }
  patch(body: any, done: string) {
    this.http.patch<any>(API + '/auth/me', body).subscribe({
      next: r => { this.u = r; this.edit.set(''); this.ok.set(true); this.msg.set(done);
        this.auth.user.set({ ...this.auth.user(), ...r }); localStorage.setItem('user', JSON.stringify(this.auth.user())); },
      error: e => { this.ok.set(false); this.msg.set(e.error?.error || 'No se pudo guardar'); } });
  }
  save() {
    const b: any = {};
    this.fields.forEach(f => { const v = (this.u[f.k] || '').trim(); if (v) b[f.k] = v; });
    this.patch(b, 'Cambios guardados');
  }
  toggle2fa(on: boolean) { this.patch({ two_fa: on }, on ? 'Autenticación en dos pasos activada' : 'Autenticación en dos pasos desactivada'); }
}
