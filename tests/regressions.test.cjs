'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),server=fs.readFileSync('server.js','utf8');
test('scripts HTML continuam válidos',()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert(scripts.length>0);
 for(const [i,s] of scripts.entries())assert.doesNotThrow(()=>new Function(s[1]),'Script '+i);
});
test('formatador mostra M B T e Qav no valor correto',()=>{
 const suffix=html.match(/U=(\[[^\n]*\]);/);
 const format=html.match(/const fm=value=>\{[\s\S]*?\n\};/);
 assert(suffix&&format);
 const fm=new Function('const U='+suffix[1]+';'+format[0]+';return fm')();
 assert.equal(fm(1000000),'1M');
 assert.equal(fm(1000000000),'1B');
 assert.equal(fm(1000000000000),'1T');
 assert.equal(fm(1e75),'1Qav');
});
test('backup antigo não reativa corrida 10x',()=>{
 assert(html.includes('A.personalFast=false;if(Number(A.moveMult)===10)A.moveMult=1;'));
 assert(html.includes('const runMultiplier=A.moveMult;'));
 assert(!html.includes('ownerVerified&&A.personalFast===true?10'));
});
test('103 animais, auras e som preservados',()=>{
 assert(html.includes('const REMOVED_BIRDS=new Set([0,9])'));
 assert(html.includes('const AUR={3:'));
 assert(html.includes('GUAXINIM • PARTE 4'));
 assert(html.includes('const SNDSRC='));
});
test('admin distingue o dinheiro digitado do acumulado',()=>{
 assert(html.includes("const raw=String(AS[key]??'').trim()"));
 assert(html.includes('id="adCashPreview"'));
 assert(html.includes('Você digitou: $'));
});
test('mensagens de salas antigas são ignoradas',()=>{
 assert(html.includes('ws.onmessage=e=>{if(MP.socket!==ws)return;'));
 assert(server.includes('if(MP.socket===ws)mpSend({type:mode,room,name})'));
 assert(html.includes("msg.type==='limited-sync'"));
});
test('retirar LIMITED inválido sincroniza e limpar apaga os carregados',()=>{
 assert(server.includes("const resync=()=>send(ws,{type:'limited-sync',eggs});"));
 assert(server.includes('for(const player of peers(ws.room))player.heldLimited=null;'));
});
test('salas, guardião, esteira e Admin Abuse preservados',()=>{
 assert(html.includes('adminSpawnLimited'));assert(html.includes('const ABUSE_NAMES='));
 assert(server.includes('installServerBrowser'));assert(!server.includes('TREADMILL_RATE'));
});

test('reset único do dono mantém ADMIN',()=>{
 assert(html.includes('resetOwnerProgressOnce'));
 assert(html.includes('ADMIN_DEVICE_KEY'));
 assert(!html.includes('removeOwnerTreadmill'));
 assert(html.includes('ensureTM(S.pid);regrow(true);'));
 assert(!server.includes('applyOwnerTreadmill'));
});

test('renovação dos ovos: 9 segundos de noite, depois 3 até abrir as áreas',()=>{
 assert(html.includes("const EGG_NIGHT={phase:'day',until:0,last:'',cycles:0,renewed:0}"));
 assert(html.includes("EGG_NIGHT.phase='night';EGG_NIGHT.until=now+9000"));
 assert(html.includes("EGG_NIGHT.phase='unlock';EGG_NIGHT.until+=3000"));
 assert(html.includes("EGG_NIGHT.phase='day';EGG_NIGHT.until=0"));
 assert(html.includes("nextReset=now/1000+CFG.reset"));
 assert(html.includes("if(EGG_NIGHT.phase==='day'&&Date.now()/1e3>=nextReset)startEggNight()"));
 assert(html.includes("case 'eggNightNow':msg=startEggNight()"));
 assert(html.includes("adBtn('eggNightNow','🌙 Iniciar renovação dos ovos'"));
});
test('13 paredes brancas com relógios bloqueiam áreas e coleta noturna',()=>{
 assert(html.includes('color:0xffffff,transparent:true,opacity:.92'));
 assert(html.includes('return{z,bar,timer,l,b,req:b.req}'));
 assert(html.includes("GT.forEach(g=>{g.bar.visible=true;g.timer.visible=true;g.timer.set(text)})"));
 assert(html.includes("GT.forEach(g=>{g.bar.visible=false;g.timer.visible=false})"));
 assert(html.includes("if(Math.abs(player.x)<10&&EGG_NIGHT.phase==='day')return"));
 assert(html.includes("if(EGG_NIGHT.phase!=='day')return null"));
 assert(html.includes("if(EGG_NIGHT.phase!=='day'){toast('🔒 Aguarde renovar os ovos"));
 assert(html.includes('id="eggNightClock"'));
 assert(html.includes("EGG_NIGHT.phase==='night'?30:1"));
});
test('trocar ovos dos ninhos preserva LIMITED e sorte de raros',()=>{
 assert(html.includes("if(!e||e.s===LIMITED_ID)continue"));
 assert(html.includes("if(e.aura){sc.remove(e.aura);e.aura=null;}"));
 assert(html.includes("const ix=eggs.indexOf(e);if(ix>=0)eggs.splice(ix,1)"));
 assert(html.includes("Math.min(1,chances[r]*1.4)"));
 assert(html.includes("EGG_NIGHT.phase==='night'&&Math.random()<.32"));
 assert(html.includes("}finally{for(const r of [7,8,9])CFG.rare[r]=chances[r]}"));
});

