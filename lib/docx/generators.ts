import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

export interface CoverLetterDOCXData {
  job_title: string;
  company_name: string;
  content: string;
  tone: string;
  created_at: string;
  applicant_name?: string | null;
}

/**
 * Generates a professionally formatted .docx cover letter using the
 * `docx` library. Returns a Buffer suitable for a NextResponse body.
 */
export async function generateCoverLetterDOCX(data: CoverLetterDOCXData): Promise<Buffer> {
  const dateLabel = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(data.created_at));

  const bodyParagraphs = data.content
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map(
      (para) =>
        new Paragraph({
          children: [new TextRun({ text: para, size: 22 })],
          spacing: { after: 200 },
          alignment: AlignmentType.LEFT,
        })
    );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: data.applicant_name || "Cover Letter", bold: true, size: 28, color: "4B54F5" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `${data.job_title} \u00b7 ${data.company_name}`, size: 22, color: "666666" })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: dateLabel, size: 20, color: "999999" })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            border: { bottom: { color: "DDDDDD", space: 1, style: "single", size: 6 } },
            spacing: { after: 300 },
            children: [],
          }),
          ...bodyParagraphs,
        ],
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Calibri" },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
