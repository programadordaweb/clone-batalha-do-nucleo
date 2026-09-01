/* ============================================================
   CLONE! - A Batalha do Nucleo
   Jogo de acao estilo cartoon dos anos 30 sobre CLONAGEM.
   Roda em PC (teclado), celular (botoes na tela) e controle.
   ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const touchUI = document.getElementById('touch');
const rotateUI = document.getElementById('rotate');

/* ---------- TELA SEM BORDA PRETA ----------
   A altura do jogo é sempre 360. A LARGURA acompanha o formato da
   tela do aparelho (dentro de um limite), então o desenho ocupa a
   janela inteira: nada de tarjas pretas nas laterais.               */
const SCALE = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
const stageEl = document.getElementById('stage');
var jogoPronto = false;   // vira true no fim do arquivo (evita usar Game cedo demais)
const W_MIN = 500, W_MAX = 940;      // limites da largura interna

function viewport(){
  const vw = (window.visualViewport && window.visualViewport.width)  || window.innerWidth;
  const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  return {vw:Math.max(1,vw), vh:Math.max(1,vh)};
}

function fitStage(){
  const {vw, vh} = viewport();

  // largura interna = altura fixa x formato da tela (limitada)
  let larg = Math.round(CFG.H * (vw/vh) / 2) * 2;
  larg = Math.max(W_MIN, Math.min(W_MAX, larg));

  if (larg !== CFG.W){
    CFG.W = larg;
    Art.buildGrain(CFG.W, CFG.H);
    if (jogoPronto && Game.boss) Game.boss.reposicionar();
  }

  canvas.width  = CFG.W * SCALE;
  canvas.height = CFG.H * SCALE;
  ctx.setTransform(SCALE,0,0,SCALE,0,0);
  ctx.imageSmoothingEnabled = true;

  // o palco preenche a janela toda mantendo a proporção interna
  let w = vw, h = Math.round(vw * CFG.H / CFG.W);
  if (h > vh){ h = vh; w = Math.round(vh * CFG.W / CFG.H); }
  stageEl.style.width  = w + 'px';
  stageEl.style.height = h + 'px';

  updateOrientation();
}

addEventListener('resize', fitStage);
addEventListener('orientationchange', () => setTimeout(fitStage, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitStage);
document.addEventListener('fullscreenchange', () => setTimeout(fitStage, 60));
document.addEventListener('webkitfullscreenchange', () => setTimeout(fitStage, 60));

/* ---------- deteccao de toque (celular de verdade) ---------- */
const COARSE = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
const IS_TOUCH = COARSE && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

// modo de jogo atual: TOQUE muda os textos de ajuda e liga os botoes na tela
function touchMode(){ return Input.isTouchMode; }

function updateOrientation(){
  const portrait = window.innerHeight > window.innerWidth;
  rotateUI.classList.toggle('hidden', !(IS_TOUCH && portrait && window.innerWidth < 900));
}

/* ---------- TELA CHEIA AUTOMÁTICA ----------
   O navegador só deixa entrar em tela cheia a partir de um toque ou
   tecla do jogador. Então o jogo entra sozinho no PRIMEIRO comando,
   sem precisar de botão. (Instalado no celular já abre em tela cheia.) */
function estaEmTelaCheia(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function entrarTelaCheia(){
  const el = document.documentElement;
  try {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req){ const r = req.call(el); if (r && r.catch) r.catch(()=>{}); }
    if (IS_TOUCH && screen.orientation && screen.orientation.lock){
      const r2 = screen.orientation.lock('landscape');
      if (r2 && r2.catch) r2.catch(()=>{});
    }
  } catch(e){}
  setTimeout(fitStage, 120);
}

function sairTelaCheia(){
  try {
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (ex){ const r = ex.call(document); if (r && r.catch) r.catch(()=>{}); }
  } catch(e){}
  setTimeout(fitStage, 120);
}

function toggleFullscreen(){
  if (estaEmTelaCheia()) sairTelaCheia(); else entrarTelaCheia();
}

let telaCheiaTentada = false;
function telaCheiaAutomatica(){
  if (telaCheiaTentada) return;
  telaCheiaTentada = true;
  if (!estaEmTelaCheia()) entrarTelaCheia();
}
['pointerdown','keydown','touchstart'].forEach(ev =>
  addEventListener(ev, telaCheiaAutomatica, {once:true, capture:true}));

/* ---------- INSTALAR NO CELULAR ---------- */
let promptInstalar = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  promptInstalar = e;
});
addEventListener('appinstalled', () => { promptInstalar = null; });

function instalarJogo(){
  if (!promptInstalar) return false;
  promptInstalar.prompt();
  promptInstalar.userChoice.then(() => { promptInstalar = null; }).catch(()=>{});
  return true;
}

fitStage();

/* ============================================================
   CONTEUDO EDUCATIVO
   ============================================================ */
const CARDS = {
  nucleus: [
    {
      tag:'FASE 1',
      title:'MITOSE: O CLONE NATURAL',
      body:'Toda vez que uma célula se divide por mitose, ela copia o DNA e gera DUAS células-filhas geneticamente idênticas a ela. Isso é uma clonagem natural, e acontece no seu corpo agora mesmo: pele, sangue e intestino se renovam assim.',
      hint:'No jogo: o chefe se divide e cria cópias de si mesmo. Destrua as cópias!'
    },
    {
      tag:'FASE 2',
      title:'DNA: O MANUAL COPIADO',
      body:'O DNA é uma dupla hélice. As bases se ligam sempre em pares: A com T e C com G. Na replicação as fitas se separam e cada uma serve de molde para uma nova fita - por isso a cópia sai igual. Um erro nessa cópia é uma mutação.',
      hint:'No jogo: desvie dos pares de bases que atravessam a tela.'
    },
    {
      tag:'FASE 3',
      title:'DOLLY E A TRANSFERÊNCIA NUCLEAR',
      body:'Em 1996 nasceu Dolly, a ovelha clonada. A técnica (SCNT) retira o núcleo de um óvulo e coloca no lugar o núcleo de uma célula adulta. O embrião formado tem o mesmo DNA do doador - um clone.',
      hint:'No jogo: o chefe cria um CLONE de você. Enfrente a si mesmo!'
    }
  ],
  dolly: [
    {
      tag:'FASE 1',
      title:'DOLLY, A PRIMEIRA DE TODAS',
      body:'Dolly nasceu em 5 de julho de 1996, no Instituto Roslin (Escócia). Foi o primeiro mamífero clonado a partir de uma célula ADULTA. Provou que uma célula já especializada pode voltar a "começar do zero" e formar um animal inteiro.',
      hint:'No jogo: a ovelha pula e sacode o chão. Pule junto para não levar a onda de choque!'
    },
    {
      tag:'FASE 2',
      title:'A MÁQUINA: TRANSFERÊNCIA NUCLEAR',
      body:'Uma micropipeta retira o núcleo de um óvulo (ele fica sem DNA). Outra pipeta injeta o núcleo de uma célula adulta doadora. Um choque elétrico funde as duas partes e o óvulo começa a se dividir como um embrião.',
      hint:'No jogo: fuja da pipeta e passe pelo espaço entre os choques elétricos.'
    },
    {
      tag:'FASE 3',
      title:'277 TENTATIVAS PARA UM CLONE',
      body:'Foram 277 óvulos reconstruídos para nascer UMA Dolly. Clonagem ainda falha muito: a maioria dos embriões não vinga. Dolly teve 6 filhotes normais e morreu em 2003, de uma doença de pulmão causada por um vírus comum em ovelhas.',
      hint:'No jogo: agora é um rebanho inteiro de clones. Sobreviva à debandada!'
    }
  ]
};

const SCIENCE = [
  {
    title:'O QUE É CLONAGEM?',
    body:'Clonagem é produzir um ser vivo (ou uma célula) com o mesmo material genético de outro. O clone não surge da união de dois gametas: ele é cópia do DNA de um único doador.'
  },
  {
    title:'CLONES NATURAIS EXISTEM',
    body:'Gêmeos univitelinos são clones naturais: um mesmo embrião se divide em dois. Bactérias, morangos que se espalham por estolhos e estrelas-do-mar também se multiplicam sem reprodução sexuada.'
  },
  {
    title:'MITOSE x MEIOSE',
    body:'Mitose: 1 célula gera 2 idênticas, com o mesmo número de cromossomos - crescimento e reparo. Meiose: gera 4 células com metade dos cromossomos (gametas) e MISTURA os genes - por isso irmãos não são iguais.'
  },
  {
    title:'COMO DOLLY FOI FEITA',
    body:'1) Retira-se o núcleo de um óvulo (fica sem DNA). 2) Insere-se o núcleo de uma célula da glândula mamária de uma ovelha adulta. 3) Um choque elétrico funde as células e inicia a divisão. 4) O embrião é implantado numa barriga de aluguel. Dolly nasceu em 5 de julho de 1996.'
  },
  {
    title:'REPRODUTIVA x TERAPÊUTICA',
    topics:[
      ['A DIFERENÇA',
       'A reprodutiva quer formar um indivíduo. A terapêutica para no 5º dia e só retira as células-tronco, que viram qualquer tecido do corpo.'],
      ['POR QUE AJUDA: TECIDO SEM REJEIÇÃO',
       'O tecido novo tem o mesmo DNA do paciente: o corpo não rejeita e ele não precisa de imunossupressor a vida toda. Hoje se usa células iPS (Nobel 2012), sem embrião.'],
      ['EXEMPLOS DE VERDADE',
       'China, 2024: mulher com diabetes tipo 1 recebeu ilhotas feitas das PRÓPRIAS células e ficou sem insulina (revista Cell). Japão, 2025: 7 pacientes com Parkinson receberam neurônios de iPS, que produziram dopamina (revista Nature).'],
      ['PORCOS CLONADOS PARA TRANSPLANTE',
       'Porcos são editados e depois CLONADOS pela técnica da Dolly. Em 2025 começaram os testes clínicos com rins desses porcos em pacientes.']
    ]
  },
  {
    title:'CLONE NÃO É CÓPIA IDÊNTICA',
    body:'Mesmo DNA não significa mesma pessoa. Ambiente, alimentação, experiências e a epigenética (marcas químicas que ligam e desligam genes) mudam aparência e comportamento. Até as manchas de um gato clonado saem diferentes.'
  },
  {
    title:'ÉTICA E LEI',
    topics:[
      ['O QUE É ÉTICA',
       'É a reflexão sobre o certo e o errado. A moral são os costumes de um grupo; a lei obriga. A bioética aplica isso à saúde com 4 princípios: autonomia, beneficência, não maleficência e justiça.'],
      ['POR QUE HUMANOS NÃO E ANIMAIS SIM',
       'Clonar uma pessoa fere a dignidade (ela viraria um produto), o clone não pode consentir e a técnica ainda falha muito. Em animais é permitido, mas só com aprovação da comissão de ética (CEUA) e sem maus-tratos - Lei 11.794/2008.'],
      ['A LEI BRASILEIRA',
       'Lei 11.105/2005 (Biossegurança), art. 6º: proíbe a clonagem humana, tanto a reprodutiva quanto a terapêutica. A pena é de 2 a 5 anos de reclusão (art. 26). ONU (2005) e UNESCO (1997) também condenam clonar pessoas.'],
      ['COMO REGULAM AS CÉLULAS-TRONCO',
       'Art. 5º: só embriões que sobraram da fertilização in vitro, inviáveis ou congelados há 3 anos ou mais, com autorização dos pais, aprovação do comitê de ética (CEP) e proibida a venda. O STF confirmou a regra em 2008. Hoje as células iPS (Nobel 2012) fazem o mesmo sem usar embriões.']
    ]
  },
  {
    title:'DOLLY, A OVELHA FAMOSA',
    body:'O nome veio da cantora Dolly Parton, porque a célula usada era da glândula mamária. Ela viveu 6 anos e meio no Instituto Roslin, teve 6 filhotes e hoje está empalhada no Museu Nacional da Escócia. Sua morte foi por uma infecção de pulmão comum em ovelhas presas, e não por "envelhecimento de clone".'
  },
  {
    title:'POR QUE CLONAR É DIFÍCIL',
    body:'O núcleo adulto precisa ser "reprogramado" para agir como o de um embrião. Isso quase nunca dá certo: no caso da Dolly foram 277 óvulos reconstruídos, 29 embriões e 1 nascimento. Por isso a clonagem é cara, demorada e levanta questões de bem-estar animal.'
  },
  {
    title:'PARA QUE SERVE',
    body:'Clonagem ajuda a multiplicar animais de interesse, produzir remédios (como insulina em bactérias clonadas), preservar espécies ameaçadas e pesquisar tratamentos. Também levanta debates sobre bem-estar animal e limites da ciência.'
  }
];

