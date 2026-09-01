/* ============================================================
   ENTIDADES - jogador, tiros, particulas.
   ============================================================ */
const CFG = {
  W: 640, H: 360,
  GROUND: 300,          // linha do chao (pes do jogador)
  GRAV: 0.62,
  MAXFALL: 11.5,
  JUMP: -10.6,
  SPEED: 3.15,
  DASH_SPD: 8.4,
  DASH_TIME: 13,        // quadros
  DASH_CD: 30,
  FIRE_RATE: 6,         // quadros entre tiros
  IFRAMES: 78
};

/* ------------------------------------------------------------
   PARTICULAS
------------------------------------------------------------ */
class Particle {
  constructor(x, y, vx, vy, life, color, size, kind){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.life=life; this.maxLife=life;
    this.color=color; this.size=size; this.kind=kind||'dot';
    this.rot = Math.random()*Math.PI*2;
    this.spin = (Math.random()-0.5)*0.3;
    this.dead=false;
  }
  update(){
    this.x+=this.vx; this.y+=this.vy;
    if (this.kind!=='smoke' && this.kind!=='ring') this.vy+=0.16;
    this.vx*=0.97; this.vy*=0.98;
    this.rot+=this.spin;
    if (--this.life<=0) this.dead=true;
  }
  draw(ctx){
    const a = Math.max(0, this.life/this.maxLife);
    ctx.save(); ctx.globalAlpha = a;
    if (this.kind==='ring'){
      const r = this.size*(1.6-a)+2;
      ctx.strokeStyle=this.color; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(this.x,this.y,r,0,Math.PI*2); ctx.stroke();
    } else if (this.kind==='smoke'){
      ctx.fillStyle=this.color;
      Art.blob(ctx, this.x, this.y, this.size*(2-a), this.size*(2-a), this.color, 0, 8, 3, this.x);
    } else if (this.kind==='star'){
      ctx.translate(this.x,this.y); ctx.rotate(this.rot);
      ctx.fillStyle=this.color;
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const rr = i%2===0 ? this.size : this.size*0.45;
        const an = i/10*Math.PI*2;
        i===0?ctx.moveTo(Math.cos(an)*rr,Math.sin(an)*rr):ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle=Art.PAL.ink; ctx.lineWidth=1.5; ctx.stroke();
    } else {
      ctx.fillStyle=this.color;
      ctx.beginPath(); ctx.arc(this.x,this.y,this.size*a+0.6,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

const FX = {
  list: [],
  add(p){ this.list.push(p); },
  burst(x,y,n,color,spd,size,kind){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, s=(0.3+Math.random())*(spd||3);
      this.add(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,20+Math.random()*20,color,size||3,kind));
    }
  },
  ring(x,y,color,size){ this.add(new Particle(x,y,0,0,22,color,size||16,'ring')); },
  smoke(x,y,n,color){
    for(let i=0;i<n;i++){
      this.add(new Particle(x+(Math.random()-0.5)*10,y+(Math.random()-0.5)*8,
        (Math.random()-0.5)*1.2,-0.4-Math.random()*0.8,26+Math.random()*18,
        color||'rgba(250,240,215,.85)',3+Math.random()*3,'smoke'));
    }
  },
  update(){ for(const p of this.list) p.update(); this.list=this.list.filter(p=>!p.dead); },
  draw(ctx){ for(const p of this.list) p.draw(ctx); },
  clear(){ this.list.length=0; }
};

/* ------------------------------------------------------------
   TIROS DO JOGADOR
------------------------------------------------------------ */
class Shot {
  constructor(x,y,vx,vy,dmg,wpn){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.w = wpn || WEAPONS[0];
    this.r = this.w.r; this.dmg=dmg;
    this.big = this.w.r >= 9;
    this.homing = this.w.homing || 0;
    this.color = this.w.color || Art.PAL.yellow;
    this.life = this.homing ? 130 : 90;
    this.dead=false; this.t=0;
  }

  // procura o alvo mais proximo (chefe, clones, ovelhinhas...)
  findTarget(g){
    let best=null, bd=1e9;
    const test=(x,y)=>{
      const d=Math.hypot(x-this.x,y-this.y);
      if(d<bd){ bd=d; best={x,y}; }
    };
    if(g.boss && g.boss.state==='fight'){
      const b=g.boss.hitbox();
      test(b.x+b.w/2, b.y+b.h/2);
    }
    for(const m of g.minions) test(m.x,m.y);
    if(g.shadow) test(g.shadow.x, g.shadow.y-18);
    for(const h of g.hazards) if(h.hp>0) test(h.x,h.y);
    return best;
  }

  update(g){
    this.t++;
    if(this.homing && g && this.t>4){
      const tg=this.findTarget(g);
      if(tg){
        const dx=tg.x-this.x, dy=tg.y-this.y, d=Math.hypot(dx,dy)||1;
        const sp=Math.hypot(this.vx,this.vy)||1;
        this.vx += (dx/d)*sp*this.homing;
        this.vy += (dy/d)*sp*this.homing;
        const ns=Math.hypot(this.vx,this.vy)||1;
        this.vx=this.vx/ns*sp; this.vy=this.vy/ns*sp;
      }
    }
    this.x+=this.vx; this.y+=this.vy;
    if(--this.life<=0) this.dead=true;
    if(this.x<-30||this.x>CFG.W+30||this.y<-40||this.y>CFG.H+40) this.dead=true;
    if(this.t%3===0) FX.add(new Particle(this.x,this.y,0,0,10,'rgba(240,200,90,.55)',this.r*0.7,'dot'));
  }

  draw(ctx){
    const w=Math.sin(this.t*0.5)*0.6;
    ctx.save();
    ctx.globalAlpha=.35;
    Art.circle(ctx,this.x-this.vx*0.7,this.y-this.vy*0.7,this.r*0.8,this.color,0);
    ctx.globalAlpha=1;
    Art.blob(ctx,this.x,this.y,this.r+w,this.r-w,this.color,2.5,8,6,this.x);
    Art.circle(ctx,this.x-this.r*0.25,this.y-this.r*0.25,this.r*0.35,Art.PAL.cream,0);
    if(this.homing){
      // rabinho de fita de RNA
      ctx.strokeStyle=Art.PAL.ink; ctx.lineWidth=1.8;
      ctx.beginPath();
      for(let i=0;i<3;i++){
        const k=(i+1)*3.4;
        ctx.lineTo(this.x-this.vx*0.25*k, this.y-this.vy*0.25*k + Math.sin(this.t*0.6+i)*2.4);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   JOGADOR - "Celia/Celio", a celula cientista
------------------------------------------------------------ */
class Player {
  constructor(){ this.reset(); }

  reset(){
    this.x=110; this.y=CFG.GROUND;
    this.vx=0; this.vy=0;
    this.w=22; this.h=38;
    this.face=1;
    this.onGround=true;
    this.ducking=false;
    this.dashT=0; this.dashCD=0; this.airDash=false;
    this.fireT=0;
    this.inv=0;
    this.hp=3; this.maxHp=3;
    this.super=0;
    this.superT=0;
    this.dead=false;
    this.anim=0;
    this.aim='side';
    this.aimAngle=0;
    this.dashDir=1;
    this.blink=0;
    this.parryFlash=0;
    this.hitStop=0;
    this.shots=[];
    this.trail=[];
  }

  get cx(){ return this.x; }
  get cy(){ return this.y - (this.ducking?12:20); }

  hitbox(){
    const h = this.ducking ? 20 : this.h;
    return {x:this.x-9, y:this.y-h, w:18, h:h};
  }

  damage(dmgSrcX){
    if (this.inv>0 || this.superT>0 || this.dead) return false;
    this.hp--;
    this.inv=CFG.IFRAMES;
    this.vy=-5.4;
    this.vx = (this.x < dmgSrcX ? -3.4 : 3.4);
    this.onGround=false;
    Sound.sfx.hurt();
    Input.rumble(200,.8,.6);
    FX.burst(this.cx,this.cy,16,Art.PAL.red,4,4);
    FX.ring(this.cx,this.cy,Art.PAL.red,18);
    if (this.hp<=0){ this.hp=0; this.dead=true; }
    return true;
  }

  addSuper(v){ this.super=Math.min(100,this.super+v); }

  update(g){
    if (this.dead){
      this.vy=Math.min(this.vy+CFG.GRAV,CFG.MAXFALL);
      this.y+=this.vy; this.x+=this.vx; this.vx*=0.94;
      this.anim++;
      this.updateShots(g);
      return;
    }

    const I=Input;
    this.anim++;
    if(this.inv>0) this.inv--;
    if(this.dashCD>0) this.dashCD--;
    if(this.parryFlash>0) this.parryFlash--;

    // ---- SUPER ----
    if (this.superT>0){
      this.superT--;
      this.vx=0;
      if(!this.onGround){ this.vy=Math.min(this.vy+CFG.GRAV,CFG.MAXFALL); this.y+=this.vy; }
      if(this.y>=CFG.GROUND){ this.y=CFG.GROUND; this.vy=0; this.onGround=true; }
      this.updateShots(g);
      return;
    }
    if (I.pressed.super && this.super>=100){
      this.super=0; this.superT=70;
      // o feixe sai na direcao em que voce esta mirando
      const v=this.aimVec();
      g.superAngle=Math.atan2(v.y,v.x);
      Sound.sfx.superShot();
      Input.rumble(400,1,.8);
      g.superBeam=70;
      g.shake=14;
      return;
    }

    // ---- DASH ----
    if (I.pressed.dash && this.dashT<=0 && this.dashCD<=0 && (this.onGround||!this.airDash)){
      this.dashT=CFG.DASH_TIME; this.dashCD=CFG.DASH_CD;
      // com o mouse a mira e livre, entao o dash segue a direcao andada
      this.dashDir = I.held.left ? -1 : (I.held.right ? 1 : this.face);
      if(!this.onGround) this.airDash=true;
      Sound.sfx.dash();
      FX.smoke(this.x-this.dashDir*10,this.y-8,6);
      this.inv=Math.max(this.inv,10);
    }

    if (this.dashT>0){
      this.dashT--;
      this.vx=(this.dashDir||this.face)*CFG.DASH_SPD;
      this.vy=0;
      this.trail.push({x:this.x,y:this.y,f:this.face,a:1});
    } else {
      // ---- MOVIMENTO ----
      const l=I.held.left, r=I.held.right;
      this.ducking = I.held.down && this.onGround;
      let mv=0;
      if(l&&!r) mv=-1; else if(r&&!l) mv=1;
      if(mv!==0 && !this.ducking) this.face=mv;
      const target = this.ducking?0:mv*CFG.SPEED;
      this.vx += (target-this.vx)*(this.onGround?0.42:0.20);

      // ---- PULO ----
      if(I.pressed.jump){
        if(this.onGround){
          this.vy=CFG.JUMP; this.onGround=false; this.airDash=false;
          Sound.sfx.jump(); FX.smoke(this.x,this.y-2,5);
        } else {
          // tentativa de aparar (parry) projetil rosa
          g.tryParry(this);
        }
      }
      if(!I.held.jump && this.vy<-3.5) this.vy*=0.55;   // pulo variavel
      this.vy=Math.min(this.vy+CFG.GRAV,CFG.MAXFALL);
    }

    // ---- POSICAO ----
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<14) {this.x=14; this.vx=0;}
    if(this.x>CFG.W-14){this.x=CFG.W-14; this.vx=0;}
    if(this.y>=CFG.GROUND){
      if(!this.onGround){ Sound.sfx.land(); FX.smoke(this.x,CFG.GROUND-2,4); }
      this.y=CFG.GROUND; this.vy=0; this.onGround=true; this.airDash=false;
    }

    // ---- MIRA ----
    if(Input.aimStick.active && !this.ducking){
      // mira livre pelo analogico direito do celular
      this.aimAngle = Input.aimStick.ang;
      const cx = Math.cos(this.aimAngle);
      if(Math.abs(cx) > 0.25) this.face = cx < 0 ? -1 : 1;
      this.aim='mouse';
    } else if(Input.usingMouse && !this.ducking){
      // mira livre: aponta para o cursor do mouse
      const mx=Input.mouse.x, my=Input.mouse.y;
      const dx=mx-this.x, dy=my-this.cy;
      this.aimAngle=Math.atan2(dy,dx);
      if(Math.abs(dx)>6) this.face = dx<0 ? -1 : 1;
      this.aim='mouse';
    } else {
      const up=Input.held.up, dn=Input.held.down;
      const moving=Math.abs(this.vx)>0.6;
      if(up && moving)       this.aim='upDiag';
      else if(up)            this.aim='up';
      else if(dn && !this.onGround && !moving) this.aim='down';
      else if(dn && !this.onGround)            this.aim='downDiag';
      else                   this.aim='side';
    }

    // ---- TIRO ----
    if(this.fireT>0) this.fireT--;
    if(Input.held.shoot && this.fireT<=0 && !this.ducking){
      this.shoot(g);
      this.fireT=Shop.weapon.rate;
    }

    // rastro do dash
    for(const t of this.trail) t.a-=0.12;
    this.trail=this.trail.filter(t=>t.a>0);

    this.updateShots(g);
  }

  aimVec(){
    const s=1/Math.SQRT2;
    switch(this.aim){
      case 'mouse':    return {x:Math.cos(this.aimAngle||0), y:Math.sin(this.aimAngle||0)};
      case 'up':       return {x:0,y:-1};
      case 'upDiag':   return {x:this.face*s,y:-s};
      case 'down':     return {x:0,y:1};
      case 'downDiag': return {x:this.face*s,y:s};
      default:         return {x:this.face,y:0};
    }
  }

  muzzle(){
    const v=this.aimVec();
    const ox=this.x+v.x*20, oy=this.cy+v.y*18 - (this.aim==='up'?6:0);
    return {x:ox,y:oy,v};
  }

  shoot(g){
    const m=this.muzzle();
    const wp=Shop.weapon;
    const spd=wp.speed;
    const spread=(Math.random()-0.5)*(wp.homing?0.35:0.10);
    const ang=Math.atan2(m.v.y,m.v.x)+spread;
    this.shots.push(new Shot(m.x,m.y,Math.cos(ang)*spd,Math.sin(ang)*spd,wp.dmg,wp));
    Sound.sfx.shoot();
    FX.add(new Particle(m.x,m.y,Math.cos(ang)*1.5,Math.sin(ang)*1.5,10,'rgba(255,230,150,.8)',4,'dot'));
    g.shake=Math.max(g.shake,1.2);
  }

  updateShots(g){
    for(const s of this.shots) s.update(g);
    this.shots=this.shots.filter(s=>!s.dead);
  }

  /* ---------------- DESENHO ---------------- */
  draw(ctx){
    if(this.inv>0 && Math.floor(this.anim/3)%2===0 && !this.dead) return;

    // rastro do dash
    for(const t of this.trail){
      ctx.save(); ctx.globalAlpha=t.a*0.35;
      this.drawBody(ctx,t.x,t.y,t.f,true);
      ctx.restore();
    }
    this.drawBody(ctx,this.x,this.y,this.face,false);
  }

  drawBody(ctx,x,y,face,ghost){
    const P=Art.PAL;
    const run = this.onGround && Math.abs(this.vx)>0.7 && !this.ducking;
    const t=this.anim;
    const bob = run ? Math.sin(t*0.34)*2 : (this.onGround?Math.sin(t*0.08)*1.2:0);
    const duck=this.ducking;
    const hy = y - (duck?24:40) + bob;     // centro da cabeca
    const by = y - (duck?12:20) + bob;     // centro do corpo

    ctx.save();
    // sombra
    ctx.globalAlpha=ghost?0.2:0.35;
    Art.ellipse(ctx,x,CFG.GROUND+3,13,4,'rgba(28,20,16,.45)',0);
    ctx.globalAlpha=1;

    if(this.dead) ctx.rotate(0);

    // pernas (rubber hose)
    const legSw = run ? Math.sin(t*0.34)*7 : 0;
    const legY = y;
    if(!duck){
      Art.hose(ctx,x-4,by+8,x-4-legSw*0.6,legY-2, legSw*0.5, 5, P.blue);
      Art.hose(ctx,x+4,by+8,x+4+legSw*0.6,legY-2,-legSw*0.5, 5, P.blue);
      // sapatos
      Art.ellipse(ctx,x-5-legSw*0.6+face*2,legY-1,6,3.4,P.ink,0);
      Art.ellipse(ctx,x+5+legSw*0.6+face*2,legY-1,6,3.4,P.ink,0);
    } else {
      Art.ellipse(ctx,x+face*2,legY-2,10,4,P.ink,0);
    }

    // corpo: jaleco de laboratorio
    Art.blob(ctx,x,by,11,duck?10:13,P.white,3,10,3,x*0.7);
    // gravata / detalhe
    ctx.fillStyle=P.red;
    ctx.beginPath();
    ctx.moveTo(x+face*1,by-8); ctx.lineTo(x+face*4,by-2); ctx.lineTo(x+face*1,by+5); ctx.lineTo(x-face*2,by-2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=P.ink; ctx.lineWidth=1.4; ctx.stroke();

    // braco / arma
    const m=this.muzzle();
    const armX=x+face*6, armY=by-4;
    const gunX=m.x - (this.x-x), gunY=m.y - (this.y-y);
    Art.hose(ctx,armX,armY,gunX,gunY,face*4,4.6,P.white);
    // luva
    Art.circle(ctx,gunX,gunY,4.6,P.cream,2.4);
    // canhao de plasma
    ctx.save();
    ctx.translate(gunX,gunY);
    ctx.rotate(Math.atan2(m.v.y,m.v.x));
    Art.ellipse(ctx,4,0,7,4.2,P.orange,2.6);
    Art.circle(ctx,9,0,2.6,P.yellow,2);
    ctx.restore();

    // outro braco
    Art.hose(ctx,x-face*6,by-4,x-face*10,by+4+ (run?Math.sin(t*0.34+2)*3:0),-face*5,4.2,P.white);
    Art.circle(ctx,x-face*10,by+5,4,P.cream,2.2);

    // CABECA: uma celula com nucleo
    const hw=13,hh=12.5;
    Art.blob(ctx,x,hy,hw,hh,'rgba(150,205,225,.92)',3,12,4,x*1.3);
    // citoplasma / organelas
    ctx.globalAlpha=.5;
    Art.circle(ctx,x-6,hy+4,2.6,P.blue,0);
    Art.circle(ctx,x+7,hy-3,2,P.green,0);
    ctx.globalAlpha=1;
    // nucleo (atras dos olhos)
    Art.circle(ctx,x+face*2,hy+1,6.4,'rgba(125,95,158,.85)',2);

    // olhos grandes de desenho
    const eyeX=x+face*3.2;
    const blink = (Math.floor(t/70)%9===0 && (t%70)<6);
    Art.ellipse(ctx,eyeX-3.6,hy-2,3.2,blink?0.7:4.1,P.cream,2);
    Art.ellipse(ctx,eyeX+3.6,hy-2,3.2,blink?0.7:4.1,P.cream,2);
    if(!blink){
      const look=this.aim==='mouse'? Math.max(-2,Math.min(2,Math.sin(this.aimAngle)*2.4)) : (this.aim==='up'?-2:(this.aim==='down'?2:0));
      Art.circle(ctx,eyeX-3.2+face*0.8,hy-2+look,1.7,P.ink,0);
      Art.circle(ctx,eyeX+4.0+face*0.8,hy-2+look,1.7,P.ink,0);
    }
    // sorriso
    ctx.beginPath();
    ctx.arc(x+face*2.5,hy+5,4,0.15*Math.PI,0.85*Math.PI);
    Art.ink(ctx,2); ctx.stroke();

    // chapeuzinho de cientista (fita)
    ctx.save();
    ctx.translate(x,hy-11);
    ctx.rotate(face*0.12);
    ctx.fillStyle=P.red;
    ctx.beginPath(); ctx.ellipse(0,0,10,3.4,0,0,Math.PI*2); ctx.fill();
    Art.ink(ctx,2.2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(face*2,-4,5.5,4.6,0,0,Math.PI*2);
    ctx.fillStyle=P.red; ctx.fill(); Art.ink(ctx,2.2); ctx.stroke();
    ctx.restore();

    if(this.parryFlash>0){
      ctx.globalAlpha=this.parryFlash/14;
      Art.circle(ctx,x,by,26,'rgba(255,95,162,.5)',0);
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
}
