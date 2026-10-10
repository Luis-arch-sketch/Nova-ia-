'use strict';
// Diretório de servidores públicos; códigos personalizados continuam privados.
(() => {
  const joinButton=document.getElementById('roomJoin');
  const roomPanel=document.getElementById('roomPanel');
  const roomInput=document.getElementById('roomCode');
  if(!joinButton||!roomPanel||!roomInput)return;

  const style=document.createElement('style');
  style.textContent=`
  #serverDirectory{margin:12px 0;padding:12px;border:1px solid #497ab7;border-radius:12px;background:#152c4a;color:#f5f9ff}
  #serverDirectory h3{margin:3px 0 6px;font-size:16px}
  #serverDirectory .sv-note{font-size:12px;color:#c6dcfc;line-height:1.4;margin:5px 0 10px}
  #serverDirectory .sv-actions{display:flex;gap:5px;flex-wrap:wrap}
  #serverDirectory .sv-actions button{flex:1 1 130px;font-size:13px}
  #serverDirectory .sv-list{display:grid;gap:7px;margin:8px 0}
  #serverDirectory .sv-item{display:flex;justify-content:space-between;align-items:center;gap:7px;border:1px solid #3a6492;border-radius:8px;padding:7px}
  #serverDirectory .sv-item button{font-size:12px;margin:0;flex-shrink:0}
  #serverDirectory .sv-pages{display:flex;align-items:center;gap:8px;justify-content:center}
  #serverDirectory .sv-pages button{font-size:12px}
  `;
  document.head.appendChild(style);

  const wrapper=document.createElement('section');
  wrapper.id='serverDirectory';
  wrapper.innerHTML=`
    <h3>🌐 Servidores sem número fixo de salas</h3>
    <p class="sv-note">Crie um servidor público ou entre em um disponível. Até 16 jogadores por sala; novas salas aparecem conforme a necessidade. Salas vazias saem da lista.</p>
    <div class="sv-actions">
      <button type="button" id="svQuick">⚡ Entrar em um servidor</button>
      <button type="button" id="svCreate">➕ Criar servidor</button>
    </div>
    <div class="sv-actions"><button type="button" id="svRefresh">🔄 Ver servidores ativos</button></div>
    <p class="sv-note" id="svCount" aria-live="polite">Carregando servidores…</p>
    <div id="svList" class="sv-list"></div>
    <div class="sv-pages">
      <button type="button" id="svPrev">◀ Anterior</button>
      <span id="svPage">1 / 1</span>
      <button type="button" id="svNext">Próxima ▶</button>
    </div>
  `;
  joinButton.parentNode.insertBefore(wrapper,joinButton);
  const el=id=>document.getElementById(id);
  let page=0,lastPages=1,fetchId=0;

  async function refresh(wantedPage=page){
    const request=++fetchId;
    el('svCount').textContent='Consultando servidores…';
    try{
      const response=await fetch('/api/servers?page='+Math.max(0,wantedPage),{cache:'no-store'});
      if(!response.ok)throw new Error('Servidor não respondeu');
      const result=await response.json();
      if(request!==fetchId)return;
      page=result.page;lastPages=result.pages;
      el('svCount').textContent=result.total+' servidor(es) público(s) ativo(s) • '+result.players+' jogador(es) conectados';
      const list=el('svList');list.replaceChildren();
      if(!result.rooms.length){
        const empty=document.createElement('p');empty.className='sv-note';
        empty.textContent='Ainda não há servidores públicos nesta página. Toque em Criar servidor!';
        list.appendChild(empty);
      }
      for(const server of result.rooms){
        const entry=document.createElement('div');entry.className='sv-item';
        const caption=document.createElement('span');
        caption.textContent='🌍 '+server.room+' • '+server.count+'/'+server.capacity+' jogadores';
        const join=document.createElement('button');join.type='button';join.textContent='🚪 Entrar';
        join.addEventListener('click',()=>{roomInput.value=server.room;mpJoin('join')});
        entry.append(caption,join);list.appendChild(entry);
      }
      el('svPage').textContent=(page+1)+' / '+lastPages;
      el('svPrev').disabled=page<=0;el('svNext').disabled=page>=lastPages-1;
    }catch(err){
      if(request!==fetchId)return;
      el('svCount').textContent='⚠ Falha ao consultar servidores. Tente atualizar.';
      el('svList').replaceChildren();
    }
  }

  el('svQuick').addEventListener('click',()=>mpJoin('quick-join'));
  el('svCreate').addEventListener('click',()=>mpJoin('create-server'));
  el('svRefresh').addEventListener('click',()=>refresh(0));
  el('svPrev').addEventListener('click',()=>refresh(page-1));
  el('svNext').addEventListener('click',()=>refresh(page+1));
  document.getElementById('roomButton')?.addEventListener('click',()=>refresh(0));
  refresh(0);
})();
