# CLONE! — A Batalha do Núcleo

Jogo de ação e chefões no estilo dos desenhos animados dos anos 30 (tipo *Cuphead*),
com tema de **CLONAGEM**: mitose, DNA, transferência nuclear e a ovelha Dolly.

Feito 100% em HTML5 + Canvas + JavaScript puro. **Sem instalação, sem internet, sem bibliotecas.**

---

## Como abrir

**No PC:** dê dois cliques em `index.html`. O jogo se ajusta sozinho à janela,
sempre em proporção 16:9 (sem esticar e sem cortar). No menu há a opção **TELA CHEIA**.

**No celular** (o áudio e o toque funcionam melhor por HTTP):

1. No PC, dentro desta pasta, rode:

```bash
python -m http.server 8000
```

2. Descubra o IP do PC (`ipconfig` no Windows) e, no celular ligado no **mesmo Wi‑Fi**, abra:
   `http://SEU_IP:8000`
3. Vire o celular na horizontal. Ao escolher o chefe o jogo entra em tela cheia sozinho.

Também funciona hospedado em qualquer lugar (GitHub Pages, Netlify, Vercel) — é só site estático.

---

## Controles (as quatro formas funcionam ao mesmo tempo)

| Ação | Teclado | **Mouse** | Celular | Controle |
|---|---|---|---|---|
| Mover | Setas ou `A` `D` | — | D‑pad na tela | Analógico / direcional |
| Mirar | `↑` `↓` | **mover o cursor** (mira livre 360°) | Setas cima/baixo | Analógico |
| Atirar | `Z` ou `J` | **BOTÃO ESQUERDO** | Botão TIRO | X (Xbox) / Quadrado |
| Super | `V` ou `I` | **BOTÃO DIREITO** | Botão SUPER | Y / LB |
| Pular | `X`, `K` ou `Espaço` | — | Botão PULO | A (Xbox) / X (PS) |
| Dash | `C`, `L` ou `Shift` | — | Botão DASH | B / RB |
| Pausar | `Enter`, `P` ou `Esc` | — | Botão **II** | Start |
| Menus | Setas + `Enter` | clique | toque na opção | Direcional + A |

### A interface troca sozinha
O jogo percebe o que você está usando e se adapta na hora:

- **Tocou a tela** → aparecem os botões de celular (D-pad, TIRO, PULO, DASH, SUPER, pausa).
- **Apertou uma tecla, mexeu o mouse ou usou o controle** → os botões somem e a tela fica limpa.
- Um aviso rápido no canto mostra o modo atual (MODO TECLADO, MODO CONTROLE, MODO CELULAR…).
- Os textos de ajuda também mudam ("TOQUE PARA LUTAR" x "APERTE PULAR / ENTER").

Isso vale nos dois sentidos e quantas vezes quiser — dá para jogar de teclado num
notebook com tela sensível ao toque e voltar para os botões só encostando o dedo.

Quando você mexe o mouse, a mira passa a seguir o cursor (aparece uma cruz na tela);
se apertar as setas de novo, volta a mira do teclado. O controle é detectado sozinho
(Gamepad API), com vibração no controle e no celular.

### Mecânica principal: APARAR (parry)
Projéteis **ROSA** podem ser aparados: pule e, **no ar**, aperte PULAR de novo perto deles.
Cada defesa dá um pulo extra e enche o medidor de **SUPER**. Com o super cheio, use a
**MITOSE REVERSA** — um feixe de DNA que sai **na direção em que você está mirando**
(com o mouse dá para apontar em qualquer ângulo; no teclado/controle segue a mira das setas).

---

## O mapa: Ilha do Laboratório

O **JOGAR** abre um mini-mapa onde você anda com o personagem pelas trilhas
(setas / D-pad / analógico — ou clique/toque direto no lugar) e entra nos locais
apertando PULAR / ENTER:

- **LABORATÓRIO** — onde você começa.
- **BIBLIOTECA** — as fichas de ciência da clonagem.
- **LOJA** — compra de armas (aparece um **!** quando você tem pontos para gastar).
- **NUCLEUS-9** — primeiro chefe.
- **PORTÃO TRANCADO** — o caminho para o segundo chefe só abre depois que você vence o NUCLEUS-9.
- **DOLLY-96** — segundo chefe (fica com um **?** enquanto está trancado).

Cada chefe derrotado ganha um carimbo **K.O.** no mapa e o recorde de tempo fica salvo.

## A loja do Dr. Bacilo

Ao vencer um chefe **pela primeira vez** você ganha **1 Ponto de Pesquisa (PP)**.
Na loja dá para trocar por armas (a compra já equipa; depois é só escolher qual usar):

