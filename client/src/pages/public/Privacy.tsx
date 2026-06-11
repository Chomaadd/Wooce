import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface Section {
  title: string;
  content?: string;
  paragraphs?: string[];
  items?: string[];
  note?: string;
}

export default function Privacy() {
  const { t, language } = useLanguage();
  const isID = language === "id";

  const sectionsID: Section[] = [
    {
      title: "1. Pendahuluan",
      paragraphs: [
        "WOOCE Novel berkomitmen penuh untuk melindungi privasi seluruh penggunanya — baik pembaca, penulis, maupun pengunjung umum. Kebijakan Privasi ini menjelaskan secara rinci data apa yang kami kumpulkan, bagaimana kami mengumpulkan dan menggunakannya, dengan siapa kami berbagi data tersebut, dan hak-hak yang kamu miliki atas data pribadimu.",
        "Dengan menggunakan platform WOOCE Novel, termasuk mengakses halaman publik, membuat akun, atau menggunakan fitur apapun, kamu menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam kebijakan ini.",
        "Kebijakan ini berlaku untuk seluruh layanan WOOCE Novel yang dapat diakses melalui domain platform kami.",
      ],
    },
    {
      title: "2. Data yang Kami Kumpulkan",
      paragraphs: [
        "Kami mengumpulkan berbagai jenis data tergantung bagaimana kamu berinteraksi dengan platform. Berikut rincian data yang kami kumpulkan:",
      ],
      items: [
        "Data Akun Google (saat login): Nama lengkap, alamat email, foto profil, dan ID unik Google-mu dikumpulkan melalui proses autentikasi Google OAuth 2.0. Data ini diperlukan untuk membuat dan mengelola akunmu.",
        "Data Profil Penulis: Jika kamu mendaftar sebagai penulis, kami menyimpan informasi tambahan seperti username penulis, bio singkat, alasan bergabung, dan status akun penulis (pending, aktif, suspend). Data profil publik yang kamu tambahkan sendiri — termasuk tautan media sosial (TikTok, Instagram, Facebook, Twitter/X, Website, Email publik) dan tautan donasi (Saweria, Trakteer) — juga disimpan dan dapat diakses secara publik di halaman profil penulismu.",
        "Data Karya: Seluruh konten yang kamu unggah sebagai penulis — termasuk judul novel, sinopsis, konten chapter, cover gambar, kategori, dan status publikasi — disimpan di server kami.",
        "Data Sesi: Informasi sesi login (session ID terenkripsi) disimpan sementara di server untuk menjaga status autentikasimu selama menggunakan platform.",
        "Data Permohonan Penulis: Informasi yang kamu isi di formulir permohonan jadi penulis, termasuk alasan bergabung dan informasi kontak.",
        "Data Pengajuan Verifikasi: Jika kamu mengajukan verifikasi penulis, kami menyimpan informasi yang kamu masukkan dalam formulir verifikasi, meliputi: judul novel, genre, tautan novel, jumlah total chapter, sinopsis, dan alasan pengajuan verifikasi. Data ini digunakan semata-mata untuk keperluan tinjauan admin.",
        "Data Notifikasi In-App: Notifikasi dalam aplikasi yang dikirimkan kepada akunmu (terkait status permohonan, verifikasi, atau pembaruan akun) disimpan di server kami dan terhubung ke ID akunmu.",
        "Data Penggunaan Anonim: Jumlah tampilan (view count) dan data rating per cerita dikumpulkan secara anonim untuk memahami popularitas konten. Data ini tidak terhubung ke identitas pribadimu.",
        "Data Laporan Konten: Jika kamu mengirimkan laporan pelanggaran konten melalui fitur Laporkan di halaman baca, kami menyimpan informasi laporan tersebut — termasuk alasan laporan, ID chapter/cerita yang dilaporkan, dan waktu pengiriman — untuk ditinjau oleh admin. Laporan konten bersifat anonim dan tidak terhubung ke identitas akun pribadimu.",
        "Data Transaksi Koin: Setiap perolehan koin (login bonus, quest, top-up) dan pengeluaran koin (membuka chapter premium) dicatat sebagai transaksi koin yang terhubung ke ID akunmu. Data ini mencakup jumlah koin, tipe transaksi, deskripsi, dan waktu transaksi.",
        "Data Pesanan Top-up: Jika kamu melakukan top-up koin, kami menyimpan data pesanan yang mencakup ID pesanan, jumlah koin yang dibeli, harga, dan status pembayaran. Data kartu kredit/debit atau informasi pembayaran sensitif TIDAK disimpan oleh WOOCE Novel — data tersebut diproses langsung oleh Midtrans.",
        "Data Preferensi Lokal: Preferensi bahasa (Indonesia/Inggris), tema (terang/gelap), dan riwayat chapter terakhir yang dibaca (digunakan oleh fitur 'Lanjut Baca' di halaman utama) disimpan di localStorage browser perangkatmu, bukan di server kami.",
      ],
    },
    {
      title: "3. Cara Kami Mengumpulkan Data",
      paragraphs: [
        "Data dikumpulkan melalui cara-cara berikut:",
      ],
      items: [
        "Login Google OAuth: Saat kamu memilih untuk login menggunakan Google, Google mengirimkan data profil dasarmu (nama, email, foto, ID Google) kepada kami sesuai izin yang kamu berikan di layar persetujuan Google.",
        "Formulir dan Input Langsung: Data yang kamu masukkan secara langsung di platform, seperti formulir permohonan penulis, konten chapter, atau pengaturan profil.",
        "Aktivitas Platform: Data teknis seperti view count yang tercatat secara otomatis saat pengguna mengakses halaman cerita tertentu.",
        "Unggahan File: Gambar cover novel yang kamu unggah disimpan menggunakan sistem GridFS di database kami.",
        "Komunikasi Email: Jika kamu menghubungi kami melalui formulir kontak atau email, informasi yang kamu berikan dalam komunikasi tersebut akan disimpan.",
      ],
    },
    {
      title: "4. Penggunaan Data",
      paragraphs: [
        "Data yang kami kumpulkan digunakan untuk tujuan-tujuan berikut:",
      ],
      items: [
        "Autentikasi dan Keamanan Akun: Memverifikasi identitasmu saat login dan menjaga keamanan sesi aktifmu di platform.",
        "Pengelolaan Akun dan Profil: Menampilkan nama, foto, dan informasi profilmu di halaman yang relevan.",
        "Proses Permohonan Penulis: Meninjau dan memproses permohonan kamu untuk menjadi penulis di platform.",
        "Tinjauan Verifikasi Penulis: Memeriksa formulir pengajuan verifikasi dan profil publik penulis (bio, tautan media sosial, tautan donasi) untuk memastikan keaslian identitas dan mencegah potensi penipuan atau penyalahgunaan nama platform.",
        "Notifikasi Email dan In-App: Mengirimkan notifikasi penting terkait akun dan karya — baik melalui email maupun notifikasi dalam aplikasi (in-app) — termasuk konfirmasi permohonan, persetujuan/penolakan, pembaruan verifikasi, pemberitahuan suspend, OTP verifikasi penghapusan akun, dan backup PDF karya.",
        "Backup Data Otomatis: Menghasilkan dan mengirimkan file PDF backup saat penulis menghapus novel atau akunnya, sebagai bentuk perlindungan data pengguna.",
        "Pengelolaan Konten: Menyimpan, menampilkan, dan mengelola karya yang dipublikasikan oleh penulis terdaftar.",
        "Analitik Platform: Menggunakan data view count anonim untuk memahami popularitas konten dan meningkatkan kualitas platform.",
        "Dukungan Pengguna: Merespons pertanyaan, laporan, atau keberatan yang kamu sampaikan melalui saluran kontak resmi kami.",
        "Kepatuhan Hukum: Memenuhi kewajiban hukum yang berlaku jika diperlukan oleh otoritas yang berwenang.",
      ],
    },
    {
      title: "5. Penyimpanan dan Keamanan Data",
      paragraphs: [
        "Seluruh data akun dan konten platform disimpan di database MongoDB yang aman. Berikut langkah-langkah keamanan yang kami terapkan:",
      ],
      items: [
        "Enkripsi Sesi: Data sesi pengguna dienkripsi menggunakan secret key yang unik dan disimpan di MongoDB Session Store yang terpisah dari data utama.",
        "Autentikasi Berlapis: Sistem admin dilindungi dengan autentikasi terpisah yang tidak terhubung langsung dengan akun Google pengguna biasa.",
        "HTTPS: Seluruh komunikasi antara browser pengguna dan server kami dienkripsi menggunakan protokol HTTPS/TLS.",
        "Verifikasi OTP: Proses sensitif seperti penghapusan akun memerlukan verifikasi OTP (One-Time Password) yang dikirim ke email terdaftar untuk mencegah penghapusan yang tidak disengaja atau tidak sah.",
        "Akses Terbatas: Akses ke data pengguna dibatasi hanya untuk sistem yang membutuhkannya dan administrator platform yang berwenang.",
      ],
      note: "Meskipun kami menerapkan langkah-langkah keamanan yang wajar, tidak ada sistem yang 100% kebal terhadap ancaman siber. Kami mendorong pengguna untuk menjaga keamanan akun Google mereka sebagai lapisan perlindungan tambahan.",
    },
    {
      title: "6. Notifikasi Email dan In-App",
      paragraphs: [
        "WOOCE Novel menggunakan dua saluran notifikasi untuk menjaga penggunanya tetap terinformasi:",
      ],
      items: [
        "Notifikasi Email (via Gmail SMTP): Dikirimkan untuk kejadian penting yang memerlukan perhatian di luar platform, seperti konfirmasi tindakan dan backup data.",
        "Notifikasi In-App: Ditampilkan langsung di dalam platform saat kamu login, untuk memberikan informasi terkini mengenai status akun dan aktivitas terkait.",
      ],
    },
    {
      title: "6a. Daftar Notifikasi Email",
      paragraphs: [
        "Email hanya dikirimkan untuk keperluan yang relevan dan penting, yaitu:",
      ],
      items: [
        "Konfirmasi penerimaan permohonan penulis (saat formulir permohonan berhasil dikirim)",
        "Pemberitahuan persetujuan atau penolakan permohonan penulis oleh admin",
        "Pemberitahuan suspend akun penulis oleh admin",
        "OTP (One-Time Password) untuk verifikasi proses penghapusan akun mandiri",
        "Konfirmasi penghapusan akun — termasuk backup PDF semua karya untuk akun penulis",
        "Pemberitahuan penghapusan akun oleh admin — termasuk backup PDF semua karya",
        "Backup PDF novel/karya yang dihapus oleh penulis sendiri",
        "Email tes konfigurasi (hanya untuk admin platform)",
      ],
      note: "WOOCE Novel tidak mengirimkan email pemasaran, newsletter, atau iklan tanpa persetujuan eksplisit dari pengguna. Email yang kami kirim murni bersifat transaksional dan fungsional.",
    },
    {
      title: "6b. Daftar Notifikasi In-App",
      paragraphs: [
        "Notifikasi dalam aplikasi (in-app) disimpan di server kami dan ditampilkan di dashboard pengguna. Notifikasi ini mencakup:",
      ],
      items: [
        "Pemberitahuan persetujuan permohonan penulis",
        "Pemberitahuan penolakan permohonan penulis",
        "Pemberitahuan persetujuan pengajuan verifikasi penulis",
        "Pemberitahuan penolakan pengajuan verifikasi penulis",
        "Pemberitahuan suspend akun",
        "Pembaruan penting lainnya terkait akun dan status penulismu",
      ],
      note: "Data notifikasi in-app disimpan di server kami dan terhubung ke ID akunmu. Notifikasi ini tidak dibagikan kepada pihak ketiga.",
    },
    {
      title: "7. Backup dan Ekspor Data",
      paragraphs: [
        "WOOCE Novel menyediakan mekanisme backup otomatis untuk melindungi karya penulis dalam situasi tertentu:",
      ],
      items: [
        "Backup Saat Novel Dihapus: Ketika penulis menghapus sebuah novel atau karya dari dashboard mereka, sistem secara otomatis menghasilkan file PDF yang berisi seluruh konten novel tersebut (termasuk semua season dan chapter) dan mengirimkannya ke email terdaftar penulis sebelum penghapusan permanen dilakukan.",
        "Backup Saat Akun Penulis Dihapus (Mandiri): Saat penulis memilih untuk menghapus akunnya sendiri dan menyelesaikan verifikasi OTP, sistem menghasilkan PDF backup komprehensif yang berisi semua novel dan karya yang pernah dipublikasikan, lalu mengirimkannya ke email terdaftar.",
        "Backup Saat Akun Penulis Dihapus (oleh Admin): Dalam kasus penghapusan akun penulis yang dilakukan oleh administrator platform, sistem tetap menghasilkan dan mengirimkan backup PDF karya kepada penulis bersangkutan.",
      ],
      note: "File PDF backup adalah layanan terbaik upaya (best effort). Dalam kasus gangguan teknis ekstrem, pengiriman backup mungkin tidak berhasil. Kami menyarankan penulis untuk menyimpan salinan karya mereka secara mandiri sebagai langkah pencegahan.",
    },
    {
      title: "8. Berbagi Data dengan Pihak Ketiga",
      paragraphs: [
        "WOOCE Novel tidak menjual, menyewakan, atau memperdagangkan data pribadi penggunanya kepada pihak ketiga untuk tujuan komersial. Data hanya dibagikan dalam kondisi terbatas berikut:",
      ],
      items: [
        "Google (OAuth Provider): Proses autentikasi login melewati layanan Google OAuth 2.0. Google dapat memproses data profil dasarmu sesuai Kebijakan Privasi Google mereka sendiri.",
        "Google (Gmail SMTP): Notifikasi email dikirim melalui infrastruktur Gmail Google. Google dapat memproses metadata email (pengirim, penerima, waktu) sesuai kebijakan mereka.",
        "MongoDB Atlas: Data platform disimpan di infrastruktur MongoDB Atlas. Data diproses oleh MongoDB, Inc. sesuai kebijakan privasi dan keamanan data mereka.",
        "Kewajiban Hukum: Kami dapat mengungkapkan data jika diwajibkan oleh hukum, peraturan pemerintah, atau perintah pengadilan yang sah.",
      ],
      note: "Selain kondisi di atas, data pribadimu tidak dibagikan kepada pihak manapun tanpa persetujuan eksplisitmu.",
    },
    {
      title: "9. Cookie dan Penyimpanan Lokal",
      paragraphs: [
        "WOOCE Novel menggunakan mekanisme penyimpanan berikut:",
      ],
      items: [
        "Session Cookie: Cookie sesi digunakan untuk menjaga status login aktifmu. Cookie ini bersifat sementara (session cookie) dan akan terhapus saat browser ditutup, atau setelah sesi berakhir karena tidak aktif.",
        "LocalStorage Browser: Preferensi tampilan seperti bahasa (Indonesia/Inggris) dan tema (terang/gelap) disimpan di localStorage perangkatmu. Data ini sepenuhnya lokal — tidak pernah dikirim ke server kami.",
        "Tidak Ada Cookie Pelacak Pihak Ketiga: WOOCE Novel tidak menggunakan cookie analitik pihak ketiga (seperti Google Analytics, Meta Pixel, atau sejenisnya) yang melacak perilaku penggunamu di luar platform.",
      ],
      note: "Kamu dapat menghapus cookie dan data localStorage kapan saja melalui pengaturan browser. Menghapus cookie sesi akan mengakhiri sesi loginmu.",
    },
    {
      title: "10. Retensi Data",
      paragraphs: [
        "Kami menyimpan data selama diperlukan untuk keperluan yang dijelaskan dalam kebijakan ini:",
      ],
      items: [
        "Data Akun Aktif: Data akun disimpan selama akunmu aktif di platform.",
        "Data Setelah Penghapusan Akun: Saat akun dihapus (baik secara mandiri maupun oleh admin), semua data akun dan karya dihapus secara permanen dari sistem kami dalam waktu yang wajar.",
        "Data Sesi: Sesi login aktif disimpan selama 30 hari atau sampai kamu logout, mana yang lebih dahulu.",
        "Log Sistem: Log teknis server mungkin menyimpan informasi seperti waktu akses dan alamat IP untuk keperluan keamanan dan debugging dalam jangka waktu terbatas.",
        "Email Komunikasi: Riwayat komunikasi email yang masuk ke sistem kami (melalui formulir kontak) dapat disimpan untuk keperluan dukungan.",
      ],
    },
    {
      title: "11. Hak Pengguna atas Data Pribadi",
      paragraphs: [
        "Sebagai pengguna WOOCE Novel, kamu memiliki hak-hak berikut atas data pribadimu:",
      ],
      items: [
        "Hak Akses: Kamu berhak mengetahui data apa yang kami simpan tentang kamu. Data profil dasar dapat kamu lihat melalui halaman pengaturan profilmu.",
        "Hak Koreksi: Jika data yang kami simpan tidak akurat, kamu dapat memperbaruinya melalui pengaturan profil atau menghubungi kami.",
        "Hak Penghapusan: Kamu berhak menghapus akunmu beserta seluruh data terkait kapan saja melalui halaman pengaturan profil. Proses ini memerlukan verifikasi OTP.",
        "Hak Backup Data: Sebagai penulis, kamu berhak mendapatkan backup karya-karyamu dalam format PDF saat menghapus novel atau akun.",
        "Hak Keberatan: Kamu berhak mengajukan keberatan atas cara kami memproses datamu dengan menghubungi kami melalui saluran kontak resmi.",
      ],
      note: "Untuk menggunakan hak-hak di atas atau mengajukan permintaan terkait data pribadimu, hubungi kami di wooce.novel@gmail.com. Kami akan merespons dalam waktu 7 hari kerja.",
    },
    {
      title: "12. Batasan Usia",
      content: "WOOCE Novel tidak ditujukan untuk anak-anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari anak-anak di bawah 13 tahun. Jika kamu adalah orang tua atau wali yang mengetahui bahwa anak di bawah asuhanmu telah membuat akun di platform kami, mohon hubungi kami segera di wooce.novel@gmail.com agar kami dapat menghapus data tersebut.",
    },
    {
      title: "13. Perubahan Kebijakan Privasi",
      paragraphs: [
        "WOOCE Novel berhak memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk mencerminkan perubahan pada fitur platform, praktik data, atau persyaratan hukum yang berlaku.",
        "Setiap perubahan akan dipublikasikan di halaman ini disertai tanggal pembaruan terbaru. Untuk perubahan yang signifikan dan berdampak pada hak-hak pengguna, kami akan berupaya memberikan pemberitahuan tambahan melalui email atau pengumuman di platform.",
        "Penggunaan layanan WOOCE Novel setelah perubahan kebijakan dipublikasikan dianggap sebagai penerimaan atas kebijakan yang diperbarui. Jika kamu tidak menyetujui perubahan tersebut, kamu berhak untuk menghapus akunmu.",
      ],
    },
    {
      title: "14. Hubungi Kami",
      paragraphs: [
        "Jika kamu memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau cara kami mengelola data pribadimu, silakan hubungi kami melalui:",
      ],
      items: [
        "Email: wooce.novel@gmail.com",
        "Media Sosial: TikTok, Facebook, atau Instagram @woocenovel (tautan tersedia di footer platform)",
        "Formulir Kontak: Tersedia di halaman Hubungi Kami di platform",
      ],
      note: "Kami berkomitmen untuk merespons setiap pertanyaan atau permintaan terkait privasi dalam waktu 7 hari kerja.",
    },
  ];

  const sectionsEN: Section[] = [
    {
      title: "1. Introduction",
      paragraphs: [
        "WOOCE Novel is fully committed to protecting the privacy of all its users — readers, writers, and general visitors alike. This Privacy Policy explains in detail what data we collect, how we collect and use it, who we share it with, and the rights you have over your personal data.",
        "By using the WOOCE Novel platform, including accessing public pages, creating an account, or using any feature, you agree to the data collection and usage practices described in this policy.",
        "This policy applies to all WOOCE Novel services accessible through our platform domain.",
      ],
    },
    {
      title: "2. Data We Collect",
      paragraphs: [
        "We collect various types of data depending on how you interact with the platform. Here is a breakdown of the data we collect:",
      ],
      items: [
        "Google Account Data (upon login): Your full name, email address, profile photo, and unique Google ID are collected through the Google OAuth 2.0 authentication process. This data is necessary to create and manage your account.",
        "Writer Profile Data: If you register as a writer, we store additional information such as your writer username, short bio, reason for joining, and writer account status (pending, active, suspended). Public profile data you add yourself — including social media links (TikTok, Instagram, Facebook, Twitter/X, Website, public email) and donation links (Saweria, Trakteer) — is also stored and accessible publicly on your writer profile page.",
        "Works Data: All content you upload as a writer — including novel titles, synopses, chapter content, cover images, categories, and publication status — is stored on our servers.",
        "Session Data: Encrypted login session information (session ID) is temporarily stored on the server to maintain your authentication status while using the platform.",
        "Writer Application Data: Information you fill in the writer application form, including your reason for joining and contact information.",
        "Verification Request Data: If you apply for writer verification, we store the information you enter in the verification form, including: novel title, genre, novel link, total chapter count, synopsis, and reason for applying. This data is used solely for admin review purposes.",
        "In-App Notification Data: In-app notifications sent to your account (regarding application status, verification, or account updates) are stored on our servers and linked to your account ID.",
        "Anonymous Usage Data: View counts and rating data per story are collected anonymously to understand content popularity. This data is not linked to your personal identity.",
        "Content Report Data: If you submit a content violation report via the Report button on the reading page, we store the report information — including the reason for the report, the ID of the reported chapter/story, and the submission time — for admin review. Content reports are anonymous and not linked to your personal account identity.",
        "Coin Transaction Data: Every coin acquisition (login bonus, quests, top-up) and coin expenditure (unlocking premium chapters) is recorded as a coin transaction linked to your account ID. This data includes the coin amount, transaction type, description, and transaction time.",
        "Top-up Order Data: If you top up coins, we store order data including the order ID, number of coins purchased, price, and payment status. Credit/debit card information or other sensitive payment data is NOT stored by WOOCE Novel — it is processed directly by Midtrans.",
        "Local Preference Data: Language preference (Indonesian/English), theme (light/dark), and the last read chapter history (used by the 'Continue Reading' feature on the homepage) are stored in your device's browser localStorage, not on our servers.",
      ],
    },
    {
      title: "3. How We Collect Data",
      paragraphs: [
        "Data is collected through the following methods:",
      ],
      items: [
        "Google OAuth Login: When you choose to log in using Google, Google sends your basic profile data (name, email, photo, Google ID) to us according to the permissions you grant on the Google consent screen.",
        "Forms and Direct Input: Data you enter directly on the platform, such as writer application forms, chapter content, or profile settings.",
        "Platform Activity: Technical data such as view counts that are automatically recorded when users access specific story pages.",
        "File Uploads: Novel cover images you upload are stored using the GridFS system in our database.",
        "Email Communication: If you contact us via the contact form or email, information you provide in that communication will be stored.",
      ],
    },
    {
      title: "4. Use of Data",
      paragraphs: [
        "The data we collect is used for the following purposes:",
      ],
      items: [
        "Authentication and Account Security: Verifying your identity upon login and maintaining the security of your active session on the platform.",
        "Account and Profile Management: Displaying your name, photo, and profile information on relevant pages.",
        "Writer Application Process: Reviewing and processing your application to become a writer on the platform.",
        "Writer Verification Review: Examining the verification application form and the writer's public profile (bio, social media links, donation links) to verify identity and prevent potential fraud or misuse of the platform's name.",
        "Email and In-App Notifications: Sending important notifications regarding your account and works — both via email and in-app notifications — including application confirmation, approval/rejection, verification updates, suspension notices, account deletion OTP verification, and work PDF backups.",
        "Automatic Data Backup: Generating and sending PDF backup files when writers delete novels or their accounts, as a user data protection measure.",
        "Content Management: Storing, displaying, and managing works published by registered writers.",
        "Platform Analytics: Using anonymous view count data to understand content popularity and improve platform quality.",
        "User Support: Responding to questions, reports, or objections you submit through our official contact channels.",
        "Legal Compliance: Fulfilling applicable legal obligations if required by competent authorities.",
      ],
    },
    {
      title: "5. Data Storage and Security",
      paragraphs: [
        "All account data and platform content is stored in a secure MongoDB database. Here are the security measures we implement:",
      ],
      items: [
        "Session Encryption: User session data is encrypted using a unique secret key and stored in a MongoDB Session Store separate from the main data.",
        "Layered Authentication: The admin system is protected by separate authentication not directly connected to regular user Google accounts.",
        "HTTPS: All communication between the user's browser and our server is encrypted using HTTPS/TLS protocol.",
        "OTP Verification: Sensitive processes such as account deletion require OTP (One-Time Password) verification sent to the registered email to prevent accidental or unauthorized deletion.",
        "Restricted Access: Access to user data is limited only to systems that require it and authorized platform administrators.",
      ],
      note: "Although we implement reasonable security measures, no system is 100% immune to cyber threats. We encourage users to maintain the security of their Google account as an additional layer of protection.",
    },
    {
      title: "6. Email and In-App Notifications",
      paragraphs: [
        "WOOCE Novel uses two notification channels to keep users informed:",
      ],
      items: [
        "Email Notifications (via Gmail SMTP): Sent for important events that require attention outside the platform, such as action confirmations and data backups.",
        "In-App Notifications: Displayed directly within the platform when you log in, to provide real-time updates about your account status and related activities.",
      ],
    },
    {
      title: "6a. Email Notification List",
      paragraphs: [
        "Emails are only sent for relevant and important purposes, namely:",
      ],
      items: [
        "Confirmation of writer application receipt (when the application form is successfully submitted)",
        "Notification of writer application approval or rejection by an admin",
        "Notification of writer account suspension by an admin",
        "OTP (One-Time Password) for verifying the self-deletion account process",
        "Account deletion confirmation — including PDF backup of all works for writer accounts",
        "Admin-initiated account deletion notification — including PDF backup of all works",
        "PDF backup of a novel/work deleted by the writer themselves",
        "Configuration test email (admin platform only)",
      ],
      note: "WOOCE Novel does not send marketing emails, newsletters, or advertisements without explicit user consent. All emails we send are purely transactional and functional in nature.",
    },
    {
      title: "6b. In-App Notification List",
      paragraphs: [
        "In-app notifications are stored on our servers and displayed on the user dashboard. These notifications include:",
      ],
      items: [
        "Writer application approval notification",
        "Writer application rejection notification",
        "Writer verification approval notification",
        "Writer verification rejection notification",
        "Account suspension notification",
        "Other important updates regarding your account and writer status",
      ],
      note: "In-app notification data is stored on our servers and linked to your account ID. These notifications are not shared with third parties.",
    },
    {
      title: "7. Backup and Data Export",
      paragraphs: [
        "WOOCE Novel provides automatic backup mechanisms to protect writers' works in certain situations:",
      ],
      items: [
        "Backup When a Novel is Deleted: When a writer deletes a novel or work from their dashboard, the system automatically generates a PDF file containing the full content of that novel (including all seasons and chapters) and sends it to the writer's registered email before permanent deletion.",
        "Backup When a Writer Account is Self-Deleted: When a writer chooses to delete their own account and completes OTP verification, the system generates a comprehensive PDF backup containing all novels and works ever published, then sends it to the registered email.",
        "Backup When a Writer Account is Deleted by Admin: In cases where a writer's account is deleted by a platform administrator, the system still generates and sends a PDF backup of the writer's works to them.",
      ],
      note: "PDF backup files are a best-effort service. In cases of extreme technical failure, backup delivery may not succeed. We recommend writers keep independent copies of their works as a precautionary measure.",
    },
    {
      title: "8. Sharing Data with Third Parties",
      paragraphs: [
        "WOOCE Novel does not sell, rent, or trade users' personal data to third parties for commercial purposes. Data is only shared under the following limited conditions:",
      ],
      items: [
        "Google (OAuth Provider): The login authentication process passes through Google OAuth 2.0 services. Google may process your basic profile data according to their own Privacy Policy.",
        "Google (Gmail SMTP): Email notifications are sent through Google's Gmail infrastructure. Google may process email metadata (sender, recipient, time) according to their policies.",
        "MongoDB Atlas: Platform data is stored in MongoDB Atlas infrastructure. Data is processed by MongoDB, Inc. according to their data privacy and security policies.",
        "Legal Obligations: We may disclose data if required by applicable law, government regulations, or valid court orders.",
      ],
      note: "Beyond the conditions above, your personal data is not shared with any party without your explicit consent.",
    },
    {
      title: "9. Cookies and Local Storage",
      paragraphs: [
        "WOOCE Novel uses the following storage mechanisms:",
      ],
      items: [
        "Session Cookie: Session cookies are used to maintain your active login status. These are temporary (session cookies) and will be deleted when the browser is closed, or after the session expires due to inactivity.",
        "Browser LocalStorage: Display preferences such as language (Indonesian/English) and theme (light/dark) are stored in your device's localStorage. This data is entirely local — it is never sent to our servers.",
        "No Third-Party Tracking Cookies: WOOCE Novel does not use third-party analytics cookies (such as Google Analytics, Meta Pixel, or similar) that track your behavior outside the platform.",
      ],
      note: "You can delete cookies and localStorage data at any time through your browser settings. Deleting session cookies will end your login session.",
    },
    {
      title: "10. Data Retention",
      paragraphs: [
        "We retain data for as long as necessary for the purposes described in this policy:",
      ],
      items: [
        "Active Account Data: Account data is retained as long as your account is active on the platform.",
        "Data After Account Deletion: When an account is deleted (either self-deleted or by an admin), all account data and works are permanently deleted from our system within a reasonable timeframe.",
        "Session Data: Active login sessions are stored for 30 days or until you log out, whichever comes first.",
        "System Logs: Technical server logs may store information such as access times and IP addresses for security and debugging purposes for a limited period.",
        "Email Communication: History of email communications received by our system (via the contact form) may be stored for support purposes.",
      ],
    },
    {
      title: "11. User Rights over Personal Data",
      paragraphs: [
        "As a WOOCE Novel user, you have the following rights over your personal data:",
      ],
      items: [
        "Right of Access: You have the right to know what data we store about you. Basic profile data can be viewed through your profile settings page.",
        "Right of Correction: If the data we store is inaccurate, you can update it through profile settings or by contacting us.",
        "Right of Deletion: You have the right to delete your account and all related data at any time through the profile settings page. This process requires OTP verification.",
        "Right to Data Backup: As a writer, you have the right to receive a PDF backup of your works when deleting a novel or account.",
        "Right to Object: You have the right to object to how we process your data by contacting us through official contact channels.",
      ],
      note: "To exercise the above rights or submit requests regarding your personal data, contact us at wooce.novel@gmail.com. We will respond within 7 business days.",
    },
    {
      title: "12. Age Restrictions",
      content: "WOOCE Novel is not intended for children under the age of 13. We do not knowingly collect personal data from children under 13. If you are a parent or guardian who becomes aware that a child in your care has created an account on our platform, please contact us immediately at wooce.novel@gmail.com so we can delete that data.",
    },
    {
      title: "13. Changes to Privacy Policy",
      paragraphs: [
        "WOOCE Novel reserves the right to update this Privacy Policy from time to time to reflect changes to platform features, data practices, or applicable legal requirements.",
        "Any changes will be published on this page along with the latest update date. For significant changes that affect user rights, we will endeavor to provide additional notification via email or platform announcements.",
        "Use of WOOCE Novel services after policy changes are published constitutes acceptance of the updated policy. If you do not agree with the changes, you have the right to delete your account.",
      ],
    },
    {
      title: "14. Contact Us",
      paragraphs: [
        "If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact us through:",
      ],
      items: [
        "Email: wooce.novel@gmail.com",
        "Social Media: TikTok, Facebook, or Instagram @woocenovel (links available in the platform footer)",
        "Contact Form: Available on the Contact Us page on the platform",
      ],
      note: "We are committed to responding to all privacy-related questions or requests within 7 business days.",
    },
  ];

  const sections = isID ? sectionsID : sectionsEN;

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
            {t("privacy.updated")}: 11 Juni 2026
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-foreground mb-3">{s.title}</h2>

              {s.content && (
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              )}

              {s.paragraphs && (
                <div className="space-y-2.5">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                </div>
              )}

              {s.items && (
                <ul className="mt-3 space-y-2 pl-1">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.note && (
                <div className="mt-3 bg-muted/50 border border-border rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
