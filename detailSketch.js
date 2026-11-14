// detailSketch.js
let river;                    // il fiume di questa pagina
let maxLen, maxArea;          // record del dataset
let nomeLungo, nomeArea;      // nomi dei fiumi che detengono i record
let hoverQ = null;            // risposta della domanda sotto il cursore

const CSV_URL = 'assets/data.csv';
const COL_BG = '#12234a';
const COL_GRIGIO = '#d9d9d9';
const COL_TESTI = '#ffffff';
const COL_TESTI_2 = '#bec8e1';

// stesse classi di colore della pagina 1
const SOGLIE = [8, 14, 20];
const COLORI_CLASSI = ['#6a9fd8', '#f2c879', '#f08a6c', '#c2456f'];

const NUM_GOCCE = 200;        // 200 gocce = area massima
let goccePerRiga = 20;        // gocce in ogni riga (10 righe in tutto)
const KM_ONDA = 500;          // 1 onda = 500 km (unità di misura della lunghezza)
let margin = 40;

// y dell'ultima riga di gocce: la stessa formula usata in disegnaArea
function yUltimaRigaGocce() {
  let w = width * 0.38;
  let passo = w / goccePerRiga;
  let s = passo * 0.75;
  return height * 0.53 + 56 + (NUM_GOCCE / goccePerRiga - 1) * s * 1.4;
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica, Arial, sans-serif');

  // link per tornare alla pagina 1, allineato all'ultima riga di gocce
  let indietro = createA('index.html', '← All rivers');
  indietro.style('font-size', '15px');    // come la didascalia
  indietro.position(margin, yUltimaRigaGocce());

  let data = await loadTable(CSV_URL, ",", "header");

  // parametro della pagina: detail.html?id=...
  let id = new URLSearchParams(window.location.search).get('id');

  maxLen = 0;
  maxArea = 0;
  for (let i = 0; i < data.getRowCount(); i++) {
    let len = data.getNum(i, "length");
    let area = data.getNum(i, "area");
    let nome = data.getString(i, "name");

    // nome del fiume record: serve per il tooltip delle domande
    if (len > maxLen) { maxLen = len; nomeLungo = nome; }
    if (area > maxArea) { maxArea = area; nomeArea = nome; }

    if (data.getString(i, "id") === id) {
      let min = data.getNum(i, "min_temp");
      let max = data.getNum(i, "max_temp");
      river = {
        nome: nome,
        len: len,
        area: area,
        colore: colorePerMedia((min + max) / 2)
      };
    }
  }
}

function draw() {
  background(COL_BG);
  if (!river) return;   // dati non ancora caricati o id non trovato

  hoverQ = null;

  // colonna sinistra = nome (fissa), grafici più a destra
  let nomeW = width * 0.28 - margin;
  let barX = width * 0.35;
  let barW = width * 0.38;
  let qX = barX + barW + 30;

  disegnaTesti(nomeW);
  disegnaLunghezza(barX, barW, qX);
  disegnaArea(barX, barW, qX);
  disegnaTooltip();

  cursor(hoverQ ? HAND : ARROW);
}

function disegnaTesti(nomeW) {
  noStroke();
  textAlign(LEFT, TOP);

  // titolo, come nella pagina 1
  fill(COL_TESTI);
  textSize(34);
  textStyle(BOLD);
  text('A closer look at the rivers: how this river compares', margin, 34);

  // descrizione piccola e sbiadita, come il sottotitolo della pagina 1
  textSize(15);
  textStyle(NORMAL);
  fill(COL_TESTI_2);
  text('Each measure is rounded to whole units, so rivers can be compared at a glance. Grey marks the maximum among the rivers analysed. Hover over a question to find the answer.', margin, 78, width - 2 * margin);

  // nome del fiume nella colonna fissa, centrato sulla fascia dei grafici
  fill(COL_TESTI);
  textSize(34);
  textStyle(BOLD);
  let righe = vaACapo(river.nome, nomeW);
  let hTesto = righe.length * 40;
  let yNome = height * 0.60 - hTesto / 2;
  for (let i = 0; i < righe.length; i++) {
    text(righe[i], margin, yNome + i * 40);
  }
  textStyle(NORMAL);
}

// spezza il nome in righe: va a capo sugli spazi e dopo i trattini lunghi,
// senza mai tagliare una parola
function vaACapo(testo, maxW) {
  let pezzi = testo.replace(/–/g, '– ').split(' ');
  let righe = [];
  let riga = '';
  for (let p of pezzi) {
    if (p === '') continue;
    let prova = riga === '' ? p : riga + (riga.endsWith('–') ? '' : ' ') + p;
    if (textWidth(prova) <= maxW || riga === '') {
      riga = prova;
    } else {
      righe.push(riga);
      riga = p;
    }
  }
  if (riga !== '') righe.push(riga);
  return righe;
}

function disegnaLunghezza(x, w, qX) {
  let y = height * 0.38;

  // titolo in alto a sinistra
  noStroke();
  fill(COL_TESTI);
  textSize(18);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text('Length: ' + river.len.toLocaleString('en') + ' km', x, y);
  textStyle(NORMAL);

  // legenda in alto a destra, allineata alla fine della barra
  legendaOnda(x + w - 92, y + 13, 40);
  fill(COL_TESTI_2);
  textSize(12);
  textAlign(LEFT, TOP);
  text('≈ ' + KM_ONDA + ' km', x + w - 40, y + 7);

  // onde intere: ogni onda = KM_ONDA km
  let ondeMax = round(maxLen / KM_ONDA);              // onde del massimo
  let onde = round(river.len / KM_ONDA);              // onde di questo fiume
  let unaOnda = w / ondeMax;                          // larghezza di una onda in pixel
  barraOndulata(x, y + 48, w, unaOnda, COL_GRIGIO);
  barraOndulata(x, y + 48, onde * unaOnda, unaOnda, river.colore);

  // la domanda non compare se questo fiume è il più lungo
  if (river.len < maxLen) {
    domanda("What's the longest river?", qX, y + 63,
      'The longest river among those analysed is the ' + nomeLungo + ', ' + maxLen.toLocaleString('en') + ' km.');
  }
}

