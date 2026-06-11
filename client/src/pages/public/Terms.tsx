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

export default function Terms() {
  const { t, language } = useLanguage();
  const isID = language === "id";

  const sectionsID: Section[] = [
    {
      title: "1. Penerimaan Ketentuan",
      paragraphs: [
        "Dengan mengakses, membuka, mendaftar, atau menggunakan platform WOOCE Novel dalam bentuk apapun, kamu menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen ini secara penuh dan tanpa pengecualian.",
        "Jika kamu tidak menyetujui satu atau lebih ketentuan dalam dokumen ini, mohon hentikan penggunaan layanan WOOCE Novel segera. Akses berkelanjutan ke platform dianggap sebagai persetujuan penuh atas ketentuan yang berlaku.",
        "Ketentuan ini berlaku untuk seluruh pengguna platform, termasuk pembaca umum, penulis terdaftar, dan administrator.",
      ],
    },
    {
      title: "2. Deskripsi Layanan",
      paragraphs: [
        "WOOCE Novel adalah platform digital untuk membaca dan mempublikasikan novel, komik, dan cerita pendek secara online. Layanan utama yang tersedia meliputi:",
      ],
      items: [
        "Membaca karya fiksi dari berbagai genre yang dipublikasikan oleh penulis terdaftar",
        "Mendaftar sebagai penulis untuk mempublikasikan karya sendiri melalui proses permohonan dan persetujuan admin",
        "Mengelola karya dalam struktur Season dan Bab (Chapter) melalui dashboard penulis",
        "Menerima notifikasi email terkait status akun, karya, dan aktivitas penting lainnya",
        "Menikmati pengalaman baca yang dapat disesuaikan dengan pengaturan font, mode baca (terang/gelap), scroll progress, dan pintasan keyboard (← → untuk navigasi chapter, F untuk mode fokus)",
        "Menggunakan fitur Database Karakter per novel untuk mengenal tokoh-tokoh cerita lebih dalam tanpa keluar dari halaman baca",
        "Membagikan kutipan favorit dari chapter sebagai kartu gambar (Quote Card) ke media sosial — menggunakan Canvas API tanpa data tambahan yang disimpan di server",
        "Melanjutkan bacaan dari chapter terakhir yang dibuka melalui fitur 'Lanjut Baca' di halaman utama",
        "Menyalin tautan chapter secara langsung melalui tombol Salin Link di halaman baca",
        "Melaporkan konten yang melanggar ketentuan melalui tombol Laporkan di halaman baca",
        "Mengakses fitur pendukung seperti blog, tautan sosial, dan musik latar belakang platform",
      ],
      note: "WOOCE Novel berhak menambah, mengubah, membatasi, atau menghentikan fitur layanan kapan saja tanpa pemberitahuan terlebih dahulu.",
    },
    {
      title: "3. Akun Pengguna",
      paragraphs: [
        "WOOCE Novel menyediakan dua jenis akun pengguna yang dapat diakses melalui Google OAuth:",
      ],
      items: [
        "Akun Pembaca (Reader): Akun dasar yang diperoleh saat login pertama kali menggunakan Google. Pembaca dapat menikmati seluruh konten yang tersedia.",
        "Akun Penulis (Writer): Akun dengan hak tambahan untuk membuat dan mempublikasikan karya. Diperoleh melalui proses permohonan terpisah yang harus disetujui admin.",
      ],
      note: "Dengan membuat akun di WOOCE Novel, kamu menyatakan bahwa data yang kamu berikan melalui Google akurat dan valid. Kamu bertanggung jawab penuh atas aktivitas yang terjadi di bawah akunmu. Jangan berbagi akses akunmu kepada siapapun.",
    },
    {
      title: "4. Program Penulis",
      paragraphs: [
        "WOOCE Novel membuka program penulis bagi pengguna yang ingin mempublikasikan karyanya di platform. Berikut ketentuan program penulis:",
      ],
      items: [
        "Permohonan: Calon penulis mengisi formulir permohonan melalui halaman Jadi Penulis, termasuk nama, bio singkat, dan alasan bergabung.",
        "Proses Persetujuan: Setiap permohonan akan ditinjau oleh admin WOOCE Novel. Keputusan persetujuan atau penolakan sepenuhnya ada di tangan admin dan bersifat final.",
        "Notifikasi Status: Penulis akan menerima notifikasi email dan notifikasi dalam aplikasi (in-app) ketika permohonan diterima, disetujui, atau ditolak.",
        "Username Penulis: Setelah disetujui, penulis wajib memilih username unik yang akan ditampilkan di halaman publik karya mereka.",
        "Pengelolaan Karya: Penulis dapat membuat novel dengan struktur Season dan Bab, mengatur status publikasi (diterbitkan atau draft), serta mengelola konten kapan saja melalui dashboard penulis.",
        "Backup Karya: Saat penulis menghapus novel/karya mereka, sistem secara otomatis mengirimkan file PDF backup berisi seluruh isi karya ke email terdaftar penulis.",
      ],
    },
    {
      title: "4a. Sistem Verifikasi Penulis",
      paragraphs: [
        "WOOCE Novel menyediakan sistem verifikasi tambahan bagi penulis aktif yang ingin mendapatkan tanda verifikasi resmi (centang biru) di profil mereka. Sistem ini dirancang untuk memastikan akuntabilitas dan mencegah penyalahgunaan platform.",
      ],
      items: [
        "Pengajuan Verifikasi: Penulis aktif dapat mengajukan verifikasi melalui halaman Verifikasi Penulis dengan mengisi formulir yang mencakup judul novel, genre, tautan novel, total chapter yang ditulis, sinopsis, dan alasan pengajuan verifikasi.",
        "Tinjauan Admin: Setiap pengajuan akan ditinjau secara manual oleh admin WOOCE Novel. Dalam proses ini, admin berhak memeriksa profil publik penulis, termasuk bio, tautan media sosial, dan tautan donasi yang tercantum, untuk memastikan identitas dan keaslian penulis.",
        "Keputusan Verifikasi: Keputusan untuk menyetujui atau menolak pengajuan verifikasi sepenuhnya ada di tangan admin dan bersifat final.",
        "Masa Tunggu Penolakan: Jika pengajuan verifikasi ditolak, penulis tidak dapat mengajukan kembali dalam jangka waktu 30 hari kalender sejak tanggal penolakan. Hal ini untuk mencegah pengajuan berulang tanpa perbaikan yang berarti.",
        "Notifikasi Verifikasi: Penulis akan menerima notifikasi dalam aplikasi (in-app) dan email mengenai status pengajuan verifikasi mereka.",
        "Pencabutan Verifikasi: Admin berhak mencabut status verifikasi penulis jika ditemukan pelanggaran ketentuan layanan atau indikasi penipuan.",
      ],
      note: "Tanda verifikasi tidak memberikan hak atau keistimewaan tambahan di luar tampilan visual di profil. Verifikasi semata-mata menandakan bahwa identitas penulis telah ditinjau dan diakui oleh admin WOOCE Novel.",
    },
    {
      title: "5. Hak dan Kewajiban Penulis",
      paragraphs: [
        "Sebagai penulis di WOOCE Novel, kamu memiliki hak dan kewajiban berikut:",
      ],
      items: [
        "Hak atas Karya: Kamu tetap memegang hak cipta atas karya originalmu yang dipublikasikan di platform. Dengan mempublikasikan di WOOCE Novel, kamu memberikan lisensi non-eksklusif kepada WOOCE Novel untuk menampilkan, mendistribusikan, dan mempromosikan karyamu di platform.",
        "Tanggung Jawab Konten: Kamu sepenuhnya bertanggung jawab atas konten yang kamu publikasikan. Pastikan konten tidak melanggar hak cipta orang lain.",
        "Keaslian: Kamu menjamin bahwa karya yang dipublikasikan adalah karya original milikmu atau kamu memiliki izin resmi untuk mempublikasikannya.",
        "Pembaruan Karya: Penulis berhak mengedit, memperbarui, atau menghapus karya mereka kapan saja. Penghapusan karya bersifat permanen.",
        "Suspend dan Penghapusan Akun: Admin berhak mensuspend atau menghapus akun penulis yang melanggar ketentuan. Dalam hal akun dihapus oleh admin, sistem akan mengirimkan backup PDF seluruh karya penulis ke email terdaftar.",
      ],
    },
    {
      title: "6. Kebijakan Konten yang Dilarang",
      paragraphs: [
        "Konten berikut dilarang keras dipublikasikan di WOOCE Novel. Pelanggaran dapat mengakibatkan penghapusan konten, suspend, atau penghapusan akun permanen:",
      ],
      items: [
        "Konten seksual eksplisit, pornografi, atau konten dewasa yang tidak pantas",
        "Ujaran kebencian, diskriminasi, atau konten yang merendahkan kelompok tertentu berdasarkan ras, agama, gender, orientasi seksual, atau latar belakang",
        "Konten kekerasan grafis, penyiksaan, atau konten yang memuliakan tindak kejahatan",
        "Plagiarisme atau penggunaan konten yang dilindungi hak cipta tanpa izin dari pemilik aslinya",
        "Konten yang mengandung informasi palsu (hoaks), disinformasi, atau propaganda berbahaya",
        "Konten yang mempromosikan aktivitas ilegal, termasuk penggunaan narkoba, terorisme, atau tindak kriminal",
        "Konten yang menargetkan, mengintimidasi, atau melecehkan individu atau kelompok tertentu",
        "Konten yang membahayakan keselamatan anak-anak atau melibatkan eksploitasi minor dalam bentuk apapun",
      ],
    },
    {
      title: "7. Hak Kekayaan Intelektual",
      paragraphs: [
        "Seluruh elemen visual, teks, logo, nama merek, kode, desain antarmuka, dan materi lain yang merupakan karya asli WOOCE Novel (bukan konten yang diunggah oleh penulis) dilindungi oleh hak cipta dan hak kekayaan intelektual yang berlaku.",
        "Pengguna tidak diizinkan untuk menyalin, mereproduksi, mendistribusikan, membuat karya turunan, menampilkan secara publik, atau mengeksploitasi secara komersial elemen-elemen tersebut tanpa izin tertulis dari WOOCE Novel.",
        "Karya penulis yang dipublikasikan di platform tetap menjadi hak milik masing-masing penulis. WOOCE Novel tidak mengklaim kepemilikan atas konten yang dibuat oleh penulis terdaftar.",
      ],
    },
    {
      title: "8. Penggunaan yang Dilarang",
      paragraphs: [
        "Selain batasan konten di atas, pengguna dilarang melakukan aktivitas berikut saat menggunakan platform WOOCE Novel:",
      ],
      items: [
        "Mengakses sistem atau data yang tidak diotorisasi, termasuk mencoba meretas akun admin atau sistem backend",
        "Menggunakan bot, scraper, crawler, atau alat otomatis untuk mengumpulkan konten dari platform secara besar-besaran",
        "Mencoba menginterferensi, mengganggu, atau merusak kinerja server, infrastruktur, atau layanan platform",
        "Menyalahgunakan sistem pelaporan atau fitur kontak untuk mengirim spam atau konten berbahaya",
        "Membuat akun palsu, akun duplikat, atau menyamar sebagai orang atau entitas lain",
        "Menggunakan platform untuk tujuan komersial tanpa izin tertulis dari WOOCE Novel",
        "Menyebarluaskan konten platform (cerita, komik, dll) di luar platform tanpa izin penulis dan WOOCE Novel",
      ],
    },
    {
      title: "9. Penghapusan Akun dan Backup Data",
      paragraphs: [
        "Pengguna dapat mengajukan penghapusan akun mandiri melalui halaman pengaturan profil. Proses ini memerlukan verifikasi OTP (One-Time Password) yang dikirim ke email terdaftar untuk memastikan keamanan.",
        "Setelah penghapusan dikonfirmasi, seluruh data akun — termasuk profil, preferensi, dan data sesi — akan dihapus permanen dari sistem kami.",
        "Untuk akun penulis, sistem secara otomatis menghasilkan dan mengirimkan file PDF backup berisi semua karya yang pernah ditulis ke email terdaftar sebelum penghapusan dilakukan.",
        "Demikian pula, saat penulis memilih untuk menghapus satu novel atau karya tertentu, sistem akan mengirimkan backup PDF khusus untuk karya tersebut ke email penulis sebelum penghapusan permanen.",
        "Admin juga berhak menghapus akun pengguna atau penulis yang melanggar ketentuan. Dalam kasus penghapusan oleh admin, email pemberitahuan dan backup karya (jika berlaku) tetap dikirimkan.",
      ],
    },
    {
      title: "10. Suspend dan Penonaktifan Akun",
      paragraphs: [
        "WOOCE Novel berhak mensuspend atau menonaktifkan sementara akun penulis yang:",
      ],
      items: [
        "Terbukti melanggar Kebijakan Konten (Pasal 6)",
        "Melakukan aktivitas yang melanggar Ketentuan Penggunaan (Pasal 8)",
        "Menerima laporan pelanggaran yang valid dari pengguna lain",
        "Terindikasi melakukan aktivitas mencurigakan atau tidak sah di platform",
      ],
      note: "Akun yang disuspend akan menerima notifikasi email. Akun yang disuspend tidak dapat mengakses dashboard penulis atau mengelola karya selama masa suspend. Penulis dapat mengajukan keberatan melalui email kontak resmi platform.",
    },
    {
      title: "11. Layanan Pihak Ketiga",
      paragraphs: [
        "WOOCE Novel menggunakan beberapa layanan pihak ketiga untuk mendukung operasional platform:",
      ],
      items: [
        "Google OAuth 2.0: Digunakan sebagai sistem autentikasi login. Dengan login menggunakan Google, kamu tunduk pada Kebijakan Privasi dan Ketentuan Layanan Google.",
        "Gmail SMTP: Digunakan untuk mengirim notifikasi email kepada pengguna dan penulis. Email dikirim melalui infrastruktur Google.",
        "MongoDB: Digunakan sebagai database untuk menyimpan data platform. Dioperasikan oleh MongoDB, Inc.",
        "Tautan Eksternal: Platform menyertakan tautan ke media sosial (TikTok, Facebook, Instagram) dan situs eksternal lainnya. WOOCE Novel tidak bertanggung jawab atas konten atau kebijakan privasi situs eksternal tersebut.",
      ],
    },
    {
      title: "12. Batasan Tanggung Jawab",
      paragraphs: [
        "WOOCE Novel menyediakan layanan \"sebagaimana adanya\" (as is) dan \"sebagaimana tersedia\" (as available) tanpa jaminan apapun, baik tersurat maupun tersirat.",
        "WOOCE Novel tidak menjamin bahwa layanan akan selalu tersedia, bebas dari gangguan, bebas dari kesalahan, atau sepenuhnya aman dari ancaman siber.",
        "Dalam batas yang diizinkan hukum yang berlaku, WOOCE Novel tidak bertanggung jawab atas:",
      ],
      items: [
        "Kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan",
        "Kehilangan data, konten, atau karya akibat gangguan teknis (meskipun kami berusaha mencegahnya dengan sistem backup)",
        "Kerugian yang timbul dari tindakan pihak ketiga, termasuk serangan siber atau pelanggaran keamanan yang berada di luar kendali kami",
        "Konten yang dipublikasikan oleh penulis terdaftar — tanggung jawab konten sepenuhnya ada pada penulis bersangkutan",
      ],
    },
    {
      title: "13. Perubahan Ketentuan Layanan",
      paragraphs: [
        "WOOCE Novel berhak mengubah, memperbarui, atau mengganti bagian manapun dari Ketentuan Layanan ini kapan saja. Perubahan akan dipublikasikan di halaman ini beserta tanggal pembaruan terbaru.",
        "Kami akan berupaya memberitahukan perubahan signifikan melalui pengumuman di platform atau notifikasi email. Namun, tanggung jawab untuk secara berkala meninjau ketentuan ini ada pada pengguna.",
        "Penggunaan layanan WOOCE Novel setelah perubahan ketentuan dipublikasikan dianggap sebagai penerimaan penuh atas ketentuan yang diperbarui.",
      ],
    },
    {
      title: "14. Hukum yang Berlaku",
      content: "Ketentuan Layanan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia. Segala sengketa yang timbul dari atau terkait dengan ketentuan ini akan diselesaikan melalui mekanisme yang disepakati bersama atau, jika perlu, melalui pengadilan yang berwenang di Indonesia.",
    },
    {
      title: "15. Hubungi Kami",
      paragraphs: [
        "Jika kamu memiliki pertanyaan, keberatan, atau laporan terkait Ketentuan Layanan ini atau penggunaan platform, silakan hubungi kami melalui:",
      ],
      items: [
        "Email: wooce.novel@gmail.com",
        "Media Sosial: TikTok, Facebook, atau Instagram @woocenovel (cek tautan di footer platform)",
        "Formulir Kontak: Tersedia di halaman Hubungi Kami di platform",
      ],
      note: "Kami akan berusaha merespons setiap pertanyaan dalam waktu 3×24 jam hari kerja.",
    },
  ];

  const sectionsEN: Section[] = [
    {
      title: "1. Acceptance of Terms",
      paragraphs: [
        "By accessing, opening, registering, or using the WOOCE Novel platform in any form, you confirm that you have read, understood, and fully agreed to all terms in this document without exception.",
        "If you disagree with one or more provisions of this document, please stop using WOOCE Novel immediately. Continued access to the platform constitutes full acceptance of the applicable terms.",
        "These terms apply to all platform users, including general readers, registered writers, and administrators.",
      ],
    },
    {
      title: "2. Service Description",
      paragraphs: [
        "WOOCE Novel is a digital platform for reading and publishing novels, comics, and short stories online. Available core services include:",
      ],
      items: [
        "Reading fiction across various genres published by registered writers",
        "Registering as a writer to publish your own works through an application and admin approval process",
        "Managing works in Season and Chapter structures via the writer dashboard",
        "Receiving email notifications regarding account status, works, and other important activities",
        "Enjoying a fully customizable reading experience with font settings, reading modes (light/dark), scroll progress indicator, and keyboard shortcuts (← → for chapter navigation, F for focus mode)",
        "Using the Character Database feature per novel to learn more about story characters without leaving the reading page",
        "Sharing favorite chapter quotes as image cards (Quote Cards) to social media — using the Canvas API with no additional data stored on the server",
        "Resuming reading from the last opened chapter via the 'Continue Reading' feature on the homepage",
        "Copying the chapter link directly via the Copy Link button on the reading page",
        "Reporting content that violates the terms via the Report button on the reading page",
        "Accessing supporting features such as the blog, social links, and platform background music",
      ],
      note: "WOOCE Novel reserves the right to add, modify, restrict, or discontinue service features at any time without prior notice.",
    },
    {
      title: "3. User Accounts",
      paragraphs: [
        "WOOCE Novel provides two types of user accounts accessible via Google OAuth:",
      ],
      items: [
        "Reader Account: A basic account obtained upon first login with Google. Readers can enjoy all available content.",
        "Writer Account: An account with additional rights to create and publish works. Obtained through a separate application process that must be approved by an admin.",
      ],
      note: "By creating an account on WOOCE Novel, you confirm that the data you provide through Google is accurate and valid. You are fully responsible for all activities that occur under your account. Do not share your account access with anyone.",
    },
    {
      title: "4. Writer Program",
      paragraphs: [
        "WOOCE Novel opens a writer program for users who wish to publish their works on the platform. Writer program terms are as follows:",
      ],
      items: [
        "Application: Prospective writers fill out an application form via the Become a Writer page, including name, short bio, and reason for joining.",
        "Approval Process: Each application will be reviewed by WOOCE Novel admin. The decision to approve or reject is entirely at the admin's discretion and is final.",
        "Status Notification: Writers will receive email and in-app notifications when their application is received, approved, or rejected.",
        "Writer Username: Once approved, writers must choose a unique username that will be displayed on their public work pages.",
        "Work Management: Writers can create novels with Season and Chapter structures, manage publication status (published or draft), and manage content at any time via the writer dashboard.",
        "Work Backup: When a writer deletes a novel/work, the system automatically sends a PDF backup file containing all of the work's content to the writer's registered email.",
      ],
    },
    {
      title: "4a. Writer Verification System",
      paragraphs: [
        "WOOCE Novel provides an additional verification system for active writers who wish to obtain an official verification badge (blue checkmark) on their profile. This system is designed to ensure accountability and prevent platform abuse.",
      ],
      items: [
        "Verification Application: Active writers can apply for verification through the Writer Verification page by filling out a form that includes the novel title, genre, novel link, total chapters written, synopsis, and reason for applying for verification.",
        "Admin Review: Each application will be manually reviewed by WOOCE Novel admin. During this process, the admin has the right to examine the writer's public profile, including bio, social media links, and donation links listed, to verify the writer's identity and authenticity.",
        "Verification Decision: The decision to approve or reject a verification application is entirely at the admin's discretion and is final.",
        "Rejection Waiting Period: If a verification application is rejected, the writer may not reapply for 30 calendar days from the date of rejection. This is to prevent repeated applications without meaningful improvement.",
        "Verification Notification: Writers will receive in-app and email notifications regarding the status of their verification application.",
        "Verification Revocation: Admins reserve the right to revoke a writer's verification status if violations of the terms of service or indications of fraud are found.",
      ],
      note: "The verification badge does not grant additional rights or privileges beyond the visual display on the profile. Verification solely indicates that the writer's identity has been reviewed and acknowledged by WOOCE Novel admin.",
    },
    {
      title: "5. Writer Rights and Obligations",
      paragraphs: [
        "As a writer on WOOCE Novel, you have the following rights and obligations:",
      ],
      items: [
        "Rights to Your Work: You retain copyright over your original works published on the platform. By publishing on WOOCE Novel, you grant WOOCE Novel a non-exclusive license to display, distribute, and promote your work on the platform.",
        "Content Responsibility: You are solely responsible for the content you publish. Ensure your content does not infringe on others' copyrights.",
        "Originality: You guarantee that the work you publish is your original creation, or that you hold proper authorization to publish it.",
        "Work Updates: Writers may edit, update, or delete their works at any time. Deletion of works is permanent.",
        "Suspension and Account Deletion: Admins may suspend or delete writer accounts that violate the terms. If an account is deleted by an admin, the system will send a PDF backup of all the writer's works to their registered email.",
      ],
    },
    {
      title: "6. Prohibited Content Policy",
      paragraphs: [
        "The following content is strictly prohibited from being published on WOOCE Novel. Violations may result in content removal, suspension, or permanent account deletion:",
      ],
      items: [
        "Explicit sexual content, pornography, or inappropriate adult content",
        "Hate speech, discrimination, or content demeaning groups based on race, religion, gender, sexual orientation, or background",
        "Graphic violence, torture, or content glorifying criminal acts",
        "Plagiarism or use of copyrighted content without permission from the original owner",
        "Content containing false information (hoaxes), disinformation, or harmful propaganda",
        "Content promoting illegal activities, including drug use, terrorism, or criminal acts",
        "Content targeting, intimidating, or harassing specific individuals or groups",
        "Content endangering children's safety or involving exploitation of minors in any form",
      ],
    },
    {
      title: "7. Intellectual Property",
      paragraphs: [
        "All visual elements, text, logos, brand names, code, interface design, and other materials that are original works of WOOCE Novel (not content uploaded by writers) are protected by applicable copyright and intellectual property laws.",
        "Users are not permitted to copy, reproduce, distribute, create derivative works, publicly display, or commercially exploit these elements without written permission from WOOCE Novel.",
        "Works published by writers on the platform remain the property of their respective authors. WOOCE Novel does not claim ownership of content created by registered writers.",
      ],
    },
    {
      title: "8. Prohibited Uses",
      paragraphs: [
        "In addition to the content restrictions above, users are prohibited from engaging in the following activities while using the WOOCE Novel platform:",
      ],
      items: [
        "Accessing unauthorized systems or data, including attempting to hack admin accounts or backend systems",
        "Using bots, scrapers, crawlers, or automated tools to collect content from the platform in bulk",
        "Attempting to interfere with, disrupt, or damage the performance of the platform's servers, infrastructure, or services",
        "Misusing the reporting system or contact features to send spam or harmful content",
        "Creating fake accounts, duplicate accounts, or impersonating other individuals or entities",
        "Using the platform for commercial purposes without written permission from WOOCE Novel",
        "Distributing platform content (stories, comics, etc.) outside the platform without permission from the author and WOOCE Novel",
      ],
    },
    {
      title: "9. Account Deletion and Data Backup",
      paragraphs: [
        "Users may request self-deletion of their account through the profile settings page. This process requires OTP (One-Time Password) verification sent to the registered email to ensure security.",
        "After deletion is confirmed, all account data — including profile, preferences, and session data — will be permanently deleted from our system.",
        "For writer accounts, the system automatically generates and sends a PDF backup file containing all works ever written to the registered email before deletion.",
        "Similarly, when a writer chooses to delete a specific novel or work, the system will send a dedicated PDF backup for that work to the writer's email before permanent deletion.",
        "Admins also have the right to delete user or writer accounts that violate the terms. In cases of admin-initiated deletion, notification emails and work backups (where applicable) are still sent.",
      ],
    },
    {
      title: "10. Suspension and Account Deactivation",
      paragraphs: [
        "WOOCE Novel reserves the right to suspend or temporarily deactivate writer accounts that:",
      ],
      items: [
        "Are found to violate the Content Policy (Section 6)",
        "Engage in activities that violate the Usage Terms (Section 8)",
        "Receive valid violation reports from other users",
        "Show indications of suspicious or unauthorized activity on the platform",
      ],
      note: "Suspended accounts will receive an email notification. Suspended accounts cannot access the writer dashboard or manage works during the suspension period. Writers may file an appeal via the platform's official contact email.",
    },
    {
      title: "11. Third-Party Services",
      paragraphs: [
        "WOOCE Novel uses several third-party services to support platform operations:",
      ],
      items: [
        "Google OAuth 2.0: Used as the login authentication system. By logging in with Google, you are subject to Google's Privacy Policy and Terms of Service.",
        "Gmail SMTP: Used to send email notifications to users and writers. Emails are sent through Google's infrastructure.",
        "MongoDB: Used as the database to store platform data. Operated by MongoDB, Inc.",
        "External Links: The platform includes links to social media (TikTok, Facebook, Instagram) and other external sites. WOOCE Novel is not responsible for the content or privacy policies of those external sites.",
      ],
    },
    {
      title: "12. Limitation of Liability",
      paragraphs: [
        "WOOCE Novel provides services \"as is\" and \"as available\" without warranties of any kind, either express or implied.",
        "WOOCE Novel does not guarantee that the service will always be available, uninterrupted, error-free, or fully secure from cyber threats.",
        "To the extent permitted by applicable law, WOOCE Novel is not liable for:",
      ],
      items: [
        "Indirect, incidental, or consequential damages arising from the use or inability to use the service",
        "Loss of data, content, or works due to technical failures (although we strive to prevent this with backup systems)",
        "Damages arising from the actions of third parties, including cyber attacks or security breaches beyond our control",
        "Content published by registered writers — content responsibility lies entirely with the respective authors",
      ],
    },
    {
      title: "13. Changes to Terms of Service",
      paragraphs: [
        "WOOCE Novel reserves the right to change, update, or replace any part of these Terms of Service at any time. Changes will be published on this page along with the latest update date.",
        "We will endeavor to notify users of significant changes via platform announcements or email notifications. However, it is the user's responsibility to periodically review these terms.",
        "Use of WOOCE Novel services after changes to the terms are published constitutes full acceptance of the updated terms.",
      ],
    },
    {
      title: "14. Governing Law",
      content: "These Terms of Service are governed by and interpreted in accordance with the laws of the Republic of Indonesia. Any disputes arising from or related to these terms will be resolved through mutually agreed mechanisms or, if necessary, through competent courts in Indonesia.",
    },
    {
      title: "15. Contact Us",
      paragraphs: [
        "If you have questions, objections, or reports regarding these Terms of Service or platform usage, please contact us through:",
      ],
      items: [
        "Email: wooce.novel@gmail.com",
        "Social Media: TikTok, Facebook, or Instagram @woocenovel (see links in the platform footer)",
        "Contact Form: Available on the Contact Us page on the platform",
      ],
      note: "We will endeavor to respond to all inquiries within 3×24 business hours.",
    },
  ];

  const sections = isID ? sectionsID : sectionsEN;

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
            {t("terms.updated")}: 11 Juni 2026
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
