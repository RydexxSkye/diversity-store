const nm=require('nodemailer'),cfg=require('../config');
const t=nm.createTransport({...cfg.smtp,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
exports.send=async(to,subject,html)=>{
 if(process.env.BREVO_API_KEY){
  const m=/^(.*)<(.+)>$/.exec((cfg.from||'').replace(/"/g,'').trim());
  const r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',
   headers:{'api-key':process.env.BREVO_API_KEY,'content-type':'application/json',accept:'application/json'},
   body:JSON.stringify({sender:{name:m?m[1].trim():'Diversity Store',email:m?m[2]:cfg.from},to:[{email:to}],subject,htmlContent:html})});
  if(!r.ok)throw new Error('Brevo API '+r.status+' '+await r.text());
  return;
 }
 return t.sendMail({from:cfg.from,to,subject,html});
};