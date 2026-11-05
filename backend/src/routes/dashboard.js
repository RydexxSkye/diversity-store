const r=require('express').Router(),db=require('../db'),{auth}=require('../middleware');
r.get('/',auth('admin'),async(_q,s)=>{
 const[a,b,c,d,e]=await Promise.all([
  db.query("select count(*)::int n from users where role='client'"),
  db.query('select count(*)::int n,coalesce(sum(total),0)::float rev from orders'),
  db.query("select to_char(date_trunc('day',created_at),'DD/MM') day,sum(total)::float total from orders where created_at>now()-interval '14 days' group by date_trunc('day',created_at) order by date_trunc('day',created_at)"),
  db.query('select p.name,sum(i.qty)::int qty from order_items i join products p on p.id=i.product_id group by p.name order by qty desc limit 5'),
  db.query("select nombres,apellidos,email,created_at from users where role='client' order by created_at desc limit 8")]);
 s.json({clients:a.rows[0].n,orders:b.rows[0].n,revenue:b.rows[0].rev,salesByDay:c.rows,topProducts:d.rows,recentClients:e.rows});});
module.exports=r;
