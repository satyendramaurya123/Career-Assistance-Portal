import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadRateLimit } from "@/lib/rate-limit";

import { PDFParse } from "pdf-parse";
import { ensurePdfWorkerConfigured } from "@/lib/pdf/worker-setup";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!uploadRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Too many uploads. Please try again later." }, { status: 429 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ success: false, error: "Only PDF files are allowed" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: "File size must be under 10MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";
    try {
      ensurePdfWorkerConfigured();
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      extractedText = (textResult.text || "").replace(/\n--\s*\d+\s*of\s*\d+\s*--\n?/g, "\n").trim();
      await parser.destroy();
    } catch (e) {
      console.error("PDF parse error:", e);
    }

    const admin = createAdminClient();
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error: uploadError } = await admin.storage.from("resumes").upload(fileName, buffer, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ success: false, error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = await admin.storage.from("resumes").createSignedUrl(fileName, 60 * 60 * 24 * 7);

    const { data: resume, error: dbError } = await admin.from("resumes").insert({
      user_id: user.id, file_name: file.name, file_path: fileName, file_size: file.size,
      file_url: urlData?.signedUrl || null, extracted_text: extractedText, status: "COMPLETED", is_primary: false,
    }).select().single();

    if (dbError) { console.error("Resume DB insert error:", dbError); await admin.storage.from("resumes").remove([fileName]); return NextResponse.json({ success: false, error: `Failed to save resume: ${dbError.message}` }, { status: 500 }); }

    return NextResponse.json({ success: true, data: resume, warning: extractedText.trim().length === 0 ? "No text could be extracted from this PDF. It may be a scanned image or a design-tool export. AI analysis won't work until you upload a text-based PDF (exported from Word/Google Docs)." : undefined });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