/* ============================================================
   CRÉDITOS E FONTES
   ============================================================ */
const CREDITS = [
  {t:'gap',  h:40},
  {t:'title',s:'CLONE!'},
  {t:'sub',  s:'A BATALHA DO NÚCLEO'},
  {t:'gap',  h:26},
  {t:'head', s:'CRIAÇÃO'},
  {t:'name', s:'Gustavo Bevilaqua e grupo'},
  {t:'gap',  h:22},
  {t:'head', s:'TEMA'},
  {t:'name', s:'Clonagem: mitose, DNA e a ovelha Dolly'},
  {t:'gap',  h:22},
  {t:'head', s:'CHEFÕES'},
  {t:'name', s:'NUCLEUS-9, o Clone Mestre'},
  {t:'name', s:'DOLLY-96, a Ovelha Replicante'},
  {t:'gap',  h:22},
  {t:'head', s:'FEITO COM'},
  {t:'item', s:'HTML5 Canvas + JavaScript puro'},
  {t:'item', s:'Desenhos, música e efeitos gerados por código'},
  {t:'gap',  h:30},
  {t:'head', s:'FONTES DAS INFORMAÇÕES'},
  {t:'item', s:'WILMUT, I. et al. "Viable offspring derived from fetal and'},
  {t:'item', s:'adult mammalian cells". Nature, v. 385, p. 810-813, 1997.'},
  {t:'gap',  h:10},
  {t:'item', s:'THE ROSLIN INSTITUTE (Universidade de Edimburgo).'},
  {t:'item', s:'"The Life of Dolly" - roslin.ed.ac.uk/public-interest/dolly-the-sheep'},
  {t:'gap',  h:10},
  {t:'item', s:'NATIONAL HUMAN GENOME RESEARCH INSTITUTE (NIH, EUA).'},
  {t:'item', s:'"Cloning Fact Sheet" - genome.gov'},
  {t:'gap',  h:10},
  {t:'item', s:'NATIONAL MUSEUMS SCOTLAND. "Dolly the sheep" - nms.ac.uk'},
  {t:'gap',  h:10},
  {t:'item', s:'BRASIL. Lei nº 11.105, de 24 de março de 2005'},
  {t:'item', s:'(Lei de Biossegurança) - planalto.gov.br'},
  {t:'gap',  h:10},
  {t:'item', s:'BRASIL. Lei nº 11.794/2008 (uso científico de animais)'},
  {t:'item', s:'e Lei nº 9.605/1998, art. 32 - planalto.gov.br'},
  {t:'gap',  h:10},
  {t:'item', s:'STF. ADI 3510/DF, rel. Min. Carlos Ayres Britto, 29/05/2008'},
  {t:'item', s:'(libera a pesquisa com células-tronco) - portal.stf.jus.br'},
  {t:'gap',  h:10},
  {t:'item', s:'UNESCO. Declaração Universal sobre o Genoma Humano (1997), art. 11.'},
  {t:'item', s:'ONU. Declaração sobre a Clonagem Humana (2005).'},
  {t:'gap',  h:10},
  {t:'item', s:'BEAUCHAMP, T.; CHILDRESS, J. "Princípios de Ética Biomédica".'},
  {t:'gap',  h:10},
  {t:'item', s:'WANG, S. et al. Ilhotas de células-tronco do próprio paciente'},
  {t:'item', s:'em diabetes tipo 1. Cell, 2024 (Universidade de Pequim).'},
  {t:'gap',  h:10},
  {t:'item', s:'SAWAMOTO, N.; TAKAHASHI, J. et al. Ensaio de células iPS para'},
  {t:'item', s:'Parkinson. Nature, v. 641, 2025 (Universidade de Kyoto).'},
  {t:'gap',  h:10},
  {t:'item', s:'NYU LANGONE / FDA (2025). Primeiros ensaios clínicos com rins'},
  {t:'item', s:'de porcos geneticamente editados - nyulangone.org'},
  {t:'gap',  h:10},
  {t:'item', s:'ALBERTS, B. et al. "Biologia Molecular da Célula".'},
  {t:'item', s:'Porto Alegre: Artmed. (mitose, DNA e replicação)'},
  {t:'gap',  h:10},
  {t:'item', s:'AMABIS, J. M.; MARTHO, G. R. "Biologia Moderna".'},
  {t:'item', s:'São Paulo: Moderna. (mitose x meiose, reprodução)'},
  {t:'gap',  h:34},
  {t:'head', s:'OBRIGADO POR JOGAR!'},
  {t:'gap',  h:20},
  {t:'item', s:'"Clonar copia o DNA - não copia a história de vida."'},
  {t:'gap',  h:60}
];

/* ============================================================
   ESTADO DO JOGO
   ============================================================ */
const Game = {
  state:'title',
  prevState:null,
  t:0,
  shake:0,
  hitStop:0,
  slowmo:0,
  superBeam:0,
  superAngle:0,
  sciFrom:'title',
  creditsFrom:'title',
  creditsY:0,
  resetIndex:0,
  resetToast:0,
  hardMode:false,
  bossKind:'nucleus',
  beaten:{nucleus:false, dolly:false},
  bests:{nucleus:null, dolly:null},
  selIndex:0,
  shopIndex:0,
  rewardPoint:false,
  player:new Player(),
  boss:null,
  hazards:[],
  minions:[],
  shadow:null,
  cardIndex:0,
  cardT:0,
  menuIndex:0,
  sciIndex:0,
  introT:0,
  endT:0,
  battleTime:0,
  parries:0,
  hitsTaken:0,
  best:null,
  flashWhite:0,
  menuHit:[],
  win:false,
  devSeen:0,
  devToast:0,
  devName:''
};

try {
  Game.bests.nucleus = localStorage.getItem('clone_best_nucleus');
  Game.bests.dolly   = localStorage.getItem('clone_best_dolly');
  Game.beaten.nucleus = !!Game.bests.nucleus;
  Game.beaten.dolly   = !!Game.bests.dolly;
  Game.hardMode = localStorage.getItem('clone_hard') === '1';
} catch(e){}

function saveBest(){
  try {
    const k = Game.bossKind;
    const cur = Game.battleTime;
    Game.beaten[k] = true;
    if(!Game.bests[k] || cur < parseFloat(Game.bests[k])){
      Game.bests[k] = String(cur);
      localStorage.setItem('clone_best_' + k, Game.bests[k]);
    }
  } catch(e){}
}

function fmtTime(fr){
  const s = fr/60;
  const m = Math.floor(s/60);
  const r = (s%60);
  return (m>0? m+'m ' : '') + r.toFixed(1) + 's';
}

/* ============================================================
   FUNCOES DE PARTIDA
   ============================================================ */
Game.startBattle = function(kind){
  if(kind) this.bossKind = kind;
  this.player.reset();
  this.player.maxHp = this.hardMode ? 3 : 4;
  this.player.hp = this.player.maxHp;
  this.boss = new Boss(this.bossKind);
  this.hazards.length=0;
  this.minions.length=0;
  this.shadow=null;
  FX.clear();
  this.battleTime=0; this.parries=0; this.hitsTaken=0;
  this.superBeam=0; this.shake=0; this.hitStop=0; this.slowmo=0;
  this.win=false;
  this.cardIndex=0; this.cardT=0;
  this.state='card';           // cartao da fase 1 antes de comecar
  Sound.play('battle',1);
};

Game.showCard = function(i){
  this.cardIndex=i; this.cardT=0;
  this.prevState=this.state;
  this.state='card';
};

Game.onBossDying = function(){
  this.state='dying';
  this.endT=170;
  this.hazards.length=0;
  this.minions.length=0;
  this.shadow=null;
  Sound.stop();
  Sound.sfx.boom();
  this.shake=20;
};

Game.tryParry = function(p){
  let best=null, bd=1e9;
  for(const h of this.hazards){
    if(!h.pink||h.dead) continue;
    const d=Math.hypot(h.x-p.cx,h.y-p.cy);
    if(d<44 && d<bd){ bd=d; best=h; }
  }
  if(!best) return false;
  best.dead=true;
  p.vy=-9.2; p.airDash=false;
  p.addSuper(22);
  p.parryFlash=14;
  this.parries++;
  this.hitStop=6; this.slowmo=10;
  Sound.sfx.parry();
  Input.rumble(90,.5,.4);
  FX.ring(best.x,best.y,Art.PAL.pinkHot,26);
  FX.burst(best.x,best.y,14,Art.PAL.pinkHot,4,4,'star');
  this.floatText('APARADO!',best.x,best.y-16,Art.PAL.pinkHot);
  return true;
};

/* textos flutuantes */
Game.texts=[];
Game.floatText=function(str,x,y,color){
  this.texts.push({str,x,y,color,life:46,vy:-1.1});
};

/* ============================================================
   COLISOES
   ============================================================ */
function overlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
function circleHit(x,y,r,box){
  const cx=Math.max(box.x,Math.min(x,box.x+box.w));
  const cy=Math.max(box.y,Math.min(y,box.y+box.h));
  return (x-cx)*(x-cx)+(y-cy)*(y-cy) <= r*r;
}

/* ============================================================
   ATUALIZACAO DA BATALHA
   ============================================================ */
