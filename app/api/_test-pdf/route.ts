import { NextResponse } from "next/server";
import fs from "fs";
import { PDFParse } from "pdf-parse";

export async function GET() {
  try {
    const buffer = fs.readFileSync("/mnt/user-data/uploads/satyendra_Placement_cv.pdf");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return NextResponse.json({ success: true, length: result.text.length, preview: result.text.slice(0, 100) });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e), stack: e instanceof Error ? e.stack : null });
  }
}