// anteprima di una singola onda, disegnata solo col bordo bianco
function legendaOnda(x, y, larghezza) {
  let ampiezza = 3;

  noFill();
  stroke(COL_TESTI);
  strokeWeight(2);
  beginShape();
  for (let px = 0; px <= larghezza; px += 3) {
    vertex(x + px, y - cos(px / larghezza * TWO_PI) * ampiezza);
  }
  endShape();
  noStroke();
}

// anteprima di una singola goccia, disegnata solo col bordo bianco
function legendaGoccia(x, y, s) {
  let ctx = drawingContext;
  ctx.strokeStyle = COL_TESTI;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.7);
  ctx.lineTo(x + s * 0.5, y);
  ctx.arc(x, y, s * 0.5, 0, PI);
  ctx.lineTo(x, y - s * 0.7);
  ctx.closePath();
  ctx.stroke();
}

// barra: una sola forma chiusa, con il bordo superiore ondulato
// una onda ogni "unaOnda" pixel; il bordo parte sempre dall'inizio di un'onda
function barraOndulata(x, y, lunghezza, unaOnda, colore) {
  let ampiezza = 3;    // altezza delle ondine
  let altezza = 30;    // altezza del rettangolo

  noStroke();
  fill(colore);
  beginShape();
  vertex(x, y + altezza);                       // angolo in basso a sinistra
  for (let px = 0; px <= lunghezza; px += 3) {
    vertex(x + px, y - cos(px / unaOnda * TWO_PI) * ampiezza);
  }
  vertex(x + lunghezza, y + altezza);           // angolo in basso a destra
  endShape(CLOSE);
}

function disegnaArea(x, w, qX) {
  let y = height * 0.53;

  // titolo in alto a sinistra
  noStroke();
  fill(COL_TESTI);
  textSize(18);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text('Area: ' + river.area.toLocaleString('en') + ' km²', x, y);
  textStyle(NORMAL);

  // legenda in alto a destra, allineata alla fine della griglia
  let sLeg = 16;
  legendaGoccia(x + w - 62, y + 14, sLeg);
  fill(COL_TESTI_2);
  textSize(12);
  textAlign(LEFT, TOP);
  text('≈ ' + round(maxArea / NUM_GOCCE).toLocaleString('en') + ' km²', x + w - 40, y + 7);

  // gocce: 10 righe da 20, stessa dimensione di prima
  let passo = w / goccePerRiga;
  let s = passo * 0.75;
  let piene = round(river.area / maxArea * NUM_GOCCE);   // gocce colorate

  for (let i = 0; i < NUM_GOCCE; i++) {
    let cx = x + (i % goccePerRiga) * passo + passo / 2;
    let cy = y + 56 + floor(i / goccePerRiga) * s * 1.4;
    goccia(cx, cy, s, i < piene ? river.colore : COL_GRIGIO);
  }

  // la domanda non compare se questo fiume ha l'area maggiore
  if (river.area < maxArea) {
    domanda('Which river has the biggest area?', qX, y + 68,
      'The largest river among those analysed is the ' + nomeArea + ', ' + maxArea.toLocaleString('en') + ' km².');
  }
}

// goccia: punta appuntita in alto e pancia tonda in basso.
// s = larghezza; la punta è in (cx, cy - s * 0.7), il fondo in (cy + s * 0.5)
function goccia(cx, cy, s, colore) {
  let puntaY = cy - s * 0.7;     // punta
  let centroY = cy + s * 0.0;    // centro del semicerchio
  let r = s * 0.5;               // raggio del semicerchio

  let ctx = drawingContext;
  ctx.fillStyle = colore;
  ctx.beginPath();
  ctx.moveTo(cx, puntaY);                                   // punta appuntita
  ctx.lineTo(cx + r, centroY);                              // fianco destro dritto
  ctx.arc(cx, centroY, r, 0, PI);                           // pancia tonda
  ctx.lineTo(cx, puntaY);                                   // fianco sinistro dritto
  ctx.closePath();
  ctx.fill();
}

// disegna una domanda e controlla se il mouse è sopra
function domanda(testo, x, y, risposta) {
  noStroke();
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  let w = min(textWidth(testo), width - x - margin);
  fill(COL_TESTI);
  text(testo, x, y);
  textStyle(NORMAL);

  if (mouseX > x && mouseX < x + w && mouseY > y - 14 && mouseY < y + 14) {
    hoverQ = risposta;
  }
}

function disegnaTooltip() {
  if (!hoverQ) return;

  let w = 320;
  let h = 70;
  textSize(13);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  let x = constrain(mouseX - w / 2, margin, width - margin - w);
  let y = mouseY + 24;

  noStroke();
  fill(8, 18, 42, 235);
  rect(x, y, w, h, 6);
  fill(COL_TESTI);
  text(hoverQ, x + 10, y + 10, w - 20, h - 20);
}

function colorePerMedia(media) {
  let indice = 0;
  for (let i = 0; i < SOGLIE.length; i++) {
    if (media > SOGLIE[i]) indice = i + 1;
  }
  return COLORI_CLASSI[indice];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