function updateBattle(){
  const g=Game, p=g.player, b=g.boss;

  if(g.hitStop>0){ g.hitStop--; return; }

  g.battleTime++;

  p.update(g);
  b.update(g);

  for(const m of g.minions) m.update(g);
  g.minions=g.minions.filter(m=>!m.dead);

  if(g.shadow){ g.shadow.update(g); if(g.shadow.dead){ g.shadow=null; } }

  for(const h of g.hazards) h.update(g);
  g.hazards=g.hazards.filter(h=>!h.dead);

  /* ---- super do jogador: feixe na direção da mira ---- */
  if(g.superBeam>0){
    g.superBeam--;
    const ox=p.x, oy=p.cy;
    const ang=g.superAngle;
    const dx=Math.cos(ang), dy=Math.sin(ang);
    const R=24, LEN=780;

    // o feixe é testado em pedacinhos ao longo da linha
    const beamHits=(box)=>{
      for(let d=0; d<=LEN; d+=16){
        if(circleHit(ox+dx*d, oy+dy*d, R, box)) return true;
      }
      return false;
    };

    if(b.state==='fight' && beamHits(b.hitbox())) b.hurt(0.85,g);
    for(const m of g.minions) if(beamHits(m.hitbox())) m.hurt(0.8);
    if(g.shadow && beamHits(g.shadow.hitbox())) g.shadow.hurt(0.8);

    // projéteis somem se estiverem em cima da linha do feixe
    for(const h of g.hazards){
      const rx=h.x-ox, ry=h.y-oy;
      const proj=rx*dx+ry*dy;
      if(proj<0 || proj>LEN) continue;
      const px=ox+dx*proj, py=oy+dy*proj;
      if(Math.hypot(h.x-px,h.y-py) < R+h.r){
        h.dead=true; FX.burst(h.x,h.y,4,Art.PAL.yellow,3,3);
      }
    }
    if(g.superBeam%6===0){
      const d=80+Math.random()*260;
      FX.burst(ox+dx*d, oy+dy*d, 3, Art.PAL.pinkHot, 3, 4);
    }
  }

  /* ---- tiros do jogador ---- */
  for(const s of p.shots){
    if(s.dead) continue;
    if(b.state==='fight' && circleHit(s.x,s.y,s.r,b.hitbox())){
      b.hurt(s.dmg,g);
      s.dead=true;
      p.addSuper(1.6);
      FX.burst(s.x,s.y,4,Art.PAL.yellow,2.5,3);
      continue;
    }
    let hit=false;
    for(const m of g.minions){
      if(circleHit(s.x,s.y,s.r,m.hitbox())){ m.hurt(s.dmg); s.dead=true; p.addSuper(2.2); hit=true; break; }
    }
    if(hit) continue;
    if(g.shadow && circleHit(s.x,s.y,s.r,g.shadow.hitbox())){
      g.shadow.hurt(s.dmg); s.dead=true; p.addSuper(2); continue;
    }
    for(const h of g.hazards){
      if(h.hp>0 && !h.dead && circleHit(s.x,s.y,s.r,h.hitbox())){
        h.hurt(s.dmg); s.dead=true; p.addSuper(1.4); break;
      }
    }
  }

  /* ---- dano no jogador ---- */
  if(!p.dead && p.superT<=0){
    const pb=p.hitbox();
    for(const h of g.hazards){
      if(h.dead) continue;
      if(circleHit(h.x,h.y,h.r*0.85,pb)){
        if(p.damage(h.x)){ g.hitsTaken++; if(h.type!=='enzyme') h.dead=true; }
        break;
      }
    }
    if(b.state==='fight' && overlap(pb,b.hitbox()) && !p.dead){
      if(p.damage(b.x)) g.hitsTaken++;
    }
    for(const m of g.minions){
      if(overlap(pb,m.hitbox()) && !p.dead){ if(p.damage(m.x)) g.hitsTaken++; break; }
    }
    if(g.shadow && overlap(pb,g.shadow.hitbox()) && !p.dead){
      if(p.damage(g.shadow.x)) g.hitsTaken++;
    }
    if(!p.dead){
      for(const bm of b.beams){
        if(pb.y < bm.y+bm.h/2+3 && pb.y+pb.h > bm.y-bm.h/2-3){
          if(p.damage(p.x-1)) g.hitsTaken++;
          break;
        }
      }
    }
    if(!p.dead){
      for(const bm of b.vbeams){
        if(pb.x < bm.x+bm.w/2+3 && pb.x+pb.w > bm.x-bm.w/2-3){
          if(p.damage(bm.x)) g.hitsTaken++;
          break;
        }
      }
    }
  }

  if(p.dead && p.y>CFG.H+60 && g.state==='battle'){
    g.state='gameover'; g.endT=0;
    Sound.stop(); Sound.sfx.lose();
  }

  if(g.shake>0) g.shake*=0.88;
  if(g.slowmo>0) g.slowmo--;
  if(g.flashWhite>0) g.flashWhite--;

  for(const t of g.texts){ t.y+=t.vy; t.life--; }
  g.texts=g.texts.filter(t=>t.life>0);

  FX.update();

  // intensidade da musica pela vida do chefe
  if(g.battleTime%60===0){
    const k=b.totalNow()/b.totalMax();
    Sound.setIntensity(k<0.33?1.6:(k<0.66?1.25:1));
  }
}

/* ============================================================
   CENARIO
   ============================================================ */
