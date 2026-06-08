import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const LOGO_PATH = path.join(process.cwd(), "public", "image", "landscape-wooce.png");
const LOGO_W = 120;
const LOGO_H = Math.round(LOGO_W * (372 / 1181)); // ≈ 38px

const PRIMARY    = "#3c40c7";
const DARK       = "#1f2937";
const GRAY       = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const YEAR       = new Date().getFullYear();

// Content must not exceed this Y — leaves room for bottom footer
const PAGE_BOTTOM = 775;

// ── Utilities ─────────────────────────────────────────────────────────────────

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

function drawLogo(doc: InstanceType<typeof PDFDocument>, x: number, y: number) {
  if (fs.existsSync(LOGO_PATH)) {
    try { doc.image(LOGO_PATH, x, y, { width: LOGO_W }); return; }
    catch (e) { console.error("[PDF] Logo gagal dimuat:", e); }
  }
  doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold").text("WOOCE", x, y + 8);
}

/**
 * Footer di bagian bawah halaman (halaman yang penuh).
 * Dipanggil SEBELUM addPage().
 */
function drawBottomFooter(
  doc: InstanceType<typeof PDFDocument>,
  pageW: number,
  pageNum: number
) {
  const lineY = doc.page.height - 42;
  doc.save();
  doc.moveTo(50, lineY).lineTo(pageW - 50, lineY)
    .strokeColor("#d1d5db").lineWidth(0.5).stroke();
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`© ${YEAR} WOOCE Novel · Hak cipta dilindungi undang-undang`, 50, lineY + 10, { width: pageW - 160, lineBreak: false });
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`Hal. ${pageNum}`, pageW - 110, lineY + 10, { width: 60, align: "right", lineBreak: false });
  doc.restore();
}

/**
 * Footer inline tepat setelah konten terakhir (halaman terakhir).
 */
function drawInlineFooter(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  pageW: number,
  pageNum: number,
  totalPages: number
) {
  doc.save();
  doc.moveTo(50, y).lineTo(pageW - 50, y)
    .strokeColor("#d1d5db").lineWidth(0.5).stroke();
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`© ${YEAR} WOOCE Novel · Hak cipta dilindungi undang-undang`, 50, y + 10, { width: pageW - 160, lineBreak: false });
  doc.fill(GRAY).fontSize(7.5).font("Helvetica")
    .text(`Hal. ${pageNum} dari ${totalPages}`, pageW - 110, y + 10, { width: 60, align: "right", lineBreak: false });
  doc.restore();
}

/**
 * Render paragraf-paragraf dari konten chapter dengan spasi antar paragraf.
 * Memanggil onNewPage() jika paragraf tidak muat di halaman saat ini.
 */
