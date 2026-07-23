import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";

/**
 * pdf-parse (built on pdfjs-dist) defaults its worker script to the
 * relative path "./pdf.worker.mjs" when running in Node. That relative
 * path breaks once Next.js/Turbopack bundles the route handler, because
 * the worker file isn't copied to wherever the bundle resolves it,
 * producing: `Error: Setting up fake worker failed: "Cannot find module
 * '.../pdf.worker.mjs'"`.
 *
 * The fix is to point pdf-parse at the *actual* on-disk location of the
 * worker file (inside node_modules) via an absolute file:// URL, which
 * bypasses bundler path resolution entirely since it's a plain runtime
 * dynamic import() of a fully-resolved URL.
 *
 * Call `ensurePdfWorkerConfigured()` once before creating any `PDFParse`
 * instance on the server.
 */
let configured = false;

export function ensurePdfWorkerConfigured() {
  if (configured) return;
  const workerPath = path.join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  configured = true;
}