function drawBackground(){
  const P=Art.PAL, t=Game.t;

  // ceu de papel
  const grd=ctx.createLinearGradient(0,0,0,CFG.H);
  grd.addColorStop(0,'#f6e9c6');
  grd.addColorStop(0.55,'#ecd9ab');
  grd.addColorStop(1,'#dcc28c');
  ctx.fillStyle=grd;
  ctx.fillRect(0,0,CFG.W,CFG.H);

  // raios de sol girando
  Art.sunburst(ctx,CFG.W/2,150,420,20,t*0.0018,'#fff6dd',0.28);

  // vidraria de laboratorio ao fundo (silhuetas)
  ctx.save();
  ctx.globalAlpha=0.16;
  ctx.fillStyle=P.ink;
  // erlenmeyer
  const flask=(x,y,s)=>{
    ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
    ctx.beginPath();
    ctx.moveTo(-6,-40); ctx.lineTo(6,-40); ctx.lineTo(6,-16);
    ctx.lineTo(24,16); ctx.quadraticCurveTo(28,26,16,26);
    ctx.lineTo(-16,26); ctx.quadraticCurveTo(-28,26,-24,16);
    ctx.lineTo(-6,-16); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  flask(60,244,1.5); flask(120,250,1.0); flask(560,246,1.3);
  // microscopio
  ctx.save(); ctx.translate(300,250); ctx.scale(1.5,1.5);
  ctx.beginPath();
  ctx.moveTo(-20,20); ctx.lineTo(20,20); ctx.lineTo(16,10); ctx.lineTo(-16,10); ctx.closePath(); ctx.fill();
  ctx.fillRect(-4,-30,8,42);
  ctx.save(); ctx.translate(0,-30); ctx.rotate(-0.3); ctx.fillRect(-3,-6,26,7); ctx.restore();
  ctx.fillRect(-16,-4,32,4);
  ctx.restore();
  ctx.restore();

  // celulas flutuando ao fundo
  ctx.save();
  for(let i=0;i<9;i++){
    const sp=0.25+ (i%3)*0.12;
    const x=((i*97 + t*sp) % (CFG.W+120)) - 60;
    const y=50+ ((i*53)%150) + Math.sin(t*0.01+i)*12;
    ctx.globalAlpha=0.18;
    Art.blob(ctx,x,y,16+(i%3)*7,15+(i%3)*6,P.blue,2,10,4,i*3);
    Art.circle(ctx,x,y,6,P.purple,0);
  }
  ctx.restore();

  // placa de petri (chao)
  const gy=CFG.GROUND;
  ctx.fillStyle='#cdb27c';
  ctx.fillRect(0,gy,CFG.W,CFG.H-gy);
  ctx.fillStyle='#bfa26c';
  ctx.beginPath();
  ctx.moveTo(0,gy);
  for(let x=0;x<=CFG.W;x+=20){
    ctx.lineTo(x,gy+Math.sin(x*0.05+t*0.01)*2.5);
  }
  ctx.lineTo(CFG.W,CFG.H); ctx.lineTo(0,CFG.H); ctx.closePath(); ctx.fill();
  Art.ink(ctx,4);
  ctx.beginPath();
  ctx.moveTo(0,gy);
  for(let x=0;x<=CFG.W;x+=20) ctx.lineTo(x,gy+Math.sin(x*0.05+t*0.01)*2.5);
  ctx.stroke();

  // colonias de bacterias no agar
  ctx.save(); ctx.globalAlpha=0.30;
  for(let i=0;i<26;i++){
    const x=(i*77)%CFG.W, y=gy+12+((i*37)%40);
    Art.circle(ctx,x,y,2+ (i%3),Art.PAL.greenDk,0);
  }
  ctx.restore();

  // bolhas subindo
  ctx.save();
  for(let i=0;i<14;i++){
    const y=CFG.H - ((t*0.7 + i*41) % (CFG.H+40));
    const x=(i*57+Math.sin((t*0.02)+i)*18)%CFG.W;
    ctx.globalAlpha=0.22;
    Art.circle(ctx,x,y,3+(i%4),'#ffffff',1.4);
  }
  ctx.restore();
}

/* ============================================================
   HUD
   ============================================================ */
function drawHeart(x,y,full,scale){
  ctx.save();
  ctx.translate(x,y); ctx.scale(scale||1,scale||1);
  ctx.beginPath();
  ctx.moveTo(0,4);
  ctx.bezierCurveTo(-9,-4,-6,-11,0,-6);
  ctx.bezierCurveTo(6,-11,9,-4,0,4);
  ctx.closePath();
  ctx.fillStyle= full? Art.PAL.red : 'rgba(60,45,35,.35)';
  ctx.fill();
  Art.ink(ctx,2.4); ctx.stroke();
  ctx.restore();
}

function drawHUD(){
  const g=Game,p=g.player,b=g.boss;

  // vidas
  for(let i=0;i<p.maxHp;i++){
    const pulse = (i===p.hp-1 && p.hp<=1) ? 1+Math.sin(g.t*0.3)*0.14 : 1;
    drawHeart(24+i*24,26,i<p.hp,pulse);
  }

  // medidor de super
  const sx=22, sy=44, sw=96, sh=11;
  ctx.save();
  ctx.fillStyle='rgba(28,20,16,.30)';
  ctx.fillRect(sx,sy,sw,sh);
  const k=p.super/100;
  ctx.fillStyle= k>=1 ? (Math.floor(g.t/5)%2? Art.PAL.pinkHot : Art.PAL.yellow) : Art.PAL.orange;
  ctx.fillRect(sx,sy,sw*k,sh);
  Art.ink(ctx,2.2); ctx.strokeRect(sx,sy,sw,sh);
  Art.text(ctx, k>=1?'SUPER PRONTO!':'SUPER', sx+sw/2, sy+sh/2+1,
    {size:9,color:k>=1?Art.PAL.cream:'#f0e0bb',stroke:2.5,align:'center'});
  ctx.restore();

  // arma equipada
  Art.text(ctx,Shop.weapon.name,22,66,{size:9,color:Shop.weapon.color,stroke:2.5,align:'left'});

  // barra do chefe
  const bw=CFG.W-160, bx=80, by=CFG.H-22;
  ctx.save();
  ctx.fillStyle='rgba(28,20,16,.35)';
  ctx.fillRect(bx,by,bw,13);
  const total=b.totalNow()/b.totalMax();
  const grd=ctx.createLinearGradient(bx,0,bx+bw,0);
  grd.addColorStop(0,Art.PAL.red);
  grd.addColorStop(0.5,Art.PAL.orange);
  grd.addColorStop(1,Art.PAL.yellow);
  ctx.fillStyle=grd;
  ctx.fillRect(bx,by,bw*total,13);
  // divisoes de fase
  ctx.strokeStyle='rgba(28,20,16,.6)'; ctx.lineWidth=2;
  for(let i=1;i<b.phases.length;i++){
    const acc=b.phases.slice(0,i).reduce((a,c)=>a+c,0)/b.totalMax();
    const x=bx+bw*(1-acc);
    ctx.beginPath(); ctx.moveTo(x,by); ctx.lineTo(x,by+13); ctx.stroke();
  }
  Art.ink(ctx,2.6); ctx.strokeRect(bx,by,bw,13);
  Art.text(ctx,b.name,bx+bw/2,by-9,{size:11,color:Art.PAL.cream,stroke:3});
  ctx.restore();

  // nome do ataque (fica divertido e ensina)
  if(b.atk && b.state==='fight'){
    const names={
      chromo:'CROMOSSOMOS EM X', mitose:'MITOSE!', cytoRain:'CHUVA DE CITOPLASMA',
      swoop:'INVESTIDA CELULAR', helix:'ONDA DE BASES A-T-C-G', enzimas:'ENZIMAS DE RESTRIÇÃO',
      laser:'FEIXE DE REPLICAÇÃO', pinkBurst:'EXPLOSÃO DE PLASMÍDEOS',
      clone:'TRANSFERÊNCIA NUCLEAR!', rings:'ANÉIS DE CLONAGEM',
      crossfire:'FOGO CRUZADO GENÉTICO', stormRain:'TEMPESTADE DE CULTURA',
      laVolley:'RAJADA DE LÃ', salto:'PULO SÍSMICO', rebanho:'REBANHO CLONADO',
      balido:'BALIDO DE ÓVULOS', pipeta:'MICROPIPETA!', oocitos:'CHUVA DE ÓVULOS',
      choque:'FUSÃO ELÉTRICA', placas:'PLACAS DE PETRI', estouro:'DEBANDADA DE CLONES',
      chuvaLa:'TEMPESTADE DE LÃ', megaBalido:'MÉÉÉGA BALIDO!', clonesDolly:'CÓPIAS DA DOLLY'
    };
    const n=names[b.atk];
    if(n && b.atkT<70){
      const a=Math.min(1,b.atkT/10)*Math.min(1,(70-b.atkT)/14);
      ctx.save(); ctx.globalAlpha=a;
      Art.text(ctx,n,CFG.W/2,52,{size:15,color:Art.PAL.cream,stroke:4,rot:-0.02});
      ctx.restore();
    }
  }
}

/* ============================================================
   DESENHO DA BATALHA
   ============================================================ */
function drawBattle(showHud){
  const g=Game,p=g.player,b=g.boss;
  if(showHud===undefined) showHud=true;

  ctx.save();
  if(g.shake>0.4){
    ctx.translate((Math.random()-0.5)*g.shake,(Math.random()-0.5)*g.shake);
  }

  drawBackground();

  b.draw(ctx,g);
  for(const m of g.minions) m.draw(ctx);
  if(g.shadow) g.shadow.draw(ctx);
  for(const h of g.hazards) h.draw(ctx);

  FX.draw(ctx);
  for(const s of p.shots) s.draw(ctx);
  p.draw(ctx);

  // raio super (sai na direção em que o jogador está mirando)
  if(g.superBeam>0){
    const k=g.superBeam/70;
    const h=52*Math.min(1,k*2.4)*(1+Math.sin(g.t*0.6)*0.06);
    const LEN=780;
    ctx.save();
    ctx.translate(p.x, p.cy);
    ctx.rotate(g.superAngle);
    ctx.globalAlpha=0.9;
    const grd=ctx.createLinearGradient(0,0,LEN,0);
    grd.addColorStop(0,'rgba(255,250,225,1)');
    grd.addColorStop(0.35,'rgba(255,60,140,.95)');
    grd.addColorStop(1,'rgba(110,50,155,.85)');
    ctx.fillStyle=grd;
    ctx.fillRect(0, -h/2, LEN, h);
    ctx.fillStyle='rgba(255,255,255,.95)';
    ctx.fillRect(0, -h/6, LEN, h/3);
    ctx.strokeStyle=Art.PAL.ink; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,-h/2); ctx.lineTo(LEN,-h/2);
    ctx.moveTo(0, h/2); ctx.lineTo(LEN, h/2);
    ctx.stroke();
    // hélices girando dentro do raio
    ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=3;
    for(let s2=0;s2<2;s2++){
      ctx.beginPath();
      for(let x=0;x<LEN;x+=8){
        const yy=Math.sin(x*0.06 - g.t*0.25 + s2*Math.PI)*(h*0.32);
        x===0?ctx.moveTo(x,yy):ctx.lineTo(x,yy);
      }
      ctx.stroke();
    }
    // bocal do canhão
    ctx.globalAlpha=1;
    Art.circle(ctx,0,0,h*0.42,'rgba(255,255,255,.95)',3);
    ctx.restore();
    Art.text(ctx,'MITOSE REVERSA!',CFG.W/2,86,{size:18,color:Art.PAL.pinkHot,stroke:4,rot:-0.03});
  }

  // textos flutuantes
  for(const t of g.texts){
    ctx.save(); ctx.globalAlpha=Math.min(1,t.life/16);
    Art.text(ctx,t.str,t.x,t.y,{size:13,color:t.color,stroke:3});
    ctx.restore();
  }

  // mira do mouse (PC)
  if(Input.usingMouse && !p.dead){
    const mx=Input.mouse.x, my=Input.mouse.y;
    ctx.save();
    ctx.globalAlpha=.9;
    ctx.strokeStyle=Art.PAL.ink; ctx.lineWidth=3.4;
    ctx.beginPath();
    ctx.arc(mx,my,8,0,Math.PI*2);
    ctx.moveTo(mx-13,my); ctx.lineTo(mx-4,my);
    ctx.moveTo(mx+4,my);  ctx.lineTo(mx+13,my);
    ctx.moveTo(mx,my-13); ctx.lineTo(mx,my-4);
    ctx.moveTo(mx,my+4);  ctx.lineTo(mx,my+13);
    ctx.stroke();
    ctx.strokeStyle=Art.PAL.pinkHot; ctx.lineWidth=1.6;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  if(showHud) drawHUD();

  if(g.flashWhite>0){
    ctx.save();
    ctx.globalAlpha=g.flashWhite/12;
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.restore();
  }
}

/* ============================================================
   TELAS
   ============================================================ */
function drawTitle(){
  const t=Game.t;
  drawBackground();

  // faixa escura
  ctx.save();
  ctx.globalAlpha=.18; ctx.fillStyle=Art.PAL.ink;
  ctx.fillRect(0,0,CFG.W,CFG.H);
  ctx.restore();

  Art.sunburst(ctx,CFG.W/2,110,300,18,-t*0.004,'#fff6dd',0.30);

  // titulo
  const bob=Math.sin(t*0.05)*4;
  ctx.save();
  ctx.translate(CFG.W/2,86+bob);
  ctx.rotate(-0.03);
  Art.text(ctx,'CLONE!',0,0,{size:64,color:Art.PAL.yellow,stroke:8,shadow:'rgba(28,20,16,.45)'});
  Art.text(ctx,'CLONE!',0,-3,{size:64,color:Art.PAL.cream,stroke:0});
  ctx.restore();

  Art.ribbon(ctx,CFG.W/2,132,300,26,Art.PAL.red);
  Art.text(ctx,'A BATALHA DO NÚCLEO',CFG.W/2,132,{size:15,color:Art.PAL.cream,stroke:3});

  // duas celulinhas dancando
  const dance=(x,f)=>{
    ctx.save();
    ctx.translate(x,232+Math.sin(t*0.09+ (f>0?0:1))*5);
    ctx.rotate(Math.sin(t*0.06+(f>0?0:1.5))*0.12);
    Art.blob(ctx,0,0,20,19,'rgba(150,205,225,.9)',3,12,4,x);
    Art.circle(ctx,0,1,9,'rgba(125,95,158,.9)',2.4);
    Art.ellipse(ctx,-5,-3,3.4,4,Art.PAL.cream,2);
    Art.ellipse(ctx, 5,-3,3.4,4,Art.PAL.cream,2);
    Art.circle(ctx,-5+f,-2,1.7,Art.PAL.ink,0);
    Art.circle(ctx, 5+f,-2,1.7,Art.PAL.ink,0);
    Art.ink(ctx,2);
    ctx.beginPath(); ctx.arc(0,5,5,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
    ctx.restore();
  };
  dance(78,1); dance(CFG.W-78,-1);

  // menu
  const items=[
    'JOGAR',
    'COMO JOGAR',
    'CIÊNCIA DA CLONAGEM',
    'DIFICULDADE: ' + (Game.hardMode?'CIENTISTA':'ESTAGIÁRIO'),
    'TELA CHEIA',
    'SOM: ' + (Sound.muted?'OFF':'ON'),
    'CRÉDITOS E FONTES',
    'APAGAR PROGRESSO'
  ];
  Game.menuHit=[];
  const y0=156;
  items.forEach((it,i)=>{
    const y=y0+i*22;
    const sel=i===Game.menuIndex;
    const w=Art.measure(ctx,it,sel?19:16)+40;
    Game.menuHit.push({x:CFG.W/2-w/2,y:y-11,w,h:22,i});
    if(sel){
      ctx.save();
      ctx.globalAlpha=.85;
      Art.ribbon(ctx,CFG.W/2,y,w,22,Art.PAL.blueDk);
      ctx.restore();
    }
    const perigo = i===items.length-1;
    Art.text(ctx,it,CFG.W/2,y,{
      size:sel?17:14,
      color:sel?Art.PAL.cream:(perigo?'#8f2a1c':'#3a2c22'),
      stroke:sel?3.5:0
    });
  });

  // botao de instalar no celular (so aparece se o navegador oferecer)
  if(promptInstalar){
    const txt='INSTALAR NO CELULAR';
    const w=Art.measure(ctx,txt,11)+34;
    const bx=14+w/2, by=26;
    Game.menuHit.push({x:bx-w/2,y:by-13,w,h:26,i:-1});
    ctx.save();
    ctx.translate(0,Math.sin(Game.t*0.09)*1.5);
    Art.ribbon(ctx,bx,by,w,24,Art.PAL.greenDk);
    Art.text(ctx,txt,bx,by,{size:11,color:Art.PAL.cream,stroke:2.5});
    ctx.restore();
  }

  // aviso depois de apagar
  if(Game.resetToast>0){
    Game.resetToast--;
    ctx.save();
    ctx.globalAlpha=Math.min(1,Game.resetToast/25);
    const msg='PROGRESSO APAGADO! COMEÇANDO DO ZERO.';
    const w=Art.measure(ctx,msg,12)+28;
    ctx.fillStyle='rgba(28,20,16,.85)';
    ctx.fillRect(CFG.W/2-w/2,CFG.H-30,w,22);
    Art.ink(ctx,2.4); ctx.strokeRect(CFG.W/2-w/2,CFG.H-30,w,22);
    Art.text(ctx,msg,CFG.W/2,CFG.H-19,{size:12,color:Art.PAL.yellow,stroke:0});
    ctx.restore();
  }

  if(Game.resetToast<=0){
    const hint = touchMode() ? 'TOQUE NA OPÇÃO PARA ESCOLHER'
                             : 'SETAS ESCOLHEM  -  ENTER CONFIRMA  -  MOUSE: CLIQUE';
    Art.text(ctx,hint,CFG.W/2,CFG.H-16,{size:11,color:'#4a382b',stroke:0});
  }
}

/* ---------------- APAGAR PROGRESSO ---------------- */
function apagarProgresso(){
  try {
    ['clone_best_nucleus','clone_best_dolly','clone_points',
     'clone_owned','clone_weapon','clone_hard'].forEach(k => localStorage.removeItem(k));
  } catch(e){}

  Game.bests  = {nucleus:null, dolly:null};
  Game.beaten = {nucleus:false, dolly:false};
  Game.hardMode = false;

  Shop.points = 0;
  Shop.owned = ['plasma'];
  Shop.equipped = 'plasma';
  Shop.save();

  Game.player.reset();
  Game.boss = null;
  Game.hazards.length = 0;
  Game.minions.length = 0;
  Game.shadow = null;
  Game.rewardPoint = false;
  FX.clear();
  WorldMap.reset();

  Game.resetToast = 200;
  Game.state = 'title';
  Game.menuIndex = 0;
  Sound.sfx.boom();
  FX.burst(CFG.W/2, CFG.H/2, 30, Art.PAL.red, 5, 4, 'star');
}

function drawReset(){
  const P=Art.PAL, t=Game.t;
  drawTitle();
  ctx.save(); ctx.globalAlpha=.68; ctx.fillStyle=P.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  Art.cardFrame(ctx,90,84,CFG.W-180,180,P.paper);
  Art.ribbon(ctx,CFG.W/2,96,300,26,P.red);
  Art.text(ctx,'APAGAR TODO O PROGRESSO?',CFG.W/2,96,{size:14,color:P.cream,stroke:3});

  Art.text(ctx,'Isso apaga PARA SEMPRE:',CFG.W/2,130,{size:12,color:'#2a2018',stroke:0});
  Art.text(ctx,'• os chefes já vencidos e os recordes de tempo',CFG.W/2,150,{size:11,color:'#4a382b',stroke:0});
  Art.text(ctx,'• os Pontos de Pesquisa e as armas compradas',CFG.W/2,166,{size:11,color:'#4a382b',stroke:0});
  Art.text(ctx,'• a dificuldade volta para ESTAGIÁRIO',CFG.W/2,182,{size:11,color:'#4a382b',stroke:0});
  Art.text(ctx,'O jogo recomeça do zero, como na primeira vez.',CFG.W/2,204,{size:11,color:'#6a563f',stroke:0});

  const botoes=[
    {txt:'NÃO, VOLTAR',   cor:Art.PAL.greenDk},
    {txt:'SIM, APAGAR',   cor:Art.PAL.red}
  ];
  Game.menuHit=[];
  botoes.forEach((b,i)=>{
    const cx = i===0 ? CFG.W/2-90 : CFG.W/2+90;
    const sel = i===Game.resetIndex;
    const w=150, h=28;
    Game.menuHit.push({x:cx-w/2,y:236-h/2,w,h,i});
    ctx.save();
    if(sel) ctx.translate(0,Math.sin(t*0.16)*1.6);
    Art.ribbon(ctx,cx,236,w,h,sel?b.cor:'#6b6355');
    Art.text(ctx,b.txt,cx,236,{size:sel?14:12,color:P.cream,stroke:sel?3:2});
    ctx.restore();
  });

  Art.text(ctx, touchMode()? 'TOQUE NA OPÇÃO' : 'SETAS ESCOLHEM  -  ENTER CONFIRMA  -  ESC CANCELA',
    CFG.W/2,CFG.H-16,{size:11,color:P.cream,stroke:2.5});
}

/* ---------------- CRÉDITOS ---------------- */
function creditsHeight(){
  let h=0;
  for(const l of CREDITS){
    h += l.t==='gap' ? (l.h||20)
       : l.t==='title' ? 58
       : l.t==='sub' ? 26
       : l.t==='head' ? 30
       : l.t==='name' ? 24 : 17;
  }
  return h;
}

function drawCredits(){
  const t=Game.t, P=Art.PAL;
  // fundo de cinema antigo
  ctx.fillStyle='#1a1410';
  ctx.fillRect(0,0,CFG.W,CFG.H);
  Art.sunburst(ctx,CFG.W/2,CFG.H/2,420,20,t*0.004,'#f2e3bd',0.10);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,CFG.W,CFG.H-24);
  ctx.clip();

  let y = CFG.H - Game.creditsY;
  for(const l of CREDITS){
    if(l.t==='gap'){ y += (l.h||20); continue; }
    if(y > -40 && y < CFG.H+40){
      if(l.t==='title'){
        Art.text(ctx,l.s,CFG.W/2,y,{size:46,color:P.yellow,stroke:6,rot:-0.02,shadow:'rgba(0,0,0,.4)'});
      } else if(l.t==='sub'){
        Art.text(ctx,l.s,CFG.W/2,y,{size:16,color:P.cream,stroke:3});
      } else if(l.t==='head'){
        Art.text(ctx,l.s,CFG.W/2,y,{size:15,color:P.red,stroke:2.5});
      } else if(l.t==='name'){
        Art.text(ctx,l.s,CFG.W/2,y,{size:15,color:P.cream,stroke:2.5});
      } else {
        Art.text(ctx,l.s,CFG.W/2,y,{size:11,color:'#f5e7c4',stroke:2});
      }
    }
    y += l.t==='title' ? 58 : l.t==='sub' ? 26 : l.t==='head' ? 30 : l.t==='name' ? 24 : 17;
  }
  ctx.restore();

  // duas celulinhas dançando no rodapé
  const dance=(x,f)=>{
    ctx.save();
    ctx.translate(x,CFG.H-30+Math.sin(t*0.09+(f>0?0:1))*4);
    ctx.rotate(Math.sin(t*0.06+(f>0?0:1.5))*0.14);
    Art.blob(ctx,0,0,14,13,'rgba(150,205,225,.9)',2.6,12,4,x);
    Art.circle(ctx,0,1,6,'rgba(125,95,158,.9)',2);
    Art.circle(ctx,-3.4+f,-2,1.4,P.ink,0);
    Art.circle(ctx, 3.4+f,-2,1.4,P.ink,0);
    ctx.restore();
  };
  dance(40,1); dance(CFG.W-40,-1);

  const fim = Game.creditsY > creditsHeight();
  const msg = fim
    ? (touchMode()?'TOQUE PARA VOLTAR':'ENTER / X PARA VOLTAR')
    : (touchMode()?'TOQUE PARA ADIANTAR  -  SEGURE BAIXO PARA CORRER':'ESC VOLTA  -  SEGURE BAIXO PARA CORRER');
  ctx.save();
  ctx.globalAlpha=0.6+Math.sin(t*0.1)*0.35;
  Art.text(ctx,msg,CFG.W/2,CFG.H-10,{size:10,color:P.yellow,stroke:2.5});
  ctx.restore();
}

/* ---------------- LOJA ---------------- */
function drawWeaponIcon(id,x,y,sc,color){
  const P=Art.PAL;
  ctx.save();
  ctx.translate(x,y); ctx.scale(sc,sc);
  if(id==='mito'){
    // canhão grandão com uma mitocôndria em cima
    Art.ellipse(ctx,0,10,24,9,'#b9b3a4',3);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(-16,4); ctx.lineTo(20,-2); ctx.lineTo(20,10); ctx.lineTo(-16,14);
    ctx.closePath(); ctx.fill(); Art.ink(ctx,3); ctx.stroke();
    Art.circle(ctx,22,4,7,P.yellow,3);
    Art.ellipse(ctx,-4,-12,16,9,'#d98f5a',3);
    ctx.strokeStyle=P.ink; ctx.lineWidth=2;
    for(let i=-2;i<=2;i++){
      ctx.beginPath(); ctx.moveTo(i*5,-17); ctx.lineTo(i*5+3,-7); ctx.stroke();
    }
  } else if(id==='rna'){
    // arma fininha com uma fita de RNA
    ctx.fillStyle='#cfc7b4';
    ctx.beginPath();
    ctx.moveTo(-16,2); ctx.lineTo(16,-2); ctx.lineTo(16,7); ctx.lineTo(-16,11);
    ctx.closePath(); ctx.fill(); Art.ink(ctx,3); ctx.stroke();
    Art.ellipse(ctx,-14,10,7,6,'#8d8676',2.6);
    ctx.strokeStyle=color; ctx.lineWidth=3.4; ctx.lineCap='round';
    ctx.beginPath();
    for(let i=0;i<=16;i++){
      const xx=-6+i*2.2, yy=-10+Math.sin(i*0.7)*7;
      i===0?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy);
    }
    ctx.stroke();
    Art.circle(ctx,20,2,5,color,2.6);
  } else {
    // pistola de plasma
    ctx.fillStyle='#e8dcc0';
    ctx.beginPath();
    ctx.moveTo(-14,0); ctx.lineTo(14,-3); ctx.lineTo(14,6); ctx.lineTo(-14,9);
    ctx.closePath(); ctx.fill(); Art.ink(ctx,3); ctx.stroke();
    Art.ellipse(ctx,-12,10,7,7,'#b9b3a4',2.6);
    Art.circle(ctx,18,2,7,color,3);
    Art.circle(ctx,16,0,2.4,P.cream,0);
  }
  ctx.restore();
}

