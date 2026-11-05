const r=require('express').Router(),{z}=require('zod'),multer=require('multer');
const db=require('../db'),{auth,validate,httpErr}=require('../middleware'),img=require('../services/image');
const up=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(_q,f,cb)=>cb(null,/^image\/(jpeg|png|webp)$/.test(f.mimetype))});
const P=z.object({name:z.string().min(2).max(120),description:z.string().max(2000).default(''),price:z.coerce.number().positive(),
 stock:z.coerce.number().int().min(0),category_id:z.coerce.number().int(),brand:z.string().max(50).optional()});

r.get('/categories',async(_q,s)=>s.json((await db.query('select * from categories order by id')).rows));
r.get('/',async(q,s)=>{
 const w=['true'],p=[],add=(c,v)=>{p.push(v);w.push(c.replace(/\?/g,'$'+p.length))};
 const{q:t,category,brand,min,max}=q.query,page=Math.max(1,+q.query.page||1);
 if(t)add('(p.name ilike ? or p.description ilike ?)','%'+t+'%');
 if(category)add('p.category_id=?',+category);if(brand)add('p.brand ilike ?',brand);
 if(min)add('p.price>=?',+min);if(max)add('p.price<=?',+max);
 const base=`from products p left join categories c on c.id=p.category_id where ${w.join(' and ')}`;
 const total=(await db.query('select count(*) '+base,p)).rows[0].count;
 const{rows}=await db.query(`select p.*,c.name category ${base} order by p.created_at desc limit 12 offset ${(page-1)*12}`,p);
 s.json({items:rows,total:+total,page});});

r.post('/',auth('admin'),up.single('image'),validate(P),async(q,s)=>{
 const b=q.body,i=q.file?await img.process(q.file.buffer):{};
 const{rows:[x]}=await db.query('insert into products(name,description,price,stock,category_id,brand,image_url,image_thumb) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',
  [b.name,b.description,b.price,b.stock,b.category_id,b.brand||null,i.image_url||null,i.image_thumb||null]);s.status(201).json(x)});

r.put('/:id',auth('admin'),up.single('image'),validate(P),async(q,s)=>{
 const b=q.body,{rows:[old]}=await db.query('select * from products where id=$1',[q.params.id]);if(!old)throw httpErr(404,'No existe');
 let i={image_url:old.image_url,image_thumb:old.image_thumb};
 if(q.file){i=await img.process(q.file.buffer);await img.remove(old.image_url,old.image_thumb)}
 const{rows:[x]}=await db.query('update products set name=$2,description=$3,price=$4,stock=$5,category_id=$6,brand=$7,image_url=$8,image_thumb=$9 where id=$1 returning *',
  [q.params.id,b.name,b.description,b.price,b.stock,b.category_id,b.brand||null,i.image_url,i.image_thumb]);s.json(x)});

r.delete('/:id',auth('admin'),async(q,s)=>{
 const{rows:[x]}=await db.query('delete from products where id=$1 returning image_url,image_thumb',[q.params.id]);
 if(!x)throw httpErr(404,'No existe');await img.remove(x.image_url,x.image_thumb);s.status(204).end()});
module.exports=r;
