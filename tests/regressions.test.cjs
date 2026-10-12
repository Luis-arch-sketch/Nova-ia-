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

test('esteira normal para ADMIN, poderes sempre opcionais',()=>{
 assert(!server.includes('applyOwnerTreadmill'));
 assert(!server.includes('TREADMILL_RATE_TEXT'));
 assert(!server.includes('ownerVerified?TREADMILL_RATE'));
 assert(server.includes("const gameHtml=installServerBrowser(applyGraphicUpgrade(fs.readFileSync("));
 assert(html.includes('S.sp+=TM[S.tm][1]*CFG.train*abuseTrainMult()*dt'));
 assert(html.includes("TMO.lab.set('Sua esteira: '+TM[S.tm][0]+' x'+TM[S.tm][1])"));
 assert(html.includes('Sua esteira normal:'));
 assert(html.includes("adBtn('playNormal','👤 Jogar normalmente'"));
 assert(html.includes("case 'playNormal':"));
 assert(html.includes('ADMIN e Admin Abuse continuam disponíveis'));
 assert(html.includes("adBtn('spawnLimitedBatch'"));
 assert(html.includes("case 'speedSet':"));
 assert(html.includes("case 'moneySet':"));
});

test('conta ADMIN fica realmente sem esteira nem treino automático',()=>{
 assert(html.includes('const removeOwnerTreadmill=()=>{'));
 assert(html.includes('if(TMO){sc.remove(TMO.g);TMO=null;}'));
 assert(html.includes('P.train=false;S.tm=0;'));
 assert(html.includes('if(ownerVerified)removeOwnerTreadmill();else ensureTM(S.pid);'));
 assert(html.includes('if(ownerVerified&&P.train)P.train=false;'));
 assert(html.includes('if(P.train&&!ownerVerified){tx=tz=0;'));
 assert(html.includes("if(!ownerVerified&&near(-14,4,4))"));
 assert(html.includes("ownerVerified&&i===0?'':bt('T'+i"));
 assert(html.includes("case 'trainToggle':if(ownerVerified)"));
 assert(html.includes("case 'treadSet':if(ownerVerified)"));
 assert(html.includes("case 'playNormal':{removeOwnerTreadmill();"));
 assert(html.includes("ownerVerified=true;adminBadge.visible=true;removeOwnerTreadmill();"));
 assert(html.includes('const adminLogin=async e=>'));
 assert(html.includes('const ABUSE_NAMES='));
 assert(html.includes("case 'speedSet':"));
 assert(html.includes("case 'moneySet':"));
});
