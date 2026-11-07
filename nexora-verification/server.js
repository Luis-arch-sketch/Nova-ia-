'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,file=process.env.DATA_FILE||'/tmp/nexora-verification-requests.json';
const port=Number(process.env.PORT||10000);
let requests=[];try{requests=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(requests))requests=[]}catch{}
const sessions=new Map();
function save(){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(requests,null,2),{mode:0o600});fs.renameSync(tmp,file)}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function clean(s,n=280){return String(s||'').trim().slice(0,n)}

const emailSessions=new Map(),emailThrottle=new Map();
function emailSettings(){return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.EMAIL_FROM))}
function cleanEmail(v){const email=String(v||'').trim().toLowerCase();return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null}
function readBody(req,res,callback){let raw='',stopped=false;req.on('data',b=>{raw+=b;if(raw.length>2048&&!stopped){stopped=true;json(res,413,{error:'Dados muito grandes'});req.destroy()}});req.on('end',async()=>{if(stopped)return;try{await callback(JSON.parse(raw))}catch(e){if(!res.writableEnded)json(res,400,{error:'Dados inválidos'})}})}
function clientId(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'anonymous').split(',')[0].slice(0,80)}
async function sendVerificationEmail(email,code){const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'Código de verificação Nexora — expira em 1 minuto',text:'Seu código de verificação da Nexora é: '+code+'\n\nEle expira em 1 minuto. Não compartilhe este código com ninguém.'}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('email provider rejected request');return response.json()}
function codeDigest(salt,code){return crypto.createHash('sha256').update(salt+':'+code).digest()}

const accountFile=process.env.ACCOUNT_DATA_FILE||'/tmp/nexora-account-claims.json';
let accountDb={claims:{},verified:{}};try{const d=JSON.parse(fs.readFileSync(accountFile,'utf8'));if(d&&typeof d==='object'&&d.claims&&d.verified)accountDb=d}catch{}
const accountLimits=new Map();
function persistAccount(){const tmp=accountFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(accountDb),{mode:0o600});fs.renameSync(tmp,accountFile)}
function accountHandle(v){const h=String(v||'').replace(/^@/,'').trim().toLowerCase();return /^[a-z0-9_]{3,28}$/.test(h)?h:null}
function claimToken(v){return String(v||'').trim().toUpperCase().replace(/[\s-]/g,'')}
function expireClaims(){for(const [key,val] of Object.entries(accountDb.claims))if(val.expires<Date.now())delete accountDb.claims[key]}
function publicOrigin(req,res){const allowed='https://nexora-lm-streaming.onrender.com';const origin=req.headers.origin;if(origin===allowed){res.setHeader('Access-Control-Allow-Origin',allowed);res.setHeader('Vary','Origin')}}

