/* ============================================================
   MAPA — a Ilha do Laboratório.
   O jogador anda pelas trilhas e entra na LOJA, na BIBLIOTECA
   e nos chefes. O caminho para o 2º chefe fica trancado até
   você derrotar o 1º.
   ============================================================ */
const WorldMap = (() => {

  const P = () => Art.PAL;

  // trilhas por onde dá para andar (retângulos)
  const WALK = [
    {x:66,  y:196, w:512, h:38},   // estrada principal
    {x:236, y:138, w:34,  h:62},   // ramo da loja
    {x:366, y:106, w:34,  h:94},   // ramo do chefe 1
    {x:546, y:128, w:34,  h:72},   // ramo do chefe 2
    {x:156, y:230, w:34,  h:46}    // ramo da biblioteca
  ];

  // portão trancado (some quando NUCLEUS-9 é derrotado)
  const GATE = {x:466, y:192, w:30, h:46};

  const NODES = [
    {id:'lab',   x:92,  y:215, label:'LABORATÓRIO', kind:'home'},
    {id:'sci',   x:173, y:264, label:'BIBLIOTECA',  kind:'book'},
    {id:'shop',  x:253, y:146, label:'LOJA',        kind:'shop'},
    {id:'boss1', x:383, y:116, label:'NUCLEUS-9',   kind:'boss', boss:0},
    {id:'boss2', x:563, y:138, label:'DOLLY-96',    kind:'boss', boss:1, lock:true}
  ];

  const me = {x:126, y:215, face:1, anim:0, vx:0, vy:0};
  let near = null;
  let t = 0;
  let toast = 0, toastMsg = '';

  function unlocked(){ return Game.beaten.nucleus; }

  function inWalk(x,y){
    for(const r of WALK){
      if(x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h){
        if(!unlocked() && x>GATE.x-4 && x<GATE.x+GATE.w+4 && y>GATE.y-4 && y<GATE.y+GATE.h+4)
          return false;
        return true;
      }
    }
    return false;
  }

  function reset(){
    me.x=126; me.y=215; me.face=1;
  }

  function say(msg){ toastMsg=msg; toast=110; }

  function enter(n){
    if(n.kind==='boss'){
      if(n.lock && !unlocked()){
        say('Vença NUCLEUS-9 para abrir o portão!');
        Sound.sfx.hurt();
        return;
      }
      chooseBoss(n.boss);
      return;
    }
    if(n.kind==='shop'){ Sound.sfx.confirm(); Game.state='shop'; Game.shopIndex=0; return; }
    if(n.kind==='book'){ Sound.sfx.confirm(); Game.state='science'; Game.sciIndex=0; Game.sciFrom='map'; return; }
    if(n.kind==='home'){ say('Laboratório: aqui você começou sua pesquisa.'); Sound.sfx.select(); }
  }

  function update(g){
    t++; me.anim++;
    if(toast>0) toast--;

    const I=Input;
    const sp=2.5;
    let dx=0, dy=0;
    if(I.held.left)  dx-=1;
    if(I.held.right) dx+=1;
    if(I.held.up)    dy-=1;
    if(I.held.down)  dy+=1;
    if(dx&&dy){ dx*=0.71; dy*=0.71; }
    if(dx) me.face = dx<0?-1:1;

    const nx=me.x+dx*sp, ny=me.y+dy*sp;
    if(inWalk(nx,me.y)) me.x=nx;
    if(inWalk(me.x,ny)) me.y=ny;

    // fumacinha dos passos
    if((dx||dy) && t%9===0) FX.smoke(me.x, me.y+9, 1, 'rgba(250,240,215,.6)');

    // nó mais próximo
    near=null;
    let bd=32;
    for(const n of NODES){
      const d=Math.hypot(n.x-me.x, n.y-me.y);
      if(d<bd){ bd=d; near=n; }
    }

    if(near && Input.pressed.confirm) enter(near);
    if(Input.pressed.back){ Game.state='title'; Game.menuIndex=0; Sound.sfx.select(); }

    FX.update();
  }

  // toque / clique direto num lugar do mapa
  function tap(x,y){
    for(const n of NODES){
      if(Math.hypot(n.x-x, n.y-y) < 34){
        me.x=n.x; me.y=n.y;      // anda até lá
        enter(n);
        return true;
      }
    }
    // clicou na trilha: caminha para o ponto
    if(inWalk(x,y)){ me.x=x; me.y=y; Sound.sfx.select(); return true; }
    if(y>CFG.H-26){ Game.state='title'; Game.menuIndex=0; Sound.sfx.select(); return true; }
    return false;
  }

  /* ---------------- DESENHO ---------------- */
  function drawIsland(ctx){
    const pal=P();
    // "mesa" de fundo
    const grd=ctx.createLinearGradient(0,0,0,CFG.H);
    grd.addColorStop(0,'#5c4a37');
    grd.addColorStop(1,'#3a2d21');
    ctx.fillStyle=grd; ctx.fillRect(0,0,CFG.W,CFG.H);

    // ilha = placa de Petri gigante
    ctx.save();
    ctx.globalAlpha=.35;
    Art.ellipse(ctx,CFG.W/2,196,300,150,'#000',0);
    ctx.restore();
    Art.blob(ctx,CFG.W/2,190,296,146,'#e2efc8',5,20,2,3);
    Art.blob(ctx,CFG.W/2,190,276,132,'#cde5ac',0,18,2,9);

    // colônias decorativas
    ctx.save(); ctx.globalAlpha=.35;
    for(let i=0;i<30;i++){
      const a=i*2.4, r=40+((i*53)%230);
      const x=CFG.W/2+Math.cos(a)*r, y=190+Math.sin(a)*r*0.48;
      Art.circle(ctx,x,y,2+(i%4),'#7fa168',0);
    }
    ctx.restore();
  }

  function drawPaths(ctx){
    // trilha de agar
    for(const r of WALK){
      ctx.fillStyle='#f0dfb4';
      ctx.fillRect(r.x,r.y,r.w,r.h);
      Art.ink(ctx,3);
      ctx.strokeRect(r.x,r.y,r.w,r.h);
    }
    // tapa as junções para não ficar linha no meio do caminho
    ctx.fillStyle='#f0dfb4';
    for(const r of WALK.slice(1)){
      ctx.fillRect(r.x+2, 198, r.w-4, 34);
    }
    // linha tracejada no meio da estrada
    ctx.save();
    ctx.strokeStyle='rgba(28,20,16,.30)';
    ctx.lineWidth=2; ctx.setLineDash([10,10]);
    ctx.beginPath(); ctx.moveTo(70,215); ctx.lineTo(574,215); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawGate(ctx){
    if(unlocked()) return;
    const pal=P();
    ctx.save();
    ctx.translate(GATE.x+GATE.w/2, GATE.y+GATE.h/2);
    // grade
    ctx.fillStyle='#8d8676';
    ctx.fillRect(-GATE.w/2,-GATE.h/2,GATE.w,GATE.h);
    Art.ink(ctx,3);
    ctx.strokeRect(-GATE.w/2,-GATE.h/2,GATE.w,GATE.h);
    ctx.lineWidth=2.4;
    for(let i=-1;i<=1;i++){
      ctx.beginPath(); ctx.moveTo(i*8,-GATE.h/2); ctx.lineTo(i*8,GATE.h/2); ctx.stroke();
    }
    // cadeado
    Art.circle(ctx,0,0,9,pal.yellow,2.6);
    ctx.strokeStyle=Art.PAL.ink; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.arc(0,-6,5,Math.PI,0); ctx.stroke();
    Art.circle(ctx,0,2,2,Art.PAL.ink,0);
    ctx.restore();
    Art.text(ctx,'TRANCADO',GATE.x+GATE.w/2,GATE.y-14,{size:9,color:pal.red,stroke:2.5});
  }

  function drawNode(ctx,n){
    const pal=P();
    const sel = near===n;
    const bob = sel ? Math.sin(t*0.12)*3 : 0;
    const locked = n.lock && !unlocked();

    ctx.save();
    ctx.translate(n.x, n.y+bob);

    // sombra
    ctx.save(); ctx.globalAlpha=.3;
    Art.ellipse(ctx,0,26,26,7,'#2b2118',0);
    ctx.restore();

    if(n.kind==='boss'){
      // portal = placa de Petri em pé com a cara do chefe
      Art.circle(ctx,0,0,30,'#e8dcc0',4);
      Art.circle(ctx,0,0,24,'#cfe6ef',2.4);
      const kind = n.boss===0 ? 'nucleus' : 'dolly';
      ctx.save();
      ctx.translate(0,2); ctx.scale(0.6,0.6);
      if(locked){
        ctx.globalAlpha=.30;
      }
      drawBossPortrait(kind,0,0,1,t);
      ctx.restore();
      if(locked){
        Art.text(ctx,'?',0,6,{size:30,color:pal.ink,stroke:0});
      }
      // troféu de vencido
      const beat = n.boss===0 ? Game.beaten.nucleus : Game.beaten.dolly;
      if(beat){
        ctx.save();
        ctx.translate(22,-22); ctx.rotate(0.2);
        Art.circle(ctx,0,0,10,pal.yellow,2.4);
        Art.text(ctx,'K.O.',0,1,{size:8,color:pal.ink,stroke:0});
        ctx.restore();
      }
    } else if(n.kind==='shop'){
      // barraquinha listrada
      ctx.fillStyle=pal.cream;
      ctx.fillRect(-22,-6,44,26);
      Art.ink(ctx,3); ctx.strokeRect(-22,-6,44,26);
      // toldo
      for(let i=0;i<5;i++){
        ctx.fillStyle = i%2 ? pal.red : pal.cream;
        ctx.beginPath();
        ctx.moveTo(-26+i*10.4,-6); ctx.lineTo(-26+(i+1)*10.4,-6);
        ctx.lineTo(-26+(i+1)*10.4,-16); ctx.lineTo(-26+i*10.4,-16);
        ctx.closePath(); ctx.fill();
      }
      Art.ink(ctx,3); ctx.strokeRect(-26,-16,52,10);
      // balcão + plaquinha
      Art.text(ctx,'$',0,8,{size:16,color:pal.greenDk,stroke:0});
      Art.circle(ctx,0,-24,7,'#9fd0a8',2.4);
      Art.circle(ctx,-2,-25,1.4,pal.ink,0);
      Art.circle(ctx, 2,-25,1.4,pal.ink,0);
      if(Shop.points>0){
        ctx.save();
        ctx.translate(24,-24);
        Art.circle(ctx,0,0,9,pal.yellow,2.4);
        Art.text(ctx,'!',0,1,{size:12,color:pal.ink,stroke:0});
        ctx.restore();
      }
    } else if(n.kind==='book'){
      ctx.save();
      ctx.rotate(-0.06);
      ctx.fillStyle=pal.blue;
      ctx.fillRect(-18,-14,36,28);
      Art.ink(ctx,3); ctx.strokeRect(-18,-14,36,28);
      ctx.fillStyle=pal.cream;
      ctx.fillRect(-13,-9,26,18);
      ctx.strokeStyle='rgba(28,20,16,.5)'; ctx.lineWidth=1.4;
      for(let i=0;i<4;i++){
        ctx.beginPath(); ctx.moveTo(-10,-5+i*5); ctx.lineTo(10,-5+i*5); ctx.stroke();
      }
      ctx.restore();
    } else {
      // laboratório (casinha com chaminé de erlenmeyer)
      ctx.fillStyle='#e8dcc0';
      ctx.fillRect(-20,-8,40,26);
      Art.ink(ctx,3); ctx.strokeRect(-20,-8,40,26);
      ctx.fillStyle=pal.red;
      ctx.beginPath();
      ctx.moveTo(-24,-8); ctx.lineTo(0,-24); ctx.lineTo(24,-8); ctx.closePath();
      ctx.fill(); Art.ink(ctx,3); ctx.stroke();
      ctx.fillStyle=pal.blue; ctx.fillRect(-6,2,12,16);
      Art.ink(ctx,2.4); ctx.strokeRect(-6,2,12,16);
      // fumacinha
      ctx.save(); ctx.globalAlpha=.5;
      for(let i=0;i<3;i++)
        Art.circle(ctx,10+Math.sin(t*0.05+i)*3,-26-i*8,3+i,'#fff',0);
      ctx.restore();
    }

    ctx.restore();

    // placa com o nome
    const w=Art.measure(ctx,n.label,10)+16;
    ctx.save();
    ctx.globalAlpha = sel?1:0.85;
    ctx.fillStyle = sel ? 'rgba(28,20,16,.85)' : 'rgba(28,20,16,.55)';
    ctx.fillRect(n.x-w/2, n.y+30, w, 15);
    Art.text(ctx,n.label,n.x,n.y+38,{size:10,color:sel?pal.yellow:pal.cream,stroke:0});
    ctx.restore();
  }

  function drawMe(ctx){
    const pal=P();
    ctx.save();
    ctx.translate(me.x,me.y);
    ctx.scale(1.25,1.25);
    ctx.translate(-me.x,-me.y);
    const walking = Input.held.left||Input.held.right||Input.held.up||Input.held.down;
    const bob = walking ? Math.abs(Math.sin(me.anim*0.25))*3 : Math.sin(me.anim*0.06)*1;
    const x=me.x, y=me.y-bob;

    ctx.save();
    ctx.globalAlpha=.32;
    Art.ellipse(ctx,me.x,me.y+12,10,4,'#2b2118',0);
    ctx.restore();

    // corpinho
    Art.ink(ctx,3);
    ctx.beginPath();
    ctx.moveTo(x-3,y+6); ctx.lineTo(x-4,y+12);
    ctx.moveTo(x+3,y+6); ctx.lineTo(x+4,y+12);
    ctx.stroke();
    Art.blob(ctx,x,y+2,8,9,Art.PAL.white,3,10,3,x*0.5);
    // cabeça de célula
    Art.blob(ctx,x,y-10,10,9.5,'rgba(150,205,225,.95)',3,12,4,x);
    Art.circle(ctx,x+me.face*1.5,y-9,4.6,'rgba(125,95,158,.9)',2);
    Art.ellipse(ctx,x+me.face*2-2.6,y-11,2.4,3,pal.cream,1.8);
    Art.ellipse(ctx,x+me.face*2+2.6,y-11,2.4,3,pal.cream,1.8);
    Art.circle(ctx,x+me.face*2-2.4,y-10.6,1.2,pal.ink,0);
    Art.circle(ctx,x+me.face*2+2.8,y-10.6,1.2,pal.ink,0);
    // chapeuzinho
    ctx.save();
    ctx.translate(x,y-19); ctx.rotate(me.face*0.1);
    ctx.fillStyle=pal.red;
    ctx.beginPath(); ctx.ellipse(0,0,7.5,2.6,0,0,Math.PI*2); ctx.fill();
    Art.ink(ctx,2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(me.face*1.5,-3,4,3.4,0,0,Math.PI*2);
    ctx.fillStyle=pal.red; ctx.fill(); Art.ink(ctx,2); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function draw(ctx,g){
    const pal=P();
    drawIsland(ctx);
    drawPaths(ctx);
    drawGate(ctx);

    // nós atrás do jogador quando ele está mais embaixo
    const sorted = NODES.slice().sort((a,b)=>a.y-b.y);
    let drewMe=false;
    for(const n of sorted){
      if(!drewMe && me.y < n.y){ drawMe(ctx); drewMe=true; }
      drawNode(ctx,n);
    }
    if(!drewMe) drawMe(ctx);

    FX.draw(ctx);

    // faixa do título
    Art.ribbon(ctx,CFG.W/2,22,286,26,pal.red);
    Art.text(ctx,'ILHA DO LABORATÓRIO',CFG.W/2,22,{size:15,color:pal.cream,stroke:3});

    // pontos de pesquisa
    ctx.save();
    const txt='PONTOS DE PESQUISA: '+Shop.points;
    const w=Art.measure(ctx,txt,11)+22;
    ctx.fillStyle='rgba(28,20,16,.75)';
    ctx.fillRect(10,8,w,20);
    Art.ink(ctx,2.4); ctx.strokeRect(10,8,w,20);
    Art.text(ctx,txt,10+w/2,18,{size:11,color:pal.yellow,stroke:0});
    ctx.restore();

    // arma equipada
    ctx.save();
    const wp=Shop.weapon;
    const t2='ARMA: '+wp.name;
    const w2=Art.measure(ctx,t2,10)+20;
    ctx.fillStyle='rgba(28,20,16,.75)';
    ctx.fillRect(CFG.W-w2-10,8,w2,20);
    Art.ink(ctx,2.4); ctx.strokeRect(CFG.W-w2-10,8,w2,20);
    Art.text(ctx,t2,CFG.W-w2/2-10,18,{size:10,color:wp.color,stroke:0});
    ctx.restore();

    // dica do nó em que está parado
    if(near){
      const msg = near.kind==='boss'
        ? (near.lock && !unlocked() ? 'PORTÃO TRANCADO' : 'ENTRAR NA LUTA')
        : (near.kind==='shop' ? 'ABRIR A LOJA'
        : (near.kind==='book' ? 'LER AS FICHAS' : 'CASA DO CIENTISTA'));
      const hint = touchMode() ? 'TOQUE NO LOCAL' : 'APERTE PULAR / ENTER';
      const a=0.7+Math.sin(t*0.14)*0.3;
      ctx.save(); ctx.globalAlpha=a;
      Art.text(ctx,msg+'  -  '+hint,CFG.W/2,CFG.H-40,{size:12,color:pal.yellow,stroke:3});
      ctx.restore();
    }

    // recado temporário
    if(toast>0){
      ctx.save();
      ctx.globalAlpha=Math.min(1,toast/20);
      const w3=Art.measure(ctx,toastMsg,12)+30;
      ctx.fillStyle='rgba(28,20,16,.85)';
      ctx.fillRect(CFG.W/2-w3/2,CFG.H-92,w3,24);
      Art.ink(ctx,2.6); ctx.strokeRect(CFG.W/2-w3/2,CFG.H-92,w3,24);
      Art.text(ctx,toastMsg,CFG.W/2,CFG.H-80,{size:12,color:pal.cream,stroke:0});
      ctx.restore();
    }

    Art.text(ctx, touchMode()? 'ANDE COM O D-PAD  -  TOQUE NO LOCAL PARA ENTRAR'
                             : 'ANDE COM AS SETAS  -  ENTER ENTRA  -  ESC VOLTA AO TÍTULO',
      CFG.W/2,CFG.H-16,{size:10,color:'#e9d6ab',stroke:2.5});
  }

  return {update, draw, tap, reset, say, NODES, pos:me};
})();