// posicao e tamanho das cartas da loja, conforme a largura da tela
function shopCard(i){
  const gap = Math.min(190, (CFG.W-60)/3);
  const ww  = Math.min(168, gap-14);
  return {cx: CFG.W/2 + (i-1)*gap, ww: ww, y:70, h:196};
}

function shopStatus(w){
  if(Shop.equipped===w.id) return {txt:'EQUIPADA', color:Art.PAL.greenDk, can:false};
  if(Shop.has(w.id))       return {txt:'EQUIPAR',  color:Art.PAL.blueDk,  can:true};
  if(Shop.points>=w.price) return {txt:'COMPRAR ('+w.price+' PP)', color:Art.PAL.red, can:true};
  return {txt:'FALTA '+(w.price-Shop.points)+' PP', color:'#8a6a4a', can:false};
}

function shopAction(i){
  const w=WEAPONS[i];
  const st=shopStatus(w);
  if(!st.can){ Sound.sfx.hurt(); return; }
  if(Shop.has(w.id)){
    Shop.equip(w.id);
    Sound.sfx.confirm();
    FX.burst(CFG.W/2,CFG.H/2,14,w.color,4,4,'star');
  } else {
    Shop.buy(w.id);
    Sound.sfx.win();
    FX.burst(CFG.W/2,CFG.H/2,26,Art.PAL.yellow,5,4,'star');
  }
}

function shopTap(x,y){
  for(let i=0;i<WEAPONS.length;i++){
    const c=shopCard(i);
    if(x>c.cx-c.ww/2 && x<c.cx+c.ww/2 && y>62 && y<270){
      if(Game.shopIndex===i) shopAction(i);
      else { Game.shopIndex=i; Sound.sfx.select(); }
      return;
    }
  }
  if(y>CFG.H-30){ Game.state='map'; Sound.sfx.select(); }
}

function drawShopKeeper(x,y,t){
  const P=Art.PAL;
  ctx.save();
  ctx.translate(x,y+Math.sin(t*0.05)*2);
  // bacteriazinha comerciante
  Art.blob(ctx,0,0,26,20,'#9fd0a8',3.4,12,4,3);
  // flagelos
  ctx.strokeStyle=P.ink; ctx.lineWidth=2.4; ctx.lineCap='round';
  for(let i=-1;i<=1;i+=2){
    ctx.beginPath();
    ctx.moveTo(i*24,4);
    ctx.quadraticCurveTo(i*34,10+Math.sin(t*0.12)*4,i*40,2);
    ctx.stroke();
  }
  Art.ellipse(ctx,-8,-4,5,6,P.cream,2.4);
  Art.ellipse(ctx, 8,-4,5,6,P.cream,2.4);
  Art.circle(ctx,-7,-3,2.2,P.ink,0);
  Art.circle(ctx, 9,-3,2.2,P.ink,0);
  // bigodão
  ctx.strokeStyle=P.ink; ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-10,6); ctx.quadraticCurveTo(0,12,10,6);
  ctx.stroke();
  // gravata borboleta
  ctx.fillStyle=P.red;
  ctx.beginPath();
  ctx.moveTo(-8,18); ctx.lineTo(0,14); ctx.lineTo(8,18); ctx.lineTo(0,22);
  ctx.closePath(); ctx.fill(); Art.ink(ctx,2); ctx.stroke();
  // chapéu
  ctx.fillStyle=P.blueDk;
  ctx.fillRect(-12,-26,24,10);
  Art.ink(ctx,2.6); ctx.strokeRect(-12,-26,24,10);
  ctx.fillStyle=P.blueDk; ctx.fillRect(-17,-17,34,4);
  Art.ink(ctx,2.6); ctx.strokeRect(-17,-17,34,4);
  ctx.restore();
}

function drawShop(){
  const t=Game.t, P=Art.PAL;
  drawBackground();
  ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle=P.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  Art.ribbon(ctx,CFG.W/2,26,320,26,P.red);
  Art.text(ctx,'LOJA DO DR. BACILO',CFG.W/2,26,{size:16,color:P.cream,stroke:3});

  // pontos
  const pts='PONTOS DE PESQUISA: '+Shop.points;
  ctx.save();
  const pw=Art.measure(ctx,pts,11)+22;
  ctx.fillStyle='rgba(28,20,16,.8)';
  ctx.fillRect(CFG.W/2-pw/2,44,pw,19);
  Art.ink(ctx,2.4); ctx.strokeRect(CFG.W/2-pw/2,44,pw,19);
  Art.text(ctx,pts,CFG.W/2,53,{size:11,color:P.yellow,stroke:0});
  ctx.restore();

  WEAPONS.forEach((w,i)=>{
    const c=shopCard(i);
    const cx=c.cx, ww=c.ww, y=c.y, h=c.h;
    const sel=i===Game.shopIndex;
    const st=shopStatus(w);

    ctx.save();
    if(sel) ctx.translate(0,Math.sin(t*0.09)*2-4);
    Art.cardFrame(ctx,cx-ww/2,y,ww,h,sel?P.paper:'#d5c49c');
    if(!sel) ctx.globalAlpha=0.8;

    drawWeaponIcon(w.id,cx,y+40,sel?1.1:0.95,w.color);

    const nomeTam = ww<150 ? 10.5 : 12;
    Art.text(ctx,w.name,cx,y+78,{size:nomeTam,color:'#2a2018',stroke:0});
    Art.text(ctx,w.sub,cx,y+92,{size:9.5,color:'#6a563f',stroke:0});

    // barrinhas de status
    const bars=[['DANO',w.bars.dano],['CADÊNCIA',w.bars.cadencia],['MIRA',w.bars.mira]];
    const pip = Math.min(13, (ww-84)/5);
    bars.forEach((b,k)=>{
      const by=y+110+k*15;
      Art.text(ctx,b[0],cx-ww/2+8,by,{size:8.5,color:'#4a382b',stroke:0,align:'left'});
      for(let n=0;n<5;n++){
        const px=cx-ww/2+72+n*pip;
        ctx.fillStyle = n<b[1] ? w.color : 'rgba(28,20,16,.18)';
        ctx.fillRect(px,by-4,pip-3,8);
        Art.ink(ctx,1.4); ctx.strokeRect(px,by-4,pip-3,8);
      }
    });

    // botão de estado
    ctx.save();
    ctx.globalAlpha = sel ? 1 : 0.9;
    Art.ribbon(ctx,cx,y+172,Math.min(140,ww-20),22,st.color);
    Art.text(ctx,st.txt,cx,y+172,{size:11,color:P.cream,stroke:2.5});
    ctx.restore();
    ctx.restore();
  });

  // descrição da arma selecionada
  const w=WEAPONS[Game.shopIndex];
  ctx.save();
  ctx.fillStyle='rgba(28,20,16,.72)';
  ctx.fillRect(70,272,CFG.W-140,38);
  Art.ink(ctx,2.4); ctx.strokeRect(70,272,CFG.W-140,38);
  Art.paragraph(ctx,w.desc,CFG.W/2,286,CFG.W-180,{size:10,color:P.cream,align:'center',lh:13});
  ctx.restore();

  drawShopKeeper(40,292,t);

  Art.text(ctx, touchMode()? 'TOQUE NA ARMA PARA ESCOLHER  -  TOQUE EMBAIXO PARA VOLTAR'
                           : 'SETAS ESCOLHEM  -  ENTER COMPRA/EQUIPA  -  ESC VOLTA AO MAPA',
    CFG.W/2,CFG.H-12,{size:10,color:P.cream,stroke:2.5});
}

