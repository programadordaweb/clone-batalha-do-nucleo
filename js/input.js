/* ============================================================
   INPUT — teclado + MOUSE + toque + controle (gamepad), unificado.
   Uso:  Input.held.jump    -> botão está segurado
         Input.pressed.jump -> foi apertado NESTE quadro
         Input.mouse        -> {x,y} em coordenadas do jogo (640x360)
         Input.usingMouse   -> true quando o jogador está mirando com o mouse
   ============================================================ */
const Input = (() => {

  const ACTIONS = ['left','right','up','down','jump','shoot','dash','super','pause','confirm','back'];

  const blank = () => ACTIONS.reduce((o,a)=>(o[a]=false,o), {});

  const kb   = blank();   // teclado
  const tc   = blank();   // toque
  const gp   = blank();   // controle
  const ms   = blank();   // mouse
  const held = blank();
  const prev = blank();
  const pressed = blank();

  // aparelho com tela sensivel ao toque comeca no modo TOQUE;
  // PC comeca no modo TECLADO. Depois troca sozinho conforme o uso.
  const COARSE_PTR = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  let lastDevice = COARSE_PTR ? 'touch' : 'keyboard';   // keyboard | mouse | touch | gamepad
  let anyKeyFlag = false;
  let usingMouse = false;
  let deviceChanged = 0;        // conta trocas de aparelho (para avisos na tela)

  function setDevice(d){
    if (lastDevice !== d){ lastDevice = d; deviceChanged++; }
  }

  const mouse = {x:320, y:180};

  /* ---------- TECLADO ---------- */
  const KEYMAP = {
    'ArrowLeft':['left'],  'KeyA':['left'],
    'ArrowRight':['right'],'KeyD':['right'],
    'ArrowUp':['up'],      'KeyW':['up'],
    'ArrowDown':['down'],  'KeyS':['down'],
    'KeyZ':['shoot'],      'KeyJ':['shoot'],
    'KeyX':['jump','confirm'], 'KeyK':['jump','confirm'], 'Space':['jump','confirm'],
    'KeyC':['dash'],       'KeyL':['dash'], 'ShiftLeft':['dash'], 'ShiftRight':['dash'],
    'KeyV':['super'],      'KeyI':['super'],
    'Enter':['confirm','pause'],
    'Escape':['back','pause'],
    'KeyP':['pause'],
    'Backspace':['back']
  };

  // teclas que devolvem a mira para o teclado
  const AIMKEYS = {ArrowUp:1, ArrowDown:1, KeyW:1, KeyS:1};

  addEventListener('keydown', e => {
    const acts = KEYMAP[e.code];
    if (acts){
      e.preventDefault();
      acts.forEach(a => kb[a]=true);
      setDevice('keyboard');
      if (AIMKEYS[e.code]) usingMouse = false;
    }
    anyKeyFlag = true;
  }, {passive:false});

  addEventListener('keyup', e => {
    const acts = KEYMAP[e.code];
    if (acts){ e.preventDefault(); acts.forEach(a => kb[a]=false); }
  }, {passive:false});

  addEventListener('blur', () => {
    ACTIONS.forEach(a => { kb[a]=false; tc[a]=false; ms[a]=false; });
  });

  /* ---------- MOUSE (PC) ----------
     Botão ESQUERDO = atirar   |   Botão DIREITO = super
     A mira segue o cursor enquanto o mouse estiver sendo usado.        */
  const canvasEl = document.getElementById('game');

  function toGame(e){
    if (!canvasEl) return;
    const r = canvasEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const gw = (typeof CFG !== 'undefined') ? CFG.W : 640;
    const gh = (typeof CFG !== 'undefined') ? CFG.H : 360;
    mouse.x = (e.clientX - r.left) * (gw / r.width);
    mouse.y = (e.clientY - r.top)  * (gh / r.height);
  }

  function bindMouse(){
    if (!canvasEl) return;

    canvasEl.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      toGame(e);
      usingMouse = true;
      setDevice('mouse');
    });

    canvasEl.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      toGame(e);
      usingMouse = true;
      setDevice('mouse');
      if (e.button === 0) ms.shoot = true;
      if (e.button === 2){ ms.super = true; e.preventDefault(); }
    });

    // soltar em qualquer lugar (mesmo fora do canvas)
    addEventListener('pointerup', e => {
      if (e.pointerType !== 'mouse') return;
      if (e.button === 0) ms.shoot = false;
      if (e.button === 2) ms.super = false;
    });
    addEventListener('pointercancel', () => { ms.shoot = false; ms.super = false; });

    // nada de menu do botão direito em cima do jogo
    canvasEl.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('contextmenu', e => {
      if (e.target === canvasEl || (e.target && e.target.closest && e.target.closest('#stage')))
        e.preventDefault();
    });
  }

  /* ---------- TOQUE ---------- */
  // qualquer toque de dedo em qualquer lugar volta o jogo para o modo TOQUE
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch'){ setDevice('touch'); usingMouse = false; }
  }, true);

  const touchRoot = document.getElementById('touch');
  const btnAct = new Map();   // pointerId -> action

  function bindTouch(){
    if (!touchRoot) return;
    touchRoot.querySelectorAll('[data-act]').forEach(el => {
      const act = el.dataset.act;

      const down = e => {
        e.preventDefault();
        el.classList.add('pressed');
        btnAct.set(e.pointerId, {act, el});
        setAct(act, true);
        setDevice('touch');
        usingMouse = false;
        if (navigator.vibrate) navigator.vibrate(8);
        try { el.setPointerCapture(e.pointerId); } catch(_){}
      };
      const up = e => {
        e.preventDefault();
        el.classList.remove('pressed');
        btnAct.delete(e.pointerId);
        setAct(act, false);
        try { el.releasePointerCapture(e.pointerId); } catch(_){}
      };

      el.addEventListener('pointerdown',   down, {passive:false});
      el.addEventListener('pointerup',     up,   {passive:false});
      el.addEventListener('pointercancel', up,   {passive:false});
      el.addEventListener('pointerleave',  e => { if(btnAct.has(e.pointerId)) up(e); }, {passive:false});
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
  }

  function setAct(act, val){
    tc[act] = val;
    if (act === 'jump') tc.confirm = val;
    if (act === 'pause') tc.back = val;
  }

  /* ---------- CONTROLE (Gamepad API) ---------- */
  const DEAD = 0.35;
  let padIndex = null;

  addEventListener('gamepadconnected',    e => { padIndex = e.gamepad.index; });
  addEventListener('gamepaddisconnected', e => { if (padIndex === e.gamepad.index) padIndex = null; });

  function pollPad(){
    ACTIONS.forEach(a => gp[a] = false);
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let pad = null;
    for (const p of pads){ if (p && p.connected){ pad = p; break; } }
    if (!pad) return;

    const b = i => pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.4);
    const ax = i => pad.axes[i] !== undefined ? pad.axes[i] : 0;

    gp.left  = ax(0) < -DEAD || b(14);
    gp.right = ax(0) >  DEAD || b(15);
    gp.up    = ax(1) < -DEAD || b(12);
    gp.down  = ax(1) >  DEAD || b(13);

    gp.jump  = b(0);                    // A / X(PS)
    gp.shoot = b(2) || b(7);            // X(Xbox) / Quadrado / RT
    gp.dash  = b(1) || b(5) || b(6);    // B / RB / LT
    gp.super = b(3) || b(4);            // Y / LB
    gp.pause = b(9);                    // Start
    gp.back  = b(8) || b(1);            // Select / B
    gp.confirm = b(0) || b(9);

    if (ACTIONS.some(a => gp[a])){ setDevice('gamepad'); usingMouse = false; }
  }

  function rumble(ms2, strong, weak){
    ms2 = ms2 || 120; strong = strong===undefined?0.5:strong; weak = weak===undefined?0.3:weak;
    if (navigator.vibrate && lastDevice === 'touch') navigator.vibrate(ms2);
    if (!navigator.getGamepads) return;
    for (const p of navigator.getGamepads()){
      if (p && p.vibrationActuator){
        try {
          p.vibrationActuator.playEffect('dual-rumble',
            {duration:ms2, strongMagnitude:strong, weakMagnitude:weak});
        } catch(_){}
      }
    }
  }

  /* ---------- ATUALIZAÇÃO POR QUADRO ---------- */
  function update(){
    pollPad();
    for (const a of ACTIONS){
      prev[a]    = held[a];
      held[a]    = kb[a] || tc[a] || gp[a] || ms[a];
      pressed[a] = held[a] && !prev[a];
    }
  }

  function anyPressed(){ return ACTIONS.some(a => pressed[a]); }

  function clear(){
    ACTIONS.forEach(a => { kb[a]=tc[a]=gp[a]=ms[a]=held[a]=prev[a]=false; pressed[a]=false; });
  }

  function releaseTouch(){
    ACTIONS.forEach(a => tc[a] = false);
    btnAct.clear();
    if (touchRoot) touchRoot.querySelectorAll('.pressed').forEach(el => el.classList.remove('pressed'));
  }

  bindTouch();
  bindMouse();

  return {
    ACTIONS, held, pressed, update, rumble, anyPressed, clear, releaseTouch, mouse,
    get usingMouse(){ return usingMouse; },
    get isTouchMode(){ return lastDevice === 'touch'; },
    get deviceChanged(){ return deviceChanged; },
    get coarse(){ return COARSE_PTR; },
    set usingMouse(v){ usingMouse = !!v; },
    get device(){ return lastDevice; },
    get hadInput(){ return anyKeyFlag; }
  };
})();
