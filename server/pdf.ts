import PDFDocument from "pdfkit";

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
