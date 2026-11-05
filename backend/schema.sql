create extension if not exists pgcrypto;
create table users(
 id uuid primary key default gen_random_uuid(), dni char(8) unique not null,
 nombres text not null, apellidos text not null, email text unique not null,
 password_hash text not null, telefono text, fecha_nacimiento date, direccion text, region text,
 role text not null default 'client' check(role in('client','admin')),
 two_fa boolean not null default true, verified boolean not null default false, created_at timestamptz default now());
create table codes(id serial primary key, user_id uuid references users on delete cascade, purpose text not null,
 code_hash text not null, attempts int default 0, expires_at timestamptz not null, created_at timestamptz default now());
create table categories(id serial primary key, name text unique not null);
insert into categories(name) values('Consolas'),('Videojuegos'),('Accesorios'),('Coleccionables');
create table products(id uuid primary key default gen_random_uuid(), name text not null, description text default '',
 price numeric(10,2) not null check(price>0), stock int not null default 0 check(stock>=0),
 category_id int references categories, brand text, image_url text, image_thumb text, created_at timestamptz default now());
create index on products(category_id); create index on products(lower(name));
create table orders(id serial primary key, user_id uuid references users, total numeric(10,2) not null, created_at timestamptz default now());
create table order_items(order_id int references orders on delete cascade, product_id uuid references products on delete set null, qty int not null, price numeric(10,2) not null);
