(() => {
  'use strict';
  if (window.CloudPad) return;
  const b = Array.from({length:17},() => ({pressed:false,touched:false,value:0}));
  const axes = [0,0,0,0];
  const gamepad = {id:'Cloud Futebol Virtual Xbox Controller', index:0,connected:true,mapping:'standard',buttons:b,axes,timestamp:performance.now()};
  let root=null, shown=true, announced=false;
  const key='cloud-futebol-pad-visible';
  function stamp(){gamepad.timestamp=performance.now();}
  function announce(){
    try{
      const evt=new Event('gamepadconnected');
      Object.defineProperty(evt,'gamepad',{value:gamepad});
      window.dispatchEvent(evt);announced=true;
    }catch(e){window.__cloudPadError=String(e);}
  }
  try{
    const original=navigator.getGamepads? navigator.getGamepads.bind(navigator):()=>[];
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=> {
      const real=Array.from(original()||[]);
      if(real.some(p=>p&&p.connected))return real;
      return [gamepad,null,null,null];
    }});
    announce();
  }catch(e){window.__cloudPadError=String(e);}
  function button(index,down){
    b[index].pressed=!!down;b[index].touched=!!down;b[index].value=down?1:0;
    stamp();
    if(down&&!announced)announce();
  }
  function stick(index,x,y){axes[index*2]=x;axes[index*2+1]=y;stamp();}
  function el(tag,style,label){
    const node=document.createElement(tag);
    Object.assign(node.style,style);
    if(label)node.textContent=label;
    return node;
  }
  const common={position:'absolute',touchAction:'none',userSelect:'none',WebkitUserSelect:'none',boxSizing:'border-box'};
  function keyButton(label,index,pos,size=45){
    const node=el('div',{...common,...pos,width:size+'px',height:size+'px',display:'grid',placeItems:'center',border:'2px solid #ffffffb0',borderRadius:'50%',color:'white',font:'800 16px system-ui',background:'#102338ad',boxShadow:'0 2px 9px #0007',pointerEvents:'auto'},label);
    const ids=new Set();
    node.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ids.add(e.pointerId);node.setPointerCapture(e.pointerId);button(index,true);node.style.background='#0e8759cc';});
    function end(e){e.preventDefault();e.stopPropagation();ids.delete(e.pointerId);if(!ids.size){button(index,false);node.style.background='#102338ad';}}
    node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);return node;
  }
  function analog(index,pos){
    const outer=el('div',{...common,...pos,width:'120px',height:'120px',border:'2px solid #ffffff70',borderRadius:'50%',background:'#10233865',pointerEvents:'auto'});
    const nub=el('div',{position:'absolute',left:'35px',top:'35px',width:'50px',height:'50px',borderRadius:'50%',background:'#70a5d5ad',border:'2px solid #ffffff90',pointerEvents:'none'});
    outer.appendChild(nub);let finger=null;
    function update(e){
      const r=outer.getBoundingClientRect();
      const x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.39)));
      const y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.39)));
      const mag=Math.max(1,Math.hypot(x,y));const ax=x/mag,ay=y/mag;
      stick(index,ax,ay);nub.style.transform='translate('+(ax*39)+'px,'+(ay*39)+'px)';
    }
    outer.addEventListener('pointerdown',e=>{if(finger!==null)return;e.preventDefault();e.stopPropagation();finger=e.pointerId;outer.setPointerCapture(finger);update(e);announce();});
    outer.addEventListener('pointermove',e=>{if(e.pointerId!==finger)return;e.preventDefault();e.stopPropagation();update(e);});
    function end(e){if(e.pointerId!==finger)return;finger=null;stick(index,0,0);nub.style.transform='';}
    outer.addEventListener('pointerup',end);outer.addEventListener('pointercancel',end);return outer;
  }
  function mount(){
    if(root&&root.isConnected)return;
    if(!document.body)return;
    root=el('div',{position:'fixed',inset:'0',zIndex:'2147483646',pointerEvents:'none',touchAction:'none',fontFamily:'system-ui'});
    root.id='cloud-futebol-controls';
    root.appendChild(analog(0,{left:'4%',bottom:'13%'}));
    root.appendChild(analog(1,{right:'26%',bottom:'13%'}));
    const layout=[
      ['A',0,{right:'6%',bottom:'16%'},54],['B',1,{right:'1%',bottom:'30%'},54],
      ['X',2,{right:'12%',bottom:'30%'},54],['Y',3,{right:'6%',bottom:'44%'},54],
      ['LB',4,{left:'9%',top:'10%'}],['RB',5,{right:'10%',top:'10%'}],
      ['LT',6,{left:'2%',top:'10%'}],['RT',7,{right:'3%',top:'10%'}],
      ['▣',8,{left:'43%',top:'6%'},36],['☰',9,{left:'51%',top:'6%'},36],
      ['L3',10,{left:'35%',bottom:'4%'},34],['R3',11,{right:'37%',bottom:'4%'},34],
      ['↑',12,{left:'23%',bottom:'40%'},33],['↓',13,{left:'23%',bottom:'18%'},33],
      ['←',14,{left:'19%',bottom:'29%'},33],['→',15,{left:'27%',bottom:'29%'},33]
    ];
    for(const [label,index,pos,size] of layout)root.appendChild(keyButton(label,index,pos,size||44));
    document.body.appendChild(root);
    root.style.display=shown?'block':'none';
  }
  function setShown(on){shown=!!on;try{localStorage.setItem(key,shown?'1':'0');}catch(e){}mount();if(root)root.style.display=shown?'block':'none';}
  window.CloudPad={toggle:()=>setShown(!shown),show:()=>setShown(true),hide:()=>setShown(false),get visible(){return shown;},get installed(){return !!root;}};
  try{shown=localStorage.getItem(key)!=='0';}catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  setInterval(()=>{if(!root||!root.isConnected){root=null;mount();}},1500);
})();
