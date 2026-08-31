/* ============================================================
   CHEFÕES
     1) NUCLEUS-9, o Clone Mestre   (mitose -> DNA -> clone de você)
     2) DOLLY-96, a Ovelha Replicante (ovelha -> máquina SCNT -> rebanho)
   ============================================================ */

/* ------------------------------------------------------------
   PROJÉTEIS DO CHEFE
------------------------------------------------------------ */
class Hazard {
  constructor(x, y, vx, vy, type, opt){
    opt = opt || {};
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.type=type;
    this.r = opt.r || 9;
    this.pink = !!opt.pink;             // pode ser aparado (parry)
    this.hp = opt.hp || 0;              // >0 = destrutível
    this.life = opt.life || 400;
    this.t = 0;
    this.rot = Math.random()*Math.PI*2;
    this.spin = opt.spin !== undefined ? opt.spin : 0.08;
    this.amp = opt.amp || 0;            // ondulação
    this.freq = opt.freq || 0.06;
    this.phase = opt.phase || 0;
    this.baseY = y;
    this.homing = opt.homing || 0;
    this.grav = opt.grav || 0;          // projéteis em arco
    this.bounce = opt.bounce || 0;      // quica no chão
    this.dead = false;
    this.color = opt.color || null;
  }

  hitbox(){ return {x:this.x-this.r, y:this.y-this.r, w:this.r*2, h:this.r*2}; }

  update(g){
    this.t++;
    this.rot += this.spin;

    if (this.homing > 0 && this.t < 70){
      const dx = g.player.cx - this.x, dy = g.player.cy - this.y;
      const d = Math.hypot(dx,dy) || 1;
      this.vx += (dx/d) * this.homing;
      this.vy += (dy/d) * this.homing;
      const sp = Math.hypot(this.vx,this.vy);
      if (sp > 4.2){ this.vx = this.vx/sp*4.2; this.vy = this.vy/sp*4.2; }
    }

    if (this.type === 'enzyme' || this.type === 'petri'){
      // anda/rola pelo chão na direção do jogador
      const dir = g.player.cx < this.x ? -1 : 1;
      this.vx += (dir*(this.type==='petri'?2.2:1.7) - this.vx)*0.05;
      this.y = CFG.GROUND - (this.type==='petri'?8:12);
      this.x += this.vx;
    } else if (this.type === 'shock'){
      // onda de choque correndo pelo chão
      this.x += this.vx;
      this.y = CFG.GROUND - 8;
    } else if (this.amp){
      this.x += this.vx;
      this.baseY += this.vy;
      this.y = this.baseY + Math.sin(this.t*this.freq + this.phase)*this.amp;
    } else {
      if (this.grav) this.vy += this.grav;
      this.x += this.vx;
      this.y += this.vy;
      if (this.bounce && this.y > CFG.GROUND-this.r*0.6){
        this.y = CFG.GROUND-this.r*0.6;
        this.vy = -Math.abs(this.vy)*this.bounce;
        if (Math.abs(this.vy) < 1.4) this.vy = -4.2;
      }
    }

    if (this.type === 'blob') this.vy += 0.09;

    if (this.t % 6 === 0 && this.pink)
      FX.add(new Particle(this.x,this.y,0,0,12,'rgba(255,95,162,.5)',this.r*0.6,'dot'));

    if (--this.life <= 0) this.dead = true;
    if (this.x < -70 || this.x > CFG.W+70 || this.y > CFG.H+70 || this.y < -140) this.dead = true;
  }

  hurt(d){
    if (this.hp <= 0) return false;
    this.hp -= d;
    FX.burst(this.x,this.y,3,Art.PAL.yellow,2,2);
    if (this.hp <= 0){
      this.dead = true;
      FX.burst(this.x,this.y,12,Art.PAL.green,3.5,3);
      FX.ring(this.x,this.y,Art.PAL.green,14);
      Sound.sfx.boom();
      return true;
    }
    return false;
  }

  draw(ctx){
    const P = Art.PAL;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.pink){
      ctx.save();
      ctx.globalAlpha = .35 + Math.sin(this.t*0.3)*0.2;
      Art.circle(ctx,0,0,this.r+5,P.pinkHot,0);
      ctx.restore();
    }

