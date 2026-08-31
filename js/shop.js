/* ============================================================
   LOJA E ARMAS
   Pontos de Pesquisa (PP): você ganha 1 na primeira vez que
   derrota cada chefe. Gaste na LOJA do mapa.
   ============================================================ */
const WEAPONS = [
  {
    id:'plasma',
    name:'PLASMA PADRÃO',
    sub:'equilibrada',
    desc:'A arma do laboratório. Tiro rápido, dano médio, vai reto para onde você mira.',
    price:0,
    dmg:1.2, rate:6, speed:9.2, r:5.5, homing:0,
    color:'#f2c14b',
    bars:{dano:2, cadencia:4, mira:2}
  },
  {
    id:'mito',
    name:'CANHÃO MITOCÔNDRIA',
    sub:'muito dano, tiro lento',
    desc:'Dispara uma bolha de energia enorme. Bate MUITO mais forte, mas demora para recarregar. Erre pouco!',
    price:1,
    dmg:3.4, rate:15, speed:7.4, r:10, homing:0,
    color:'#e08b3c',
    bars:{dano:5, cadencia:1, mira:2}
  },
  {
    id:'rna',
    name:'RASTREADOR DE RNA',
    sub:'teleguiado, dano baixo',
    desc:'Fitas de RNA que perseguem o alvo sozinhas. Quase nunca erra, mas cada tiro machuca pouco.',
    price:1,
    dmg:0.75, rate:5, speed:6.4, r:5, homing:0.26,
    color:'#5f9e63',
    bars:{dano:1, cadencia:4, mira:5}
  }
];

const Shop = {
  points: 0,
  owned: ['plasma'],
  equipped: 'plasma',

  load(){
    try {
      const p = localStorage.getItem('clone_points');
      if (p !== null) this.points = parseInt(p,10) || 0;
      const o = localStorage.getItem('clone_owned');
      if (o) this.owned = JSON.parse(o);
      if (!this.owned.length) this.owned = ['plasma'];
      const e = localStorage.getItem('clone_weapon');
      if (e && this.owned.indexOf(e) >= 0) this.equipped = e;
    } catch(err){}
  },

  save(){
    try {
      localStorage.setItem('clone_points', String(this.points));
      localStorage.setItem('clone_owned', JSON.stringify(this.owned));
      localStorage.setItem('clone_weapon', this.equipped);
    } catch(err){}
  },

  get weapon(){
    return WEAPONS.find(w => w.id === this.equipped) || WEAPONS[0];
  },

  has(id){ return this.owned.indexOf(id) >= 0; },

  addPoints(n){ this.points += n; this.save(); },

  buy(id){
    const w = WEAPONS.find(x => x.id === id);
    if (!w || this.has(id) || this.points < w.price) return false;
    this.points -= w.price;
    this.owned.push(id);
    this.equipped = id;
    this.save();
    return true;
  },

  equip(id){
    if (!this.has(id)) return false;
    this.equipped = id;
    this.save();
    return true;
  }
};

Shop.load();
