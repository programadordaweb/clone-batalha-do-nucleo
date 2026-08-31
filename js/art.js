/* ============================================================
   ART - desenho estilo cartoon dos anos 30 (traço grosso,
   papel envelhecido, "fervura" da linha, vinheta e granulado).
   Tudo desenhado por codigo: nenhuma imagem externa.
   ============================================================ */
const Art = (() => {

  const PAL = {
    ink:      '#1c1410',
    paper:    '#f2e3bd',
    paper2:   '#e6d2a4',
    cream:    '#fff6dd',
    red:      '#c9432f',
    redDark:  '#8f2a1c',
    orange:   '#e08b3c',
    yellow:   '#f2c14b',
    green:    '#5f9e63',
    greenDk:  '#3d6b45',
    blue:     '#4a7fa8',
    blueDk:   '#2f5675',
    purple:   '#7d5f9e',
    pink:     '#e3799f',
    pinkHot:  '#ff5fa2',
    skin:     '#f0c9a0',
    white:    '#fdf6e6',
    shadow:   'rgba(28,20,16,.22)'
  };

  // ------------------------------------------------------------------
  // "Fervura" da linha: valor pseudo-aleatorio estavel por (seed, frame)
  // ------------------------------------------------------------------
  let boilFrame = 0;
  function setBoil(f){ boilFrame = Math.floor(f / 5); }   // troca a cada 5 quadros
  function rnd(seed){
    const x = Math.sin(seed * 12.9898 + boilFrame * 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;   // -1..1
  }

  function ink(ctx, w){
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = w || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  // ------------------------------------------------------------------
  // Formas organicas (celulas, nucleos, bolhas)
  // ------------------------------------------------------------------
  function blobPath(ctx, x, y, rx, ry, pts, wob, seed){
    pts = pts || 12; wob = wob === undefined ? 2 : wob; seed = seed || 1;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++){
      const a = (i / pts) * Math.PI * 2;
      const r = 1 + rnd(seed + i * 7.3) * (wob / 100) * 6;
      const px = x + Math.cos(a) * rx * r;
      const py = y + Math.sin(a) * ry * r;
      if (i === 0) ctx.moveTo(px, py);
      else {
        const pa = ((i - 1) / pts) * Math.PI * 2;
        const pr = 1 + rnd(seed + (i - 1) * 7.3) * (wob / 100) * 6;
        const cx = x + Math.cos((a + pa) / 2) * rx * ((r + pr) / 2) * 1.06;
        const cy = y + Math.sin((a + pa) / 2) * ry * ((r + pr) / 2) * 1.06;
        ctx.quadraticCurveTo(cx, cy, px, py);
      }
    }
    ctx.closePath();
  }

  function blob(ctx, x, y, rx, ry, fill, lw, pts, wob, seed){
    blobPath(ctx, x, y, rx, ry, pts, wob, seed);
    if (fill){ ctx.fillStyle = fill; ctx.fill(); }
    if (lw !== 0){ ink(ctx, lw || 3); ctx.stroke(); }
  }

  function circle(ctx, x, y, r, fill, lw){
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill){ ctx.fillStyle = fill; ctx.fill(); }
    if (lw !== 0){ ink(ctx, lw || 3); ctx.stroke(); }
  }

  function ellipse(ctx, x, y, rx, ry, fill, lw, rot){
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    if (fill){ ctx.fillStyle = fill; ctx.fill(); }
    if (lw !== 0){ ink(ctx, lw || 3); ctx.stroke(); }
  }

  // membro de borracha (rubber hose)
  function hose(ctx, x1, y1, x2, y2, bend, w, color){
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx + nx * bend, my + ny * bend, x2, y2);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = w + 3; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.stroke();
  }

  // ------------------------------------------------------------------
  // Texto de cartaz antigo
  // ------------------------------------------------------------------
  function text(ctx, str, x, y, opt){
    opt = opt || {};
    const size   = opt.size || 20;
    const color  = opt.color || PAL.cream;
    const align  = opt.align || 'center';
    const stroke = opt.stroke === undefined ? 4 : opt.stroke;
    const font   = opt.font || '900 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    const rot    = opt.rot || 0;
    const shadow = opt.shadow;

    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = opt.baseline || 'middle';
    if (shadow){
      ctx.fillStyle = shadow;
      ctx.fillText(str, 3, 3);
    }
    if (stroke > 0){
      ctx.lineWidth = stroke; ctx.lineJoin = 'round';
      ctx.strokeStyle = opt.inkColor || PAL.ink;
      ctx.strokeText(str, 0, 0);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, 0, 0);
    ctx.restore();
  }

  function measure(ctx, str, size, font){
    ctx.save();
    ctx.font = font || ('900 ' + size + 'px "Trebuchet MS", Verdana, sans-serif');
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }

  // texto que quebra em varias linhas
  function paragraph(ctx, str, x, y, maxW, opt){
    opt = opt || {};
    const size = opt.size || 12;
    const lh   = opt.lh || size * 1.45;
    const font = '600 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    const words = str.split(' ');
    let line = '', ly = y, lines = 0;
    ctx.save(); ctx.font = font;
    for (let i = 0; i < words.length; i++){
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line){
        text(ctx, line, x, ly, {size, font, color:opt.color || PAL.ink, stroke:opt.stroke || 0, align:opt.align || 'left'});
        line = words[i]; ly += lh; lines++;
      } else line = test;
    }
    if (line){ text(ctx, line, x, ly, {size, font, color:opt.color || PAL.ink, stroke:opt.stroke || 0, align:opt.align || 'left'}); lines++; }
    ctx.restore();
    return lines * lh;
  }

  // ------------------------------------------------------------------
  // Textura de papel + granulado de filme (pre-renderizados)
  // ------------------------------------------------------------------
  let grainTiles = [], grainIdx = 0;

  function buildGrain(w, h){
    grainTiles = [];
    for (let n = 0; n < 4; n++){
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      const img = g.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4){
        const v = Math.random();
        const on = v > 0.965;
        img.data[i] = img.data[i+1] = img.data[i+2] = v > 0.98 ? 255 : 0;
        img.data[i+3] = on ? 26 + Math.random() * 40 : 0;
      }
      g.putImageData(img, 0, 0);
      // riscos verticais do filme
      g.globalAlpha = 0.10; g.fillStyle = '#1c1410';
      for (let s = 0; s < 3; s++){
        const sx = Math.random() * w;
        g.fillRect(sx, 0, 1, h);
      }
      grainTiles.push(c);
    }
  }

  function grain(ctx, w, h, frame){
    if (!grainTiles.length) buildGrain(w, h);
    if (frame % 3 === 0) grainIdx = (grainIdx + 1) % grainTiles.length;
    ctx.globalAlpha = 0.55;
    ctx.drawImage(grainTiles[grainIdx], 0, 0);
    ctx.globalAlpha = 1;
  }

  function vignette(ctx, w, h, strength){
    const g = ctx.createRadialGradient(w/2, h/2, h*0.30, w/2, h/2, h*0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(30,18,10,' + (strength === undefined ? 0.55 : strength) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // brilho sepia geral
  function sepia(ctx, w, h, a){
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(232,205,150,' + (a || 0.16) + ')';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ------------------------------------------------------------------
  // Efeitos de cartaz
  // ------------------------------------------------------------------
  function sunburst(ctx, x, y, r, rays, rot, color, alpha){
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.14 : alpha;
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = color || PAL.cream;
    const step = Math.PI * 2 / rays;
    for (let i = 0; i < rays; i++){
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * step, i * step + step * 0.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function ribbon(ctx, x, y, w, h, color){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w/2, y - h/2);
    ctx.lineTo(x + w/2, y - h/2);
    ctx.lineTo(x + w/2 + h*0.35, y);
    ctx.lineTo(x + w/2, y + h/2);
    ctx.lineTo(x - w/2, y + h/2);
    ctx.lineTo(x - w/2 - h*0.35, y);
    ctx.closePath();
    ctx.fillStyle = color || PAL.red; ctx.fill();
    ink(ctx, 3); ctx.stroke();
    ctx.restore();
  }

  // molde de "cartao de titulo" antigo
  function cardFrame(ctx, x, y, w, h, fill){
    ctx.save();
    ctx.fillStyle = 'rgba(28,20,16,.35)';
    ctx.fillRect(x + 5, y + 6, w, h);
    ctx.fillStyle = fill || PAL.paper;
    ctx.fillRect(x, y, w, h);
    ink(ctx, 4); ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
    ctx.restore();
  }

  return {
    PAL, setBoil, rnd, ink, blob, blobPath, circle, ellipse, hose,
    text, measure, paragraph, grain, vignette, sepia, sunburst, ribbon, cardFrame,
    buildGrain
  };
})();
