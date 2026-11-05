require('dotenv').config();
['DATABASE_URL','JWT_SECRET'].forEach(k=>{if(!process.env[k])throw new Error('Falta variable '+k)});
const e=process.env;
module.exports={port:e.PORT||3000,jwt:e.JWT_SECRET,dbUrl:e.DATABASE_URL,origin:e.CORS_ORIGIN||'http://localhost:4200',
 adminInvite:e.ADMIN_INVITE_CODE,dniUrl:e.DNI_API_URL,dniToken:e.DNI_API_TOKEN,uploads:e.UPLOAD_DIR||'uploads',publicUrl:e.PUBLIC_URL||'',
 smtp:{host:e.SMTP_HOST,port:+(e.SMTP_PORT||587),auth:{user:e.SMTP_USER,pass:e.SMTP_PASS}},from:e.MAIL_FROM||e.SMTP_USER};
