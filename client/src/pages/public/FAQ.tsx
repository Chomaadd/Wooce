import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  label: string;
  emoji: string;
  items: FaqItem[];
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-start justify-between py-4 text-left gap-4 hover:text-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
        data-testid="button-faq-toggle"
      >
        <span className="font-medium text-sm text-foreground leading-relaxed">{item.q}</span>
        <span className="shrink-0 mt-0.5">
          {open ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-4 leading-relaxed whitespace-pre-line">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const { language } = useLanguage();
  const isID = language === "id";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories: FaqCategory[] = isID
    ? [
        {
          id: "umum",
          label: "Umum",
          emoji: "📖",
          items: [
            {
              q: "Apa itu WOOCE Novel?",
              a: "WOOCE Novel adalah platform baca novel, komik, dan cerita pendek berbahasa Indonesia. Di sini, pembaca bisa menikmati ribuan karya dari penulis lokal, dan penulis bisa mempublikasikan karyanya langsung ke pembaca.",
            },
            {
              q: "Apakah WOOCE Novel gratis?",
              a: "Ya! Sebagian besar konten di WOOCE Novel bisa dibaca secara gratis. Beberapa chapter premium memerlukan koin untuk dibuka, namun konten gratis selalu tersedia.",
            },
            {
              q: "Di mana saja saya bisa mengakses WOOCE Novel?",
              a: "WOOCE Novel bisa diakses dari browser di smartphone, tablet, maupun komputer/laptop. Tidak perlu instal aplikasi — cukup buka di browser favoritmu.",
            },
            {
              q: "Apakah ada aplikasi WOOCE Novel?",
              a: "Saat ini WOOCE Novel tersedia dalam versi web yang sudah dioptimalkan untuk semua perangkat. Kamu bisa menambahkannya ke layar beranda smartphone (Add to Home Screen) agar terasa seperti aplikasi.",
            },
            {
              q: "Apa saja genre yang tersedia di WOOCE Novel?",
              a: "WOOCE Novel menyediakan berbagai genre, di antaranya: Romance, Fantasy, Action, Slice of Life, Horror, Misteri, BL/GL, Komedi, dan banyak lagi. Genre terus bertambah seiring penulis baru bergabung.",
            },
            {
              q: "Bagaimana cara menghubungi tim WOOCE Novel?",
              a: "Kamu bisa menghubungi kami melalui:\n• Halaman Kontak di website\n• Email: support@woocenovel.my.id\n• Instagram: @woocenovel\n• Facebook: WOOCE Novel\n\nTim kami akan merespons dalam waktu 1×24 jam di hari kerja.",
            },
          ],
        },
        {
          id: "akun",
          label: "Akun & Login",
          emoji: "👤",
          items: [
            {
              q: "Bagaimana cara membuat akun?",
              a: "Klik tombol 'Masuk' di pojok kanan atas, lalu pilih 'Login dengan Google'. Akun kamu otomatis dibuat menggunakan data Google-mu — tidak perlu isi formulir panjang.",
            },
            {
              q: "Apakah saya harus login untuk membaca?",
              a: "Tidak, kamu bisa membaca konten gratis tanpa login. Namun untuk fitur seperti bookmark, mengikuti penulis, komentar, dan membaca chapter premium, kamu perlu login terlebih dahulu.",
            },
            {
              q: "Metode login apa yang tersedia?",
              a: "Saat ini WOOCE Novel mendukung login via Google. Kami berencana menambah metode login lain di masa mendatang.",
            },
            {
              q: "Apakah data akun saya aman?",
              a: "Ya. Kami tidak menyimpan password-mu — login dilakukan sepenuhnya melalui Google OAuth yang aman. Data pribadimu dilindungi sesuai Kebijakan Privasi kami.",
            },
            {
              q: "Bagaimana cara mengganti foto profil?",
              a: "Foto profil diambil otomatis dari akun Google-mu. Untuk mengubahnya, ubah foto profil di akun Google-mu, lalu logout dan login kembali di WOOCE Novel.",
            },
            {
              q: "Bagaimana cara menghapus akun saya?",
              a: "Untuk menghapus akun, hubungi kami melalui halaman Kontak atau email support@woocenovel.my.id dengan subjek 'Hapus Akun'. Tim kami akan memproses permintaanmu dalam 3 hari kerja.",
            },
            {
              q: "Saya tidak bisa login, apa yang harus dilakukan?",
              a: "Coba langkah berikut:\n1. Pastikan browser kamu mengizinkan pop-up dari WOOCE Novel\n2. Coba bersihkan cache browser\n3. Gunakan mode Incognito / Private untuk mencoba login\n4. Pastikan koneksi internet stabil\n\nMasih bermasalah? Hubungi kami melalui halaman Kontak.",
            },
          ],
        },
        {
          id: "baca",
          label: "Membaca & Fitur",
          emoji: "📚",
          items: [
            {
              q: "Bagaimana cara mulai membaca novel?",
              a: "Dari halaman utama, pilih novel yang ingin kamu baca, klik judulnya untuk masuk ke halaman detail, lalu klik tombol 'Mulai Baca' atau pilih chapter dari daftar.",
            },
            {
              q: "Apa itu mode gelap dan bagaimana cara mengaktifkannya?",
              a: "Mode gelap membuat tampilan lebih nyaman di mata saat membaca di malam hari. Klik ikon bulan di pojok kanan atas navbar untuk mengaktifkan/menonaktifkan mode gelap.",
            },
            {
              q: "Bagaimana cara mengubah ukuran font saat membaca?",
              a: "Di halaman baca, klik ikon pengaturan (⚙️) di toolbar atas, lalu sesuaikan ukuran font sesuai kenyamananmu. Pengaturan ini akan tersimpan otomatis.",
            },
            {
              q: "Apa itu fitur Bookmark?",
              a: "Bookmark memungkinkan kamu menyimpan novel favorit agar mudah ditemukan kembali. Klik ikon bookmark di halaman detail novel untuk menambah/menghapus bookmark.",
            },
            {
              q: "Apa itu fitur 'Lanjut Baca'?",
              a: "Fitur Lanjut Baca menyimpan chapter terakhir yang kamu buka, dan menampilkan shortcut di homepage agar kamu bisa langsung melanjutkan tanpa harus mencari-cari lagi.",
            },
            {
              q: "Apakah ada shortcut keyboard untuk membaca?",
              a: "Ya! Gunakan tombol:\n• ← (panah kiri) — chapter sebelumnya\n• → (panah kanan) — chapter berikutnya\n• F — aktifkan/nonaktifkan Focus Mode\n\nFocus Mode menyembunyikan elemen UI agar kamu bisa fokus membaca.",
            },
            {
              q: "Bagaimana cara berbagi kutipan dari chapter?",
              a: "Seleksi/sorot teks di halaman baca, lalu klik tombol 'Buat Kartu Kutipan' yang muncul. Sistem akan membuat kartu gambar cantik berisi kutipanmu yang bisa didownload atau dibagikan ke Instagram Story.",
            },
            {
              q: "Bagaimana cara melaporkan konten yang tidak pantas?",
              a: "Di halaman baca chapter, klik ikon flag (🚩) di toolbar. Pilih alasan laporan dari daftar yang tersedia, lalu kirim. Laporan akan ditinjau oleh tim admin kami.",
            },
            {
              q: "Apa itu chapter premium?",
              a: "Chapter premium adalah chapter eksklusif yang memerlukan koin untuk dibuka. Penulis bisa menandai chapter tertentu sebagai premium untuk mendapat dukungan dari pembaca.",
            },
            {
              q: "Bagaimana cara menyalin link chapter?",
              a: "Di halaman baca, klik tombol 'Salin Link' di toolbar. URL chapter akan langsung tersalin ke clipboard dan bisa kamu bagikan ke siapa saja.",
            },
          ],
        },
        {
          id: "koin",
          label: "Koin & Pembayaran",
          emoji: "🪙",
          items: [
            {
              q: "Apa itu Koin WOOCE?",
              a: "Koin WOOCE adalah mata uang virtual di platform yang digunakan untuk membuka chapter premium. Beli sekali, gunakan kapan saja untuk chapter mana saja.",
            },
            {
              q: "Bagaimana cara top up koin?",
              a: "1. Klik ikon koin di navbar (atau buka menu Koin)\n2. Pilih halaman Top Up Koin\n3. Pilih paket koin yang sesuai\n4. Klik tombol beli, lalu selesaikan pembayaran via Midtrans\n5. Koin langsung masuk setelah pembayaran terkonfirmasi",
            },
            {
              q: "Metode pembayaran apa yang diterima?",
              a: "WOOCE Novel menerima berbagai metode pembayaran via Midtrans:\n• GoPay\n• OVO\n• QRIS (semua e-wallet/bank yang mendukung QRIS)\n• Transfer Bank (BCA, Mandiri, BNI, BRI, dll.)\n• Kartu Kredit/Debit Visa & Mastercard\n• Indomaret & Alfamart",
            },
            {
              q: "Berapa lama koin masuk setelah pembayaran?",
              a: "Instan. Setelah pembayaran terkonfirmasi, kamu otomatis diarahkan ke halaman konfirmasi yang mengecek status real-time. Begitu sukses, koin langsung masuk dan kamu diarahkan ke Riwayat Koin.",
            },
            {
              q: "Kenapa koin belum masuk setelah bayar?",
              a: "Tenang, jangan panik. Ikuti langkah ini:\n1. Buka Riwayat Koin → tab 'Pesanan' — mungkin statusnya masih 'Menunggu' dan sistem sedang verifikasi otomatis\n2. Tunggu 1–2 menit, sistem cek otomatis tanpa perlu refresh\n3. Lebih dari 5 menit belum masuk? Klik 'Cek Manual Sekarang' di baris pesanan\n4. Masih belum? Hubungi kami via halaman Kontak dengan menyertakan Order ID",
            },
            {
              q: "Apakah koin bisa kadaluarsa?",
              a: "Tidak. Koin yang sudah dibeli tidak akan pernah kadaluarsa selama akun kamu aktif.",
            },
            {
              q: "Apakah koin bisa dikembalikan (refund)?",
              a: "Koin yang sudah digunakan untuk membuka chapter tidak dapat dikembalikan. Koin yang belum digunakan dapat dikembalikan dalam 24 jam sejak pembelian — hubungi kami via halaman Kontak.",
            },
            {
              q: "Apakah pembayaran aman?",
              a: "Ya. Semua transaksi diproses oleh Midtrans, payment gateway berlisensi Bank Indonesia yang sudah digunakan jutaan bisnis di Indonesia. Kami tidak menyimpan data kartu kreditmu.",
            },
            {
              q: "Bagaimana cara cek riwayat pembelian koin?",
              a: "Buka menu Koin di navbar, lalu pilih 'Riwayat Koin'. Di sana ada dua tab: 'Transaksi' (penggunaan koin) dan 'Pesanan' (riwayat pembelian/topup).",
            },
          ],
        },
        {
          id: "penulis",
          label: "Penjulis & Karya",
          emoji: "✍️",
          items: [
            {
              q: "Bagaimana cara mendaftar sebagai penulis?",
              a: "Klik 'Ingin Menjadi Penulis' di navbar, isi formulir permohonan, lalu tunggu persetujuan dari tim admin. Proses review biasanya 1–3 hari kerja.",
            },
            {
              q: "Apakah mendaftar sebagai penulis gratis?",
              a: "Ya, mendaftar sebagai penulis di WOOCE Novel sepenuhnya gratis.",
            },
            {
              q: "Apa syarat menjadi penulis di WOOCE Novel?",
              a: "Syarat utama:\n• Berusia minimal 13 tahun\n• Memiliki karya original (bukan plagiarisme)\n• Bersedia mengikuti Ketentuan Layanan WOOCE Novel\n• Mengisi formulir permohonan dengan lengkap dan jujur",
            },
            {
              q: "Format file apa yang diterima untuk upload chapter?",
              a: "Konten chapter ditulis langsung di editor yang tersedia di dashboard penulis. Kamu juga bisa menyalin (paste) teks dari file dokumen.",
            },
            {
              q: "Bagaimana cara menetapkan chapter sebagai premium?",
              a: "Di dashboard penulis saat membuat/mengedit chapter, centang opsi 'Chapter Premium' dan tentukan harga koin. Chapter tersebut akan memerlukan koin dari pembaca untuk dibuka.",
            },
            {
              q: "Apakah penulis mendapat bagian dari penjualan koin?",
              a: "Ya, sistem bagi hasil untuk penulis sedang dalam pengembangan. Informasi lebih lanjut akan diumumkan melalui email dan media sosial resmi WOOCE Novel.",
            },
            {
              q: "Bagaimana cara menjadwalkan rilis chapter?",
              a: "Di halaman edit chapter di dashboard penulis, pilih opsi 'Jadwalkan Rilis' dan tentukan tanggal & waktu terbit. Chapter akan otomatis dipublikasikan sesuai jadwal.",
            },
            {
              q: "Bisakah saya menghapus atau menarik karya saya?",
              a: "Ya, kamu bisa mengubah status novel menjadi draft atau menghapus chapter tertentu melalui dashboard penulis. Untuk menghapus keseluruhan novel, hubungi admin.",
            },
            {
              q: "Apakah karya saya bisa dilihat semua orang?",
              a: "Novel yang statusnya 'Published' akan tampil di halaman publik dan bisa dibaca semua pengunjung. Novel berstatus 'Draft' hanya bisa dilihat oleh kamu (penulis).",
            },
          ],
        },
        {
          id: "teknis",
          label: "Teknis & Bantuan",
          emoji: "🔧",
          items: [
            {
              q: "Website lambat atau tidak bisa diakses, apa yang harus saya lakukan?",
              a: "Coba langkah berikut:\n1. Refresh halaman (Ctrl+R / Cmd+R)\n2. Bersihkan cache browser\n3. Coba buka di browser lain\n4. Periksa koneksi internet\n\nJika masalah berlanjut, kemungkinan sedang ada maintenance. Pantau media sosial kami untuk update.",
            },
            {
              q: "Gambar cover tidak muncul, bagaimana solusinya?",
              a: "Coba refresh halaman atau bersihkan cache browser. Jika masalah terus terjadi, kemungkinan sedang ada gangguan sementara pada server gambar — biasanya pulih dalam beberapa menit.",
            },
            {
              q: "Saya menemukan bug atau error di website, ke mana melapor?",
              a: "Laporkan melalui halaman Kontak kami atau email ke support@woocenovel.my.id. Sertakan:\n• Deskripsi masalah\n• Langkah untuk mereproduksi error\n• Screenshot jika memungkinkan\n• Browser dan perangkat yang digunakan",
            },
            {
              q: "Apakah WOOCE Novel mendukung mode offline?",
              a: "Saat ini WOOCE Novel memerlukan koneksi internet untuk membaca. Fitur download untuk baca offline mungkin akan tersedia di masa mendatang.",
            },
            {
              q: "Bagaimana cara mengganti bahasa tampilan?",
              a: "Klik tombol 'ID / EN' di pojok kanan atas navbar untuk beralih antara Bahasa Indonesia dan English. Preferensi bahasa tersimpan secara otomatis.",
            },
            {
              q: "Apakah data bacaan saya tersimpan?",
              a: "Progress bacaan dan bookmark tersimpan di akun kamu (perlu login). Riwayat 'Lanjut Baca' tersimpan di perangkatmu (localStorage) tanpa perlu login.",
            },
          ],
        },
      ]
    : [
        {
          id: "general",
          label: "General",
          emoji: "📖",
          items: [
            {
              q: "What is WOOCE Novel?",
              a: "WOOCE Novel is a platform for reading novels, comics, and short stories in Indonesian. Readers can enjoy thousands of works from local authors, and writers can publish their work directly to readers.",
            },
            {
              q: "Is WOOCE Novel free?",
              a: "Yes! Most content on WOOCE Novel is free to read. Some premium chapters require coins to unlock, but free content is always available.",
            },
            {
              q: "Where can I access WOOCE Novel?",
              a: "WOOCE Novel can be accessed from any browser on your smartphone, tablet, or computer. No app installation needed — just open it in your favorite browser.",
            },
            {
              q: "Is there a WOOCE Novel app?",
              a: "Currently WOOCE Novel is available as a web app optimized for all devices. You can add it to your smartphone home screen (Add to Home Screen) for an app-like experience.",
            },
            {
              q: "What genres are available on WOOCE Novel?",
              a: "WOOCE Novel offers a wide variety of genres including: Romance, Fantasy, Action, Slice of Life, Horror, Mystery, BL/GL, Comedy, and more. New genres are added as new writers join.",
            },
            {
              q: "How do I contact the WOOCE Novel team?",
              a: "You can reach us through:\n• The Contact page on the website\n• Email: support@woocenovel.my.id\n• Instagram: @woocenovel\n• Facebook: WOOCE Novel\n\nOur team responds within 24 hours on business days.",
            },
          ],
        },
        {
          id: "account",
          label: "Account & Login",
          emoji: "👤",
          items: [
            {
              q: "How do I create an account?",
              a: "Click the 'Sign In' button in the top right corner, then select 'Login with Google'. Your account is automatically created using your Google data — no lengthy forms to fill out.",
            },
            {
              q: "Do I need to log in to read?",
              a: "No, you can read free content without logging in. However, features like bookmarks, following authors, comments, and reading premium chapters require you to log in.",
            },
            {
              q: "What login methods are available?",
              a: "Currently WOOCE Novel supports login via Google. We plan to add more login methods in the future.",
            },
            {
              q: "Is my account data safe?",
              a: "Yes. We don't store your password — login is handled entirely through secure Google OAuth. Your personal data is protected in accordance with our Privacy Policy.",
            },
            {
              q: "How do I change my profile picture?",
              a: "Your profile picture is automatically pulled from your Google account. To change it, update your Google account photo, then log out and back in to WOOCE Novel.",
            },
            {
              q: "How do I delete my account?",
              a: "To delete your account, contact us via the Contact page or email support@woocenovel.my.id with the subject 'Delete Account'. Our team will process your request within 3 business days.",
            },
            {
              q: "I can't log in. What should I do?",
              a: "Try these steps:\n1. Make sure your browser allows pop-ups from WOOCE Novel\n2. Clear your browser cache\n3. Try logging in via Incognito / Private mode\n4. Make sure your internet connection is stable\n\nStill having issues? Contact us via the Contact page.",
            },
          ],
        },
        {
          id: "reading",
          label: "Reading & Features",
          emoji: "📚",
          items: [
            {
              q: "How do I start reading a novel?",
              a: "From the homepage, choose a novel you want to read, click its title to go to the detail page, then click 'Start Reading' or select a chapter from the list.",
            },
            {
              q: "What is dark mode and how do I enable it?",
              a: "Dark mode makes the display easier on your eyes when reading at night. Click the moon icon in the top right of the navbar to toggle dark mode on/off.",
            },
            {
              q: "How do I change the font size while reading?",
              a: "On the reading page, click the settings icon (⚙️) in the top toolbar, then adjust the font size to your comfort. Settings are saved automatically.",
            },
            {
              q: "What is the Bookmark feature?",
              a: "Bookmarks let you save favorite novels for easy access later. Click the bookmark icon on a novel's detail page to add/remove it from your bookmarks.",
            },
            {
              q: "What is the 'Continue Reading' feature?",
              a: "Continue Reading saves the last chapter you opened and shows a shortcut on the homepage so you can pick up right where you left off without searching.",
            },
            {
              q: "Are there keyboard shortcuts for reading?",
              a: "Yes! Use these keys:\n• ← (left arrow) — previous chapter\n• → (right arrow) — next chapter\n• F — toggle Focus Mode\n\nFocus Mode hides UI elements so you can concentrate on reading.",
            },
            {
              q: "How do I share a quote from a chapter?",
              a: "Select/highlight text on the reading page, then click the 'Create Quote Card' button that appears. The system will generate a beautiful image card with your quote that you can download or share to Instagram Story.",
            },
            {
              q: "How do I report inappropriate content?",
              a: "On the chapter reading page, click the flag icon (🚩) in the toolbar. Choose a reason from the list and submit. Reports will be reviewed by our admin team.",
            },
            {
              q: "What is a premium chapter?",
              a: "Premium chapters are exclusive chapters that require coins to unlock. Authors can mark certain chapters as premium to receive support from readers.",
            },
            {
              q: "How do I copy a chapter link?",
              a: "On the reading page, click the 'Copy Link' button in the toolbar. The chapter URL will be copied to your clipboard instantly.",
            },
          ],
        },
        {
          id: "coins",
          label: "Coins & Payment",
          emoji: "🪙",
          items: [
            {
              q: "What are WOOCE Coins?",
              a: "WOOCE Coins are virtual currency on the platform used to unlock premium chapters. Buy once, use anytime on any chapter.",
            },
            {
              q: "How do I top up coins?",
              a: "1. Click the coin icon in the navbar (or open the Coins menu)\n2. Go to the Top Up Coins page\n3. Choose a coin package\n4. Click buy and complete payment via Midtrans\n5. Coins are added instantly after payment is confirmed",
            },
            {
              q: "What payment methods are accepted?",
              a: "WOOCE Novel accepts various payment methods via Midtrans:\n• GoPay\n• OVO\n• QRIS (all e-wallets/banks supporting QRIS)\n• Bank Transfer (BCA, Mandiri, BNI, BRI, etc.)\n• Credit/Debit Card (Visa & Mastercard)\n• Indomaret & Alfamart",
            },
            {
              q: "How long does it take for coins to arrive after payment?",
              a: "Instant. After payment is confirmed, you're automatically redirected to a confirmation page that checks status in real-time. Once successful, coins are added and you're taken to Coin History.",
            },
            {
              q: "Why haven't my coins arrived after payment?",
              a: "Don't worry. Follow these steps:\n1. Open Coin History → 'Orders' tab — status might still show 'Pending' while the system auto-verifies\n2. Wait 1–2 minutes, the system checks automatically without refreshing\n3. More than 5 minutes and coins still haven't arrived? Click 'Check Now' on that order row\n4. Still nothing? Contact us via the Contact page with your Order ID",
            },
            {
              q: "Do coins expire?",
              a: "No. Purchased coins never expire as long as your account remains active.",
            },
            {
              q: "Can I get a refund for coins?",
              a: "Coins already used to unlock chapters are non-refundable. Unused coins may be refunded within 24 hours of purchase — contact us via the Contact page.",
            },
            {
              q: "Is payment secure?",
              a: "Yes. All transactions are processed by Midtrans, a payment gateway licensed by Bank Indonesia and used by millions of businesses. We do not store your card data.",
            },
            {
              q: "How do I check my coin purchase history?",
              a: "Open the Coins menu in the navbar, then select 'Coin History'. You'll find two tabs: 'Transactions' (coin usage) and 'Orders' (purchase/top-up history).",
            },
          ],
        },
        {
          id: "writers",
          label: "Writers & Works",
          emoji: "✍️",
          items: [
            {
              q: "How do I register as a writer?",
              a: "Click 'Become a Writer' in the navbar, fill out the application form, then wait for approval from the admin team. The review process usually takes 1–3 business days.",
            },
            {
              q: "Is registering as a writer free?",
              a: "Yes, registering as a writer on WOOCE Novel is completely free.",
            },
            {
              q: "What are the requirements to become a writer on WOOCE Novel?",
              a: "Main requirements:\n• At least 13 years old\n• Have original work (no plagiarism)\n• Agree to WOOCE Novel's Terms of Service\n• Fill out the application form completely and honestly",
            },
            {
              q: "What file formats are accepted for uploading chapters?",
              a: "Chapter content is written directly in the editor available in the writer's dashboard. You can also paste text from a document file.",
            },
            {
              q: "How do I set a chapter as premium?",
              a: "In your writer dashboard when creating/editing a chapter, check the 'Premium Chapter' option and set the coin price. Readers will need coins to unlock that chapter.",
            },
            {
              q: "Do writers get a share from coin sales?",
              a: "Yes, a revenue sharing system for writers is currently in development. More information will be announced via email and WOOCE Novel's official social media.",
            },
            {
              q: "How do I schedule a chapter release?",
              a: "In the chapter editing page in your writer dashboard, select the 'Schedule Release' option and set the date & time. The chapter will automatically be published as scheduled.",
            },
            {
              q: "Can I delete or withdraw my work?",
              a: "Yes, you can change a novel's status to draft or delete specific chapters through the writer dashboard. To delete an entire novel, contact admin.",
            },
          ],
        },
        {
          id: "technical",
          label: "Technical & Help",
          emoji: "🔧",
          items: [
            {
              q: "The website is slow or inaccessible. What should I do?",
              a: "Try these steps:\n1. Refresh the page (Ctrl+R / Cmd+R)\n2. Clear your browser cache\n3. Try opening in a different browser\n4. Check your internet connection\n\nIf the issue persists, there may be scheduled maintenance. Follow our social media for updates.",
            },
            {
              q: "Cover images aren't showing. How do I fix this?",
              a: "Try refreshing the page or clearing your browser cache. If the issue continues, there may be a temporary disruption on the image server — it usually resolves within a few minutes.",
            },
            {
              q: "I found a bug or error on the website. Where do I report it?",
              a: "Report it through our Contact page or email support@woocenovel.my.id. Please include:\n• Description of the problem\n• Steps to reproduce the error\n• Screenshot if possible\n• Browser and device you're using",
            },
            {
              q: "Does WOOCE Novel support offline mode?",
              a: "WOOCE Novel currently requires an internet connection to read. An offline reading/download feature may be available in the future.",
            },
            {
              q: "How do I change the display language?",
              a: "Click the 'ID / EN' button in the top right navbar to switch between Bahasa Indonesia and English. Your language preference is saved automatically.",
            },
            {
              q: "Is my reading data saved?",
              a: "Reading progress and bookmarks are saved to your account (login required). 'Continue Reading' history is saved on your device (localStorage) without needing to log in.",
            },
          ],
        },
      ];

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          search.trim() === "" ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) =>
      activeCategory === "all"
        ? cat.items.length > 0
        : cat.id === activeCategory && cat.items.length > 0
    );

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <>
      <SeoHead
        title={isID ? "FAQ — WOOCE Novel" : "FAQ — WOOCE Novel"}
        description={
          isID
            ? "Temukan jawaban atas pertanyaan umum seputar WOOCE Novel — akun, membaca, koin, penulis, dan bantuan teknis."
            : "Find answers to common questions about WOOCE Novel — account, reading, coins, writers, and technical support."
        }
      />
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-amber-50/60 to-background dark:from-amber-950/20 dark:to-background border-b border-border/40">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              ❓ {isID ? "Pusat Bantuan" : "Help Center"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {isID ? "Pertanyaan yang Sering Diajukan" : "Frequently Asked Questions"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
              {isID
                ? `${totalItems} pertanyaan & jawaban seputar WOOCE Novel — dari cara membaca hingga top up koin.`
                : `${totalItems} questions & answers about WOOCE Novel — from how to read to topping up coins.`}
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveCategory("all");
                }}
                placeholder={isID ? "Cari pertanyaan..." : "Search questions..."}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                data-testid="input-faq-search"
              />
            </div>
          </div>
        </section>

        {/* Category filter pills */}
        <section className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 py-3 px-4">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === "all"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid="button-faq-category-all"
            >
              {isID ? "Semua" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid={`button-faq-category-${cat.id}`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ Content */}
        <section className="max-w-3xl mx-auto px-4 py-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-medium text-foreground mb-1">
                {isID ? "Tidak ada hasil ditemukan" : "No results found"}
              </p>
              <p>
                {isID
                  ? `Tidak ada pertanyaan yang cocok dengan "${search}"`
                  : `No questions match "${search}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filtered.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <h2 className="font-bold text-base text-foreground">{cat.label}</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {cat.items.length}
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-5 divide-y divide-border">
                    {cat.items.map((item, i) => (
                      <FaqRow key={i} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA bottom */}
          <div className="mt-12 text-center bg-muted/50 rounded-2xl border border-border px-6 py-8">
            <p className="text-sm font-semibold text-foreground mb-1">
              {isID ? "Tidak menemukan jawaban yang kamu cari?" : "Didn't find the answer you're looking for?"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {isID
                ? "Tim kami siap membantu kamu secara langsung."
                : "Our team is ready to help you directly."}
            </p>
            <Link href="/contact">
              <button
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all"
                data-testid="button-faq-contact"
              >
                {isID ? "Hubungi Kami" : "Contact Us"}
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
