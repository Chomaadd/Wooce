import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const { t, language } = useLanguage();
  const isID = language === "id";

  const sections = isID ? [
    {
      title: "1. Pendahuluan",
      content: "WOOCE Novel berkomitmen melindungi privasi penggunanya. Kebijakan ini menjelaskan data apa yang kami kumpulkan dan bagaimana kami menggunakannya saat kamu menggunakan platform kami.",
    },
    {
      title: "2. Data yang Dikumpulkan",
      content: "Kami tidak mewajibkan pendaftaran akun. Data yang disimpan secara lokal di perangkatmu meliputi: preferensi bahasa, tema (terang/gelap), bookmark novel, dan progres membaca. Data ini hanya ada di perangkatmu dan tidak dikirim ke server kami.",
    },
    {
      title: "3. Cookie & Penyimpanan Lokal",
      content: "Platform kami menggunakan localStorage browser untuk menyimpan preferensi dan progres baca. Tidak ada cookie pelacak pihak ketiga yang digunakan. Kamu dapat menghapus data ini kapan saja melalui pengaturan browser.",
    },
    {
      title: "4. Data Penggunaan",
      content: "Kami mengumpulkan data anonim seperti jumlah tampilan (view count) per cerita untuk memahami konten yang diminati pembaca. Data ini tidak terhubung ke identitas pribadimu.",
    },
    {
      title: "5. Pihak Ketiga",
      content: "WOOCE Novel tidak menjual, menyewakan, atau membagikan data pribadimu kepada pihak ketiga. Tautan ke media sosial eksternal (TikTok, Facebook, Instagram) tunduk pada kebijakan privasi masing-masing platform.",
    },
    {
      title: "6. Keamanan",
      content: "Kami mengambil langkah-langkah yang wajar untuk melindungi platform kami. Namun, tidak ada sistem yang 100% aman. Gunakan platform ini dengan bijak.",
    },
    {
      title: "7. Perubahan Kebijakan",
      content: "Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan dipublikasikan di halaman ini. Penggunaan layanan setelah perubahan berarti kamu menerima kebijakan baru.",
    },
    {
      title: "8. Hubungi Kami",
      content: "Jika ada pertanyaan terkait privasi, hubungi kami di wooce.novel@gmail.com.",
    },
  ] : [
    {
      title: "1. Introduction",
      content: "WOOCE Novel is committed to protecting your privacy. This policy explains what data we collect and how we use it when you use our platform.",
    },
    {
      title: "2. Data We Collect",
      content: "We do not require account registration. Data stored locally on your device includes: language preference, theme (light/dark), novel bookmarks, and reading progress. This data stays on your device and is not sent to our servers.",
    },
    {
      title: "3. Cookies & Local Storage",
      content: "Our platform uses browser localStorage to save preferences and reading progress. No third-party tracking cookies are used. You can clear this data at any time through your browser settings.",
    },
    {
      title: "4. Usage Data",
      content: "We collect anonymous data such as view counts per story to understand what content readers enjoy. This data is not linked to your personal identity.",
    },
    {
      title: "5. Third Parties",
      content: "WOOCE Novel does not sell, rent, or share your personal data with third parties. Links to external social media (TikTok, Facebook, Instagram) are subject to their respective privacy policies.",
    },
    {
      title: "6. Security",
      content: "We take reasonable steps to protect our platform. However, no system is 100% secure. Please use this platform responsibly.",
    },
    {
      title: "7. Policy Changes",
      content: "We may update this privacy policy from time to time. Changes will be posted on this page. Continued use of the service after changes constitutes acceptance of the new policy.",
    },
    {
      title: "8. Contact Us",
      content: "If you have any privacy-related questions, contact us at wooce.novel@gmail.com.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${t("privacy.title")} — WOOCE Novel`}
        description="Pelajari bagaimana WOOCE Novel mengelola dan melindungi data penggunanya."
        url="/privacy"
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
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("privacy.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("privacy.updated")}: 14 Mei 2026
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
