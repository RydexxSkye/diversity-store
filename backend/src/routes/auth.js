const r=require('express').Router(),{z}=require('zod'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const db=require('../db'),cfg=require('../config'),{validate,auth,httpErr}=require('../middleware'),codes=require('../services/codes'),dni=require('../services/dni');
const sign=u=>jwt.sign({id:u.id,role:u.role},cfg.jwt,{expiresIn:'8h'});
const pub=u=>({
 id:u.id,
 nombres:u.nombres,
 apellidos:u.apellidos,
 email:u.email,
 role:u.role,
 two_fa:u.two_fa,
 telefono:u.telefono,
 direccion:u.direccion,
 region:u.region,
 dni:u.dni ? u.dni.slice(0,2)+'****'+u.dni.slice(6) : null
});
const D=z.string().regex(/^\d{8}$/,'DNI de 8 dígitos'),E=z.string().email(),P=z.string().min(8).max(12);
const reg=z.object({
 dni:D.optional(),
 email:E,
 password:P,
 role:z.enum(['client','admin']).default('client'),
 nombres:z.string().min(2).max(80).optional(),
 apellidos:z.string().min(2).max(80).optional(),
 telefono:z.string().regex(/^\d{9}$/,'Teléfono de 9 dígitos').optional(),
 fecha_nacimiento:z.string().optional(),
 adminCode:z.string().optional(),
 acepta:z.boolean().optional()
});
const one=e=>db.query('select * from users where email=$1',[e]).then(x=>x.rows[0]);

// Admin: al escribir el DNI se devuelve el nombre (protegido con código de invitación para evitar consultas abiertas)
r.get('/dni/:dni',async(q,s)=>{
 if(q.headers['x-admin-code']!==cfg.adminInvite)throw httpErr(403,'Código de administrador inválido');
 s.json(await dni.lookup(D.parse(q.params.dni)));});

r.post('/register',validate(reg),async(q,s)=>{
 const b=q.body;
 let {nombres,apellidos}=b;

 // Validaciones para administradores
 if(b.role==='admin'){
   if(b.adminCode!==cfg.adminInvite)
     throw httpErr(403,'Código de administrador inválido');

   if(!nombres || nombres.length<2 || !apellidos || apellidos.length<2)
     throw httpErr(400,'Completa tus nombres y apellidos');

 } else {

   // Validaciones para clientes
   if(!nombres || !apellidos || !b.acepta)
     throw httpErr(400,'Completa tus datos y acepta los términos');
 }

  try{
    const {rows:[u]}=await db.query(
      `insert into users
      (dni,nombres,apellidos,email,password_hash,telefono,fecha_nacimiento,role)
      values($1,$2,$3,$4,$5,$6,$7,$8)
      returning *`,
      [
        null,
        nombres,
        apellidos,
        b.email,
        await bcrypt.hash(b.password,10),
        b.role==='admin' ? null : (b.telefono||null),
        b.role==='admin' ? null : (b.fecha_nacimiento||null),
        b.role
      ]
    );

   await codes.send(u,'register');
   s.status(201).json({step:'verify',email:u.email});

 }catch(e){
   if(e.code==='23505')
     throw httpErr(409,'DNI o correo ya registrado');

   throw e;
 }
});

r.post('/resend',validate(z.object({email:E,purpose:z.enum(['register','login','reset'])})),async(q,s)=>{
 const u=await one(q.body.email);if(u)await codes.send(u,q.body.purpose);s.json({ok:true})});

r.post('/verify',validate(z.object({email:E,code:z.string().length(6),purpose:z.enum(['register','login'])})),async(q,s)=>{
 const u=await codes.check(q.body.email,q.body.code,q.body.purpose);
 if(q.body.purpose==='register'){await db.query('update users set verified=true where id=$1',[u.id]);return s.json({ok:true})}
 s.json({token:sign(u),user:pub(u)});});

r.post('/login',validate(z.object({email:E,password:z.string().min(1)})),async(q,s)=>{
 const u=await one(q.body.email);
 if(!u||!(await bcrypt.compare(q.body.password,u.password_hash)))throw httpErr(401,'Correo o contraseña incorrectos');
 if(!u.verified)throw httpErr(403,'Cuenta sin verificar');
 if(u.role==='admin'||u.two_fa){await codes.send(u,'login');return s.json({step:'verify'})}  // admin: código obligatorio; cliente: configurable
 s.json({token:sign(u),user:pub(u)});});

r.post('/forgot',validate(z.object({email:E})),async(q,s)=>{const u=await one(q.body.email);if(u)await codes.send(u,'reset');s.json({ok:true})});
r.post('/reset',validate(z.object({email:E,code:z.string().length(6),password:P})),async(q,s)=>{
 const u=await codes.check(q.body.email,q.body.code,'reset');
 await db.query('update users set password_hash=$1 where id=$2',[await bcrypt.hash(q.body.password,10),u.id]);s.json({ok:true})});

r.get('/me',auth(),async(q,s)=>s.json(pub((await db.query('select * from users where id=$1',[q.user.id])).rows[0])));
r.patch('/me',auth(),validate(z.object({nombres:z.string().min(2).optional(),apellidos:z.string().min(2).optional(),telefono:z.string().regex(/^\d{9}$/).optional(),
 direccion:z.string().max(200).optional(),region:z.string().max(60).optional(),two_fa:z.boolean().optional()}).strict()),async(q,s)=>{
 const k=Object.keys(q.body);if(!k.length)throw httpErr(400,'Nada que actualizar');
 const{rows:[u]}=await db.query(`update users set ${k.map((c,i)=>`${c}=$${i+2}`).join(',')} where id=$1 returning *`,[q.user.id,...k.map(c=>q.body[c])]);s.json(pub(u))});
module.exports=r;