| Arma | Preço | Dano | Cadência | Como é |
|---|---|---|---|---|
| **PLASMA PADRÃO** | grátis | 1,2 | rápida | A inicial, equilibrada, vai reto na mira |
| **CANHÃO MITOCÔNDRIA** | 1 PP | **3,4** | lenta | Bolha enorme que bate muito forte — não pode errar |
| **RASTREADOR DE RNA** | 1 PP | 0,75 | rápida | Tiro **teleguiado**: persegue o alvo sozinho, mas machuca pouco |

A arma equipada aparece no HUD durante a luta e o progresso (pontos, armas
compradas e arma equipada) fica salvo no navegador.

## Os dois chefes

Cada um tem 3 fases e um cartão explicando a ciência antes de cada fase.

### 1) NUCLEUS-9 — O Clone Mestre
| Fase | Forma | Ciência | Ataques |
|---|---|---|---|
| 1 | Célula gigante | **Mitose**: divisão que gera clones idênticos | Cromossomos em X, Mitose (spawna clones), chuva de citoplasma, investida |
| 2 | Dupla hélice | **DNA**: pares A‑T e C‑G, replicação | Onda de bases, enzimas de restrição, feixe de replicação, plasmídeos |
| 3 | Clone Mestre | **Transferência nuclear** | Cria um **clone de você**, anéis de clonagem, fogo cruzado, tempestade |

### 2) DOLLY-96 — A Ovelha Replicante
| Fase | Forma | Ciência | Ataques |
|---|---|---|---|
| 1 | A ovelha gigante | **Dolly (1996)**: 1º mamífero clonado de célula adulta | Rajada de lã, pulo sísmico (onda no chão), rebanho de clones, balido de óvulos |
| 2 | Máquina de SCNT | **Como se clona**: tira o núcleo do óvulo, injeta o núcleo adulto, choque elétrico | Micropipeta (raio vertical), chuva de óvulos, fusão elétrica, placas de Petri |
| 3 | O rebanho | **277 tentativas para 1 Dolly** | Debandada de clones, tempestade de lã, méééga balido, cópias da Dolly |

No menu há ainda **CIÊNCIA DA CLONAGEM**: 10 fichas de estudo (clones naturais,
mitose × meiose, como Dolly foi feita, reprodutiva × terapêutica, epigenética,
por que clonar é difícil, ética e a Lei de Biossegurança 11.105/2005).

Dificuldade: **ESTAGIÁRIO** (4 vidas) ou **CIENTISTA** (3 vidas, inimigos mais rápidos).

Para começar tudo de novo existe **APAGAR PROGRESSO** no menu do título: ele pede
confirmação e apaga chefes vencidos, recordes, Pontos de Pesquisa e armas compradas,
voltando o jogo ao estado da primeira vez.

---

## Créditos e fontes

Ao derrotar **os dois chefes** o jogo mostra os créditos (também dá para abrir
a qualquer momento em **CRÉDITOS E FONTES**, no menu do título):

- **Criação:** Gustavo Bevilaqua e grupo
- **Fontes das informações:**
  - WILMUT, I. et al. "Viable offspring derived from fetal and adult mammalian cells". *Nature*, v. 385, p. 810-813, 1997.
  - THE ROSLIN INSTITUTE (Universidade de Edimburgo). *The Life of Dolly*. roslin.ed.ac.uk
  - NATIONAL HUMAN GENOME RESEARCH INSTITUTE (NIH). *Cloning Fact Sheet*. genome.gov
  - NATIONAL MUSEUMS SCOTLAND. *Dolly the sheep*. nms.ac.uk
  - BRASIL. Lei nº 11.105, de 24 de março de 2005 (Lei de Biossegurança). planalto.gov.br
  - ALBERTS, B. et al. *Biologia Molecular da Célula*. Porto Alegre: Artmed.
  - AMABIS, J. M.; MARTHO, G. R. *Biologia Moderna*. São Paulo: Moderna.

## Arquivos

```
index.html        estrutura + botões de toque
css/style.css     visual e controles na tela
js/input.js       teclado + mouse + toque + controle, unificados
js/audio.js       música jazz e efeitos gerados na hora (Web Audio, sem MP3)
js/art.js         traço cartoon, papel envelhecido, granulado de filme
js/shop.js        armas, pontos de pesquisa e save da loja
js/entities.js    jogador, tiros (inclusive teleguiados), partículas
js/boss.js        NUCLEUS-9 e DOLLY-96, projéteis e clones
js/map.js         a Ilha do Laboratório (mapa navegável)
js/game.js        telas, loja, HUD, colisões, cartões educativos
```

Tudo é desenhado por código — não existe nenhuma imagem ou som em arquivo,
então o jogo roda offline e pesa poucos KB.
