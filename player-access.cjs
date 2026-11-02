'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');

// Identidades e permissões são assinadas pelo servidor, nunca por nomes ou flags do navegador.
class PlayerAccess {
 constructor(secret,file=null){
  this.secret=secret;this.file=file;this.state={ownerId:null,grants:[],blocked:[],updatedAt:0};this.kicks=new Map();
  if(file)try{const saved=this.verify(fs.readFileSync(file,'utf8'),'access-state');if(saved)this.restore(saved.state)}catch{}
 }
 sign(data){const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+crypto.createHmac('sha256',this.secret).update(body).digest('base64url')}
 verify(token,kind){
  if(typeof token!=='string'||token.length>100000)return null;
  const [body,sig,...extra]=token.split('.');if(!body||!sig||extra.length)return null;
  try{const expected=crypto.createHmac('sha256',this.secret).update(body).digest(),actual=Buffer.from(sig,'base64url');
   if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
   const data=JSON.parse(Buffer.from(body,'base64url').toString());return data.kind===kind?data:null;
  }catch{return null}
 }
 identity(token){const data=this.verify(token,'player');return data&&typeof data.id==='string'&&/^[a-f0-9-]{36}$/.test(data.id)?data.id:null}
 newIdentity(){const id=crypto.randomUUID();return {id,token:this.sign({kind:'player',id})}}
 cookie(req){const raw=(req.headers?.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('rue_player='));const token=raw?.slice(11);return token&&this.identity(token)?{id:this.identity(token),token}:null}
 blocked(id){return this.state.blocked.some(p=>p.id===id)}
 role(id){return id===this.state.ownerId?'owner':!this.blocked(id)&&this.state.grants.some(p=>p.id===id)?'operator':'player'}
 save(){
  this.state.updatedAt=Math.max(Date.now(),this.state.updatedAt+1);
  if(this.file){fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(this.file+'.tmp',this.backup(),{mode:0o600});fs.renameSync(this.file+'.tmp',this.file)}
 }
 backup(){return this.sign({kind:'access-state',state:this.state})}
 restore(state){
  if(!state||!Number.isSafeInteger(state.updatedAt)||state.updatedAt<=this.state.updatedAt||typeof state.ownerId!=='string')return false;
  if(!Array.isArray(state.grants)||!Array.isArray(state.blocked)||state.grants.length>2000||state.blocked.length>2000)return false;
  const clean=rows=>rows.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').map(p=>({id:p.id,name:p.name.slice(0,20)}));
  this.state={ownerId:state.ownerId,grants:clean(state.grants),blocked:clean(state.blocked),updatedAt:state.updatedAt};return true;
 }
 resumeOwner(id,proof,backup){
  const data=this.verify(proof,'owner');if(!data||data.id!==id)return false;
  const saved=this.verify(backup,'access-state');if(saved?.state?.ownerId===id)this.restore(saved.state);
  if(this.state.ownerId&&this.state.ownerId!==id)return false;
  if(!this.state.ownerId){this.state.ownerId=id;this.save()}
  return !this.blocked(id);
 }
 claimOwner(id){
  if(this.blocked(id))return {error:'Seu acesso ao painel foi bloqueado pelo dono.'};
  if(this.state.ownerId&&this.state.ownerId!==id)return {error:'Você não é o dono. Somente o dono pode conceder acesso ao painel.'};
  this.state.ownerId=id;this.save();return {token:this.sign({kind:'owner',id})};
 }
 change(action,id,name){
  if(id===this.state.ownerId)return {error:'As permissões do dono não podem ser removidas.'};
  if(!['grant','block','unblock','revoke'].includes(action))return {error:'Comando inválido.'};
  this.state.grants=this.state.grants.filter(p=>p.id!==id);
  if(action==='grant'||action==='unblock')this.state.blocked=this.state.blocked.filter(p=>p.id!==id);
  if(action==='grant')this.state.grants.push({id,name});
  if(action==='block'&&!this.blocked(id))this.state.blocked.push({id,name});
  this.save();return {ok:true};
 }
}
module.exports={PlayerAccess};
