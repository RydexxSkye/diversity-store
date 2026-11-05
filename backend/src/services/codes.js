const crypto=require('crypto'),db=require('../db'),mail=require('./mail'),{httpErr}=require('../middleware');
const h=c=>crypto.createHash('sha256').update(c).digest('hex');
exports.send=async(u,purpose)=>{
 const{rows:[last]}=await db.query("select 1 from codes where user_id=$1 and purpose=$2 and created_at>now()-interval '60 seconds'",[u.id,purpose]);
 if(last)throw httpErr(429,'Espera 60 segundos para reenviar el código');
 const code=String(crypto.randomInt(0,1000000)).padStart(6,'0');
 await db.query('delete from codes where user_id=$1 and purpose=$2',[u.id,purpose]);
 await db.query("insert into codes(user_id,purpose,code_hash,expires_at) values($1,$2,$3,now()+interval '10 minutes')",[u.id,purpose,h(code)]);
 await mail.send(u.email,'Tu código de verificación - Diversity Store',
  `<div style="background:#0a0a0a;color:#fff;padding:24px;font-family:sans-serif"><h2 style="color:#e10a0a">Diversity Store</h2><p>Tu código:</p><h1 style="letter-spacing:6px">${code.slice(0,3)}-${code.slice(3)}</h1><p>Vence en 10 minutos.</p></div>`);
};
exports.check=async(email,code,purpose)=>{
 const{rows:[u]}=await db.query('select * from users where email=$1',[email]);
 if(!u)throw httpErr(400,'Código inválido');
 const{rows:[c]}=await db.query('select * from codes where user_id=$1 and purpose=$2 and expires_at>now() and attempts<5',[u.id,purpose]);
 if(!c||c.code_hash!==h(code)){if(c)await db.query('update codes set attempts=attempts+1 where id=$1',[c.id]);throw httpErr(400,'Código inválido o vencido')}
 await db.query('delete from codes where id=$1',[c.id]);return u;
};
