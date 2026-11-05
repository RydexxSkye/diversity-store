const sharp=require('sharp'),fs=require('fs/promises'),path=require('path'),crypto=require('crypto'),cfg=require('../config');
// Optimización: autorrotación, máx 800px, WebP calidad 75 + miniatura 240px. sharp elimina EXIF por defecto.
exports.process=async buf=>{
 await fs.mkdir(cfg.uploads,{recursive:true});
 const id=crypto.randomUUID();
 await sharp(buf).rotate().resize(800,800,{fit:'inside',withoutEnlargement:true}).webp({quality:75}).toFile(path.join(cfg.uploads,id+'.webp'));
 await sharp(buf).rotate().resize(240,240,{fit:'cover'}).webp({quality:70}).toFile(path.join(cfg.uploads,id+'-thumb.webp'));
 return{image_url:`/uploads/${id}.webp`,image_thumb:`/uploads/${id}-thumb.webp`};
};
exports.remove=async(...urls)=>{for(const u of urls)if(u)await fs.unlink(path.join(cfg.uploads,path.basename(u))).catch(()=>{})};
