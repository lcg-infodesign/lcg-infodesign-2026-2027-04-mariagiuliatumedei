//variabili
let river;                    //fiume di questa pagina
let maxLen, maxArea;          //record nel dataset
let nomeLungo, nomeArea;      //nomi dei fiumi che detengono i record
let hoverQ = null;            //risposta della domanda sotto il cursore

const CSV_URL = 'assets/data.csv';

const COL_BG = '#12234a';
const COL_GRIGIO = '#d9d9d9';
const COL_TESTI = '#ffffff';
const COL_TESTI_2 = '#bec8e1';
const SOGLIE = [8, 14, 20];
const COLORI_CLASSI = ['#6a9fd8', '#f2c879', '#f08a6c', '#c2456f'];

const NUM_GOCCE = 200;        //200 gocce = area massima (così ogni fiume ha almeno una goccia colorata)
const GOCCE_PER_RIGA = 20;    //gocce in ogni riga (10 righe in tutto)
const KM_ONDA = 500;          //1 onda = 500 km (unità di misura della lunghezza)
let margin = 40;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica, Arial, sans-serif');

  //link per tornare alla pagina 1, in basso a sinistra
  let indietro = createA('index.html', '← All rivers');
  indietro.style('font-size', '15px');    //stessa dimensione della didascalia
  indietro.position(margin, height - 48);

  let data = await loadTable(CSV_URL, ",", "header");
  let id = new URLSearchParams(window.location.search).get('id');

  maxLen = 0;
  maxArea = 0;

  for (let i = 0; i < data.getRowCount(); i++) {
    let len = data.getNum(i, "length");
    let area = data.getNum(i, "area");
    let nome = data.getString(i, "name");

    //nome del fiume record
    if (len > maxLen) { maxLen = len; nomeLungo = nome; }
    if (area > maxArea) { maxArea = area; nomeArea = nome; }

    if (data.getString(i, "id") === id) {
      let min = data.getNum(i, "min_temp");
      let max = data.getNum(i, "max_temp");
      river = { nome: nome, len: len, area: area, colore: colorePerMedia((min + max) / 2) };
    }
  }
}

function draw() {
  background(COL_BG);
  if (!river) return;   
  hoverQ = null;

  //grafici centrati nella pagina, le domande a destra
  let barW = width * 0.38;
  let barX = width / 2 - barW / 2;
  let qX = barX + barW + 30;

  disegnaTesti();
  disegnaLunghezza(barX, barW, qX);
  disegnaArea(barX, barW, qX);
  disegnaTooltip();

  cursor(hoverQ ? HAND : ARROW); //come cambia forma del cursore in base a dove mi trovo
}

function disegnaTesti() {
  noStroke();
  textAlign(LEFT, TOP);

  //nome del fiume analizzato, messo in alto
  fill(COL_TESTI);
  textSize(34);
  textStyle(BOLD);
  text(river.nome, margin, 30, width - 2 * margin);

  //sotto al nome del fiume metto il titolo della pagina
  textSize(20);
  text('A closer look at the rivers: how this river compares', margin, 84, width - 2 * margin);

  //sotto al titolo della pagina metto la didascalia
  textSize(15);
  textStyle(NORMAL);
  fill(COL_TESTI_2);
  text('Each measure is rounded to whole units, so rivers can be compared at a glance. Grey marks the maximum among the rivers analysed. Hover over a question to find the answer.', margin, 118, width - 2 * margin);
}

function disegnaLunghezza(x, w, qX) {
  let y = height * 0.38;

  //titolo del grafico in alto a destra
  noStroke();
  fill(COL_TESTI);
  textSize(18);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text('Length: ' + river.len.toLocaleString('en') + ' km', x, y);
  textStyle(NORMAL);

  //legenda in alto a destra, allineata alla fine della barra
  legendaOnda(x + w - 92, y + 13, 40);
  fill(COL_TESTI_2);
  textSize(12);
  text('≈ ' + KM_ONDA + ' km', x + w - 40, y + 7);

  //onde intere: ogni onda = KM_ONDA km
  let ondeMax = round(maxLen / KM_ONDA);
  let onde = round(river.len / KM_ONDA);
  let unaOnda = w / ondeMax;
  barraOndulata(x, y + 48, w, unaOnda, COL_GRIGIO);
  barraOndulata(x, y + 48, onde * unaOnda, unaOnda, river.colore);

  //la domanda non compare se il fiume analizzato è il più lungo
  if (river.len < maxLen) {
    domanda("What's the longest river?", qX, y + 63,
      'The longest river among those analysed is the ' + nomeLungo + ', ' + maxLen.toLocaleString('en') + ' km.');
  }
}

