'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,file=process.env.DATA_FILE||'/tmp/nexora-verification-requests.json';
const port=Number(process.env.PORT||10000);
let requests=[];try{requests=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(requests))requests=[]}catch{}
const sessions=new Map();
function save(){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(requests,null,2),{mode:0o600});fs.renameSync(tmp,file)}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function clean(s,n=280){return String(s||'').trim().slice(0,n)}

const smsSessions=new Map(),smsThrottle=new Map();
function smsSettings(){return !!(process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET && /^VA[0-9a-f]{32}$/i.test(process.env.TWILIO_VERIFY_SERVICE_SID||''))}
async function twilio(action,fields){
 const endpoint='https://verify.twilio.com/v2/Services/'+process.env.TWILIO_VERIFY_SERVICE_SID+'/'+action;
 const auth=Buffer.from(process.env.TWILIO_API_KEY+':'+process.env.TWILIO_API_SECRET).toString('base64');
 const rsp=await fetch(endpoint,{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields),signal:AbortSignal.timeout(12000)});
 const payload=await rsp.json();if(!rsp.ok)throw Error('SMS_PROVIDER_ERROR_'+rsp.status);return payload;
}
function readBody(req,res,callback){let raw='',stopped=false;req.on('data',b=>{raw+=b;if(raw.length>2048&&!stopped){stopped=true;json(res,413,{error:'Dados muito grandes'});req.destroy()}});req.on('end',async()=>{if(stopped)return;try{await callback(JSON.parse(raw))}catch(e){if(!res.writableEnded)json(res,400,{error:'Dados inválidos'})}})}
function clientId(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'anonymous').split(',')[0].slice(0,80)}
function mobile(v){const p=String(v||'').replace(/[\s().-]/g,'');return /^\+[1-9]\d{9,14}$/.test(p)?p:null}

const page=fs.readFileSync(path.join(root,'index.html'));
http.createServer((req,res)=>{
 res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET' && !new URL(req.url,'http://localhost').pathname.startsWith('/api/') && new URL(req.url,'http://localhost').pathname!=='/health'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(page)}
 if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true});

 if(req.method==='GET'&&req.url==='/api/sms/config')return json(res,200,{enabled:smsSettings(),mode:'phone-only'});
 if(req.method==='POST'&&req.url==='/api/sms/send'){
  return readBody(req,res,async body=>{
   if(!smsSettings())return json(res,503,{error:'O envio de SMS ainda precisa ser ativado pela administração.'});
   const phone=mobile(body.phone),username=clean(body.username,40).replace(/^@/,'').toLowerCase();
   if(!phone||!/^[a-z0-9_]{3,28}$/.test(username))return json(res,400,{error:'Informe telefone com DDI, como +55, e seu @usuário.'});
   const id=clientId(req),key=id+'|'+phone,now=Date.now(),recent=(smsThrottle.get(key)||[]).filter(t=>now-t<3600000);
   if(recent.length>=3)return json(res,429,{error:'Limite de envios atingido. Tente depois.'});
   try{
    const v=await twilio('Verifications',{To:phone,Channel:'sms'});
    if(v.status!=='pending')return json(res,502,{error:'Operadora não confirmou o envio.'});
    const session=crypto.randomBytes(24).toString('hex');
    smsSessions.set(session,{phone,username,ip:id,createdAt:now,tries:0});smsThrottle.set(key,[...recent,now]);
    return json(res,200,{session,delivery:'sms',expiresInSeconds:600});
   }catch(e){return json(res,502,{error:'Falha no envio de SMS. Confira o serviço e o número.'})}
  });
 }
 if(req.method==='POST'&&req.url==='/api/sms/check'){
  return readBody(req,res,async body=>{
   if(!smsSettings())return json(res,503,{error:'SMS indisponível'});
   const session=clean(body.session,64),code=clean(body.code,10),state=smsSessions.get(session);
   if(!state||Date.now()-state.createdAt>600000||state.ip!==clientId(req))return json(res,400,{error:'Sessão inválida ou expirada. Solicite outro SMS.'});
   if(!/^\d{4,10}$/.test(code))return json(res,400,{error:'Informe o código numérico recebido por SMS.'});
   if(++state.tries>5){smsSessions.delete(session);return json(res,429,{error:'Muitas tentativas. Solicite outro SMS.'})}
   try{
    const result=await twilio('VerificationCheck',{To:state.phone,Code:code});
    if(result.status!=='approved')return json(res,400,{error:'Código incorreto ou expirado.'});
    smsSessions.delete(session);
    return json(res,200,{phoneVerified:true,username:state.username,message:'Telefone verificado. A ativação do selo na Nexora dependerá da vinculação segura da conta.'});
   }catch(e){return json(res,502,{error:'Não foi possível validar o código agora.'})}
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