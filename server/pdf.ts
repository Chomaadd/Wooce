import PDFDocument from "pdfkit";
import path from "path";

const LOGO_PATH = path.resolve("public/image/landscape-wooce.png");
const LOGO_W = 120;
const LOGO_H = Math.round(LOGO_W * (372 / 1181)); // ≈ 38px, preserve aspect ratio

const PRIMARY    = "#3c40c7";
const DARK       = "#1f2937";
const GRAY       = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const YEAR       = new Date().getFullYear();

// Content must not go below this Y on any page (leaves room for bottom footer)
const PAGE_BOTTOM = 782; // A4 841.89 - 60px

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<hr[^>]*>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Draw footer on the CURRENT page at a fixed bottom position.
 * Used before switching to a new page (intermediate pages).
 */
function drawBottomFooter(doc: InstanceType<typeof PDFDocument>, pageW: number) {
  const footerY = doc.page.height - 40;
  doc.moveTo(50, footerY - 8).lineTo(pageW - 50, footerY - 8)
    .strokeColor("#d1d5db").lineWidth(0.5).stroke();
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`© ${YEAR} WOOCE Novel · Hak cipta dilindungi undang-undang`, 50, footerY, { align: "center", width: pageW - 100 });
}

/**
 * Draw footer inline right after content (last page).
 * No gap — footer sits directly below the last content line.
 */
function drawInlineFooter(doc: InstanceType<typeof PDFDocument>, y: number, pageW: number) {
  doc.moveTo(50, y).lineTo(pageW - 50, y)
    .strokeColor("#d1d5db").lineWidth(0.5).stroke();
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`© ${YEAR} WOOCE Novel · Hak cipta dilindungi undang-undang`, 50, y + 10, { align: "center", width: pageW - 100 });
}

/**
 * Add a new page: draw footer on current page first, then open a new page.
 * Returns the new y start position.
 */
function nextPage(doc: InstanceType<typeof PDFDocument>, pageW: number): number {
  drawBottomFooter(doc, pageW);
  doc.addPage();
  return 50;
}

// ── Story Backup PDF ──────────────────────────────────────────────────────────

export interface StoryBackupData {
  storyTitle: string;
  category: string;
  status: string;
  synopsis?: string;
  writerName: string;
  writerEmail: string;
  exportedAt: string;
  seasons: {
    seasonNumber: number;
    title: string;
    chapters: {
      chapterNumber: number;
      title: string;
      content?: string;
    }[];
  }[];
}

