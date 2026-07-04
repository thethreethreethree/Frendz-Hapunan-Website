import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";

const ROOT = "C:/Users/johns/OneDrive/Documents/GitHub/Frendz Hapunan Website";
const URL =
  "https://search.google.com/local/writereview?placeid=ChIJHTeEQAVVtjMRGdLFCRZo2SA";

const W = (10 / 2.54) * 72, // 283.46 pt (10 cm)
  H = (5 / 2.54) * 72; // 141.73 pt (5 cm)

const cream = "#fbf1d6",
  teal = "#138a8c",
  tealD = "#0f7174",
  accentD = "#c0521a",
  maroon = "#7a2e16",
  ink = "#2c2016";
const fiesta = ["#d23b2e", "#e2641f", "#f3b73e", "#3a9d4b", "#138a8c", "#2a6fb0", "#7a4ea3"];

const card = { s: 112 };
card.x = W - card.s - 10;
card.y = (H - card.s) / 2;
const qs = 90;
const qr = { x: card.x + (card.s - qs) / 2, y: card.y + 7, s: qs };

// Pre-wrapped lines: {text, size, color, baseline-y, bold}
const B = true,
  N = false;
const lines = [
  { t: "Salamat sa iyong", s: 12, c: tealD, y: 25, b: B },
  { t: "pagbisita!", s: 12, c: tealD, y: 39, b: B },
  { t: "Thank you for dining with us", s: 7, c: maroon, y: 52, b: B },
  { t: "at Frendz Hapunan.", s: 7, c: maroon, y: 61, b: B },
  { t: "If our food and kwentuhan", s: 7, c: ink, y: 75, b: N },
  { t: "brought you joy, a few kind", s: 7, c: ink, y: 84, b: N },
  { t: "words would mean so much.", s: 7, c: ink, y: 93, b: N },
  { t: "Scan to leave a Google review", s: 8, c: accentD, y: 109, b: B },
  { t: "Maraming salamat po!", s: 8, c: tealD, y: 121, b: B },
];

// ── Clean QR ──
const qrBuf = await QRCode.toBuffer(URL, {
  errorCorrectionLevel: "M",
  margin: 1,
  width: 640,
  color: { dark: "#141414", light: "#ffffff" },
});
fs.writeFileSync(
  `${ROOT}/public/frendz-review-qr.png`,
  await QRCode.toBuffer(URL, { errorCorrectionLevel: "M", margin: 2, width: 1000 }),
);

// ── PDF ──
const doc = new PDFDocument({ size: [W, H], margin: 0 });
doc.pipe(fs.createWriteStream(`${ROOT}/public/frendz-review-poster.pdf`));
doc.rect(0, 0, W, H).fill(cream);
doc.lineWidth(2).strokeColor(ink).roundedRect(5, 5, W - 10, H - 10, 8).stroke();
for (let i = 0; i < 16; i++) {
  const x = 13 + i * 9;
  doc.fillColor(fiesta[i % fiesta.length]);
  doc.moveTo(x, 9).lineTo(x + 9, 9).lineTo(x + 4.5, 15).fill();
}
for (const L of lines) {
  doc
    .font(L.b ? "Helvetica-Bold" : "Helvetica")
    .fontSize(L.s)
    .fillColor(L.c)
    .text(L.t, 14, L.y - L.s * 0.82, { lineBreak: false });
}
doc.fillColor("#ffffff").roundedRect(card.x, card.y, card.s, card.s, 8).fill();
doc.lineWidth(1.5).strokeColor(ink).roundedRect(card.x, card.y, card.s, card.s, 8).stroke();
doc.image(qrBuf, qr.x, qr.y, { width: qs, height: qs });
doc
  .fillColor(maroon)
  .font("Helvetica-Bold")
  .fontSize(6.5)
  .text("SCAN ME", card.x, card.y + card.s - 12, { width: card.s, align: "center" });
doc.end();

// ── PNG (sharp) ──
const S = 300 / 72;
const P = (v) => +(v * S).toFixed(1);
const R = (v) => Math.round(v * S);
const PW = R(W),
  PH = R(H);
let band = "";
for (let i = 0; i < 16; i++) {
  const x = 13 + i * 9;
  band += `<polygon points="${P(x)},${P(9)} ${P(x + 9)},${P(9)} ${P(x + 4.5)},${P(15)}" fill="${fiesta[i % 7]}"/>`;
}
const textEls = lines
  .map(
    (L) =>
      `<text x="${P(14)}" y="${P(L.y)}" font-family="Arial,sans-serif" font-weight="${L.b ? "bold" : "normal"}" font-size="${P(L.s)}" fill="${L.c}">${L.t}</text>`,
  )
  .join("");
const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">
<rect width="${PW}" height="${PH}" fill="${cream}"/>
<rect x="${P(5)}" y="${P(5)}" width="${P(W - 10)}" height="${P(H - 10)}" rx="${P(8)}" fill="none" stroke="${ink}" stroke-width="${P(2)}"/>
${band}
<rect x="${P(card.x)}" y="${P(card.y)}" width="${P(card.s)}" height="${P(card.s)}" rx="${P(8)}" fill="#ffffff"/>
${textEls}
<text x="${P(card.x + card.s / 2)}" y="${P(card.y + card.s - 4)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${P(6.5)}" fill="${maroon}">SCAN ME</text>
</svg>`;
const topSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">
<rect x="${P(card.x)}" y="${P(card.y)}" width="${P(card.s)}" height="${P(card.s)}" rx="${P(8)}" fill="none" stroke="${ink}" stroke-width="${P(1.5)}"/>
</svg>`;
const qrPng = await sharp(qrBuf).resize(R(qs), R(qs)).toBuffer();
await sharp(Buffer.from(baseSvg))
  .composite([
    { input: qrPng, left: R(qr.x), top: R(qr.y) },
    { input: Buffer.from(topSvg), left: 0, top: 0 },
  ])
  .png()
  .toFile(`${ROOT}/public/frendz-review-poster.png`);

console.log("review card written:", PW, "x", PH, "px");