/* ---------------- ESCOLHA DO CHEFE ---------------- */
const BOSS_LIST = [
  {kind:'nucleus', name:'NUCLEUS-9', sub:'O CLONE MESTRE',
   tags:'MITOSE  •  DNA  •  CLONE DE VOCÊ'},
  {kind:'dolly',   name:'DOLLY-96',  sub:'A OVELHA REPLICANTE',
   tags:'OVELHA  •  MÁQUINA SCNT  •  REBANHO'}
];

function drawBossPortrait(kind,x,y,sc,t){
  const P=Art.PAL;
  ctx.save();
  ctx.translate(x,y); ctx.scale(sc,sc);
  if(kind==='nucleus'){
    Art.blob(ctx,0,0,34,32,'rgba(150,205,225,.75)',3.4,14,4,7);
    Art.blob(ctx,0,0,22,21,'rgba(125,95,158,.95)',3,12,3,3);
    Art.ellipse(ctx,-8,-4,5,6,P.cream,2.4);
    Art.ellipse(ctx, 8,-4,5,6,P.cream,2.4);
    Art.circle(ctx,-7,-3,2.2,P.ink,0);
    Art.circle(ctx, 9,-3,2.2,P.ink,0);
    Art.ink(ctx,2.4);
    ctx.beginPath(); ctx.arc(0,7,6,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
    for(let i=0;i<4;i++){
      const a=t*0.02+i*Math.PI/2;
      Art.circle(ctx,Math.cos(a)*34,Math.sin(a)*32,5,'rgba(150,205,225,.8)',2);
    }
  } else {
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      Art.circle(ctx,Math.cos(a)*20,Math.sin(a)*16,12,P.white,3);
    }
    Art.ellipse(ctx,0,0,22,17,P.white,0);
    ctx.save();
    ctx.translate(-4,2);
    Art.ellipse(ctx,-11,-9,8,3.6,'#3b2a2a',2.6,0.4);
    Art.ellipse(ctx,  9,-9,8,3.6,'#3b2a2a',2.6,-0.4);
    Art.circle(ctx,0,-9,8,P.white,3);
    Art.ellipse(ctx,0,0,14,13,'#3d2c2c',3.2);
    Art.ellipse(ctx,-5,-2,4,4.6,P.cream,2.2);
    Art.ellipse(ctx, 5,-2,4,4.6,P.cream,2.2);
    Art.circle(ctx,-5,-1,1.8,P.ink,0);
    Art.circle(ctx, 5,-1,1.8,P.ink,0);
    Art.ellipse(ctx,0,7,8,4.6,'#e8c9c0',2.4);
    Art.circle(ctx,-2.6,6,1.2,P.ink,0);
    Art.circle(ctx, 2.6,6,1.2,P.ink,0);
    ctx.restore();
  }
  ctx.restore();
}

function drawSelect(){
  const t=Game.t;
  drawBackground();
  ctx.save(); ctx.globalAlpha=.42; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  Art.ribbon(ctx,CFG.W/2,34,300,28,Art.PAL.red);
  Art.text(ctx,'ESCOLHA O CHEFE',CFG.W/2,34,{size:18,color:Art.PAL.cream,stroke:3.5});

  Game.menuHit=[];
  BOSS_LIST.forEach((b,i)=>{
    const cx = i===0 ? 168 : CFG.W-168;
    const sel = i===Game.selIndex;
    const w=250, h=216, y=52;
    Game.menuHit.push({x:cx-w/2,y,w,h,i});

    ctx.save();
    if(sel) ctx.translate(0,Math.sin(t*0.08)*2);
    Art.cardFrame(ctx,cx-w/2,y,w,h,sel?Art.PAL.paper:'#d8c8a0');
    if(!sel){ ctx.globalAlpha=0.75; }

    drawBossPortrait(b.kind,cx,y+74,(b.kind==='dolly'?1.25:1.05)*(sel?1.1:1),t);

    Art.ribbon(ctx,cx,y+138,190,24,sel?Art.PAL.blueDk:'#6b6355');
    Art.text(ctx,b.name,cx,y+138,{size:16,color:Art.PAL.cream,stroke:3});
    Art.text(ctx,b.sub,cx,y+161,{size:11,color:'#3a2c22',stroke:0});
    Art.text(ctx,b.tags,cx,y+176,{size:9,color:'#6a563f',stroke:0});

    const best=Game.bests[b.kind];
    if(best){
      Art.text(ctx,'RECORDE: '+fmtTime(parseFloat(best)),cx,y+197,
        {size:10,color:Art.PAL.greenDk,stroke:0});
      // carimbo de vencido
      ctx.save();
      ctx.translate(cx+72,y+28); ctx.rotate(-0.22);
      ctx.globalAlpha=.85;
      Art.text(ctx,'VENCIDO!',0,0,{size:14,color:Art.PAL.red,stroke:2.5});
      ctx.restore();
    } else {
      Art.text(ctx,'AINDA NÃO DERROTADO',cx,y+197,{size:10,color:'#8a6a4a',stroke:0});
    }
    ctx.restore();
  });

  if(Game.beaten.nucleus && Game.beaten.dolly){
    Art.text(ctx,'LABORATORIO COMPLETO! VOCE VENCEU OS DOIS CHEFES',CFG.W/2,282,
      {size:12,color:Art.PAL.yellow,stroke:3});
  }

  Art.text(ctx, touchMode() ? 'TOQUE NO CHEFE PARA COMEÇAR'
                         : 'SETAS ESCOLHEM  -  ENTER / X COMEÇA  -  ESC VOLTA',
    CFG.W/2,CFG.H-30,{size:11,color:Art.PAL.cream,stroke:3});
  Art.text(ctx,'DIFICULDADE: '+(Game.hardMode?'CIENTISTA (3 vidas)':'ESTAGIÁRIO (4 vidas)'),
    CFG.W/2,CFG.H-13,{size:10,color:'#f0d9a0',stroke:0});
}

function drawHowTo(){
  drawBackground();
  ctx.save(); ctx.globalAlpha=.55; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  Art.cardFrame(ctx,40,26,CFG.W-80,CFG.H-70,Art.PAL.paper);
  Art.text(ctx,'COMO JOGAR',CFG.W/2,52,{size:24,color:Art.PAL.red,stroke:3.5});

  const rows=[
    ['MOVER',        'Setas / A D',     '-',                'D-pad',    'Analógico'],
    ['PULAR',        'X, Espaço ou K',  '-',                'PULO',     'A / X(PS)'],
    ['ATIRAR',       'Z ou J',          'BOTÃO ESQUERDO',   'TIRO',     'X / Quadrado'],
    ['MIRAR',        'Cima / Baixo',    'MOVER O CURSOR',   'setas',    'Analógico'],
    ['SUPER',        'V ou I',          'BOTÃO DIREITO',    'SUPER',    'Y / LB'],
    ['DASH',         'C, L ou Shift',   '-',                'DASH',     'B / RB'],
    ['PAUSA',        'Enter, P ou Esc', '-',                'II',       'Start']
  ];
  const col=[0.081,0.234,0.422,0.625,0.750].map(f => Math.round(f*CFG.W));
  Art.text(ctx,'AÇÃO',col[0],78,{size:11,color:Art.PAL.blueDk,stroke:0,align:'left'});
  Art.text(ctx,'TECLADO',col[1],78,{size:11,color:Art.PAL.blueDk,stroke:0,align:'left'});
  Art.text(ctx,'MOUSE',col[2],78,{size:11,color:Art.PAL.red,stroke:0,align:'left'});
  Art.text(ctx,'CELULAR',col[3],78,{size:11,color:Art.PAL.blueDk,stroke:0,align:'left'});
  Art.text(ctx,'CONTROLE',col[4],78,{size:11,color:Art.PAL.blueDk,stroke:0,align:'left'});
  ctx.save(); ctx.strokeStyle='rgba(28,20,16,.35)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(56,86); ctx.lineTo(CFG.W-56,86); ctx.stroke(); ctx.restore();

  rows.forEach((r,i)=>{
    const y=102+i*20;
    r.forEach((cell,c)=>{
      Art.text(ctx,cell,col[c],y,{size:c===0?12:10.5,
        color:c===0?'#2a2018':(c===2?'#8f2a1c':'#4a382b'),stroke:0,align:'left'});
    });
  });

  Art.text(ctx,'DICA DE OURO: pule sobre os projéteis ROSA e aperte PULAR de novo para APARAR.',
    CFG.W/2,258,{size:12,color:Art.PAL.pinkHot,stroke:2.5});
  Art.text(ctx,'Cada defesa enche o SUPER. Com o SUPER cheio, use a MITOSE REVERSA!',
    CFG.W/2,274,{size:11,color:'#3a2c22',stroke:0});
  Art.text(ctx,'Os botões da tela aparecem sozinhos quando você TOCA a tela e somem quando usa teclado ou controle.',
    CFG.W/2,292,{size:10,color:Art.PAL.blueDk,stroke:0});

  Art.text(ctx, touchMode()?'TOQUE PARA VOLTAR':'ESC / BACKSPACE PARA VOLTAR',
    CFG.W/2,CFG.H-22,{size:11,color:Art.PAL.cream,stroke:3});
}

// quebra um texto em linhas que cabem na largura pedida
function quebraLinhas(str, maxW, size){
  ctx.save();
  ctx.font = '600 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  const palavras = str.split(' ');
  const linhas = [];
  let linha = '';
  for (const p of palavras){
    const teste = linha ? linha + ' ' + p : p;
    if (ctx.measureText(teste).width > maxW && linha){ linhas.push(linha); linha = p; }
    else linha = teste;
  }
  if (linha) linhas.push(linha);
  ctx.restore();
  return linhas;
}

// ficha em blocos (usada pela ficha de ÉTICA E LEI)
function drawFichaBlocos(c){
  const P = Art.PAL;
  const x0 = 68, maxW = CFG.W - 136;
  const topo = 76, fundo = 270;

  // acha o maior tamanho de letra que faz tudo caber
  let size = 11, lh, blocos;
  for (; size >= 8; size -= 0.5){
    lh = size * 1.28;
    blocos = c.topics.map(t => quebraLinhas(t[1], maxW, size));
    let h = 0;
    for (const b of blocos) h += (size + 4) + b.length * lh + 6;
    if (h <= fundo - topo) break;
  }

  let y = topo;
  c.topics.forEach((t, i) => {
    Art.text(ctx, t[0], x0, y, {size:size+0.5, color:P.red, stroke:0, align:'left'});
    y += size + 4;
    for (const linha of blocos[i]){
      Art.text(ctx, linha, x0, y, {size:size, color:'#2f241c', stroke:0, align:'left'});
      y += lh;
    }
    y += 6;
  });
}

