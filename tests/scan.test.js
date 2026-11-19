import test from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_QR_URL, shareQr } from "../src/scan.js";

const title = "TanyaLokal · Teluk Intan";
const text = "Ask about Teluk Intan.";
const file = new File(["png test fixture"], "qr.png", { type: "image/png" });

test("QR target always uses the public Vercel Ask route", () => {
  const url = new URL(PUBLIC_QR_URL);
  assert.equal(url.origin, "https://tanyalokal.vercel.app");
  assert.equal(url.pathname, "/teluk-intan");
  assert.equal(url.searchParams.get("src"), "scan-screen");
  assert.equal(url.hash, "");
});

test("native sharing starts synchronously and includes a supported PNG", async () => {
  let payload;
  const result = shareQr({ title, text, file, platform: {
    canShare: ({ files }) => files[0] === file,
    share: async value => { payload = value; }
  } });
  assert.ok(payload, "Do not delay native share past the button gesture");
  assert.equal(payload.url, PUBLIC_QR_URL);
  assert.deepEqual(payload.files, [file]);
  assert.equal(await result, "shared");
});

test("devices without file sharing still receive the public link", async () => {
  let payload;
  assert.equal(await shareQr({ title, text, file, platform: {
    canShare: () => false,
    share: async value => { payload = value; }
  } }), "shared");
  assert.equal(payload.url, PUBLIC_QR_URL);
  assert.equal(payload.files, undefined);
});

test("an unsupported native share menu copies the canonical public link", async () => {
  let copied;
  const result = await shareQr({ title, text, platform: { clipboard: {
    writeText: async value => { copied = value; }
  } } });
  assert.equal(result, "copied");
  assert.equal(copied, PUBLIC_QR_URL);
});

test("cancelling the native menu does not copy anything unexpectedly", async () => {
  let copied = false;
  const result = await shareQr({ title, text, platform: {
    share: async () => { throw new DOMException("Cancelled", "AbortError"); },
    clipboard: { writeText: async () => { copied = true; } }
  } });
  assert.equal(result, "cancelled");
  assert.equal(copied, false);
});

test("native-share failure falls back to copying the public link", async () => {
  let copied;
  const result = await shareQr({ title, text, platform: {
    share: async () => { throw new DOMException("Unavailable", "NotAllowedError"); },
    clipboard: { writeText: async value => { copied = value; } }
  } });
  assert.equal(result, "copied");
  assert.equal(copied, PUBLIC_QR_URL);
});

test("denied clipboard access offers manual copying instead of false success", async () => {
  const result = await shareQr({ title, text, platform: { clipboard: {
    writeText: async () => { throw new DOMException("Denied", "NotAllowedError"); }
  } } });
  assert.equal(result, "manual");
});
