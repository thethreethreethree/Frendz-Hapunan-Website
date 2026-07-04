import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";

const ROOT = "C:/Users/johns/OneDrive/Documents/GitHub/Frendz Hapunan Website";
const URL =
  "https://search.google.com/local/writereview?placeid=ChIJHTeEQAVVtjMRGdLFCRZo2SA";

const W = (8 / 2.54) * 72, // 226.77 pt (8 cm)
  H = (11 / 2.54) * 72; // 311.81 pt (11 cm)

const cream = "#fbf1d6",
  teal = "#138a8c",
  tealD = "#0f7174",
  accentD = "#c0521a",
  maroon = "#7a2e16",
  ink = "#2c2016";
const fiesta = ["#d23b2e", "#e2641f", "#f3b73e", "#3a9d4b", "#138a8c", "#2a6fb0", "#7a4ea3"];

const card = { s: 126 };
card.x = (W - card.s) / 2;
card.y = 148;
const qs = 106;
const qr = { x: card.x + (card.s - qs) / 2, y: card.y + 10, s: qs };

// Centered, pre-wrapped lines (English). {text, size, color, baseline-y, bold}
const B = true,
  N = false;
const lines = [
  { t: "Thank you for", s: 17, c: tealD, y: 46, b: B },
  { t: "dining with us!", s: 17, c: tealD, y: 65, b: B },
  { t: "We hope you enjoyed your", s: 9, c: maroon, y: 85, b: B },
  { t: "evening at Frendz Hapunan.", s: 9, c: maroon, y: 97, b: B },
  { t: "If our food and good company", s: 8.5, c: ink, y: 118, b: N },
  { t: "brought you joy, a few kind words", s: 8.5, c: ink, y: 129, b: N },
  { t: "would mean the world to us.", s: 8.5, c: ink, y: 140, b: N },
  { t: "Scan to leave a Google review", s: 9.5, c: accentD, y: 289, b: B },
  { t: "With heartfelt thanks!", s: 10.5, c: tealD, y: 303, b: B },
];

// ── Clean QR ──
const qrBuf = await QRCode.toBuffer(URL, {
  errorCorrectionLevel: "M",
  margin: 1,
  width: 720,
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
doc.lineWidth(2).strokeColor(ink).roundedRect(5, 5, W - 10, H - 10, 10).stroke();
const nFlags = 21,
  bW = 9,
  bStart = (W - nFlags * bW) / 2;
for (let i = 0; i < nFlags; i++) {
  const x = bStart + i * bW;
  doc.fillColor(fiesta[i % fiesta.length]);
  doc.moveTo(x, 13).lineTo(x + bW, 13).lineTo(x + bW / 2, 20).fill();
}
for (const L of lines) {
  doc
    .font(L.b ? "Helvetica-Bold" : "Helvetica")
    .fontSize(L.s)
    .fillColor(L.c)
    .text(L.t, 0, L.y - L.s * 0.82, { width: W, align: "center", lineBreak: false });
}
doc.fillColor("#ffffff").roundedRect(card.x, card.y, card.s, card.s, 8).fill();
doc.lineWidth(1.5).strokeColor(ink).roundedRect(card.x, card.y, card.s, card.s, 8).stroke();
doc.image(qrBuf, qr.x, qr.y, { width: qs, height: qs });
doc.end();

// ── PNG (sharp) ──
const S = 300 / 72;
const P = (v) => +(v * S).toFixed(1);
const R = (v) => Math.round(v * S);
const PW = R(W),
  PH = R(H);
let band = "";
for (let i = 0; i < nFlags; i++) {
  const x = bStart + i * bW;
  band += `<polygon points="${P(x)},${P(13)} ${P(x + bW)},${P(13)} ${P(x + bW / 2)},${P(20)}" fill="${fiesta[i % 7]}"/>`;
}
const textEls = lines
  .map(
    (L) =>
      `<text x="${P(W / 2)}" y="${P(L.y)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="${L.b ? "bold" : "normal"}" font-size="${P(L.s)}" fill="${L.c}">${L.t}</text>`,
  )
  .join("");
const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">
<rect width="${PW}" height="${PH}" fill="${cream}"/>
<rect x="${P(5)}" y="${P(5)}" width="${P(W - 10)}" height="${P(H - 10)}" rx="${P(10)}" fill="none" stroke="${ink}" stroke-width="${P(2)}"/>
${band}
<rect x="${P(card.x)}" y="${P(card.y)}" width="${P(card.s)}" height="${P(card.s)}" rx="${P(8)}" fill="#ffffff"/>
${textEls}
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