export function generateStoryBackupPdf(data: StoryBackupData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;

    // ── Header ──────────────────────────────────────────────────────────────
    const HEADER_H = 90;
    doc.rect(0, 0, pageW, HEADER_H).fill(PRIMARY);
    const logoX = 50;
    const logoY = Math.round((HEADER_H - LOGO_H) / 2);
    try { doc.image(LOGO_PATH, logoX, logoY, { width: LOGO_W }); } catch {}
    const textX = logoX + LOGO_W + 16;
    doc.fill("#ffffff").fontSize(10).font("Helvetica").text("Backup Cerita / Novel", textX, logoY + 6);
    doc.fill("#ffffff").opacity(0.65).fontSize(9).text(`Diekspor pada: ${data.exportedAt}`, textX, logoY + 22);
    doc.opacity(1);

    // ── Story title box ──────────────────────────────────────────────────────
    doc.rect(50, 108, pageW - 100, 52).fill(PRIMARY);
    doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold")
      .text(data.storyTitle, 62, 116, { width: pageW - 124 });
    doc.fontSize(9).font("Helvetica").opacity(0.75)
      .text(`${data.category}  ·  ${data.status}`, 62, 136);
    doc.opacity(1);

    // ── Writer info ──────────────────────────────────────────────────────────
    doc.rect(50, 160, pageW - 100, 44).fill(LIGHT_GRAY);
    doc.fill(DARK).fontSize(9).font("Helvetica")
      .text(`Penulis: ${data.writerName}`, 62, 170)
      .text(`Email: ${data.writerEmail}`, 62, 184);

    let y = 220;

    // ── Synopsis ─────────────────────────────────────────────────────────────
    if (data.synopsis) {
      const synopsisText = stripHtml(data.synopsis);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text("Sinopsis", 50, y);
      y += 16;
      doc.fill(GRAY).fontSize(9).font("Helvetica")
        .text(synopsisText, 50, y, { width: pageW - 100 });
      y += doc.heightOfString(synopsisText, { width: pageW - 100 }) + 18;
    }

    doc.moveTo(50, y).lineTo(pageW - 50, y).stroke(PRIMARY);
    y += 14;

    const totalChapters = data.seasons.reduce((a, s) => a + s.chapters.length, 0);
    doc.fill(GRAY).fontSize(9).font("Helvetica")
      .text(`Total Season: ${data.seasons.length}  ·  Total Chapter: ${totalChapters}`, 50, y);
    y += 22;

    // ── Seasons & Chapters ───────────────────────────────────────────────────
    for (const season of data.seasons) {
      if (y > PAGE_BOTTOM - 50) { y = nextPage(doc, pageW); }

      doc.rect(50, y, pageW - 100, 28).fill("#dde0f7");
      doc.fill(PRIMARY).fontSize(11).font("Helvetica-Bold")
        .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y + 8, { width: pageW - 120 });
      y += 36;

      for (const ch of season.chapters) {
        if (y > PAGE_BOTTOM - 40) { y = nextPage(doc, pageW); }

        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Bab ${ch.chapterNumber}. ${ch.title}`, 60, y);
        y += 16;

        if (ch.content && ch.content.trim()) {
          const cleanContent = stripHtml(ch.content);
          if (!cleanContent) { y += 10; continue; }

          const CHUNK_SIZE = 2000;
          let offset = 0;
          while (offset < cleanContent.length) {
            const chunk = cleanContent.slice(offset, offset + CHUNK_SIZE);
            const h = doc.heightOfString(chunk, { width: pageW - 120 });
            if (y + h > PAGE_BOTTOM) { y = nextPage(doc, pageW); }
            doc.fill(DARK).fontSize(9).font("Helvetica")
              .text(chunk, 60, y, { width: pageW - 120 });
            y += doc.heightOfString(chunk, { width: pageW - 120 }) + 4;
            offset += CHUNK_SIZE;
          }
        }
        y += 10;
      }
      y += 10;
    }

    // ── Footer inline setelah konten (halaman terakhir) ──────────────────────
    y += 10;
    drawInlineFooter(doc, y, pageW);

    doc.end();
  });
}

// ── Writer Backup PDF ─────────────────────────────────────────────────────────

interface ChapterData {
  chapterNumber: number;
  title: string;
  content?: string;
}

interface SeasonData {
  seasonNumber: number;
  title: string;
  chapters: ChapterData[];
}

interface StoryData {
  title: string;
  category: string;
  status: string;
  synopsis?: string;
  seasons: SeasonData[];
}

export interface WriterBackupData {
  name: string;
  email: string;
  exportedAt: string;
  stories: StoryData[];
}

export function generateWriterBackupPdf(data: WriterBackupData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;

    // ── Header ──────────────────────────────────────────────────────────────
    const HEADER_H = 90;
    doc.rect(0, 0, pageW, HEADER_H).fill(PRIMARY);
    const logoX = 50;
    const logoY = Math.round((HEADER_H - LOGO_H) / 2);
    try { doc.image(LOGO_PATH, logoX, logoY, { width: LOGO_W }); } catch {}
    const textX = logoX + LOGO_W + 16;
    doc.fill("#ffffff").fontSize(10).font("Helvetica").text("Backup Data Penulis", textX, logoY + 6);
    doc.fill("#ffffff").opacity(0.7).fontSize(9).text(`Diekspor pada: ${data.exportedAt}`, textX, logoY + 22);
    doc.opacity(1);

    doc.moveDown(4);

    // ── Penulis info ─────────────────────────────────────────────────────────
    doc.rect(50, 110, pageW - 100, 60).fill(LIGHT_GRAY);
    doc.fill(DARK).fontSize(13).font("Helvetica-Bold").text("Informasi Penulis", 65, 120);
    doc.fontSize(10).font("Helvetica")
      .text(`Nama: ${data.name}`, 65, 138)
      .text(`Email: ${data.email}`, 65, 152);

    doc.moveDown(5);

    // ── Ringkasan ────────────────────────────────────────────────────────────
    doc.fill(DARK).fontSize(12).font("Helvetica-Bold").text(`Total Cerita: ${data.stories.length}`, 50, 185);
    doc.moveTo(50, 202).lineTo(pageW - 50, 202).stroke(PRIMARY);

    let y = 215;

    for (let si = 0; si < data.stories.length; si++) {
      const story = data.stories[si];
      const totalChapters = story.seasons.reduce((acc, s) => acc + s.chapters.length, 0);

      if (y > PAGE_BOTTOM - 80) { y = nextPage(doc, pageW); }

      doc.rect(50, y, pageW - 100, 32).fill(PRIMARY);
      doc.fill("#ffffff").fontSize(12).font("Helvetica-Bold")
        .text(`${si + 1}. ${story.title}`, 60, y + 9, { width: pageW - 130 });
      y += 32;

      doc.rect(50, y, pageW - 100, 24).fill(LIGHT_GRAY);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(`Kategori: ${story.category}  |  Status: ${story.status}  |  Total Chapter: ${totalChapters}`, 60, y + 8);
      y += 24;

      if (story.synopsis) {
        const synText = stripHtml(story.synopsis);
        doc.fill(DARK).fontSize(9).font("Helvetica").text(`Sinopsis: ${synText}`, 60, y + 8, { width: pageW - 120 });
        y += Math.ceil(doc.heightOfString(synText, { width: pageW - 120 }) / 12) * 12 + 14;
      }

      y += 6;

      for (const season of story.seasons) {
        if (y > PAGE_BOTTOM - 40) { y = nextPage(doc, pageW); }

        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y);
        y += 16;

        for (const ch of season.chapters) {
          if (y > PAGE_BOTTOM - 30) { y = nextPage(doc, pageW); }

          doc.fill(GRAY).fontSize(8).font("Helvetica")
            .text(`  Bab ${ch.chapterNumber}. ${ch.title}`, 70, y, { width: pageW - 130 });
          y += 13;

          if (ch.content) {
            const cleanContent = stripHtml(ch.content);
            const preview = cleanContent.slice(0, 300) + (cleanContent.length > 300 ? "..." : "");
            if (preview.trim()) {
              const h = doc.heightOfString(preview, { width: pageW - 150 });
              if (y + h > PAGE_BOTTOM) { y = nextPage(doc, pageW); }
              doc.fill(DARK).fontSize(8).font("Helvetica")
                .text(preview, 80, y, { width: pageW - 150 });
              y += h + 6;
            }
          }
        }
        y += 6;
      }
      y += 14;
    }

    // ── Footer inline setelah konten (halaman terakhir) ──────────────────────
    y += 10;
    drawInlineFooter(doc, y, pageW);

    doc.end();
  });
}
