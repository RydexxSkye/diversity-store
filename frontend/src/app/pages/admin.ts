import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API, Auth, img } from '../core';

@Component({
  standalone: true, selector: 'app-admin', imports: [FormsModule],
  template: `
<div class="admin">
  <aside [class.open]="menu">
    <div class="who"><span class="dot"></span><b>ADMIN</b></div><hr>
    <a [class.on]="tab()==='cat'" (click)="tab.set('cat'); menu=false">● Catálogo</a>
    <a [class.on]="tab()==='dash'" (click)="tab.set('dash'); menu=false; loadDash()">● Dashboard</a>
    <a class="exit" (click)="auth.logout(); router.navigate(['/'])">⇦ SALIR</a>
  </aside>
  <main>
    <button class="icon burger" (click)="menu=!menu">☰</button>
    @if (tab()==='cat') {
      <h2>CATÁLOGO</h2>
      <div class="actions"><button class="btn" (click)="edit()">Añadir productos</button></div>

      @if (form) {
        <form class="card" (ngSubmit)="save()">
          <h3>{{ form.id ? 'Editar producto' : 'Nuevo producto' }}</h3>
          <input name="n" [(ngModel)]="form.name" placeholder="Nombre" required>
          <textarea name="d" [(ngModel)]="form.description" placeholder="Descripción"></textarea>
          <div class="two"><input name="p" type="number" step="0.01" [(ngModel)]="form.price" placeholder="Precio S/" required>
            <input name="s" type="number" [(ngModel)]="form.stock" placeholder="Stock" required></div>
          <div class="two"><select name="c" [(ngModel)]="form.category_id" required><option [ngValue]="null" disabled>Categoría</option>@for (c of cats; track c.id) {<option [ngValue]="c.id">{{ c.name }}</option>}</select>
            <input name="b" [(ngModel)]="form.brand" placeholder="Marca (Sony, Microsoft…)"></div>
          <label class="upload">☁ Sube tu imagen (se mostrará en la página cliente)
            <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)" hidden></label>
          @if (preview) { <img [src]="preview" class="thumb"> }
          @if (msg) { <p class="error">{{ msg }}</p> }
          <div class="two"><button class="btn">Guardar cambios</button><button type="button" class="btn ghost" (click)="form=null">Cancelar</button></div>
        </form>
      }

      <div class="scroll"><table>
        <tr><th></th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr>
        @for (p of items; track p.id) {
          <tr><td><img [src]="img(p.image_thumb)" class="mini"></td><td>{{ p.name }}</td><td>{{ p.category }}</td><td>S/{{ p.price }}</td><td>{{ p.stock }}</td>
            <td class="nowrap"><button class="btn sm" (click)="edit(p)">Editar</button> <button class="btn sm danger" (click)="del(p)">Eliminar</button></td></tr>
        }
      </table></div>
    } @else {
      <h2>DASHBOARD</h2>
      @if (d) {
        <div class="stats"><div class="card"><small>Clientes registrados</small><h1>{{ d.clients }}</h1></div>
          <div class="card"><small>Compras realizadas</small><h1>{{ d.orders }}</h1></div>
          <div class="card"><small>Ingresos</small><h1>S/{{ d.revenue.toFixed(2) }}</h1></div></div>
        <div class="card"><h3>Ventas últimos 14 días</h3>
          <div class="bars">@for (s of d.salesByDay; track s.day) { <div><i [style.height.%]="100*s.total/maxSale()"></i><small>{{ s.day }}</small></div> } @empty { <p class="muted">Sin ventas aún</p> }</div></div>
        <div class="two"><div class="card"><h3>Más vendidos</h3>@for (t of d.topProducts; track t.name) { <div class="row"><span>{{ t.name }}</span><b>{{ t.qty }}</b></div> }</div>
          <div class="card"><h3>Últimos clientes</h3>@for (c of d.recentClients; track c.email) { <div class="row"><span>{{ c.nombres }} {{ c.apellidos }}</span><small>{{ c.email }}</small></div> }</div></div>
      }
    }
  </main>
</div>`
})
export class Admin implements OnInit {
  http = inject(HttpClient); auth = inject(Auth); router = inject(Router); img = img;
  tab = signal<'cat' | 'dash'>('cat'); menu = false; items: any[] = []; cats: any[] = []; d: any = null;
  form: any = null; file: File | null = null; preview = ''; msg = '';
  maxSale = () => Math.max(1, ...this.d.salesByDay.map((s: any) => s.total));
  ngOnInit() { this.http.get<any[]>(API + '/products/categories').subscribe(c => (this.cats = c)); this.load(); }
  load() { this.http.get<any>(API + '/products?page=1').subscribe(r => (this.items = r.items)); }
  loadDash() { this.http.get<any>(API + '/dashboard').subscribe(r => (this.d = r)); }
  edit(p?: any) { this.form = p ? { ...p } : { name: '', description: '', price: null, stock: 0, category_id: null, brand: '' }; this.file = null; this.preview = p ? img(p.image_thumb) : ''; this.msg = ''; }
  pick(e: any) { this.file = e.target.files[0] || null; if (this.file) this.preview = URL.createObjectURL(this.file); }
  save() {
    const fd = new FormData(), f = this.form;
    ['name', 'description', 'price', 'stock', 'category_id', 'brand'].forEach(k => f[k] != null && fd.append(k, f[k]));
    if (this.file) fd.append('image', this.file);
    const req = f.id ? this.http.put(`${API}/products/${f.id}`, fd) : this.http.post(API + '/products', fd);
    req.subscribe({ next: () => { this.form = null; this.load(); }, error: e => (this.msg = e.error?.error || 'Error al guardar') });
  }
  del(p: any) { if (confirm(`¿Eliminar "${p.name}"?`)) this.http.delete(`${API}/products/${p.id}`).subscribe(() => this.load()); }
}
