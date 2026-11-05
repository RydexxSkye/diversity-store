import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';

export const HOST = 'http://localhost:3000';           // cambia en producción
export const API = HOST + '/api';
export const img = (u?: string) => (u ? HOST + u : 'assets/logo.png');

@Injectable({ providedIn: 'root' })
export class Auth {
  user = signal<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  set(r: any) { localStorage.setItem('token', r.token); localStorage.setItem('user', JSON.stringify(r.user)); this.user.set(r.user); }
  logout() { localStorage.clear(); this.user.set(null); }
}

@Injectable({ providedIn: 'root' })
export class Cart {
  items = signal<{ p: any; qty: number }[]>([]);
  count = computed(() => this.items().reduce((a, i) => a + i.qty, 0));
  total = computed(() => this.items().reduce((a, i) => a + i.qty * +i.p.price, 0));
  add(p: any, qty = 1) {
    const l = this.items(), f = l.find(i => i.p.id === p.id);
    this.items.set(f ? l.map(i => (i === f ? { ...i, qty: Math.min(10, i.qty + qty) } : i)) : [...l, { p, qty }]);
  }
  remove(id: string) { this.items.set(this.items().filter(i => i.p.id !== id)); }
  clear() { this.items.set([]); }
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const t = localStorage.getItem('token');
  return next(t ? req.clone({ setHeaders: { Authorization: 'Bearer ' + t } }) : req);
};

export const adminGuard: CanActivateFn = () => {
  const a = inject(Auth), r = inject(Router);
  return a.user()?.role === 'admin' ? true : r.createUrlTree(['/admin/login']);
};
