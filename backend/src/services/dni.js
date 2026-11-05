const cfg=require('../config'),{httpErr}=require('../middleware');
// Normaliza la respuesta de proveedores comunes (apis.net.pe / apiperu.dev)
exports.lookup=async dni=>{
 if(!cfg.dniUrl)throw httpErr(500,'API de DNI no configurada');
 const r=await fetch(`${cfg.dniUrl}?numero=${dni}`,{headers:{Authorization:`Bearer ${cfg.dniToken}`}});
 if(!r.ok)throw httpErr(404,'DNI no encontrado');
 const j=await r.json(),d=j.data||j;
 const apellidos=d.apellidos||[d.apellidoPaterno||d.apellido_paterno,d.apellidoMaterno||d.apellido_materno].filter(Boolean).join(' ');
 if(!d.nombres)throw httpErr(404,'DNI no encontrado');
 return{nombres:d.nombres,apellidos};
};
