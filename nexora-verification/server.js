'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,file=process.env.DATA_FILE||'/tmp/nexora-verification-requests.json';
const port=Number(process.env.PORT||10000);
let requests=[];try{requests=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(requests))requests=[]}catch{}
const sessions=new Map();
function save(){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(requests,null,2),{mode:0o600});fs.renameSync(tmp,file)}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function clean(s,n=280){return String(s||'').trim().slice(0,n)}
const page=fs.readFileSync(path.join(root,'index.html'));
http.createServer((req,res)=>{
 res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(page)}
 if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true});
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/status'){
   const id=clean(url.searchParams.get('id'),80);const x=requests.find(v=>v.id===id);
   return x?json(res,200,{id:x.id,status:x.status,submittedAt:x.submittedAt}):json(res,404,{error:'Pedido não encontrado'});
 }
 if(req.method==='POST'&&url.pathname==='/api/apply'){
  const ip=req.headers['x-forwarded-for']?.split(',')[0]||req.socket.remoteAddress||'unknown';
  const now=Date.now();const seen=(sessions.get(ip)||[]).filter(t=>now-t<3600000);if(seen.length>=3)return json(res,429,{error:'Limite de três pedidos por hora. Tente mais tarde.'});
  let raw='';req.on('data',b=>{raw+=b;if(raw.length>5000)req.destroy()});req.on('end',()=>{
   let body;try{body=JSON.parse(raw)}catch{return json(res,400,{error:'Formulário inválido'})}
   const username=clean(body.username,48).replace(/^@/,'').toLowerCase(),reason=clean(body.reason,500),link=clean(body.link,240);
   if(!/^[a-z0-9_]{3,28}$/.test(username)||reason.length<20)return json(res,400,{error:'Informe um @ válido e descreva sua solicitação com pelo menos 20 caracteres.'});
   if(link&&(!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(link)))return json(res,400,{error:'Use um link público HTTPS válido.'});
   const recent=requests.find(v=>v.username===username&&v.status==='pending');if(recent)return json(res,409,{error:'Já existe um pedido pendente para este nome.'});
   const id=crypto.randomBytes(16).toString('hex');const x={id,username,reason,link,status:'pending',submittedAt:new Date().toISOString()};
   requests.push(x);try{save()}catch{return json(res,503,{error:'Armazenamento temporariamente indisponível'})}
   seen.push(now);sessions.set(ip,seen);return json(res,201,{id,status:'pending',submittedAt:x.submittedAt});
  });return;
 }
 if(req.method==='POST'&&url.pathname==='/api/admin/decision'){
  const secret=process.env.ADMIN_SECRET;if(!secret||secret.length<24)return json(res,503,{error:'Administração ainda não configurada'});
  const provided=String(req.headers['x-admin-secret']||'');
  const a=Buffer.from(secret),b=Buffer.from(provided);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return json(res,403,{error:'Acesso negado'});
  let raw='';req.on('data',d=>{raw+=d;if(raw.length>2000)req.destroy()});req.on('end',()=>{let p;try{p=JSON.parse(raw)}catch{return json(res,400,{error:'JSON inválido'})}
   if(!['approved','rejected'].includes(p.status))return json(res,400,{error:'Status inválido'});
   const x=requests.find(v=>v.id===p.id);if(!x)return json(res,404,{error:'Pedido não encontrado'});
   x.status=p.status;x.reviewedAt=new Date().toISOString();try{save()}catch{return json(res,503,{error:'Falha ao salvar'})}
   return json(res,200,{id:x.id,status:x.status});
  });return;
 }
 return json(res,404,{error:'Página não encontrada'});
}).listen(port,'0.0.0.0',()=>console.log('Nexora Verification listening on',port));