function renderParagraphs(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  startY: number,
  contentX: number,
  contentWidth: number,
  onNewPage: () => number
): number {
  let y = startY;
  const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);

  for (const para of paragraphs) {
    const lineGap = 3;
    const h = doc.heightOfString(para, { width: contentWidth, lineGap });

    if (y + h > PAGE_BOTTOM) {
      y = onNewPage();
    }

    doc.fill(DARK).fontSize(9.5).font("Helvetica")
      .text(para, contentX, y, { width: contentWidth, lineGap, align: "justify" });
    y += h + 9;
  }

  return y;
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
    let pageNum = 1;

    function nextPage(): number {
      drawBottomFooter(doc, pageW, pageNum);
      doc.addPage();
      pageNum++;
      return 50;
    }

    // ── Header ──────────────────────────────────────────────────────────────
    const HEADER_H = 90;
    doc.rect(0, 0, pageW, HEADER_H).fill(PRIMARY);
    const logoX = 50;
    const logoY = Math.round((HEADER_H - LOGO_H) / 2);
    drawLogo(doc, logoX, logoY);
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
      if (synopsisText) {
        doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text("Sinopsis", 50, y);
        y += 16;
        doc.fill(GRAY).fontSize(9).font("Helvetica")
          .text(synopsisText, 50, y, { width: pageW - 100, lineGap: 2, align: "justify" });
        y += doc.heightOfString(synopsisText, { width: pageW - 100, lineGap: 2 }) + 18;
      }
    }

    doc.moveTo(50, y).lineTo(pageW - 50, y).stroke(PRIMARY);
    y += 14;

    const totalChapters = data.seasons.reduce((a, s) => a + s.chapters.length, 0);
    doc.fill(GRAY).fontSize(9).font("Helvetica")
      .text(`Total Season: ${data.seasons.length}  ·  Total Chapter: ${totalChapters}`, 50, y);
    y += 24;

    // ── Seasons & Chapters ───────────────────────────────────────────────────
    for (const season of data.seasons) {
      if (y > PAGE_BOTTOM - 60) { y = nextPage(); }

      doc.rect(50, y, pageW - 100, 30).fill("#dde0f7");
      doc.fill(PRIMARY).fontSize(11).font("Helvetica-Bold")
        .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y + 9, { width: pageW - 120 });
      y += 40;

      for (const ch of season.chapters) {
        if (y > PAGE_BOTTOM - 50) { y = nextPage(); }

        // Chapter title bar
        doc.rect(50, y, pageW - 100, 24).fill("#f0f0f8");
        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Bab ${ch.chapterNumber}  —  ${ch.title}`, 60, y + 7, { width: pageW - 120 });
        y += 32;

        if (ch.content && ch.content.trim()) {
          const cleanContent = stripHtml(ch.content);
          if (cleanContent) {
            y = renderParagraphs(doc, cleanContent, y, 60, pageW - 120, nextPage);
          }
        }

        // Pemisah antar chapter
        y += 4;
        if (y + 20 <= PAGE_BOTTOM) {
          doc.fill(GRAY).fontSize(9)
            .text("· · ·", 50, y, { align: "center", width: pageW - 100, lineBreak: false });
          y += 20;
        }
      }

      y += 8;
    }

    // ── Footer di halaman terakhir ───────────────────────────────────────────
    y += 10;
    if (y > PAGE_BOTTOM) {
      // Halaman sudah penuh — pakai posisi fixed di bawah, jangan buat halaman baru
      drawBottomFooter(doc, pageW, pageNum);
    } else {
      // Halaman masih ada ruang — footer inline tepat setelah konten
      drawInlineFooter(doc, y, pageW, pageNum, pageNum);
    }

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
    let pageNum = 1;

    function nextPage(): number {
      drawBottomFooter(doc, pageW, pageNum);
      doc.addPage();
      pageNum++;
      return 50;
    }

    // ── Header ──────────────────────────────────────────────────────────────
    const HEADER_H = 90;
    doc.rect(0, 0, pageW, HEADER_H).fill(PRIMARY);
    const logoX = 50;
    const logoY = Math.round((HEADER_H - LOGO_H) / 2);
    drawLogo(doc, logoX, logoY);
    const textX = logoX + LOGO_W + 16;
    doc.fill("#ffffff").fontSize(10).font("Helvetica").text("Backup Data Penulis", textX, logoY + 6);
    doc.fill("#ffffff").opacity(0.7).fontSize(9).text(`Diekspor pada: ${data.exportedAt}`, textX, logoY + 22);
    doc.opacity(1);

    // ── Penulis info ─────────────────────────────────────────────────────────
    doc.rect(50, 110, pageW - 100, 60).fill(LIGHT_GRAY);
    doc.fill(DARK).fontSize(13).font("Helvetica-Bold").text("Informasi Penulis", 65, 120);
    doc.fontSize(10).font("Helvetica")
      .text(`Nama: ${data.name}`, 65, 138)
      .text(`Email: ${data.email}`, 65, 152);

    // ── Ringkasan ────────────────────────────────────────────────────────────
    doc.fill(DARK).fontSize(12).font("Helvetica-Bold").text(`Total Cerita: ${data.stories.length}`, 50, 185);
    doc.moveTo(50, 202).lineTo(pageW - 50, 202).stroke(PRIMARY);

    let y = 215;

    for (let si = 0; si < data.stories.length; si++) {
      const story = data.stories[si];
      const totalChapters = story.seasons.reduce((acc, s) => acc + s.chapters.length, 0);

      if (y > PAGE_BOTTOM - 80) { y = nextPage(); }

      doc.rect(50, y, pageW - 100, 32).fill(PRIMARY);
      doc.fill("#ffffff").fontSize(12).font("Helvetica-Bold")
        .text(`${si + 1}. ${story.title}`, 60, y + 9, { width: pageW - 130 });
      y += 32;

      doc.rect(50, y, pageW - 100, 24).fill(LIGHT_GRAY);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(`Kategori: ${story.category}  |  Status: ${story.status}  |  Total Chapter: ${totalChapters}`, 60, y + 8);
      y += 28;

      if (story.synopsis) {
        const synText = stripHtml(story.synopsis);
        if (synText) {
          const h = doc.heightOfString(synText, { width: pageW - 120, lineGap: 2 });
          if (y + h > PAGE_BOTTOM) { y = nextPage(); }
          doc.fill(DARK).fontSize(8.5).font("Helvetica")
            .text(`Sinopsis: ${synText}`, 60, y, { width: pageW - 120, lineGap: 2 });
          y += h + 12;
        }
      }

      for (const season of story.seasons) {
        if (y > PAGE_BOTTOM - 40) { y = nextPage(); }

        doc.fill(PRIMARY).fontSize(10).font("Helvetica-Bold")
          .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y);
        y += 18;

        for (const ch of season.chapters) {
          if (y > PAGE_BOTTOM - 30) { y = nextPage(); }

          doc.fill(DARK).fontSize(8.5).font("Helvetica-Bold")
            .text(`  Bab ${ch.chapterNumber}. ${ch.title}`, 70, y, { width: pageW - 130 });
          y += 14;

          if (ch.content) {
            const cleanContent = stripHtml(ch.content);
            const preview = cleanContent.slice(0, 350) + (cleanContent.length > 350 ? "…" : "");
            if (preview.trim()) {
              const h = doc.heightOfString(preview, { width: pageW - 150, lineGap: 2 });
              if (y + h > PAGE_BOTTOM) { y = nextPage(); }
              doc.fill(GRAY).fontSize(8).font("Helvetica")
                .text(preview, 80, y, { width: pageW - 150, lineGap: 2 });
              y += h + 8;
            }
          }
        }
        y += 8;
      }
      y += 16;
    }

    // ── Footer di halaman terakhir ───────────────────────────────────────────
    y += 10;
    if (y > PAGE_BOTTOM) {
      drawBottomFooter(doc, pageW, pageNum);
    } else {
      drawInlineFooter(doc, y, pageW, pageNum, pageNum);
    }

    doc.end();
  });
}