    switch(this.type){
      case 'chromo': {           // cromossomo em X
        ctx.rotate(this.rot);
        const c = this.pink ? P.pinkHot : P.purple;
        ctx.lineCap='round';
        ctx.strokeStyle=P.ink; ctx.lineWidth=this.r*0.95;
        ctx.beginPath();
        ctx.moveTo(-this.r,-this.r); ctx.lineTo(this.r,this.r);
        ctx.moveTo(this.r,-this.r);  ctx.lineTo(-this.r,this.r);
        ctx.stroke();
        ctx.strokeStyle=c; ctx.lineWidth=this.r*0.55;
        ctx.beginPath();
        ctx.moveTo(-this.r,-this.r); ctx.lineTo(this.r,this.r);
        ctx.moveTo(this.r,-this.r);  ctx.lineTo(-this.r,this.r);
        ctx.stroke();
        break;
      }
      case 'blob': {             // gota de citoplasma
        const c = this.pink ? P.pinkHot : 'rgba(120,190,150,.95)';
        Art.blob(ctx,0,0,this.r,this.r*1.15,c,3,9,7,this.x);
        Art.circle(ctx,-this.r*0.3,-this.r*0.35,this.r*0.26,P.cream,0);
        break;
      }
      case 'base': {             // par de bases do DNA (A-T / C-G)
        ctx.rotate(this.rot*0.4);
        const c = this.pink ? P.pinkHot : (this.color || P.blue);
        ctx.strokeStyle=P.ink; ctx.lineWidth=6;
        ctx.beginPath(); ctx.moveTo(-this.r,0); ctx.lineTo(this.r,0); ctx.stroke();
        ctx.strokeStyle=c; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(-this.r,0); ctx.lineTo(this.r,0); ctx.stroke();
        Art.circle(ctx,-this.r,0,this.r*0.55,c,2.2);
        Art.circle(ctx, this.r,0,this.r*0.55,P.orange,2.2);
        break;
      }
      case 'enzyme': {           // enzima de restrição (tesoura viva)
        const wob = Math.sin(this.t*0.25)*3;
        const f = this.vx < 0 ? -1 : 1;
        ctx.scale(f,1);
        Art.blob(ctx,0,0,14,12,P.orange,3,10,5,this.x);
        ctx.save(); ctx.translate(10,-4); ctx.rotate(-0.3 - wob*0.05);
        Art.ellipse(ctx,5,0,9,3.5,P.cream,2.5); ctx.restore();
        ctx.save(); ctx.translate(10,4); ctx.rotate(0.3 + wob*0.05);
        Art.ellipse(ctx,5,0,9,3.5,P.cream,2.5); ctx.restore();
        Art.circle(ctx,-2,-3,3.4,P.cream,2);
        Art.circle(ctx,-1,-3,1.5,P.ink,0);
        Art.ellipse(ctx,-5,11,4,2.4,P.ink,0);
        Art.ellipse(ctx, 4,11,4,2.4,P.ink,0);
        break;
      }

      /* ---------- projéteis da DOLLY ---------- */
      case 'wool': {             // floco de lã
        ctx.rotate(this.rot*0.5);
        const c = this.pink ? P.pinkHot : P.white;
        for(let i=0;i<5;i++){
          const a=i/5*Math.PI*2;
          Art.circle(ctx,Math.cos(a)*this.r*0.5,Math.sin(a)*this.r*0.5,this.r*0.55,c,2.4);
        }
        Art.circle(ctx,0,0,this.r*0.6,c,2.4);
        break;
      }
      case 'ovulo': {            // óvulo (com coroa de células)
        const c = this.pink ? P.pinkHot : '#f3d9a6';
        ctx.save();
        ctx.globalAlpha=.55;
        for(let i=0;i<10;i++){
          const a=i/10*Math.PI*2 + this.rot*0.3;
          Art.circle(ctx,Math.cos(a)*(this.r+3),Math.sin(a)*(this.r+3),2.4,P.orange,0);
        }
        ctx.restore();
        Art.blob(ctx,0,0,this.r,this.r,c,3,10,4,this.x);
        Art.circle(ctx,this.r*0.2,-this.r*0.15,this.r*0.35,'rgba(125,95,158,.9)',2);
        break;
      }
      case 'shock': {            // onda de choque no chão
        const f = this.vx<0?-1:1;
        ctx.scale(f,1);
        ctx.globalAlpha=Math.max(0.25,1-this.t/70);
        ctx.strokeStyle=P.ink; ctx.lineWidth=3.5;
        ctx.fillStyle=P.orange;
        ctx.beginPath();
        ctx.moveTo(-10,8);
        ctx.quadraticCurveTo(-4,-this.r*1.6,6,4);
        ctx.lineTo(10,8);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 'petri': {            // placa de Petri rolando
        ctx.rotate(this.rot*1.6);
        Art.circle(ctx,0,0,this.r,'rgba(200,225,215,.9)',3);
        Art.circle(ctx,0,0,this.r*0.62,'rgba(150,190,150,.85)',2);
        ctx.strokeStyle=P.ink; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(-this.r,0); ctx.lineTo(this.r,0); ctx.stroke();
        break;
      }
      case 'sheepling': {        // ovelhinha em disparada
        const f = this.vx<0?-1:1;
        const hop = Math.abs(Math.sin(this.t*0.25))*4;
        ctx.translate(0,-hop);
        ctx.scale(f,1);
        // pernas
        Art.ink(ctx,2.6);
        ctx.beginPath();
        ctx.moveTo(-5,7); ctx.lineTo(-6,13);
        ctx.moveTo(5,7);  ctx.lineTo(6,13);
        ctx.stroke();
        Art.blob(ctx,0,0,this.r,this.r*0.8,P.white,3,10,5,this.x);
        Art.ellipse(ctx,this.r*0.85,-this.r*0.35,5.5,4.5,'#3b2a2a',2.6);
        Art.circle(ctx,this.r*1.05,-this.r*0.5,1.4,P.cream,0);
        break;
      }

      case 'orb':
      default: {
        const c = this.pink ? P.pinkHot : (this.color || P.red);
        Art.blob(ctx,0,0,this.r,this.r,c,2.8,9,6,this.x);
        Art.circle(ctx,-this.r*0.3,-this.r*0.3,this.r*0.3,P.cream,0);
      }
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   CLONES MENORES (célula ou ovelha)
------------------------------------------------------------ */
class Minion {
  constructor(x,y,side,kind){
    this.x=x; this.y=y; this.side=side;
    this.kind=kind||'cell';
    this.hp = this.kind==='sheep' ? 8 : 9;
    this.r=20; this.t=0; this.dead=false;
    this.state='float'; this.stateT=60+Math.random()*40;
    this.vx=0; this.vy=0; this.flash=0;
    this.targetY=y;
  }
  hitbox(){ return {x:this.x-16,y:this.y-16,w:32,h:32}; }
  hurt(d){
    this.hp-=d; this.flash=5;
    FX.burst(this.x,this.y,2,Art.PAL.yellow,2,2);
    Sound.sfx.hitBoss();
    if(this.hp<=0){
      this.dead=true;
      FX.burst(this.x,this.y,20,this.kind==='sheep'?Art.PAL.cream:Art.PAL.green,4,4);
      FX.ring(this.x,this.y,Art.PAL.cream,20);
      Sound.sfx.boom();
      return true;
    }
    return false;
  }
  update(g){
    this.t++; if(this.flash>0) this.flash--;

    if(this.kind==='sheep'){
      // ovelhinha quicando pelo chão atrás do jogador
      this.vy += 0.5;
      this.y += this.vy;
      const floor = CFG.GROUND-16;
      if(this.y>=floor){
        this.y=floor;
        this.vy=-8.4;
        const dir = g.player.cx < this.x ? -1 : 1;
        this.vx = dir*2.3;
        FX.smoke(this.x,CFG.GROUND-2,3);
      }
      this.x += this.vx;
      if(this.x<24){this.x=24;this.vx=Math.abs(this.vx);}
      if(this.x>CFG.W-24){this.x=CFG.W-24;this.vx=-Math.abs(this.vx);}
      return;
    }

    this.stateT--;
    if(this.state==='float'){
      this.x += Math.sin(this.t*0.05)*1.4*this.side;
      this.y = this.targetY + Math.sin(this.t*0.08)*10;
      if(this.stateT<=0){ this.state='aim'; this.stateT=34; }
    } else if(this.state==='aim'){
      this.y += Math.sin(this.t*0.5)*0.8;
      if(this.stateT<=0){
        const dx=g.player.cx-this.x, dy=g.player.cy-this.y;
        const d=Math.hypot(dx,dy)||1;
        this.vx=dx/d*5.6; this.vy=dy/d*5.6;
        this.state='charge'; this.stateT=52;
        Sound.sfx.dash();
      }
    } else {
      this.x+=this.vx; this.y+=this.vy;
      this.vx*=0.985; this.vy*=0.985;
      if(this.t%4===0) FX.add(new Particle(this.x,this.y,0,0,14,'rgba(120,190,150,.5)',7,'smoke'));
      if(this.stateT<=0){
        this.state='float'; this.stateT=70+Math.random()*40;
        this.targetY=70+Math.random()*100;
      }
      if(this.y<40){this.y=40;this.vy*=-0.6;}
      if(this.y>CFG.GROUND-30){this.y=CFG.GROUND-30;this.vy*=-0.6;}
      if(this.x<30){this.x=30;this.vx*=-0.6;}
      if(this.x>CFG.W-30){this.x=CFG.W-30;this.vx*=-0.6;}
    }
  }
  draw(ctx){
    const P=Art.PAL;
    ctx.save();
    if(this.flash>0) ctx.globalCompositeOperation='lighter';

    if(this.kind==='sheep'){
      const f = this.vx<0?-1:1;
      ctx.translate(this.x,this.y);
      ctx.scale(f,1);
      Art.ink(ctx,3);
      ctx.beginPath();
      ctx.moveTo(-7,10); ctx.lineTo(-8,18);
      ctx.moveTo(7,10);  ctx.lineTo(8,18);
      ctx.stroke();
      // lã
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2;
        Art.circle(ctx,Math.cos(a)*9,Math.sin(a)*7,8,P.white,3);
      }
      Art.circle(ctx,0,0,9,P.white,0);
      // carinha
      Art.ellipse(ctx,15,-5,8,7,'#3b2a2a',3);
      Art.circle(ctx,17,-7,1.8,P.cream,0);
      Art.ellipse(ctx,10,-11,4,2.6,'#3b2a2a',2.4);
      ctx.restore();
      return;
    }

    const sq = this.state==='charge' ? 1.15 : 1;
    Art.blob(ctx,this.x,this.y,this.r*sq,this.r/sq,'rgba(150,205,225,.92)',3,12,5,this.x);
    Art.circle(ctx,this.x,this.y+1,9,'rgba(125,95,158,.9)',2.4);
    Art.ellipse(ctx,this.x-6,this.y-3,3.6,4,P.cream,2);
    Art.ellipse(ctx,this.x+4,this.y-3,3.6,4,P.cream,2);
    Art.circle(ctx,this.x-6,this.y-2,1.7,P.ink,0);
    Art.circle(ctx,this.x+4,this.y-2,1.7,P.ink,0);
    Art.ink(ctx,2.2);
    ctx.beginPath();
    ctx.moveTo(this.x-9,this.y-9); ctx.lineTo(this.x-2,this.y-6);
    ctx.moveTo(this.x+9,this.y-9); ctx.lineTo(this.x+2,this.y-6);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x,this.y+7,4,Math.PI*1.15,Math.PI*1.85); ctx.stroke();
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   CLONE SOMBRIO - cópia do jogador (NUCLEUS-9, fase 3)
------------------------------------------------------------ */
class ShadowClone {
  constructor(x,y){
    this.x=x; this.y=y; this.vy=0; this.face=-1;
    this.hp=13; this.t=0; this.dead=false; this.flash=0;
    this.fireT=70; this.onGround=false;
  }
  hitbox(){ return {x:this.x-8,y:this.y-32,w:16,h:32}; }
  hurt(d){
    this.hp-=d; this.flash=5; Sound.sfx.hitBoss();
    FX.burst(this.x,this.y-18,2,Art.PAL.purple,2,2);
    if(this.hp<=0){
      this.dead=true;
      FX.burst(this.x,this.y-18,22,Art.PAL.purple,4,4);
      FX.ring(this.x,this.y-18,Art.PAL.pinkHot,22);
      Sound.sfx.boom();
      return true;
    }
    return false;
  }
  update(g){
    this.t++; if(this.flash>0) this.flash--;
    const p=g.player;
    const tx = CFG.W - p.x;
    this.x += (tx-this.x)*0.026;
    this.face = p.cx < this.x ? -1 : 1;
    const ty = p.y - (p.onGround?0:10);
    this.y += (ty-this.y)*0.045 + Math.sin(this.t*0.06)*0.5;
    if(this.y>CFG.GROUND) this.y=CFG.GROUND;
    if(--this.fireT<=0){
      this.fireT=105;
      const dx=p.cx-this.x, dy=(p.cy)-(this.y-20);
      const d=Math.hypot(dx,dy)||1;
      g.hazards.push(new Hazard(this.x,this.y-20,dx/d*3.6,dy/d*3.6,'orb',
        {r:7,color:Art.PAL.purple,pink:Math.random()<0.5}));
      Sound.sfx.shoot();
    }
  }
  draw(ctx){
    const P=Art.PAL;
    ctx.save();
    ctx.globalAlpha=0.92;
    const y=this.y, x=this.x, f=this.face;
    const by=y-20, hy=y-40;
    Art.ellipse(ctx,x,CFG.GROUND+3,13,4,'rgba(28,20,16,.35)',0);
    Art.hose(ctx,x-4,by+8,x-5,y-2,3,5,P.purple);
    Art.hose(ctx,x+4,by+8,x+5,y-2,-3,5,P.purple);
    Art.blob(ctx,x,by,11,13,'#3b2a4d',3,10,3,x*0.7);
    Art.hose(ctx,x+f*6,by-4,x+f*17,by-2,f*4,4.6,'#3b2a4d');
    Art.circle(ctx,x+f*17,by-2,4.6,P.purple,2.4);
    Art.blob(ctx,x,hy,13,12.5,'#5a3f74',3,12,4,x*1.3);
    Art.circle(ctx,x+f*2,hy+1,6.4,'rgba(20,12,24,.9)',2);
    Art.ellipse(ctx,x+f*3.2-3.6,hy-2,3.2,4.1,P.pinkHot,2);
    Art.ellipse(ctx,x+f*3.2+3.6,hy-2,3.2,4.1,P.pinkHot,2);
    if(this.flash>0){ ctx.globalAlpha=.6; Art.circle(ctx,x,by,26,P.cream,0); }
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   DEFINIÇÃO DOS DOIS CHEFES
------------------------------------------------------------ */
const BOSSES = {
  nucleus: {
    name:'NUCLEUS-9',
    sub:'O CLONE MESTRE',
    hp:[140,170,160],
    home:[[470,130],[320,120],[320,110]],
    attacks:[
      ['chromo','mitose','cytoRain','swoop'],
      ['helix','enzimas','laser','pinkBurst','helix'],
      ['clone','rings','crossfire','stormRain','rings']
    ]
  },
  dolly: {
    name:'DOLLY-96',
    sub:'A OVELHA REPLICANTE',
    hp:[150,180,210],
    home:[[470,CFG.GROUND-46],[320,118],[320,116]],
    attacks:[
      ['laVolley','salto','rebanho','balido'],
      ['pipeta','oocitos','choque','placas'],
      ['estouro','chuvaLa','megaBalido','clonesDolly','estouro']
    ]
  }
};

class Boss {
  constructor(kind){
    this.kind = kind || 'nucleus';
    const def = BOSSES[this.kind];
    this.def = def;
    this.phases = def.hp.slice();
    this.phase=0;
    this.hp=this.phases[0]; this.maxHp=this.phases[0];
    this.baseX=def.home[0][0]; this.baseY=def.home[0][1];
    this.x=this.baseX; this.y=this.baseY;
    this.vx=0; this.vy=0;
    this.t=0;
    this.flash=0;
    this.state='fight';     // fight | transition | dying | dead
    this.stateT=0;
    this.atk=null; this.atkT=0; this.atkIdle=70;
    this.lastAtk=-1;
    this.angry=0;
    this.beams=[];          // faixas de dano horizontais
    this.vbeams=[];         // faixas de dano verticais (pipeta)
    this.telegraph=0;
    this.dyingT=0;
    this.mouth=0;
    this.swoopDir=1;
  }

  get name(){ return this.def.name; }
  get onGroundPhase(){ return this.kind==='dolly' && this.phase===0; }

  totalMax(){ return this.phases.reduce((a,b)=>a+b,0); }
  totalNow(){
    let n=this.hp;
    for(let i=this.phase+1;i<this.phases.length;i++) n+=this.phases[i];
    return Math.max(0,n);
  }

  hitbox(){
    if(this.kind==='dolly'){
      if(this.phase===0) return {x:this.x-50,y:this.y-46,w:100,h:92};
      if(this.phase===1) return {x:this.x-42,y:this.y-48,w:84,h:104};
      return {x:this.x-46,y:this.y-38,w:92,h:80};
    }
    if(this.phase===0) return {x:this.x-46,y:this.y-46,w:92,h:92};
    if(this.phase===1) return {x:this.x-38,y:this.y-58,w:76,h:130};
    return {x:this.x-34,y:this.y-34,w:68,h:68};
  }

  hurt(d,g){
    if(this.state!=='fight') return;
    this.hp-=d; this.flash=4;
    Sound.sfx.hitBoss();
    if(this.hp<=0){
      this.hp=0;
      if(this.phase<this.phases.length-1) this.startTransition(g);
      else { this.state='dying'; this.dyingT=170; g.onBossDying(); }
    }
  }

  startTransition(g){
    this.state='transition'; this.stateT=110;
    this.atk=null; this.beams.length=0; this.vbeams.length=0;
    g.hazards.length=0;
    g.minions.length=0;
    g.shadow=null;
    g.shake=18;
    Sound.sfx.phase();
    Sound.sfx.boom();
    FX.burst(this.x,this.y,50,Art.PAL.cream,7,5);
    FX.ring(this.x,this.y,Art.PAL.pinkHot,50);
    Input.rumble(500,1,.7);
  }

  nextPhase(g){
    this.phase++;
    this.hp=this.phases[this.phase]; this.maxHp=this.phases[this.phase];
    this.state='fight'; this.atk=null; this.atkIdle=60;
    this.baseX=this.def.home[this.phase][0];
    this.baseY=this.def.home[this.phase][1];
    this.x=this.baseX; this.y=this.baseY;
    this.vx=0; this.vy=0;
    g.showCard(this.phase);
    Sound.setIntensity(1+this.phase*0.35);
  }

  /* ---------------- ATAQUES ---------------- */
  startAttack(g){
    const list=this.def.attacks[this.phase];
    let i;
    do { i=Math.floor(Math.random()*list.length); } while(list.length>1 && i===this.lastAtk);
    this.lastAtk=i;
    this.atk=list[i];
    this.atkT=0;
    if(this.atk==='clone' && g.shadow) this.atk='rings';
    this.mouth=1;
  }

  endAttack(){
    this.atk=null;
    this.atkT=0;
    this.beams.length=0;
    this.vbeams.length=0;
    this.telegraph=0;
    // a última fase do NUCLEUS-9 dá mais tempo de respiro entre os ataques
    const respiro = (this.kind==='nucleus' && this.phase===2) ? 40 : 0;
    this.atkIdle = 34 + respiro + Math.random()*26;
  }

  runAttack(g){
    const t=this.atkT++;
    const p=g.player;
    const hard = g.hardMode ? 1.18 : 1;
    const shootAt=(x,y,spd,type,opt)=>{
      const dx=p.cx-x, dy=p.cy-y, d=Math.hypot(dx,dy)||1;
      g.hazards.push(new Hazard(x,y,dx/d*spd,dy/d*spd,type,opt));
    };

    switch(this.atk){
      /* ====================== NUCLEUS-9 ====================== */
      case 'chromo':
        if(t===10||t===40||t===70){
          Sound.sfx.split();
          for(let k=-1;k<=1;k++){
            const dx=p.cx-this.x, dy=p.cy-this.y, d=Math.hypot(dx,dy)||1;
            const a=Math.atan2(dy,dx)+k*0.24;
            g.hazards.push(new Hazard(this.x,this.y+10,Math.cos(a)*4.4*hard,Math.sin(a)*4.4*hard,'chromo',
              {r:10,pink:k===0&&Math.random()<0.45}));
          }
        }
        if(t>96) this.endAttack();
        break;

      case 'mitose':
        if(t===26){
          Sound.sfx.split(); g.shake=10;
          FX.ring(this.x,this.y,Art.PAL.cream,40);
          g.minions.push(new Minion(this.x-60,this.y,-1));
          g.minions.push(new Minion(this.x+60,this.y, 1));
          if(g.hardMode) g.minions.push(new Minion(this.x,this.y-50,1));
        }
        if(t>90) this.endAttack();
        break;

      case 'cytoRain':
        if(t%13===0 && t<110){
          const x=40+Math.random()*(CFG.W-80);
          g.hazards.push(new Hazard(x,-20,0,1.6*hard,'blob',{r:10,pink:(t/13)%3===0,life:400}));
        }
        if(t>132) this.endAttack();
        break;

      case 'swoop':
        if(t<44){
          this.telegraph=1;
          this.y += ((p.cy-8)-this.y)*0.08;
        } else if(t===44){
          this.telegraph=0; Sound.sfx.dash(); g.shake=8;
          this.swoopDir = p.cx < this.x ? -1 : 1;
        } else if(t<120){
          this.x += this.swoopDir*7.4;
          if(t%3===0) FX.smoke(this.x,this.y,2,'rgba(150,205,225,.55)');
          if(this.x<80||this.x>CFG.W-80) this.swoopDir*=-1;
        } else {
          this.x += (this.baseX-this.x)*0.06;
          this.y += (this.baseY-this.y)*0.06;
          if(t>150) this.endAttack();
        }
        break;

      case 'helix':
        if(t%9===0 && t<108){
          const i=t/9;
          const yy = 70 + (i%6)*34;
          const col = ['#4a7fa8','#5f9e63','#c9432f','#7d5f9e'][i%4];
          const fromLeft = (i%2===0);
          g.hazards.push(new Hazard(fromLeft?-20:CFG.W+20, yy,
            (fromLeft?1:-1)*3.4*hard, 0,'base',
            {r:11,amp:26,freq:0.055,phase:i*0.8,color:col,pink:i%5===0,life:320}));
        }
        if(t>130) this.endAttack();
        break;

      case 'enzimas':
        if(t===20) g.hazards.push(new Hazard(-25,CFG.GROUND-12,1.6,0,'enzyme',{r:14,hp:6,life:600}));
        if(t===55) g.hazards.push(new Hazard(CFG.W+25,CFG.GROUND-12,-1.6,0,'enzyme',{r:14,hp:6,life:600}));
        if(t%22===0 && t<100) shootAt(this.x,this.y+20,4.0*hard,'orb',{r:8,pink:Math.random()<0.4});
        if(t>112) this.endAttack();
        break;

      case 'laser':
        if(t<50){ this.telegraph=1; }
        else if(t<130){
          this.telegraph=0;
          const k=(t-50)/80;
          this.beams=[{y:90 + k*(CFG.GROUND-120), h:14}];
          if(t===50){ Sound.sfx.superShot(); g.shake=10; }
          if(t%4===0) FX.add(new Particle(Math.random()*CFG.W,this.beams[0].y,0,-1,16,'rgba(255,150,90,.6)',4,'smoke'));
        } else { this.beams.length=0; if(t>146) this.endAttack(); }
        break;

      case 'pinkBurst':
        if(t===25||t===65){
          Sound.sfx.split();
          const n=g.hardMode?12:10;
          const off=Math.random()*Math.PI;
          for(let i=0;i<n;i++){
            const a=off+i/n*Math.PI*2;
            g.hazards.push(new Hazard(this.x,this.y,Math.cos(a)*3.4*hard,Math.sin(a)*3.4*hard,'orb',{r:8,pink:i%3===0}));
          }
        }
        if(t>100) this.endAttack();
        break;

      case 'clone':
        if(t===20){
          Sound.sfx.split(); g.shake=12;
          FX.ring(CFG.W-110,CFG.GROUND-20,Art.PAL.purple,40);
          g.shadow=new ShadowClone(CFG.W-110,CFG.GROUND);
        }
        if(t>60) this.endAttack();
        break;

      case 'rings':
        if(t===1||t===70){
          FX.burst(this.x,this.y,18,Art.PAL.purple,4,4);
          // nao aparece em cima do jogador (senao nao tem como desviar)
          let nx=0;
          for(let tent=0; tent<12; tent++){
            nx = 90 + Math.random()*(CFG.W-180);
            if(Math.abs(nx-p.cx) > 130) break;
          }
          if(Math.abs(nx-p.cx) <= 130) nx = p.cx < CFG.W/2 ? CFG.W-120 : 120;
          this.x = nx;
          this.y = 70 + Math.random()*90;
          FX.ring(this.x,this.y,Art.PAL.pinkHot,26);
          Sound.sfx.split();
        }
        if(t===30||t===110){
          const n=g.hardMode?9:6;
          const off=Math.random()*Math.PI*2;
          for(let i=0;i<n;i++){
            const a=off+i/n*Math.PI*2;
            g.hazards.push(new Hazard(this.x,this.y,Math.cos(a)*2.6*hard,Math.sin(a)*2.6*hard,'orb',
              {r:7.5,pink:i%3===0,color:Art.PAL.purple}));
          }
        }
        if(t>140) this.endAttack();
        break;

      case 'crossfire':
        if(t%20===0 && t<100){
          const i=t/20;
          const gap = (i*97)%CFG.W;
          for(let k=0;k<5;k++){
            const x = 60 + k*130 + (i%2)*65;
            if(Math.abs(x-gap)<160) continue;
            g.hazards.push(new Hazard(x,-16,0,2.4*hard,'chromo',{r:9,pink:(i+k)%3===0}));
          }
        }
        if(t>120) this.endAttack();
        break;

      case 'stormRain':
        if(t%18===0 && t<100){
          const x=30+Math.random()*(CFG.W-60);
          g.hazards.push(new Hazard(x,-20,(Math.random()-0.5)*0.9,1.6*hard,'blob',{r:9,pink:Math.random()<0.5}));
        }
        if(t>118) this.endAttack();
        break;

      /* ====================== DOLLY-96 ====================== */
      case 'laVolley':                       // rajada de lã em arco
        if(t===14||t===34||t===54||t===74){
          Sound.sfx.split();
          const dx=p.cx-this.x;
          const dir = dx<0?-1:1;
          const spread = (t-14)/20;
          g.hazards.push(new Hazard(this.x-dir*20,this.y-30,
            dir*(2.4+spread*0.5)*hard, -4.6, 'wool',
            {r:11,grav:0.16,pink:spread===1,life:300}));
        }
        if(t>96) this.endAttack();
        break;

      case 'salto': {                        // pulo sísmico
        if(t===1){ this.telegraph=1; }
        if(t===34){
          this.telegraph=0;
          this.vy=-13.5;
          this.vx = (p.cx<this.x?-1:1)*2.6;
          Sound.sfx.jump(); g.shake=6;
        }
        if(t>36 && this.y>=this.baseY-0.5 && !this.landed){
          this.landed=true;
          g.shake=16; Sound.sfx.boom();
          Input.rumble(220,.9,.6);
          FX.smoke(this.x,CFG.GROUND-4,10);
          g.hazards.push(new Hazard(this.x-30,CFG.GROUND-8,-3.6*hard,0,'shock',{r:14,life:120}));
          g.hazards.push(new Hazard(this.x+30,CFG.GROUND-8, 3.6*hard,0,'shock',{r:14,life:120}));
        }
        if(t===78){ this.landed=false; this.vy=-11.5; this.vx=(p.cx<this.x?-1:1)*3.2; Sound.sfx.jump(); }
        if(t>110){ this.landed=false; this.endAttack(); }
        break;
      }

      case 'rebanho':
        if(t===24){
          Sound.sfx.split(); g.shake=8;
          g.minions.push(new Minion(this.x-40,this.y-40,-1,'sheep'));
          g.minions.push(new Minion(this.x+30,this.y-60, 1,'sheep'));
          if(g.hardMode) g.minions.push(new Minion(this.x,this.y-80,1,'sheep'));
        }
        if(t>80) this.endAttack();
        break;

      case 'balido':                          // balido: leque de óvulos
        if(t===26||t===62){
          Sound.sfx.split();
          const dir = p.cx<this.x?-1:1;
          for(let k=-2;k<=2;k++){
            const a=Math.PI + (dir>0?Math.PI:0) + k*0.20;
            g.hazards.push(new Hazard(this.x+dir*34,this.y-26,
              Math.cos(a)*3.6*hard, Math.sin(a)*3.6*hard - 0.6,'ovulo',
              {r:9,pink:Math.abs(k)===1,grav:0.05}));
          }
        }
        if(t>100) this.endAttack();
        break;

      case 'pipeta': {                        // micropipeta: feixe vertical
        const shots=[20,80];
        for(const s of shots){
          if(t===s){ this.pipeX = p.cx; this.telegraph=1; }
          if(t===s+30){
            this.telegraph=0;
            this.vbeams=[{x:this.pipeX,w:16,life:26}];
            Sound.sfx.superShot(); g.shake=9;
            FX.burst(this.pipeX,CFG.GROUND-10,14,Art.PAL.orange,4,4);
          }
          if(t===s+56) this.vbeams.length=0;
        }
        if(t>140) this.endAttack();
        break;
      }

      case 'oocitos':                         // fileiras de óvulos com brecha
        if(t%16===0 && t<112){
          const i=t/16;
          const gap = 60 + ((i*137)%(CFG.W-120));
          for(let k=0;k<7;k++){
            const x = 30 + k*95;
            if(Math.abs(x-gap)<95) continue;
            g.hazards.push(new Hazard(x,-18,0,2.5*hard,'ovulo',{r:10,pink:(i+k)%6===0}));
          }
        }
        if(t>138) this.endAttack();
        break;

      case 'choque':                          // fusão elétrica: 2 faixas
        if(t===26){ this.telegraph=1; }
        if(t===60){
          this.telegraph=0;
          this.beams=[{y:CFG.GROUND-24,h:12},{y:150,h:12}];
          Sound.sfx.superShot(); g.shake=12;
        }
        if(t>60 && t<118 && t%5===0){
          for(const b of this.beams)
            FX.add(new Particle(Math.random()*CFG.W,b.y,0,0,12,'rgba(255,240,150,.8)',4,'dot'));
        }
        if(t===118) this.beams.length=0;
        if(t>140) this.endAttack();
        break;

      case 'placas':                          // placas de Petri rolando
        if(t===18) g.hazards.push(new Hazard(-25,CFG.GROUND-8,2.2,0,'petri',{r:13,hp:5,life:500}));
        if(t===58) g.hazards.push(new Hazard(CFG.W+25,CFG.GROUND-8,-2.2,0,'petri',{r:13,hp:5,life:500}));
        if(t%24===0 && t<110) shootAt(this.x,this.y-10,3.8*hard,'wool',{r:9,pink:Math.random()<0.4});
        if(t>124) this.endAttack();
        break;

      case 'estouro':                         // debandada de clones
        if(t===20||t===60||t===100){
          Sound.sfx.dash(); g.shake=6;
          const lanes=[CFG.GROUND-14, CFG.GROUND-70];
          const lane=lanes[((t-20)/40)%2];
          for(let k=0;k<3;k++){
            g.hazards.push(new Hazard(CFG.W+30+k*54, lane, -4.2*hard, 0,'sheepling',
              {r:13,pink:k===1&&Math.random()<0.5,life:260}));
          }
        }
        if(t>150) this.endAttack();
        break;

      case 'chuvaLa':
        if(t%10===0 && t<118){
          const x=30+Math.random()*(CFG.W-60);
          g.hazards.push(new Hazard(x,-20,(Math.random()-0.5)*1.2,1.9*hard,'wool',
            {r:10,pink:Math.random()<0.32,life:400}));
        }
        if(t>140) this.endAttack();
        break;

      case 'megaBalido':                      // MÉÉÉ! anel + empurrão
        if(t<40){ this.telegraph=1; this.mouth=1; }
        if(t===40){
          this.telegraph=0;
          Sound.sfx.boom(); g.shake=18;
          Input.rumble(300,1,.7);
          FX.ring(this.x,this.y,Art.PAL.cream,60);
          const n=g.hardMode?16:13;
          for(let i=0;i<n;i++){
            const a=i/n*Math.PI*2;
            g.hazards.push(new Hazard(this.x,this.y,Math.cos(a)*3.3*hard,Math.sin(a)*3.3*hard,'ovulo',
              {r:8,pink:i%4===0}));
          }
          // sopro: empurra o jogador
          p.vx += (p.x<this.x?-1:1)*7;
        }
        if(t===78){
          const n=10;
          for(let i=0;i<n;i++){
            const a=i/n*Math.PI*2+0.3;
            g.hazards.push(new Hazard(this.x,this.y,Math.cos(a)*2.7*hard,Math.sin(a)*2.7*hard,'wool',{r:9,pink:i%3===0}));
          }
        }
        if(t>110) this.endAttack();
        break;

      case 'clonesDolly':
        if(t===1){
          FX.burst(this.x,this.y,18,Art.PAL.cream,4,4);
          this.x = 110 + Math.random()*(CFG.W-220);
          this.y = 90 + Math.random()*60;
          FX.ring(this.x,this.y,Art.PAL.pinkHot,26);
          Sound.sfx.split();
        }
        if(t===26){
          g.minions.push(new Minion(this.x-50,this.y,-1,'sheep'));
          g.minions.push(new Minion(this.x+50,this.y, 1,'sheep'));
        }
        if(t%26===0 && t>30 && t<110) shootAt(this.x,this.y,4.0*hard,'wool',{r:9,pink:Math.random()<0.4});
        if(t>120) this.endAttack();
        break;

      default: this.endAttack();
    }
  }

  update(g){
    this.t++;
    if(this.flash>0) this.flash--;
    if(this.mouth>0) this.mouth-=0.03;

    if(this.state==='transition'){
      this.stateT--;
      this.x += (CFG.W/2-this.x)*0.05;
      this.y += (120-this.y)*0.05;
      if(this.t%4===0) FX.burst(this.x+(Math.random()-0.5)*70,this.y+(Math.random()-0.5)*70,3,Art.PAL.cream,3,4,'smoke');
      if(this.stateT<=0) this.nextPhase(g);
      return;
    }

    if(this.state==='dying'){
      this.dyingT--;
      this.x += Math.sin(this.t*0.4)*2;
      if(this.t%5===0){
        FX.burst(this.x+(Math.random()-0.5)*80,this.y+(Math.random()-0.5)*70,8,Art.PAL.yellow,4,4);
        Sound.sfx.boom();
        g.shake=Math.max(g.shake,7);
      }
      if(this.dyingT<=0) this.state='dead';
      return;
    }

    if(this.state!=='fight') return;

    if(this.onGroundPhase){
      // chefe que anda no chão (Dolly fase 1)
      this.vy += 0.62;
      this.y += this.vy;
      this.x += this.vx;
      this.vx *= 0.97;
      if(this.y>=this.baseY){ this.y=this.baseY; this.vy=0; }
      if(this.x<100){ this.x=100; this.vx=Math.abs(this.vx); }
      if(this.x>CFG.W-70){ this.x=CFG.W-70; this.vx=-Math.abs(this.vx); }
      if(!this.atk){
        // balança de leve parado
        this.x += Math.sin(this.t*0.03)*0.4;
      }
    } else {
      const bob=Math.sin(this.t*0.035)*8;
      if(!this.atk || (this.atk!=='swoop' && this.atk!=='rings' && this.atk!=='clonesDolly')){
        this.x += (this.baseX-this.x)*0.03 + Math.sin(this.t*0.02)*0.5;
        this.y += (this.baseY+bob-this.y)*0.05;
      }
    }

    this.angry = this.hp/this.maxHp < 0.35 ? 1 : 0;

    if(this.atk) this.runAttack(g);
    else if(--this.atkIdle<=0) this.startAttack(g);
  }

  /* ---------------- DESENHO ---------------- */
  draw(ctx,g){
    if(this.state==='dead') return;
    const P=Art.PAL;

    ctx.save();
    const trans = this.state==='transition';
    const scale = trans ? 1 + Math.sin(this.stateT*0.3)*0.12 : 1;
    ctx.translate(this.x,this.y);
    ctx.scale(scale,scale);

    const forms = this.kind==='dolly'
      ? [this.drawSheepForm, this.drawMachineForm, this.drawFlockForm]
      : [this.drawCellForm,  this.drawHelixForm,   this.drawMasterForm];
    const form = forms[this.phase].bind(this);
    form(ctx);

    // piscada branca ao levar tiro (desenha a forma de novo, clareando)
    if(this.flash>0){
      ctx.save();
      ctx.globalAlpha=0.45;
      ctx.globalCompositeOperation='lighter';
      form(ctx);
      ctx.restore();
    }
    ctx.restore();

    // faixas horizontais de dano
    for(const b of this.beams){
      ctx.save();
      const th=b.h+Math.sin(this.t*0.5)*3;
      ctx.fillStyle='rgba(255,120,60,.85)';
      ctx.fillRect(0,b.y-th/2,CFG.W,th);
      ctx.fillStyle='rgba(255,240,190,.95)';
      ctx.fillRect(0,b.y-th/5,CFG.W,th*0.4);
      ctx.restore();
    }
    // faixas verticais (pipeta)
    for(const b of this.vbeams){
      ctx.save();
      const tw=b.w+Math.sin(this.t*0.6)*3;
      ctx.fillStyle='rgba(120,200,255,.8)';
      ctx.fillRect(b.x-tw/2,0,tw,CFG.H);
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.fillRect(b.x-tw/6,0,tw/3,CFG.H);
      ctx.restore();
    }

    // telegrafias
    if(this.telegraph){
      ctx.save();
      ctx.globalAlpha=.35+Math.sin(this.t*0.6)*0.2;
      ctx.strokeStyle=P.red; ctx.lineWidth=3; ctx.setLineDash([10,8]);
      if(this.atk==='laser'){
        ctx.beginPath(); ctx.moveTo(0,90); ctx.lineTo(CFG.W,90); ctx.stroke();
      } else if(this.atk==='swoop'){
        ctx.beginPath(); ctx.moveTo(0,this.y); ctx.lineTo(CFG.W,this.y); ctx.stroke();
      } else if(this.atk==='pipeta'){
        ctx.beginPath(); ctx.moveTo(this.pipeX,0); ctx.lineTo(this.pipeX,CFG.H); ctx.stroke();
      } else if(this.atk==='choque'){
        ctx.beginPath();
        ctx.moveTo(0,CFG.GROUND-24); ctx.lineTo(CFG.W,CFG.GROUND-24);
        ctx.moveTo(0,150); ctx.lineTo(CFG.W,150);
        ctx.stroke();
      } else if(this.atk==='salto'){
        ctx.beginPath(); ctx.arc(this.x,CFG.GROUND-6,40+Math.sin(this.t*0.4)*6,Math.PI,0); ctx.stroke();
      } else if(this.atk==='megaBalido'){
        ctx.beginPath(); ctx.arc(this.x,this.y,50+Math.sin(this.t*0.5)*10,0,Math.PI*2); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  face(ctx, rx, ry, mouthOpen, angry){
    const P=Art.PAL;
    const eyeY=-ry*0.18;
    const ex=rx*0.34;
    const blink = (Math.floor(this.t/80)%7===0 && this.t%80<7);
    Art.ellipse(ctx,-ex,eyeY,rx*0.24,blink?1.5:ry*0.26,P.cream,3);
    Art.ellipse(ctx, ex,eyeY,rx*0.24,blink?1.5:ry*0.26,P.cream,3);
    if(!blink){
      Art.circle(ctx,-ex+2,eyeY+2,rx*0.10,P.ink,0);
      Art.circle(ctx, ex+2,eyeY+2,rx*0.10,P.ink,0);
      Art.circle(ctx,-ex+3.5,eyeY,rx*0.035,P.cream,0);
      Art.circle(ctx, ex+3.5,eyeY,rx*0.035,P.cream,0);
    }
    if(angry){
      Art.ink(ctx,3.4);
      ctx.beginPath();
      ctx.moveTo(-ex-rx*0.26,eyeY-ry*0.36); ctx.lineTo(-ex+rx*0.16,eyeY-ry*0.18);
      ctx.moveTo( ex+rx*0.26,eyeY-ry*0.36); ctx.lineTo( ex-rx*0.16,eyeY-ry*0.18);
      ctx.stroke();
    }
    const mo=Math.max(0.12,mouthOpen);
    ctx.save();
    ctx.translate(0,ry*0.40);
    Art.ellipse(ctx,0,0,rx*0.34,ry*0.20*mo+3,'#54212a',3);
    ctx.beginPath();
    ctx.ellipse(0,-ry*0.20*mo*0.5-1,rx*0.30,3,0,0,Math.PI*2);
    ctx.fillStyle=Art.PAL.cream; ctx.fill();
    ctx.restore();
  }

  /* ---------- NUCLEUS-9 ---------- */
  drawCellForm(ctx){
    const P=Art.PAL, t=this.t;
    Art.blob(ctx,0,0,52,50,'rgba(150,205,225,.55)',4,16,4,7);
    ctx.save(); ctx.globalAlpha=.55;
    for(let i=0;i<7;i++){
      const a=t*0.008+i*0.9;
      Art.ellipse(ctx,Math.cos(a)*34,Math.sin(a*1.3)*30,6,4,i%2?P.green:P.blue,0,a);
    }
    ctx.restore();
    Art.blob(ctx,0,0,34,32,'rgba(125,95,158,.92)',3.5,14,3,3);
    this.face(ctx,34,32,this.mouth,this.angry);
    for(let i=0;i<4;i++){
      const a=t*0.02+i*Math.PI/2;
      Art.circle(ctx,Math.cos(a)*52,Math.sin(a)*50,7+Math.sin(t*0.1+i)*2,'rgba(150,205,225,.75)',2.5);
    }
  }

  drawHelixForm(ctx){
    const P=Art.PAL, t=this.t, h=120;
    for(let s=0;s<2;s++){
      ctx.beginPath();
      for(let i=0;i<=24;i++){
        const y=-h/2+(i/24)*h;
        const x=Math.sin(i*0.55 + t*0.04 + s*Math.PI)*26;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=P.ink; ctx.lineWidth=9; ctx.lineCap='round'; ctx.stroke();
      ctx.strokeStyle=s?P.blue:P.green; ctx.lineWidth=5; ctx.stroke();
    }
    for(let i=0;i<=24;i+=2){
      const y=-h/2+(i/24)*h;
      const x1=Math.sin(i*0.55+t*0.04)*26;
      const x2=Math.sin(i*0.55+t*0.04+Math.PI)*26;
      ctx.strokeStyle=P.ink; ctx.lineWidth=5;
      ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
      ctx.strokeStyle=[P.red,P.yellow,P.purple,P.orange][(i/2)%4];
      ctx.lineWidth=2.5; ctx.stroke();
    }
    ctx.save();
    ctx.translate(0,-h/2-24);
    Art.blob(ctx,0,0,34,30,'rgba(125,95,158,.95)',3.5,14,3,5);
    this.face(ctx,32,28,this.mouth,this.angry);
    ctx.restore();
  }

  drawMasterForm(ctx){
    const P=Art.PAL, t=this.t;
    for(let i=0;i<5;i++){
      const a=t*0.05+i*(Math.PI*2/5);
      const r=52+Math.sin(t*0.06+i)*8;
      Art.circle(ctx,Math.cos(a)*r,Math.sin(a)*r*0.6,8,'rgba(125,95,158,.8)',2.4);
      Art.circle(ctx,Math.cos(a)*r-2,Math.sin(a)*r*0.6-2,3,P.pinkHot,0);
    }
    ctx.save(); ctx.globalAlpha=.25;
    Art.blob(ctx,0,0,44,42,P.pinkHot,0,14,7,t*0.1);
    ctx.restore();
    Art.blob(ctx,0,0,32,30,'#3b2a4d',4,14,3,9);
    Art.blob(ctx,0,0,24,22,'rgba(125,95,158,.95)',3,12,4,11);
    this.face(ctx,26,24,this.mouth,1);
    ctx.save();
    ctx.strokeStyle=P.pinkHot; ctx.lineWidth=3; ctx.lineCap='round';
    for(let i=0;i<7;i++){
      const a=-Math.PI*0.9 + i*(Math.PI*0.8/6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*26,Math.sin(a)*24);
      ctx.lineTo(Math.cos(a)*(36+Math.sin(t*0.15+i)*4),Math.sin(a)*(34+Math.sin(t*0.15+i)*4));
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- DOLLY-96 ---------- */
  // fase 1: a ovelha gigante
  drawSheepForm(ctx){
    const P=Art.PAL, t=this.t;
    const f = -1;                       // olha para a esquerda (para o jogador)
    const squash = this.vy<-2 ? 1.08 : (this.y>=this.baseY-0.5 && this.vy>4 ? 0.92 : 1);
    ctx.save();
    ctx.scale(1/squash, squash);

    // sombra
    ctx.save(); ctx.globalAlpha=.3;
    Art.ellipse(ctx,0,(CFG.GROUND-this.y)+4,46,7,'rgba(28,20,16,.5)',0);
    ctx.restore();

    // pernas
    Art.ink(ctx,5);
    const legSw=Math.sin(t*0.08)*3;
    ctx.beginPath();
    ctx.moveTo(-22,26); ctx.lineTo(-24-legSw,46);
    ctx.moveTo(-4,28);  ctx.lineTo(-4+legSw,46);
    ctx.moveTo(16,26);  ctx.lineTo(18-legSw,46);
    ctx.moveTo(30,24);  ctx.lineTo(32+legSw,46);
    ctx.stroke();
    // cascos
    [[-24-legSw,46],[-4+legSw,46],[18-legSw,46],[32+legSw,46]].forEach(pt=>{
      Art.ellipse(ctx,pt[0],pt[1],5,3,'#3b2a2a',0);
    });

    // lã do corpo (montinhos)
    for(let i=0;i<11;i++){
      const a=i/11*Math.PI*2;
      Art.circle(ctx,Math.cos(a)*34,Math.sin(a)*26,17,P.white,3.4);
    }
    Art.ellipse(ctx,0,0,36,28,P.white,0);
    // sombreado da lã
    ctx.save(); ctx.globalAlpha=.18;
    for(let i=0;i<6;i++){
      const a=Math.PI*0.15+i*0.35;
      Art.circle(ctx,Math.cos(a)*26,Math.sin(a)*20,10,'#9a8a70',0);
    }
    ctx.restore();

    // rabinho
    Art.circle(ctx,42,-6,9,P.white,3);

    // cabeça
    ctx.save();
    ctx.translate(f*44,-16+Math.sin(t*0.05)*2);
    ctx.rotate(f*0.06);
    // orelhas
    Art.ellipse(ctx,6,-14,11,5,'#3b2a2a',3,-0.5);
    Art.ellipse(ctx,-12,-12,10,5,'#3b2a2a',3,0.4);
    // topete de lã
    Art.circle(ctx,-2,-14,10,P.white,3);
    Art.ellipse(ctx,0,0,19,17,'#3d2c2c',3.6);
    // olhos
    const blink=(Math.floor(t/80)%7===0 && t%80<7);
    Art.ellipse(ctx,-7,-3,5,blink?1:6,P.cream,2.6);
    Art.ellipse(ctx, 7,-3,5,blink?1:6,P.cream,2.6);
    if(!blink){
      Art.circle(ctx,-8,-2,2.4,P.ink,0);
      Art.circle(ctx, 6,-2,2.4,P.ink,0);
    }
    if(this.angry){
      Art.ink(ctx,3);
      ctx.beginPath();
      ctx.moveTo(-14,-11); ctx.lineTo(-3,-6);
      ctx.moveTo( 14,-11); ctx.lineTo( 3,-6);
      ctx.stroke();
    }
    // focinho
    const mo=Math.max(0.15,this.mouth);
    Art.ellipse(ctx,0,9,11,6+mo*5,'#e8c9c0',3);
    Art.circle(ctx,-3.5,7,1.6,P.ink,0);
    Art.circle(ctx, 3.5,7,1.6,P.ink,0);
    if(mo>0.3){
      Art.ellipse(ctx,0,13,6,4*mo,'#54212a',2);
    }
    // brinco de identificação (nº 6LL3 da Dolly)
    Art.circle(ctx,-16,6,4,P.yellow,2.2);
    ctx.restore();
    ctx.restore();
  }

  // fase 2: máquina de transferência nuclear
  drawMachineForm(ctx){
    const P=Art.PAL, t=this.t;
    // base do micromanipulador
    ctx.save();
    Art.ink(ctx,4);
    ctx.fillStyle='#b9b3a4';
    ctx.beginPath(); ctx.moveTo(-40,54); ctx.lineTo(40,54); ctx.lineTo(30,30); ctx.lineTo(-30,30); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // corpo da máquina
    Art.ellipse(ctx,0,4,38,34,'#cfc7b4',4);
    // parafusos
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+t*0.01;
      Art.circle(ctx,Math.cos(a)*30,Math.sin(a)*26,3,'#8d8676',1.6);
    }
    // pipeta esquerda (agulha) e direita (sucção)
    ctx.save();
    ctx.translate(-44,10); ctx.rotate(-0.25+Math.sin(t*0.05)*0.05);
    Art.ink(ctx,3); ctx.fillStyle=P.cream;
    ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-34,-1); ctx.lineTo(-34,1); ctx.lineTo(0,5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(44,10); ctx.rotate(0.25-Math.sin(t*0.05)*0.05);
    Art.ink(ctx,3); ctx.fillStyle=P.cream;
    ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(34,-2); ctx.lineTo(34,2); ctx.lineTo(0,6); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // óvulo sendo manipulado (o "rosto" da máquina)
    Art.blob(ctx,0,0,26,24,'#f3d9a6',3.5,12,4,3);
    this.face(ctx,26,24,this.mouth,this.angry);
    // cabecinha da ovelha em cima, controlando
    ctx.save();
    ctx.translate(0,-52+Math.sin(t*0.06)*3);
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      Art.circle(ctx,Math.cos(a)*10,Math.sin(a)*8+2,8,P.white,2.8);
    }
    Art.ellipse(ctx,0,2,12,10,P.white,0);
    Art.ellipse(ctx,-11,-2,6.5,3.2,"#3b2a2a",2.4,-0.4);
    Art.ellipse(ctx, 11,-2,6.5,3.2,"#3b2a2a",2.4,0.4);
    Art.ellipse(ctx,0,2,10,9,"#3d2c2c",3);
    Art.ellipse(ctx,-4,0,3,3.4,P.cream,1.8);
    Art.ellipse(ctx, 4,0,3,3.4,P.cream,1.8);
    Art.circle(ctx,-4,1,1.3,P.ink,0);
    Art.circle(ctx, 4,1,1.3,P.ink,0);
    Art.ellipse(ctx,0,7,5,3,"#e8c9c0",2);
    ctx.restore();
    // faíscas elétricas
    if(this.atk==='choque'){
      ctx.strokeStyle=P.yellow; ctx.lineWidth=2;
      for(let i=0;i<4;i++){
        const a=Math.random()*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*30,Math.sin(a)*26);
        ctx.lineTo(Math.cos(a)*46,Math.sin(a)*40);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // fase 3: o rebanho de clones
  drawFlockForm(ctx){
    const P=Art.PAL, t=this.t;
    // clones orbitando
    for(let i=0;i<5;i++){
      const a=t*0.04+i*(Math.PI*2/5);
      const r=56+Math.sin(t*0.05+i)*8;
      const x=Math.cos(a)*r, y=Math.sin(a)*r*0.5;
      ctx.save();
      ctx.globalAlpha=.85;
      Art.circle(ctx,x,y,11,P.white,2.6);
      Art.ellipse(ctx,x+6,y-4,6,5,'#3d2c2c',2.2);
      ctx.restore();
    }
    // aura
    ctx.save(); ctx.globalAlpha=.22;
    Art.blob(ctx,0,0,50,44,P.pinkHot,0,14,7,t*0.1);
    ctx.restore();
    // corpo principal (ovelha coroada)
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2;
      Art.circle(ctx,Math.cos(a)*24,Math.sin(a)*20,14,P.white,3.2);
    }
    Art.ellipse(ctx,0,0,26,22,P.white,0);
    Art.ellipse(ctx,0,-2,20,19,'#3d2c2c',3.4);
    this.face(ctx,20,19,this.mouth,1);
    // coroa de DNA
    ctx.save();
    ctx.strokeStyle=P.yellow; ctx.lineWidth=3.4; ctx.lineCap='round';
    for(let i=0;i<5;i++){
      const a=-Math.PI*0.85 + i*(Math.PI*0.7/4);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*24,Math.sin(a)*22);
      ctx.lineTo(Math.cos(a)*(38+Math.sin(t*0.16+i)*4),Math.sin(a)*(36+Math.sin(t*0.16+i)*4));
      ctx.stroke();
    }
    ctx.restore();
  }
}
