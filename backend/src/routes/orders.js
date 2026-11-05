const r=require('express').Router(),{z}=require('zod'),db=require('../db'),{auth,validate,httpErr}=require('../middleware'),mail=require('../services/mail');
const S=z.object({items:z.array(z.object({product_id:z.string().uuid(),qty:z.number().int().min(1).max(10)})).min(1).max(30)});
r.post('/',auth(),validate(S),async(q,s)=>{
 const c=await db.connect();let o,total=0;const lines=[];
 try{await c.query('begin');
  for(const it of q.body.items){
   const{rows:[p]}=await c.query('update products set stock=stock-$2 where id=$1 and stock>=$2 returning name,price',[it.product_id,it.qty]);
   if(!p)throw httpErr(409,'Stock insuficiente o producto inexistente');total+=Number(p.price)*it.qty;lines.push({...it,...p})}
  o=(await c.query('insert into orders(user_id,total) values($1,$2) returning id',[q.user.id,total])).rows[0];
  for(const l of lines)await c.query('insert into order_items values($1,$2,$3,$4)',[o.id,l.product_id,l.qty,l.price]);
  await c.query('commit')}catch(e){await c.query('rollback');throw e}finally{c.release()}
 const{rows:[u]}=await db.query('select email,nombres from users where id=$1',[q.user.id]);
 mail.send(u.email,`Recibo de compra #${o.id} - Diversity Store`,`<h2>¡Gracias, ${u.nombres}!</h2><ul>${lines.map(l=>`<li>${l.qty} × ${l.name} — S/${l.price}</li>`).join('')}</ul><b>Total: S/${total.toFixed(2)}</b>`).catch(console.error);
 s.status(201).json({orderId:o.id,total});});
module.exports=r;