function drawScience(){
  drawBackground();
  ctx.save(); ctx.globalAlpha=.55; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  const c=SCIENCE[Game.sciIndex];
  Art.cardFrame(ctx,46,30,CFG.W-92,CFG.H-84,Art.PAL.paper);

  Art.ribbon(ctx,CFG.W/2,52,Math.min(CFG.W-140,Art.measure(ctx,c.title,20)+70),28,Art.PAL.green);
  Art.text(ctx,c.title,CFG.W/2,52,{size:17,color:Art.PAL.cream,stroke:3});

  if(c.topics){
    drawFichaBlocos(c);
  } else {
    Art.paragraph(ctx,c.body,CFG.W/2,96,CFG.W-160,{size:13,color:'#2f241c',align:'center',lh:20});

    // desenho decorativo: celula se dividindo
    const t=Game.t;
    ctx.save();
    ctx.translate(CFG.W/2,222);
    const sep=Math.abs(Math.sin(t*0.02))*16+8;
    Art.blob(ctx,-sep,0,18,17,'rgba(150,205,225,.85)',2.5,11,4,1);
    Art.blob(ctx, sep,0,18,17,'rgba(150,205,225,.85)',2.5,11,4,2);
    Art.circle(ctx,-sep,0,7,'rgba(125,95,158,.9)',2);
    Art.circle(ctx, sep,0,7,'rgba(125,95,158,.9)',2);
    ctx.restore();
  }

  Art.text(ctx,(Game.sciIndex+1)+' / '+SCIENCE.length,CFG.W/2,c.topics?282:258,{size:11,color:'#4a382b',stroke:0});

  Art.text(ctx, touchMode()? 'TOQUE NOS LADOS PARA MUDAR  -  TOQUE NO CENTRO PARA VOLTAR'
                        : 'SETAS < >  MUDAR   -   ESC VOLTA PARA ' + (Game.sciFrom==='map'?'O MAPA':'O MENU'),
    CFG.W/2,CFG.H-22,{size:11,color:Art.PAL.cream,stroke:3});
}

function drawCard(){
  drawBattle(false);
  ctx.save(); ctx.globalAlpha=.62; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();

  const c=CARDS[Game.bossKind][Game.cardIndex];
  const k=Math.min(1,Game.cardT/14);
  ctx.save();
  ctx.translate(CFG.W/2,CFG.H/2);
  ctx.scale(0.9+k*0.1,0.9+k*0.1);
  ctx.globalAlpha=k;
  ctx.translate(-CFG.W/2,-CFG.H/2);

  Art.cardFrame(ctx,52,44,CFG.W-104,CFG.H-118,Art.PAL.paper);
  Art.ribbon(ctx,CFG.W/2,56,150,26,Art.PAL.red);
  Art.text(ctx,c.tag,CFG.W/2,56,{size:14,color:Art.PAL.cream,stroke:3});
  Art.text(ctx,c.title,CFG.W/2,92,{size:20,color:Art.PAL.blueDk,stroke:2.5});
  Art.paragraph(ctx,c.body,CFG.W/2,126,CFG.W-170,{size:12.5,color:'#2f241c',align:'center',lh:19});
  Art.text(ctx,c.hint,CFG.W/2,214,{size:12,color:Art.PAL.greenDk,stroke:0});
  ctx.restore();

  if(Game.cardT>26){
    const a=0.6+Math.sin(Game.t*0.15)*0.4;
    ctx.save(); ctx.globalAlpha=a;
    Art.text(ctx, touchMode()?'TOQUE PARA LUTAR!':'APERTE PULAR / ENTER PARA LUTAR!',
      CFG.W/2,CFG.H-58,{size:15,color:Art.PAL.yellow,stroke:3.5});
    ctx.restore();
  }
}

function drawIntro(){
  drawBattle();
  const t=Game.introT;
  ctx.save(); ctx.globalAlpha=.35; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();
  let str,color;
  if(t>60){ str='PRONTO?'; color=Art.PAL.cream; }
  else { str='JÁ!'; color=Art.PAL.yellow; }
  const k=t>60? Math.min(1,(120-t)/12) : Math.min(1,(60-t)/6);
  ctx.save();
  ctx.globalAlpha=Math.min(1,k*1.4);
  Art.sunburst(ctx,CFG.W/2,CFG.H/2,300,16,Game.t*0.02,'#fff6dd',0.2);
  Art.text(ctx,str,CFG.W/2,CFG.H/2,{size:t>60?46:66,color,stroke:7,rot:-0.04,shadow:'rgba(28,20,16,.4)'});
  ctx.restore();
}

function drawPause(){
  drawBattle();
  ctx.save(); ctx.globalAlpha=.62; ctx.fillStyle=Art.PAL.ink; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();
  Art.text(ctx,'PAUSA',CFG.W/2,120,{size:44,color:Art.PAL.cream,stroke:6,rot:-0.03});
  const items=['CONTINUAR','RECOMEÇAR','SOM: '+(Sound.muted?'OFF':'ON'),'SAIR PARA O MAPA'];
  Game.menuHit=[];
  items.forEach((it,i)=>{
    const y=176+i*28;
    const sel=i===Game.menuIndex;
    const w=Art.measure(ctx,it,sel?18:15)+40;
    Game.menuHit.push({x:CFG.W/2-w/2,y:y-13,w,h:26,i});
    if(sel) Art.ribbon(ctx,CFG.W/2,y,w,26,Art.PAL.blueDk);
    Art.text(ctx,it,CFG.W/2,y,{size:sel?18:15,color:Art.PAL.cream,stroke:sel?3.5:2});
  });
}

function drawGameOver(){
  drawBattle(false);
  ctx.save(); ctx.globalAlpha=.6; ctx.fillStyle='#2a0f0f'; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();
  const k=Math.min(1,Game.endT/20);
  ctx.save(); ctx.globalAlpha=k;
  Art.text(ctx,'VOCÊ FOI',CFG.W/2,116,{size:30,color:Art.PAL.cream,stroke:5,rot:-0.03});
  Art.text(ctx,'DEGENERADO!',CFG.W/2,158,{size:44,color:Art.PAL.red,stroke:6,rot:0.02});
  const pct=Math.round((1-Game.boss.totalNow()/Game.boss.totalMax())*100);
  Art.text(ctx,'NUCLEUS-9 estava com '+(100-pct)+'% de vida',CFG.W/2,204,{size:13,color:Art.PAL.cream,stroke:2.5});
  Art.text(ctx,'Dica: pule nos projéteis ROSA para aparar e encher o SUPER.',
    CFG.W/2,228,{size:11,color:'#f0d9a0',stroke:0});
  if(Game.endT>40){
    const a=0.6+Math.sin(Game.t*0.15)*0.4;
    ctx.globalAlpha=a*k;
    Art.text(ctx, touchMode()?'TOQUE PARA TENTAR DE NOVO':'PULAR / ENTER = TENTAR DE NOVO   -   ESC = MENU',
      CFG.W/2,CFG.H-46,{size:13,color:Art.PAL.yellow,stroke:3});
  }
  ctx.restore();
}

function drawWin(){
  drawBattle(false);
  ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle='#1a2a14'; ctx.fillRect(0,0,CFG.W,CFG.H); ctx.restore();
  Art.sunburst(ctx,CFG.W/2,120,340,20,Game.t*0.01,'#fff6dd',0.22);
  const k=Math.min(1,Game.endT/20);
  ctx.save(); ctx.globalAlpha=k;
  Art.text(ctx,'NOCAUTE!',CFG.W/2,86,{size:48,color:Art.PAL.yellow,stroke:7,rot:-0.03,shadow:'rgba(28,20,16,.4)'});
  Art.text(ctx,Game.boss.name+' DERROTADO',CFG.W/2,116,{size:14,color:Art.PAL.cream,stroke:3});
  Art.cardFrame(ctx,150,128,CFG.W-300,112,Art.PAL.paper);
  Art.text(ctx,'RELATÓRIO DE LABORATÓRIO',CFG.W/2,146,{size:13,color:Art.PAL.red,stroke:0});
  Art.text(ctx,'Tempo: '+fmtTime(Game.battleTime),CFG.W/2,168,{size:13,color:'#2f241c',stroke:0});
  Art.text(ctx,'Defesas (parry): '+Game.parries,CFG.W/2,187,{size:13,color:'#2f241c',stroke:0});
  Art.text(ctx,'Danos sofridos: '+Game.hitsTaken,CFG.W/2,206,{size:13,color:'#2f241c',stroke:0});
  const rank = Game.hitsTaken===0 ? 'A+ CIENTISTA-CHEFE'
             : Game.hitsTaken<=2 ? 'A  PESQUISADOR'
             : Game.hitsTaken<=5 ? 'B  ESTAGIÁRIO BOM'
             : 'C  APRENDIZ';
  Art.text(ctx,'NOTA: '+rank,CFG.W/2,226,{size:14,color:Art.PAL.greenDk,stroke:0});
  if(Game.rewardPoint){
    ctx.save();
    ctx.globalAlpha=0.75+Math.sin(Game.t*0.12)*0.25;
    Art.text(ctx,'+1 PONTO DE PESQUISA!  GASTE NA LOJA DO MAPA',CFG.W/2,244,
      {size:12,color:Art.PAL.yellow,stroke:3});
    ctx.restore();
  }
  const frase = Game.bossKind==='dolly'
    ? '"277 tentativas para uma Dolly - você conseguiu de primeira?"'
    : '"Clonar copia o DNA - não copia a história de vida."';
  Art.text(ctx,frase,CFG.W/2,Game.rewardPoint?264:256,{size:11.5,color:Art.PAL.cream,stroke:2.5});
  if(Game.beaten.nucleus && Game.beaten.dolly)
    Art.text(ctx,'VOCE DERROTOU OS DOIS CHEFES!',CFG.W/2,285,{size:12,color:Art.PAL.yellow,stroke:3});
  if(Game.endT>40){
    const a=0.6+Math.sin(Game.t*0.15)*0.4;
    ctx.globalAlpha=a*k;
    const tudo = Game.beaten.nucleus && Game.beaten.dolly;
    const msgFim = tudo
      ? (touchMode()?'TOQUE PARA VER OS CRÉDITOS':'PULAR / ENTER: VER OS CRÉDITOS')
      : (touchMode()?'TOQUE PARA ESCOLHER OUTRO CHEFE':'PULAR / ENTER: ESCOLHER OUTRO CHEFE');
    Art.text(ctx, msgFim, CFG.W/2,CFG.H-34,{size:13,color:Art.PAL.yellow,stroke:3});
  }
  ctx.restore();
}

/* ============================================================
   ENTRADA NOS MENUS
   ============================================================ */
function menuNav(count){
  if(Input.pressed.up){ Game.menuIndex=(Game.menuIndex-1+count)%count; Sound.sfx.select(); }
  if(Input.pressed.down){ Game.menuIndex=(Game.menuIndex+1)%count; Sound.sfx.select(); }
}

function chooseTitle(i){
  Sound.sfx.confirm();
  switch(i){
    case 0: Game.state='map'; Game.menuIndex=0; break;
    case 1: Game.state='howto'; break;
    case 2: Game.state='science'; Game.sciIndex=0; Game.sciFrom='title'; break;
    case 3:
      Game.hardMode=!Game.hardMode;
      try{ localStorage.setItem('clone_hard',Game.hardMode?'1':'0'); }catch(e){}
      break;
    case 4: toggleFullscreen(); break;
    case 5: Sound.toggleMute(); break;
    case 6:
      Game.state='credits'; Game.creditsFrom='title'; Game.creditsY=0;
      break;
    case 7:
      Game.state='reset'; Game.resetIndex=0;
      break;
  }
}

