import PDFDocument from "pdfkit";
import path from "path";

const LOGO_PATH = path.resolve("public/image/landscape-wooce.png");
const LOGO_W = 120;
const LOGO_H = Math.round(LOGO_W * (372 / 1181)); // ≈ 38px, preserve aspect ratio

const PRIMARY    = "#3c40c7";
const DARK       = "#1f2937";
const GRAY       = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";

const FOOTER_H   = 52; // reserved height at bottom for footer
const YEAR       = new Date().getFullYear();

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

/** Draw footer on whichever page is currently active */
function drawPageFooter(doc: InstanceType<typeof PDFDocument>, pageW: number) {
  const ph = doc.page.height;
  const lineY = ph - FOOTER_H + 2;
  doc.save();
  doc.moveTo(50, lineY).lineTo(pageW - 50, lineY)
    .strokeColor("#d1d5db").lineWidth(0.5).stroke();
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`© ${YEAR} WOOCE · Hak cipta dilindungi undang-undang`, 50, lineY + 8, { align: "center", width: pageW - 100 });
  doc.fill(GRAY).fontSize(7).font("Helvetica")
    .text("WOOCE Novel — Platform Baca Novel, Komik, dan Cerita Pendek", 50, lineY + 22, { align: "center", width: pageW - 100 });
  doc.restore();
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
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const BOTTOM = doc.page.height - FOOTER_H - 10; // content must not go below this

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
      if (y > BOTTOM - 50) { doc.addPage(); y = 50; }

      doc.rect(50, y, pageW - 100, 28).fill("#dde0f7");
      doc.fill(PRIMARY).fontSize(11).font("Helvetica-Bold")
        .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y + 8, { width: pageW - 120 });
      y += 36;

      for (const ch of season.chapters) {
        if (y > BOTTOM - 40) { doc.addPage(); y = 50; }

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
            if (y + h > BOTTOM) { doc.addPage(); y = 50; }
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

    // ── Draw footer on every buffered page ───────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      drawPageFooter(doc, pageW);
    }
    doc.flushPages();
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
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const BOTTOM = doc.page.height - FOOTER_H - 10;

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

      if (y > BOTTOM - 80) { doc.addPage(); y = 50; }

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
        if (y > BOTTOM - 40) { doc.addPage(); y = 50; }

        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y);
        y += 16;

        for (const ch of season.chapters) {
          if (y > BOTTOM - 30) { doc.addPage(); y = 50; }

          doc.fill(GRAY).fontSize(8).font("Helvetica")
            .text(`  Bab ${ch.chapterNumber}. ${ch.title}`, 70, y, { width: pageW - 130 });
          y += 13;

          if (ch.content) {
            const cleanContent = stripHtml(ch.content);
            const preview = cleanContent.slice(0, 300) + (cleanContent.length > 300 ? "..." : "");
            if (preview.trim()) {
              const h = doc.heightOfString(preview, { width: pageW - 150 });
              if (y + h > BOTTOM) { doc.addPage(); y = 50; }
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

    // ── Draw footer on every buffered page ───────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      drawPageFooter(doc, pageW);
    }
    doc.flushPages();
    doc.end();
  });
}
