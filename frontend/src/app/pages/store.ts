import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API, Auth, Cart, img } from '../core';

@Component({
  standalone: true, selector: 'app-store', imports: [FormsModule, RouterLink],
  template: `
<header class="top">
  <button class="icon" (click)="menu=!menu" aria-label="Menú">☰</button>
  <img src="assets/logo.png" class="logo" alt="Diversity Store">
  <nav>
    @if (auth.user(); as u) {
      <span class="hide-sm">Hola, {{ u.nombres.split(' ')[0] }}</span>
      @if (u.role==='admin') { <a routerLink="/admin">PANEL</a> }
      <a (click)="auth.logout()">SALIR</a>
    } @else { <a routerLink="/login">INICIA SESIÓN</a><a routerLink="/registro">REGÍSTRATE</a> }
    <button class="icon" (click)="cartOpen=true" aria-label="Carrito">🛒 {{ cart.count() }}</button>
  </nav>
</header>

<div class="search">
  <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="¿Qué estás buscando?">
  <button class="btn" (click)="load()">🔍</button>
  <button class="btn ghost" (click)="fil=true">FILTROS</button>
</div>

<div class="layout">
  <aside [class.open]="menu">
    <a routerLink="/cuenta">Mi cuenta</a><a>Soporte</a><hr>
    <a [class.on]="!cat" (click)="setCat(0)">Todo</a>
    @for (c of cats; track c.id) { <a [class.on]="cat===c.id" (click)="setCat(c.id)">{{ c.name }} ›</a> }
  </aside>
  <main>
    <div class="grid">
      @for (p of items; track p.id) {
        <article class="prod" (click)="sel=p; qty=1">
          <img [src]="img(p.image_thumb)" loading="lazy" [alt]="p.name">
          <h3>{{ p.name }}</h3><b>S/{{ p.price }}</b>
        </article>
      } @empty { <p class="muted">No se encontraron productos.</p> }
    </div>
    @if (total > items.length) { <button class="btn" (click)="more()">Ver más</button> }
  </main>
</div>

@if (fil) {
  <div class="modal" (click)="fil=false"><div class="card" (click)="$event.stopPropagation()">
    <h3>Filtros</h3>
    <label>Precio mín <input type="number" [(ngModel)]="min"></label>
    <label>Precio máx <input type="number" [(ngModel)]="max"></label>
    <label>Marca <select [(ngModel)]="brand"><option value="">Todas</option>@for (b of brands; track b) {<option>{{ b }}</option>}</select></label>
    <button class="btn" (click)="fil=false; load()">Aplicar</button>
  </div></div>
}

@if (sel) {
  <div class="modal" (click)="sel=null"><div class="card detail" (click)="$event.stopPropagation()">
    <img [src]="img(sel.image_url)" [alt]="sel.name">
    <div><h2>{{ sel.name }}</h2><p class="price">S/{{ sel.price }}</p><p>{{ sel.description }}</p>
      <p class="muted">{{ sel.category }} · {{ sel.brand }} · Stock: {{ sel.stock }}</p>
      <div class="qty"><button (click)="qty=max1(qty-1)">−</button><b>{{ qty }}</b><button (click)="qty=qty+1">+</button></div>
      <button class="btn" [disabled]="sel.stock<1" (click)="cart.add(sel,qty); sel=null; cartOpen=true">Añadir al carrito</button>
    </div>
  </div></div>
}

@if (cartOpen) {
  <div class="modal" (click)="cartOpen=false"><div class="card" (click)="$event.stopPropagation()">
    @if (done) { <h2>¡TODO LISTO! ✔</h2><p>Orden #{{ done }}. Te enviamos el recibo por correo.</p><button class="btn" (click)="done=0; cartOpen=false">Volver al menú principal</button> }
    @else {
      <h3>Tu carrito</h3>
      @for (i of cart.items(); track i.p.id) { <div class="row"><span>{{ i.qty }} × {{ i.p.name }}</span><b>S/{{ (i.qty*i.p.price).toFixed(2) }}</b><a (click)="cart.remove(i.p.id)">✕</a></div> }
      @empty { <p class="muted">Vacío</p> }
      @if (err) { <p class="error">{{ err }}</p> }
      <p><b>Total: S/{{ cart.total().toFixed(2) }}</b></p>
      <button class="btn" [disabled]="!cart.count()" (click)="buy()">Comprar ahora</button>
    }
  </div></div>
}`
})
export class Store implements OnInit {
  http = inject(HttpClient); auth = inject(Auth); cart = inject(Cart); router = inject(Router); img = img;
  items: any[] = []; cats: any[] = []; total = 0; page = 1;
  q = ''; cat = 0; min: any = ''; max: any = ''; brand = '';
  menu = false; fil = false; cartOpen = false; sel: any = null; qty = 1; err = ''; done = 0;
  get brands() { return ['Sony', 'Microsoft', 'Nintendo', 'Valve']; }
  max1 = (n: number) => Math.max(1, n);
  ngOnInit() { this.http.get<any[]>(API + '/products/categories').subscribe(c => (this.cats = c)); this.load(); }
  setCat(id: number) { this.cat = id; this.menu = false; this.load(); }
  load(append = false) {
    if (!append) this.page = 1;
    const p: any = { page: this.page };
    if (this.q) p.q = this.q; if (this.cat) p.category = this.cat; if (this.min) p.min = this.min; if (this.max) p.max = this.max; if (this.brand) p.brand = this.brand;
    this.http.get<any>(API + '/products', { params: p }).subscribe(r => { this.items = append ? [...this.items, ...r.items] : r.items; this.total = r.total; });
  }
  more() { this.page++; this.load(true); }
  buy() {
    if (!this.auth.user()) return void this.router.navigate(['/login']);
    this.http.post<any>(API + '/orders', { items: this.cart.items().map(i => ({ product_id: i.p.id, qty: i.qty })) }).subscribe({
      next: r => { this.done = r.orderId; this.cart.clear(); this.load(); },
      error: e => (this.err = e.error?.error || 'Error al comprar'),
    });
  }
}