//anteprima di una singola onda, disegnata solo col bordo bianco
function legendaOnda(x, y, larghezza) {
  noFill();
  stroke(COL_TESTI);
  strokeWeight(2);
  beginShape();
  for (let px = 0; px <= larghezza; px += 3) {
    vertex(x + px, y - cos(px / larghezza * TWO_PI) * 3);
  }
  endShape();
  noStroke();
}

//anteprima di una singola goccia, disegnata solo col bordo bianco
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

//barra: una sola forma chiusa, con il bordo superiore ondulato
//una onda ogni "unaOnda" pixel; il bordo parte sempre dall'inizio di un'onda
function barraOndulata(x, y, lunghezza, unaOnda, colore) {
  noStroke();
  fill(colore);
  beginShape();
  vertex(x, y + 30);                            //angolo in basso a sinistra
  for (let px = 0; px <= lunghezza; px += 3) {
    vertex(x + px, y - cos(px / unaOnda * TWO_PI) * 3);
  }
  vertex(x + lunghezza, y + 30);                //angolo in basso a destra
  endShape(CLOSE);
}

function disegnaArea(x, w, qX) {
  let y = height * 0.53;

  //titolo in alto a sinistra
  noStroke();
  fill(COL_TESTI);
  textSize(18);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text('Area: ' + river.area.toLocaleString('en') + ' km²', x, y);
  textStyle(NORMAL);

  //legenda in alto a destra, allineata alla fine della griglia
  legendaGoccia(x + w - 62, y + 14, 16);
  fill(COL_TESTI_2);
  textSize(12);
  text('≈ ' + round(maxArea / NUM_GOCCE).toLocaleString('en') + ' km²', x + w - 40, y + 7);

  //gocce: 10 righe da 20
  let passo = w / GOCCE_PER_RIGA;
  let s = passo * 0.75;
  let piene = round(river.area / maxArea * NUM_GOCCE);   //gocce colorate

  for (let i = 0; i < NUM_GOCCE; i++) {
    let cx = x + (i % GOCCE_PER_RIGA) * passo + passo / 2;
    let cy = y + 56 + floor(i / GOCCE_PER_RIGA) * s * 1.4;
    goccia(cx, cy, s, i < piene ? river.colore : COL_GRIGIO);
  }

  //la domanda non compare se questo fiume ha l'area maggiore
  if (river.area < maxArea) {
    domanda('Which river has the biggest area?', qX, y + 68,
      'The largest river among those analysed is the ' + nomeArea + ', ' + maxArea.toLocaleString('en') + ' km².');
  }
}

//goccia: punta appuntita in alto e pancia tonda in basso
function goccia(cx, cy, s, colore) {
  let ctx = drawingContext;
  ctx.fillStyle = colore;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.7);         //punta
  ctx.lineTo(cx + s * 0.5, cy);         //fianco destro dritto
  ctx.arc(cx, cy, s * 0.5, 0, PI);      //pancia tonda
  ctx.lineTo(cx, cy - s * 0.7);         //fianco sinistro dritto
  ctx.closePath();
  ctx.fill();
}

//disegna una domanda e controlla se il mouse è sopra
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

  textSize(13);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  let x = constrain(mouseX - 160, margin, width - margin - 320);
  let y = mouseY + 24;

  noStroke();
  fill(8, 18, 42, 235);
  rect(x, y, 320, 70, 6);
  fill(COL_TESTI);
  text(hoverQ, x + 10, y + 10, 300, 50);
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
