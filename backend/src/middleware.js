const jwt=require('jsonwebtoken'),cfg=require('./config');
const httpErr=(status,message)=>Object.assign(new Error(message),{status});
const validate=s=>(q,_r,n)=>{const r=s.safeParse(q.body);if(!r.success)return n(httpErr(400,r.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')));q.body=r.data;n()};
const auth=role=>(q,_r,n)=>{try{const t=(q.headers.authorization||'').replace('Bearer ','');q.user=jwt.verify(t,cfg.jwt);
 if(role&&q.user.role!==role)return n(httpErr(403,'Sin permisos'));n()}catch{n(httpErr(401,'Sesión inválida'))}};
const errorHandler=(e,_q,s,_n)=>{if(!e.status)console.error(e);s.status(e.status||500).json({error:e.status?e.message:'Error interno'})};
module.exports={httpErr,validate,auth,errorHandler};