function chooseBoss(i){
  Sound.sfx.confirm();
  if(IS_TOUCH) toggleFullscreen();
  Game.selIndex=i;
  Game.startBattle(BOSS_LIST[i].kind);
}

function choosePause(i){
  Sound.sfx.confirm();
  switch(i){
    case 0: Game.state='battle'; break;
    case 1: Game.startBattle(); break;
    case 2: Sound.toggleMute(); break;
    case 3: Game.state='map'; Game.menuIndex=0; Sound.play('menu'); break;
  }
}

/* toques diretos na tela (menus) */
canvas.addEventListener('pointerdown', e => {
  Sound.init(); Sound.resume();
  const r=canvas.getBoundingClientRect();
  const x=(e.clientX-r.left)*(CFG.W/r.width);
  const y=(e.clientY-r.top)*(CFG.H/r.height);
  const s=Game.state;

  if(s==='title'){
    for(const h of Game.menuHit){
      if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){
        if(h.i===-1){ Sound.sfx.confirm(); instalarJogo(); return; }
        Game.menuIndex=h.i; chooseTitle(h.i); return;
      }
    }
  } else if(s==='pause'){
    for(const h of Game.menuHit){
      if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){ Game.menuIndex=h.i; choosePause(h.i); return; }
    }
  } else if(s==='reset'){
    for(const h of Game.menuHit){
      if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){
        if(h.i===1) apagarProgresso();
        else { Game.state='title'; Sound.sfx.select(); }
        return;
      }
    }
  } else if(s==='map'){
    WorldMap.tap(x,y);
  } else if(s==='shop'){
    shopTap(x,y);
  } else if(s==='select'){
    for(const h of Game.menuHit){
      if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){ chooseBoss(h.i); return; }
    }
    if(y>CFG.H-46){ Game.state='title'; Sound.sfx.select(); }
  } else if(s==='howto'){
    Game.state='title'; Sound.sfx.select();
  } else if(s==='science'){
    if(x<CFG.W*0.3){ Game.sciIndex=(Game.sciIndex-1+SCIENCE.length)%SCIENCE.length; Sound.sfx.select(); }
    else if(x>CFG.W*0.7){ Game.sciIndex=(Game.sciIndex+1)%SCIENCE.length; Sound.sfx.select(); }
    else { Game.state=Game.sciFrom; Sound.sfx.select(); }
  } else if(s==='card' && Game.cardT>26){
    advanceCard();
  } else if(s==='gameover' && Game.endT>40){
    Game.startBattle();
  } else if(s==='win' && Game.endT>40){
    if(Game.beaten.nucleus && Game.beaten.dolly){
      Game.state='credits'; Game.creditsFrom='map'; Game.creditsY=0;
    } else {
      Game.state='map'; Game.menuIndex=0;
    }
    Sound.play('menu');
  } else if(s==='credits'){
    const total=creditsHeight();
    if(Game.creditsY > total) Game.state=Game.creditsFrom;
    else Game.creditsY = total + 1;      // toque adianta até o fim
    Sound.sfx.select();
  }
});

function advanceCard(){
  Sound.sfx.confirm();
  if(Game.cardIndex===0 && Game.boss && Game.boss.phase===0 && Game.battleTime===0){
    Game.state='intro'; Game.introT=120;
  } else {
    Game.state='battle';
  }
}

/* ============================================================
   LOOP PRINCIPAL
   ============================================================ */
let acc=0, last=performance.now();
let lastShowTouch=null;
const STEP=1000/60;

function step(){
  const g=Game;
  g.t++;
  Art.setBoil(g.t);
  Input.update();

  // trocou de aparelho? mostra um aviso rapidinho no canto
  if(Input.deviceChanged !== g.devSeen){
    g.devSeen = Input.deviceChanged;
    g.devToast = 80;
    g.devName = ({touch:'MODO CELULAR (BOTÕES NA TELA)', keyboard:'MODO TECLADO',
                  mouse:'MODO MOUSE', gamepad:'MODO CONTROLE'})[Input.device] || '';
  }
  if(g.devToast>0) g.devToast--;

  // controles na tela apenas durante a acao
  const inAction = (g.state==='battle' || g.state==='intro' || g.state==='dying' || g.state==='map');
  const showTouch = Input.isTouchMode && inAction;
  if(showTouch !== lastShowTouch){
    touchUI.classList.toggle('hidden', !showTouch);
    if(!showTouch) Input.releaseTouch();   // evita botao "preso" ao esconder a UI
    lastShowTouch = showTouch;
  }

  switch(g.state){
    case 'title':
      menuNav(8);
      if(Input.pressed.confirm) chooseTitle(g.menuIndex);
      if(Input.pressed.left||Input.pressed.right){
        if(g.menuIndex===3) chooseTitle(3);
        else if(g.menuIndex===5) chooseTitle(5);
      }
      FX.update();
      break;

    case 'map':
      WorldMap.update(g);
      break;

    case 'reset':
      if(Input.pressed.left || Input.pressed.right){
        g.resetIndex = g.resetIndex===0 ? 1 : 0;
        Sound.sfx.select();
      }
      if(Input.pressed.confirm){
        if(g.resetIndex===1) apagarProgresso();
        else { g.state='title'; Sound.sfx.select(); }
      }
      if(Input.pressed.back){ g.state='title'; Sound.sfx.select(); }
      FX.update();
      break;

    case 'credits': {
      const total=creditsHeight();
      const rapido = Input.held.down || Input.held.confirm ? 3.2 : 1;
      g.creditsY += 0.55*rapido;
      if(g.creditsY > total + 40) g.creditsY = total + 40;
      const fim = g.creditsY > total;
      if(Input.pressed.back || (fim && Input.pressed.confirm)){
        g.state = g.creditsFrom;
        Sound.sfx.select();
      }
      FX.update();
      break;
    }

    case 'shop':
      if(Input.pressed.left){ g.shopIndex=(g.shopIndex-1+WEAPONS.length)%WEAPONS.length; Sound.sfx.select(); }
      if(Input.pressed.right){ g.shopIndex=(g.shopIndex+1)%WEAPONS.length; Sound.sfx.select(); }
      if(Input.pressed.confirm) shopAction(g.shopIndex);
      if(Input.pressed.back){ g.state='map'; Sound.sfx.select(); }
      FX.update();
      break;

    case 'select':
      if(Input.pressed.left||Input.pressed.right){
        g.selIndex=(g.selIndex+1)%BOSS_LIST.length;
        Sound.sfx.select();
      }
      if(Input.pressed.confirm) chooseBoss(g.selIndex);
      if(Input.pressed.back){ g.state='title'; g.menuIndex=0; Sound.sfx.select(); }
      FX.update();
      break;

    case 'howto':
      if(Input.pressed.back||Input.pressed.confirm){ g.state='title'; Sound.sfx.select(); }
      break;

    case 'science':
      if(Input.pressed.left){ g.sciIndex=(g.sciIndex-1+SCIENCE.length)%SCIENCE.length; Sound.sfx.select(); }
      if(Input.pressed.right){ g.sciIndex=(g.sciIndex+1)%SCIENCE.length; Sound.sfx.select(); }
      if(Input.pressed.back){ g.state=g.sciFrom; Sound.sfx.select(); }
      break;

    case 'card':
      g.cardT++;
      if(g.cardT>26 && (Input.pressed.confirm||Input.pressed.jump)) advanceCard();
      FX.update();
      break;

    case 'intro':
      g.introT--;
      if(g.introT<=0){ g.state='battle'; }
      FX.update();
      break;

    case 'battle':
      if(Input.pressed.pause){
        g.state='pause'; g.menuIndex=0; Sound.sfx.select();
        break;
      }
      updateBattle();
      if(g.boss.state==='dying' && g.state==='battle'){ /* tratado em onBossDying */ }
      break;

    case 'dying':
      g.boss.update(g);
      g.player.update(g);
      FX.update();
      for(const h of g.hazards) h.update(g);
      g.hazards=g.hazards.filter(h=>!h.dead && h.y<CFG.H);
      if(g.shake>0) g.shake*=0.9;
      if(--g.endT<=0){
        g.state='win'; g.endT=0; g.win=true;
        g.rewardPoint = !g.beaten[g.bossKind];
        saveBest();
        if(g.rewardPoint){ Shop.addPoints(1); }
        Sound.sfx.win();
        Sound.play('menu');
      }
      break;

    case 'pause':
      menuNav(4);
      if(Input.pressed.confirm) choosePause(g.menuIndex);
      if(Input.pressed.pause||Input.pressed.back){ g.state='battle'; }
      break;

    case 'gameover':
      g.endT++;
      FX.update();
      if(g.endT>40){
        if(Input.pressed.confirm) Game.startBattle();
        if(Input.pressed.back){ g.state='title'; g.menuIndex=0; Sound.play('menu'); }
      }
      break;

    case 'win':
      g.endT++;
      FX.update();
      if(g.endT>40 && (Input.pressed.confirm||Input.pressed.back)){
        if(g.beaten.nucleus && g.beaten.dolly){
          g.state='credits'; g.creditsFrom='map'; g.creditsY=0;
          Sound.play('menu');
        } else {
          g.state='map'; g.menuIndex=0; Sound.play('menu');
        }
      }
      break;
  }
}

function render(){
  const g=Game;
  ctx.clearRect(0,0,CFG.W,CFG.H);

  switch(g.state){
    case 'title':    drawTitle(); break;
    case 'select':   drawSelect(); break;
    case 'map':      WorldMap.draw(ctx,Game); break;
    case 'shop':     drawShop(); break;
    case 'credits':  drawCredits(); break;
    case 'reset':    drawReset(); break;
    case 'howto':    drawHowTo(); break;
    case 'science':  drawScience(); break;
    case 'card':     drawCard(); break;
    case 'intro':    drawIntro(); break;
    case 'battle':   drawBattle(); break;
    case 'dying':    drawBattle(); break;
    case 'pause':    drawPause(); break;
    case 'gameover': drawGameOver(); break;
    case 'win':      drawWin(); break;
  }

  // acabamento de filme antigo
  Art.sepia(ctx,CFG.W,CFG.H,0.10);
  Art.vignette(ctx,CFG.W,CFG.H,0.45);
  Art.grain(ctx,CFG.W,CFG.H,g.t);

  // aviso de troca de aparelho (teclado / mouse / controle / celular)
  if(g.devToast>0 && g.devName){
    const a=Math.min(1,g.devToast/18);
    ctx.save();
    ctx.globalAlpha=a;
    const w=Art.measure(ctx,g.devName,10)+22;
    const bx=CFG.W-w-56, by=10;
    ctx.fillStyle='rgba(28,20,16,.72)';
    ctx.fillRect(bx,by,w,17);
    Art.ink(ctx,2); ctx.strokeRect(bx,by,w,17);
    Art.text(ctx,g.devName,bx+w/2,by+9,{size:10,color:Art.PAL.cream,stroke:0});
    ctx.restore();
  }
}

function loop(now){
  requestAnimationFrame(loop);
  let dt=now-last; last=now;
  if(dt>250) dt=250;
  acc+=dt;
  const slow = Game.slowmo>0 ? 2.4 : 1;
  let guard=0;
  while(acc>=STEP*slow && guard<5){
    step();
    acc-=STEP*slow;
    guard++;
  }
  render();
}

/* ---------- primeiro toque libera o audio ---------- */
function unlockAudio(){
  Sound.init(); Sound.resume();
  if(Game.state==='title') Sound.play('menu');
}
['pointerdown','keydown','touchstart'].forEach(ev =>
  addEventListener(ev, unlockAudio, {once:true}));

/* pausa sozinho se a pagina sair de vista (nao morrer sem querer) */
document.addEventListener('visibilitychange', () => {
  if(document.hidden && Game.state==='battle'){
    Game.state='pause'; Game.menuIndex=0; Input.releaseTouch();
  }
});

Art.buildGrain(CFG.W,CFG.H);
jogoPronto = true;
fitStage();
requestAnimationFrame(loop);