test('Secret nasce com 10% por renovação, inclusive durante a noite',()=>{
 assert(html.includes('rare:{2:.40,3:.30,4:.20,7:.10,8:.04,9:.005}'));
 assert(html.includes('chances:{7:10,8:4,9:.5}'));
 assert(html.includes("chanceSecret:'10'"));
 assert(html.includes("const SECRET_CHANCE_MIGRATION_KEY='rue3d_secret_chance_10_v1'"));
 assert(html.includes("CFG.rare[7]=.10"));
 assert(html.includes("A.chances={...A.chances,7:10}"));
 assert(html.includes("for(const r of [8,9])CFG.rare[r]=Math.min(1,chances[r]*1.4);"));
 assert(html.includes("}finally{for(const r of [7,8,9])CFG.rare[r]=chances[r]}"));
 assert(html.includes('if(Math.random()>=CFG.rare[r])continue'));
 assert(html.includes("case 'saveChances':CFG.rare[7]=adValidNumber('chanceSecret',0,100)/100"));
 assert(html.includes("try{CFG.rare[7]=1;CFG.rare[8]=.5;CFG.rare[9]=.25;regrow(false)}finally{"));
});


test('ao entrar não existem dezenas de ovos Rare Epic e Legendary prontos',()=>{
 assert(html.includes('rare:{2:.40,3:.30,4:.20,7:.10,8:.04,9:.005}'));
 assert(html.includes("if(!n.e&&!REMOVED_BIRDS.has(n.b*8+n.j)&&CFG.rare[RS[n.j]]===undefined)sp(n)"));
 assert(html.includes("if(!first)for(const r in CFG.rare)"));
 assert(html.includes("if(Math.random()>=CFG.rare[r])continue"));
 assert(html.includes("const renewNestEggs=()=>{"));
 assert(html.includes("if(!e||e.s===LIMITED_ID)continue"));
 assert(html.includes("const chances={7:CFG.rare[7],8:CFG.rare[8],9:CFG.rare[9]}"));
});
test('coleta é física e o bicho persegue rápido em vez de exibir Speed insuficiente',()=>{
 assert(html.includes("const findEgg=()=>{"));
 assert(!html.includes('const eggSpeedEnough='));
 assert(!html.includes('const lockedEggNearby='));
 assert(!html.includes('const reportMissingSpeed='));
 assert(html.includes("if(d<distance&&d<range&&e.gr>=1){distance=d;best=e}"));
 assert(!html.includes('if(!eggSpeedEnough(e))'));
 assert(html.includes('const guardianShouldRush=(i,home)=>'));
 assert(html.includes('Number.isFinite(S.sp)&&S.sp<=BI[i].req'));
 assert(html.includes('const guardianRushSpeed=i=>Math.max(95'));
 assert(html.includes('const guardianPushBack=g=>'));
 assert(html.includes('const rush=!frozen&&guardianShouldRush(3,g.home)'));
 assert(html.includes('const p=g.m.position,i=g.b,rush=!frozen&&guardianShouldRush(i,g.home)'));
 assert(html.includes('if(rush&&!carry)guardianPushBack(g)'));
 assert(!server.includes('Speed insuficiente'));
 assert(!server.includes('limitedSpeedRequired'));
 assert(html.includes("case 'speedSet':"));
 assert(html.includes("const ABUSE_NAMES="));
});

test('raridades ordenadas por chance e valor: Legendary abaixo de Secret e LIMITED como maior',()=>{
 const rates={2:.40,3:.30,4:.20,7:.10,8:.04,9:.005};
 for(let i=1,order=[2,3,4,7,8,9];i<order.length;i++)
  assert(rates[order[i-1]]>rates[order[i]],'Ovo mais forte é menos frequente');
 assert(html.includes('rare:{2:.40,3:.30,4:.20,7:.10,8:.04,9:.005}'));
 assert(html.includes("const RAR=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Cosmic','Secret','Eternal','Divine','LIMITED']"));
 assert(html.includes('const RS=[0,1,2,3,4,7,8,9]')||html.includes(",RS=[0,1,2,3,4,7,8,9]"));
 assert(html.includes('inc:CFG.inc*4**i*(1+1.5*j)'));
 assert(html.includes("n:'LIMITED ∞ • Dragão de Fogo'"));
 assert(html.includes('SPC.push({id:LIMITED_ID,n:'));
 assert(html.includes("Ordem de poder: Common → Uncommon → Rare → Epic → Legendary → Secret → Eternal → Divine → LIMITED ∞."));
 assert(html.includes('Rare 40% · Epic 30% · Legendary 20%'));
 assert(!html.includes('rare:{2:.25,3:.12,4:.05,7:.10,8:.04,9:.005}'));
});
