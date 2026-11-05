const nm=require('nodemailer'),cfg=require('../config');
const t=nm.createTransport(cfg.smtp);
exports.send=(to,subject,html)=>t.sendMail({from:cfg.from,to,subject,html});
