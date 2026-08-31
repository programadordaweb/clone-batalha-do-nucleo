/* ============================================================
   AUDIO - tudo gerado em tempo real (Web Audio API).
   Nenhum arquivo externo: funciona offline em qualquer lugar.
   ============================================================ */
const Sound = (() => {

  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let ready = false;
  let muted = false;

  function init(){
    if (ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master    = ctx.createGain(); master.gain.value    = 0.8;  master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.30; musicGain.connect(master);
    sfxGain   = ctx.createGain(); sfxGain.gain.value   = 0.55; sfxGain.connect(master);
    ready = true;
    startScheduler();
  }

  function resume(){ if (ctx && ctx.state === 'suspended') ctx.resume(); }

  /* -------------------- EFEITOS -------------------- */
  function env(node, t, a, d, peak){
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    node.connect(g); g.connect(sfxGain);
    return g;
  }

  function tone(freq, opt){
    if (!ready || muted) return;
    opt = opt || {};
    const type  = opt.type  || 'square';
    const dur   = opt.dur   !== undefined ? opt.dur   : 0.12;
    const peak  = opt.peak  !== undefined ? opt.peak  : 0.3;
    const slide = opt.slide || 0;
    const delay = opt.delay || 0;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    env(o, t, 0.008, dur, peak);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(opt){
    if (!ready || muted) return;
    opt = opt || {};
    const dur    = opt.dur    !== undefined ? opt.dur : 0.2;
    const peak   = opt.peak   !== undefined ? opt.peak : 0.3;
    const filter = opt.filter !== undefined ? opt.filter : 1200;
    const type   = opt.type   || 'lowpass';
    const delay  = opt.delay  || 0;
    const t = ctx.currentTime + delay;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filter;
    src.connect(f);
    env(f, t, 0.005, dur, peak);
    src.start(t);
  }

  const SFX = {
    shoot(){
      tone(760, {type:'square', dur:0.07, peak:0.16, slide:-380});
      noise({dur:0.05, peak:0.06, filter:3000, type:'highpass'});
    },
    jump(){ tone(300, {type:'square', dur:0.13, peak:0.20, slide:340}); },
    land(){ noise({dur:0.08, peak:0.12, filter:600}); },
    dash(){
      noise({dur:0.22, peak:0.20, filter:1800, type:'bandpass'});
      tone(180, {type:'sawtooth', dur:0.18, peak:0.10, slide:420});
    },
    hitBoss(){
      tone(520, {type:'square', dur:0.05, peak:0.10, slide:-180});
      noise({dur:0.05, peak:0.08, filter:2500, type:'highpass'});
    },
    hurt(){
      tone(220, {type:'sawtooth', dur:0.32, peak:0.30, slide:-150});
      noise({dur:0.2, peak:0.15, filter:800});
    },
    parry(){
      tone(1046, {type:'triangle', dur:0.10, peak:0.28});
      tone(1568, {type:'triangle', dur:0.18, peak:0.22, delay:0.06});
      tone(2093, {type:'triangle', dur:0.22, peak:0.18, delay:0.12});
    },
    boom(){
      noise({dur:0.55, peak:0.42, filter:520});
      tone(90, {type:'sawtooth', dur:0.45, peak:0.28, slide:-60});
    },
    superShot(){
      for (let i = 0; i < 6; i++) tone(330 * Math.pow(1.26, i), {type:'sawtooth', dur:0.28, peak:0.16, delay:i*0.05});
      noise({dur:0.9, peak:0.25, filter:2200, type:'bandpass', delay:0.1});
    },
    select(){ tone(660, {type:'square', dur:0.06, peak:0.16}); },
    confirm(){
      tone(660, {type:'square', dur:0.07, peak:0.20});
      tone(990, {type:'square', dur:0.14, peak:0.18, delay:0.06});
    },
    phase(){ [523,659,784,1046].forEach((f,i) => tone(f, {type:'triangle', dur:0.30, peak:0.22, delay:i*0.09})); },
    split(){
      tone(420, {type:'sawtooth', dur:0.3, peak:0.2, slide:-260});
      noise({dur:0.3, peak:0.18, filter:900});
    },
    win(){ [523,659,784,1046,1318].forEach((f,i) => tone(f, {type:'triangle', dur:0.45, peak:0.24, delay:i*0.13})); },
    lose(){ [440,392,349,262].forEach((f,i) => tone(f, {type:'sawtooth', dur:0.5, peak:0.22, delay:i*0.20})); }
  };

  /* -------------------- MUSICA (jazz de desenho antigo) -------------------- */
  // ii-V-I em Re menor, 4 compassos
  const PROG = [
    {root:'D3', chord:[62,65,69,72]},   // Dm7
    {root:'G2', chord:[59,62,65,67]},   // G7
    {root:'C3', chord:[60,64,67,71]},   // Cmaj7
    {root:'A2', chord:[57,61,64,67]}    // A7
  ];
  const SCALE = [62,64,65,67,69,71,72,74,76,77];
  const NOTE  = {A2:110, C3:130.81, D3:146.83, G2:98};
  const midi  = n => 440 * Math.pow(2, (n - 69) / 12);

  const bpm = 128;
  let step = 0, nextTime = 0, timer = null;
  let track = 'none';       // menu | battle | none
  let intensity = 1;

  function mTone(freq, t, opt){
    opt = opt || {};
    const o = ctx.createOscillator();
    o.type = opt.type || 'triangle';
    o.frequency.value = freq;
    o.detune.value = opt.detune || 0;
    const dur  = opt.dur  !== undefined ? opt.dur  : 0.2;
    const peak = opt.peak !== undefined ? opt.peak : 0.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function mNoise(t, dur, peak, filter){
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = filter;
    const g = ctx.createGain(); g.gain.value = peak;
    s.connect(f); f.connect(g); g.connect(musicGain);
    s.start(t);
  }

  function scheduleStep(s, t){
    const bar  = Math.floor(s / 8) % PROG.length;
    const beat = s % 8;
    const ch   = PROG[bar];

    // contrabaixo caminhante
    if (beat % 2 === 0){
      const base = NOTE[ch.root];
      const walk = [1, 1.122, 1.26, 1.335][(beat / 2) | 0];
      mTone(base * walk, t, {type:'triangle', dur:0.26, peak:0.34});
    }
    // prato / chimbau
    mNoise(t, 0.05, beat % 2 === 0 ? 0.055 : 0.03, 7000);
    // caixa
    if (beat === 4) mNoise(t, 0.10, 0.075, 2000);

    if (track === 'battle'){
      if (beat === 1 || beat === 5 || (intensity > 1 && beat === 3)){
        ch.chord.forEach((n, i) => mTone(midi(n), t, {type:'square', dur:0.16, peak:0.055, detune:i*3}));
      }
      if (beat % 2 === 1 && Math.random() < 0.55 * intensity){
        const n = SCALE[Math.floor(Math.random() * SCALE.length)];
        mTone(midi(n), t, {type:'sawtooth', dur:0.16, peak:0.075});
      }
      if (intensity > 1.4 && beat === 7) mNoise(t, 0.14, 0.07, 3200);
    } else if (track === 'menu'){
      if (beat === 2 || beat === 6){
        ch.chord.forEach((n, i) => mTone(midi(n), t, {type:'triangle', dur:0.34, peak:0.05, detune:i*4}));
      }
      if (beat === 0) mTone(midi(SCALE[((s / 8) | 0) % SCALE.length]), t, {type:'triangle', dur:0.4, peak:0.07});
    }
  }

  function startScheduler(){
    if (timer) return;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      if (!ready || muted || track === 'none'){
        nextTime = Math.max(nextTime, ctx.currentTime + 0.1);
        return;
      }
      const spb = 60 / bpm / 2;
      while (nextTime < ctx.currentTime + 0.25){
        scheduleStep(step, nextTime);
        step++;
        nextTime += spb;
      }
    }, 60);
  }

  return {
    init, resume, sfx: SFX,
    play(name, inten){ track = name; intensity = inten || 1; },
    stop(){ track = 'none'; },
    setIntensity(v){ intensity = v; },
    toggleMute(){
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    get muted(){ return muted; },
    get ready(){ return ready; }
  };
})();
