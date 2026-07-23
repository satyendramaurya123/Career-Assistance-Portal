import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts, RGB } from "pdf-lib";

/**
 * Lightweight, reusable PDF report builder on top of pdf-lib.
 * Handles pagination, text wrapping, headings, bullet lists, badges,
 * score bars and footers so every export route can produce a
 * consistently styled, professional document.
 */

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: rgb(0.29, 0.33, 0.96), // indigo/blue brand color
  text: rgb(0.13, 0.13, 0.16),
  muted: rgb(0.45, 0.45, 0.5),
  border: rgb(0.87, 0.87, 0.9),
  success: rgb(0.13, 0.55, 0.27),
  warning: rgb(0.72, 0.53, 0.04),
  danger: rgb(0.75, 0.2, 0.2),
  bgLight: rgb(0.96, 0.96, 0.98),
};

function scoreColor(score: number): RGB {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
}

export class PDFReportBuilder {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private y = 0;
  private fontRegular!: PDFFont;
  private fontBold!: PDFFont;
  private pageNum = 0;
  private title: string;
  private subtitle?: string;

  private constructor(title: string, subtitle?: string) {
    this.title = title;
    this.subtitle = subtitle;
  }

  static async create(title: string, subtitle?: string): Promise<PDFReportBuilder> {
    const builder = new PDFReportBuilder(title, subtitle);
    builder.doc = await PDFDocument.create();
    builder.fontRegular = await builder.doc.embedFont(StandardFonts.Helvetica);
    builder.fontBold = await builder.doc.embedFont(StandardFonts.HelveticaBold);
    builder.addPage();
    builder.drawMasthead();
    return builder;
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNum += 1;
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawFooter();
  }

  private drawFooter() {
    this.page.drawText("CareerAI \u00b7 AI-Powered Career Assistant", {
      x: MARGIN,
      y: 28,
      size: 8,
      font: this.fontRegular,
      color: COLORS.muted,
    });
    const pageLabel = `Page ${this.pageNum}`;
    const w = this.fontRegular.widthOfTextAtSize(pageLabel, 8);
    this.page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - w,
      y: 28,
      size: 8,
      font: this.fontRegular,
      color: COLORS.muted,
    });
  }

  private drawMasthead() {
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 110, width: PAGE_WIDTH, height: 110, color: COLORS.primary });
    this.page.drawText("CareerAI", { x: MARGIN, y: PAGE_HEIGHT - 45, size: 14, font: this.fontBold, color: rgb(1, 1, 1) });
    this.page.drawText(this.title, { x: MARGIN, y: PAGE_HEIGHT - 75, size: 22, font: this.fontBold, color: rgb(1, 1, 1) });
    if (this.subtitle) {
      this.page.drawText(this.subtitle, { x: MARGIN, y: PAGE_HEIGHT - 95, size: 11, font: this.fontRegular, color: rgb(0.9, 0.9, 1) });
    }
    this.y = PAGE_HEIGHT - 140;
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN + 20) this.addPage();
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  sectionTitle(text: string) {
    this.ensureSpace(30);
    this.y -= 8;
    this.page.drawText(text.toUpperCase(), { x: MARGIN, y: this.y, size: 12, font: this.fontBold, color: COLORS.primary });
    this.y -= 6;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_WIDTH - MARGIN, y: this.y }, thickness: 1, color: COLORS.border });
    this.y -= 16;
  }

  paragraph(text: string, opts: { size?: number; bold?: boolean; color?: RGB } = {}) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.fontBold : this.fontRegular;
    const color = opts.color ?? COLORS.text;
    const lines = this.wrapText(text, font, size, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 6);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font, color });
      this.y -= size + 5;
    }
    this.y -= 4;
  }

  keyValueRow(label: string, value: string) {
    this.ensureSpace(16);
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 10, font: this.fontBold, color: COLORS.muted });
    this.page.drawText(value, { x: MARGIN + 140, y: this.y, size: 10, font: this.fontRegular, color: COLORS.text });
    this.y -= 16;
  }

  bulletList(items: string[], opts: { bulletColor?: RGB; emptyText?: string } = {}) {
    if (!items || items.length === 0) {
      this.paragraph(opts.emptyText ?? "None identified.", { color: COLORS.muted });
      return;
    }
    const bulletColor = opts.bulletColor ?? COLORS.primary;
    for (const item of items) {
      const lines = this.wrapText(item, this.fontRegular, 10, CONTENT_WIDTH - 16);
      this.ensureSpace(lines.length * 14 + 4);
      this.page.drawCircle({ x: MARGIN + 3, y: this.y + 3, size: 2, color: bulletColor });
      lines.forEach((line, idx) => {
        this.page.drawText(line, { x: MARGIN + 14, y: this.y, size: 10, font: this.fontRegular, color: COLORS.text });
        this.y -= 14;
      });
      this.y -= 2;
    }
    this.y -= 4;
  }

  badgeRow(items: string[], opts: { fill?: RGB; text?: RGB } = {}) {
    if (!items || items.length === 0) return;
    const fill = opts.fill ?? COLORS.bgLight;
    const textColor = opts.text ?? COLORS.text;
    let x = MARGIN;
    const rowHeight = 22;
    this.ensureSpace(rowHeight);
    for (const item of items) {
      const size = 9;
      const padding = 8;
      const w = this.fontRegular.widthOfTextAtSize(item, size) + padding * 2;
      if (x + w > PAGE_WIDTH - MARGIN) {
        x = MARGIN;
        this.y -= rowHeight;
        this.ensureSpace(rowHeight);
      }
      this.page.drawRectangle({ x, y: this.y - 14, width: w, height: 18, color: fill, borderColor: COLORS.border, borderWidth: 0.5 });
      this.page.drawText(item, { x: x + padding, y: this.y - 10, size, font: this.fontRegular, color: textColor });
      x += w + 6;
    }
    this.y -= rowHeight + 4;
  }

  scoreCard(items: { label: string; value: number }[]) {
    const cardWidth = (CONTENT_WIDTH - 12 * (items.length - 1)) / items.length;
    const cardHeight = 60;
    this.ensureSpace(cardHeight + 10);
    let x = MARGIN;
    for (const item of items) {
      const color = scoreColor(item.value);
      this.page.drawRectangle({ x, y: this.y - cardHeight, width: cardWidth, height: cardHeight, color: COLORS.bgLight, borderColor: COLORS.border, borderWidth: 0.5 });
      const scoreText = String(item.value);
      const scoreSize = 22;
      const scoreW = this.fontBold.widthOfTextAtSize(scoreText, scoreSize);
      this.page.drawText(scoreText, { x: x + (cardWidth - scoreW) / 2, y: this.y - 32, size: scoreSize, font: this.fontBold, color });
      const labelW = this.fontRegular.widthOfTextAtSize(item.label, 8);
      this.page.drawText(item.label, { x: x + (cardWidth - labelW) / 2, y: this.y - 50, size: 8, font: this.fontRegular, color: COLORS.muted });
      x += cardWidth + 12;
    }
    this.y -= cardHeight + 14;
  }

  divider() {
    this.ensureSpace(14);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_WIDTH - MARGIN, y: this.y }, thickness: 0.5, color: COLORS.border });
    this.y -= 14;
  }

  spacer(amount = 10) {
    this.y -= amount;
  }

  async toBytes(): Promise<Uint8Array> {
    return this.doc.save();
  }
}

export { COLORS, scoreColor, MARGIN, CONTENT_WIDTH, PAGE_WIDTH, PAGE_HEIGHT };
