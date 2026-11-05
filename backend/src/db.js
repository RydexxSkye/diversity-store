const {Pool}=require('pg'),cfg=require('./config');
module.exports=new Pool({connectionString:cfg.dbUrl,ssl:{rejectUnauthorized:false}});
