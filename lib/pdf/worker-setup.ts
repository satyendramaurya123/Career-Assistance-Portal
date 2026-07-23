import path from "path";
import { pathToFileURL } from "url";

/**
 * pdf-parse (built on pdfjs-dist) references browser-only DOM APIs
 * (DOMMatrix, ImageData, Path2D) at module-evaluation time. pdfjs-dist's
 * own fallback is to try requiring the native package "@napi-rs/canvas"
 * for these — but that's a platform-specific native binary, and if the
 * lockfile was generated on a different OS than the deploy target (e.g.
 * package-lock.json created on Windows, deployed to Vercel's Linux
 * runtime), the correct binary doesn't get installed, causing:
 * `ReferenceError: DOMMatrix is not defined`.
 *
 * Since we only ever call `.getText()` (never render pages to images),
 * we don't need real canvas/matrix math — just objects that exist and
 * don't throw when constructed. These are pure JS, no native binary,
 * so they work identically on every OS/platform.
 */
class DOMMatrixPolyfill {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor(init?: number[]) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
    }
  }
  get is2D() { return true; }
  multiply(other: DOMMatrixPolyfill) {
    const m = new DOMMatrixPolyfill();
    m.a = this.a * other.a + this.c * other.b;
    m.b = this.b * other.a + this.d * other.b;
    m.c = this.a * other.c + this.c * other.d;
    m.d = this.b * other.c + this.d * other.d;
    m.e = this.a * other.e + this.c * other.f + this.e;
    m.f = this.b * other.e + this.d * other.f + this.f;
    return m;
  }
  translate(tx = 0, ty = 0) { return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty])); }
  scale(sx = 1, sy = sx) { return this.multiply(new DOMMatrixPolyfill([sx, 0, 0, sy, 0, 0])); }
  inverse() {
    const det = this.a * this.d - this.b * this.c;
    if (!det) return new DOMMatrixPolyfill();
    return new DOMMatrixPolyfill([
      this.d / det, -this.b / det, -this.c / det, this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det,
    ]);
  }
}

class ImageDataPolyfill {
  data: Uint8ClampedArray; width: number; height: number;
  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      this.data = dataOrWidth; this.width = widthOrHeight; this.height = height ?? 0;
    } else {
      this.width = dataOrWidth; this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    }
  }
}

class Path2DPolyfill {
  moveTo() {} lineTo() {} closePath() {} rect() {} arc() {} bezierCurveTo() {} quadraticCurveTo() {} ellipse() {}
}

function ensureBrowserGlobalsPolyfilled() {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = DOMMatrixPolyfill;
  if (typeof g.ImageData === "undefined") g.ImageData = ImageDataPolyfill;
  if (typeof g.Path2D === "undefined") g.Path2D = Path2DPolyfill;
}

/**
 * pdf-parse also defaults its worker script to the relative path
 * "./pdf.worker.mjs" when running in Node. That relative path breaks
 * once Next.js/Turbopack bundles the route handler, because the worker
 * file isn't copied to wherever the bundle resolves it, producing:
 * `Error: Setting up fake worker failed: "Cannot find module
 * '.../pdf.worker.mjs'"`. The fix is to point pdf-parse at the *actual*
 * on-disk location of the worker file via an absolute file:// URL.
 *
 * Because both fixes above must run BEFORE pdf-parse's module (and its
 * pdfjs-dist dependency) is ever evaluated — and static `import` is
 * hoisted above any code in the same file — callers must dynamically
 * `await import("pdf-parse")` AFTER calling this function, rather than
 * using a static top-level import.
 */
let configured = false;

export async function loadPdfParse() {
  if (!configured) {
    ensureBrowserGlobalsPolyfilled();
    configured = true;
  }
  const { PDFParse } = await import("pdf-parse");
  if (!(PDFParse as unknown as { __workerConfigured?: boolean }).__workerConfigured) {
    const workerPath = path.join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    (PDFParse as unknown as { __workerConfigured?: boolean }).__workerConfigured = true;
  }
  return PDFParse;
}