const page=fs.readFileSync(path.join(root,'index.html'));
http.createServer((req,res)=>{
 res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET' && !new URL(req.url,'http://localhost').pathname.startsWith('/api/') && new URL(req.url,'http://localhost').pathname!=='/health'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(page)}
 if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true});

 publicOrigin(req,res);
 if(req.method==='OPTIONS'&&new URL(req.url,'http://localhost').pathname.startsWith('/api/account/')){
  res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.writeHead(204);return res.end();
 }
 if(req.method==='GET'&&new URL(req.url,'http://localhost').pathname==='/api/account/badge'){
  const u=accountHandle(new URL(req.url,'http://localhost').searchParams.get('username'));
  if(!u)return json(res,400,{error:'Usuário inválido'});
  return json(res,200,{username:u,verified:!!accountDb.verified[u],preview:true});
 }
 if(req.method==='POST'&&req.url==='/api/account/code'){
  return readBody(req,res,async data=>{
   if(req.headers.origin!=='https://nexora-lm-streaming.onrender.com')return json(res,403,{error:'Abra a Nexora para gerar o código.'});
   const username=accountHandle(data.username);
   if(!username)return json(res,400,{error:'Salve primeiro seu usuário na Nexora.'});
   if(accountDb.verified[username])return json(res,409,{error:'Esta conta já tem um selo de prévia.'});
   const ip=clientId(req),now=Date.now(),recent=(accountLimits.get(ip)||[]).filter(t=>now-t<3600000);
   if(recent.length>=10)return json(res,429,{error:'Limite de códigos atingido.'});
   expireClaims();
   const code=crypto.randomBytes(5).toString('hex').toUpperCase();
   accountDb.claims[username]={digest:crypto.createHash('sha256').update(code).digest('hex'),expires:now+300000,attempts:0};
   try{persistAccount()}catch{return json(res,503,{error:'Não foi possível registrar seu código.'})}
   accountLimits.set(ip,[...recent,now]);
   return json(res,200,{username,code,expiresInSeconds:300});
  });
 }
 if(req.method==='POST'&&req.url==='/api/account/redeem'){
  return readBody(req,res,async data=>{
   const username=accountHandle(data.username),code=claimToken(data.code);
   if(!username||!/^[A-F0-9]{10}$/.test(code))return json(res,400,{error:'Informe o usuário e o código de 10 caracteres.'});
   expireClaims();const entry=accountDb.claims[username];
   if(!entry)return json(res,400,{error:'Código expirado ou inexistente. Gere outro na sua conta.'});
   if(++entry.attempts>5){delete accountDb.claims[username];persistAccount();return json(res,429,{error:'Muitas tentativas. Gere outro código.'})}
   const got=crypto.createHash('sha256').update(code).digest('hex');
   if(!crypto.timingSafeEqual(Buffer.from(got,'hex'),Buffer.from(entry.digest,'hex')))return json(res,400,{error:'Código incorreto.'});
   delete accountDb.claims[username];accountDb.verified[username]={verifiedAt:new Date().toISOString(),preview:true};
   try{persistAccount()}catch{return json(res,503,{error:'Não foi possível salvar a verificação.'})}
   return json(res,200,{verified:true,username,preview:true,message:'Código aceito! Seu selo de prévia foi ativado na Nexora.'});
  });
 }


 if(req.method==='GET'&&req.url==='/api/email/config')return json(res,200,{enabled:emailSettings(),expiresInSeconds:60});
 if(req.method==='POST'&&req.url==='/api/email/send'){
  return readBody(req,res,async body=>{
   if(!emailSettings())return json(res,503,{error:'O envio de e-mail ainda precisa ser ativado pela administração.'});
   const email=cleanEmail(body.email),username=clean(body.username,40).replace(/^@/,'').toLowerCase();
   if(!email||!/^[a-z0-9_]{3,28}$/.test(username))return json(res,400,{error:'Informe um e-mail válido e seu @usuário.'});
   const ip=clientId(req),key=ip+'|'+email,now=Date.now(),recent=(emailThrottle.get(key)||[]).filter(t=>now-t<3600000);
   if(recent.length>=3)return json(res,429,{error:'Limite de envios por hora atingido. Tente depois.'});
   const code=String(crypto.randomInt(100000,1000000));const salt=crypto.randomBytes(16).toString('hex');const session=crypto.randomBytes(24).toString('hex');
   try{
    await sendVerificationEmail(email,code);
    for(const [id,v] of emailSessions)if(v.email===email&&v.username===username)emailSessions.delete(id);
    emailSessions.set(session,{digest:codeDigest(salt,code),salt,email,username,ip,createdAt:Date.now(),tries:0});
    emailThrottle.set(key,[...recent,now]);
    return json(res,200,{session,expiresInSeconds:60,message:'Código enviado para o seu e-mail.'});
   }catch(e){return json(res,502,{error:'Falha ao enviar o e-mail. Confira a configuração do remetente.'})}
  });
 }
 if(req.method==='POST'&&req.url==='/api/email/check'){
  return readBody(req,res,async body=>{
   const session=clean(body.session,64),code=clean(body.code,10),state=emailSessions.get(session);
   if(!state)return json(res,400,{error:'Sessão inválida. Solicite outro código.'});
   if(Date.now()-state.createdAt>=60000){emailSessions.delete(session);return json(res,410,{error:'Código expirado. Solicite outro.'})}
   if(state.ip!==clientId(req))return json(res,403,{error:'Sessão inválida'});
   if(!/^\d{6}$/.test(code))return json(res,400,{error:'Digite o código de 6 números.'});
   if(++state.tries>5){emailSessions.delete(session);return json(res,429,{error:'Muitas tentativas. Solicite outro código.'})}
   const actual=codeDigest(state.salt,code);
   if(!crypto.timingSafeEqual(actual,state.digest))return json(res,400,{error:'Código incorreto.'});
   emailSessions.delete(session);
   return json(res,200,{emailVerified:true,username:state.username,message:'E-mail confirmado. A ativação do selo na conta depende da integração segura com o perfil da Nexora.'});
  });
 }
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