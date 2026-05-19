import PDFDocument from "pdfkit";

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

    const PRIMARY = "#7c3aed";
    const DARK = "#1f2937";
    const GRAY = "#6b7280";
    const LIGHT_GRAY = "#f3f4f6";
    const pageW = doc.page.width;

    // Header
    doc.rect(0, 0, pageW, 90).fill(PRIMARY);
    doc.fill("#ffffff").fontSize(20).font("Helvetica-Bold").text("WOOCE Novel", 50, 22);
    doc.fontSize(10).font("Helvetica").text("Backup Cerita / Novel", 50, 48);
    doc.fill("#ffffff").opacity(0.65).fontSize(9).text(`Diekspor pada: ${data.exportedAt}`, 50, 64);
    doc.opacity(1);

    // Story title box
    doc.rect(50, 108, pageW - 100, 52).fill(PRIMARY);
    doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold")
      .text(data.storyTitle, 62, 116, { width: pageW - 124 });
    doc.fontSize(9).font("Helvetica").opacity(0.75)
      .text(`${data.category}  ·  ${data.status}`, 62, 136);
    doc.opacity(1);

    // Writer info
    doc.rect(50, 160, pageW - 100, 44).fill(LIGHT_GRAY);
    doc.fill(DARK).fontSize(9).font("Helvetica")
      .text(`Penulis: ${data.writerName}`, 62, 170)
      .text(`Email: ${data.writerEmail}`, 62, 184);

    let y = 220;

    // Synopsis
    if (data.synopsis) {
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text("Sinopsis", 50, y);
      y += 16;
      doc.fill(GRAY).fontSize(9).font("Helvetica")
        .text(data.synopsis, 50, y, { width: pageW - 100 });
      y += doc.heightOfString(data.synopsis, { width: pageW - 100 }) + 18;
    }

    doc.moveTo(50, y).lineTo(pageW - 50, y).stroke(PRIMARY);
    y += 14;

    const totalChapters = data.seasons.reduce((a, s) => a + s.chapters.length, 0);
    doc.fill(GRAY).fontSize(9).font("Helvetica")
      .text(`Total Season: ${data.seasons.length}  ·  Total Chapter: ${totalChapters}`, 50, y);
    y += 22;

    for (const season of data.seasons) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }

      // Season header
      doc.rect(50, y, pageW - 100, 28).fill("#ede9fe");
      doc.fill(PRIMARY).fontSize(11).font("Helvetica-Bold")
        .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y + 8, { width: pageW - 120 });
      y += 36;

      for (const ch of season.chapters) {
        if (y > doc.page.height - 80) { doc.addPage(); y = 50; }

        // Chapter title
        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Bab ${ch.chapterNumber}. ${ch.title}`, 60, y);
        y += 16;

        if (ch.content && ch.content.trim()) {
          const lines = ch.content.trim();
          const lineH = doc.heightOfString(lines, { width: pageW - 120 });
          if (y + lineH > doc.page.height - 60) {
            // Write what fits, then paginate
            const remaining = lines;
            let offset = 0;
            while (offset < remaining.length) {
              const chunk = remaining.slice(offset, offset + 2000);
              const h = doc.heightOfString(chunk, { width: pageW - 120 });
              if (y + h > doc.page.height - 60) { doc.addPage(); y = 50; }
              doc.fill(DARK).fontSize(9).font("Helvetica")
                .text(chunk, 60, y, { width: pageW - 120 });
              y += doc.heightOfString(chunk, { width: pageW - 120 }) + 4;
              offset += 2000;
            }
          } else {
            doc.fill(DARK).fontSize(9).font("Helvetica")
              .text(lines, 60, y, { width: pageW - 120 });
            y += lineH + 4;
          }
        }
        y += 10;
      }
      y += 10;
    }

    // Footer
    doc.fill(GRAY).fontSize(8).font("Helvetica")
      .text("WOOCE Novel — Platform Baca Novel, Komik, dan Cerita Pendek", 50, doc.page.height - 36, { align: "center", width: pageW - 100 });

    doc.end();
  });
}

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

    const PRIMARY = "#7c3aed";
    const DARK = "#1f2937";
    const GRAY = "#6b7280";
    const LIGHT_GRAY = "#f3f4f6";

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);
    doc.fill("#ffffff").fontSize(22).font("Helvetica-Bold").text("WOOCE Novel", 50, 25);
    doc.fontSize(10).font("Helvetica").text("Backup Data Penulis", 50, 52);
    doc.fill("#ffffff").opacity(0.7).fontSize(9).text(`Diekspor pada: ${data.exportedAt}`, 50, 68);
    doc.opacity(1);

    doc.moveDown(4);

    // Penulis info
    doc.rect(50, 110, doc.page.width - 100, 60).fill(LIGHT_GRAY);
    doc.fill(DARK).fontSize(13).font("Helvetica-Bold").text("Informasi Penulis", 65, 120);
    doc.fontSize(10).font("Helvetica")
      .text(`Nama: ${data.name}`, 65, 138)
      .text(`Email: ${data.email}`, 65, 152);

    doc.moveDown(5);

    // Ringkasan
    doc.fill(DARK).fontSize(12).font("Helvetica-Bold").text(`Total Cerita: ${data.stories.length}`, 50, 185);
    doc.moveTo(50, 202).lineTo(doc.page.width - 50, 202).stroke(PRIMARY);

    let y = 215;

    for (let si = 0; si < data.stories.length; si++) {
      const story = data.stories[si];
      const totalChapters = story.seasons.reduce((acc, s) => acc + s.chapters.length, 0);

      if (y > doc.page.height - 120) { doc.addPage(); y = 50; }

      // Story header
      doc.rect(50, y, doc.page.width - 100, 32).fill(PRIMARY);
      doc.fill("#ffffff").fontSize(12).font("Helvetica-Bold")
        .text(`${si + 1}. ${story.title}`, 60, y + 9, { width: doc.page.width - 130 });
      y += 32;

      // Story meta
      doc.rect(50, y, doc.page.width - 100, 24).fill(LIGHT_GRAY);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(`Kategori: ${story.category}  |  Status: ${story.status}  |  Total Chapter: ${totalChapters}`, 60, y + 8);
      y += 24;

      if (story.synopsis) {
        doc.fill(DARK).fontSize(9).font("Helvetica").text(`Sinopsis: ${story.synopsis}`, 60, y + 8, { width: doc.page.width - 120 });
        y += Math.ceil(doc.heightOfString(story.synopsis, { width: doc.page.width - 120 }) / 12) * 12 + 14;
      }

      y += 6;

      for (const season of story.seasons) {
        if (y > doc.page.height - 80) { doc.addPage(); y = 50; }

        doc.fill(DARK).fontSize(10).font("Helvetica-Bold")
          .text(`Season ${season.seasonNumber}: ${season.title}`, 60, y);
        y += 16;

        for (const ch of season.chapters) {
          if (y > doc.page.height - 60) { doc.addPage(); y = 50; }

          doc.fill(GRAY).fontSize(8).font("Helvetica")
            .text(`  Bab ${ch.chapterNumber}. ${ch.title}`, 70, y, { width: doc.page.width - 130 });
          y += 13;

          if (ch.content) {
            const preview = ch.content.slice(0, 300) + (ch.content.length > 300 ? "..." : "");
            const h = doc.heightOfString(preview, { width: doc.page.width - 150 });
            if (y + h > doc.page.height - 60) { doc.addPage(); y = 50; }
            doc.fill(DARK).fontSize(8).font("Helvetica")
              .text(preview, 80, y, { width: doc.page.width - 150 });
            y += h + 6;
          }
        }
        y += 6;
      }
      y += 14;
    }

    // Footer
    doc.fill(GRAY).fontSize(8).font("Helvetica")
      .text("WOOCE Novel — Platform Baca Novel, Komik, dan Cerita Pendek", 50, doc.page.height - 40, { align: "center", width: doc.page.width - 100 });

    doc.end();
  });
}
