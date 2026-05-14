import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const { t, language } = useLanguage();
  const isID = language === "id";

  const sections = isID ? [
    {
      title: "1. Penerimaan Ketentuan",
      content: "Dengan mengakses dan menggunakan platform WOOCE Novel, kamu menyetujui Ketentuan Layanan ini. Jika kamu tidak menyetujui ketentuan ini, mohon tidak menggunakan layanan kami.",
    },
    {
      title: "2. Penggunaan Layanan",
      content: "WOOCE Novel adalah platform baca novel, komik, dan cerita pendek. Kamu boleh menggunakan layanan ini untuk tujuan pribadi dan non-komersial. Kamu tidak diperbolehkan menyalin, mendistribusikan, atau memodifikasi konten tanpa izin tertulis dari kami.",
    },
    {
      title: "3. Kebijakan Konten",
      content: "Seluruh konten di WOOCE Novel adalah milik penulis masing-masing atau WOOCE Novel. Konten tersedia untuk dibaca secara online. Mengunduh, menyebarluaskan, atau mengklaim konten sebagai milik sendiri adalah pelanggaran hak cipta.",
    },
    {
      title: "4. Hak Kekayaan Intelektual",
      content: "Semua cerita, karakter, nama, logo, dan materi lain di platform ini dilindungi oleh hak cipta. Penggunaan tanpa izin dapat mengakibatkan tindakan hukum.",
    },
    {
      title: "5. Akun Pengguna",
      content: "Saat ini WOOCE Novel tidak mewajibkan pendaftaran akun untuk membaca. Akun admin hanya untuk pengelola platform dan tidak dibuka untuk umum.",
    },
    {
      title: "6. Penyangkalan",
      content: "Layanan ini disediakan \"sebagaimana adanya\" tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan ini.",
    },
    {
      title: "7. Perubahan Ketentuan",
      content: "Kami berhak mengubah ketentuan ini kapan saja. Perubahan berlaku segera setelah dipublikasikan di platform. Penggunaan layanan setelah perubahan berarti kamu menerima ketentuan baru.",
    },
    {
      title: "8. Hubungi Kami",
      content: "Jika ada pertanyaan terkait ketentuan ini, hubungi kami di wooce.novel@gmail.com.",
    },
  ] : [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using the WOOCE Novel platform, you agree to these Terms of Service. If you do not agree to these terms, please do not use our service.",
    },
    {
      title: "2. Use of Service",
      content: "WOOCE Novel is a platform for reading novels, comics, and short stories. You may use this service for personal, non-commercial purposes only. You may not copy, distribute, or modify any content without our written permission.",
    },
    {
      title: "3. Content Policy",
      content: "All content on WOOCE Novel belongs to its respective authors or WOOCE Novel. Content is available for online reading only. Downloading, redistributing, or claiming content as your own is a copyright violation.",
    },
    {
      title: "4. Intellectual Property",
      content: "All stories, characters, names, logos, and other materials on this platform are protected by copyright. Unauthorized use may result in legal action.",
    },
    {
      title: "5. User Accounts",
      content: "WOOCE Novel currently does not require account registration to read. Admin accounts are for platform managers only and not open to the public.",
    },
    {
      title: "6. Disclaimer",
      content: "This service is provided \"as is\" without any warranties. We are not liable for any damages arising from the use of this service.",
    },
    {
      title: "7. Changes to Terms",
      content: "We reserve the right to change these terms at any time. Changes take effect immediately upon publication. Continued use of the service after changes constitutes acceptance of the new terms.",
    },
    {
      title: "8. Contact Us",
      content: "If you have any questions about these terms, contact us at wooce.novel@gmail.com.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${t("terms.title")} — WOOCE Novel`}
        description="Baca ketentuan layanan WOOCE Novel sebelum menggunakan platform kami."
        url="/terms"
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-12">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={14} />
            {isID ? "Kembali" : "Back"}
          </button>
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("terms.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("terms.updated")}: 14 Mei 2026
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-foreground mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
