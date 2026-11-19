import qrcode from "qrcode-generator";

// Always open the public app, including from localhost and preview deployments.
export const PUBLIC_QR_URL = "https://tanyalokal.vercel.app/teluk-intan?src=scan-screen";
export const QR_FILENAME = "tanyalokal-teluk-intan-qr.png";
export const QR_QUIET_ZONE = 4;

export function createQrCode() {
  const qr = qrcode(0, "M");
  qr.addData(PUBLIC_QR_URL);
  qr.make();
  return qr;
}

let exportPromise;
let readyFile;

async function drawBrandMark(ctx, x, y) {
  const artwork = document.getElementById("tower-art");
  if (!artwork) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="214" viewBox="0 0 120 214"><style>.t-body{fill:#fff;stroke:#1d2625;stroke-width:2}.t-roof{fill:#c2452d;stroke:#1d2625;stroke-width:2;stroke-linejoin:round}.t-win{fill:#1d2625}.t-clock{fill:#e9a820;stroke:#1d2625;stroke-width:2}.leaner{transform-origin:60px 214px;transform:rotate(-4.5deg)}</style>${artwork.innerHTML}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    ctx.drawImage(image, x, y, 42, 75);
  } catch {
    // The wordmark and QR remain usable if the decorative mark cannot render.
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function createPosterFile() {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#e2e7e5";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(28, 28, 1144, 1384, 56);
  else ctx.rect(28, 28, 1144, 1384);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#1d2625";
  ctx.font = '800 64px "Plus Jakarta Sans", system-ui, sans-serif';
  const wordWidth = ctx.measureText("TanyaLokal").width;
  const brandLeft = (1200 - wordWidth - 62) / 2;
  await drawBrandMark(ctx, brandLeft, 93);
  ctx.fillText("TanyaLokal", brandLeft + 62 + wordWidth / 2, 153);
  ctx.font = '500 30px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = "#667270";
  ctx.fillText("Teluk Intan, Perak", 600, 223);

  const qr = createQrCode();
  const n = qr.getModuleCount();
  const cell = Math.floor(800 / (n + QR_QUIET_ZONE * 2));
  const size = cell * (n + QR_QUIET_ZONE * 2);
  const left = Math.round((1200 - size) / 2);
  const top = 292;
  ctx.fillStyle = "#111111";
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(row, col)) ctx.fillRect(left + (col + QR_QUIET_ZONE) * cell, top + (row + QR_QUIET_ZONE) * cell, cell, cell);
    }
  }
  ctx.fillStyle = "#1d2625";
  ctx.font = '700 48px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("Imbas & tanya", 600, 1190);
  ctx.fillStyle = "#667270";
  ctx.font = '500 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("Scan & ask about Teluk Intan", 600, 1250);
  ctx.fillStyle = "#0b7a6e";
  ctx.font = '600 30px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("tanyalokal.vercel.app", 600, 1342);

  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG export failed")), "image/png"));
  return new File([blob], QR_FILENAME, { type: "image/png" });
}

export function prepareQrDownload() {
  if (!exportPromise) {
    exportPromise = createPosterFile().then(file => {
      readyFile = file;
      return file;
    }).catch(error => {
      exportPromise = undefined;
      throw error;
    });
  }
  return exportPromise;
}

export async function downloadQr() {
  const file = await prepareQrDownload();
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = QR_FILENAME;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function shareQr({ title, text, platform = navigator, file = readyFile }) {
  if (typeof platform.share === "function") {
    const data = { title, text, url: PUBLIC_QR_URL };
    try {
      if (file && platform.canShare?.({ files: [file] })) data.files = [file];
    } catch { /* Share the public URL when file sharing cannot be checked. */ }
    try {
      // Called before any await to preserve the button's transient activation.
      await platform.share(data);
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  try {
    if (typeof platform.clipboard?.writeText === "function") {
      await platform.clipboard.writeText(PUBLIC_QR_URL);
      return "copied";
    }
  } catch { /* The UI offers a selectable link when clipboard permission is denied. */ }
  return "manual";
}
