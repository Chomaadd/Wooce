import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const STORY_SLUG = "ruang-di-antara-kita";

// ─── Schemas ────────────────────────────────────────────────────────────────
const storySchema = new mongoose.Schema({ title: String, slug: String }, { strict: false });
const seasonSchema = new mongoose.Schema({ storyId: mongoose.Schema.Types.ObjectId, title: String, seasonNumber: Number }, { strict: false });
const chapterSchema = new mongoose.Schema({
  storyId: mongoose.Schema.Types.ObjectId,
  seasonId: mongoose.Schema.Types.ObjectId,
  chapterNumber: Number,
  title: String,
  content: String,
  published: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: null },
}, { timestamps: true });

const Story = mongoose.models.NovelStory || mongoose.model("NovelStory", storySchema);
const Season = mongoose.models.NovelSeason || mongoose.model("NovelSeason", seasonSchema);
const Chapter = mongoose.models.NovelChapter || mongoose.model("NovelChapter", chapterSchema);

// ─── Chapter Content ─────────────────────────────────────────────────────────

const bab1 = `<p>Raka tidak pernah menyangka bahwa kebiasaan buruknya — menunggu lift di lantai dua belas sambil memegang kopi yang sudah terlalu dingin untuk diminum — akan mempertemukannya dengan seseorang yang perlahan mengubah cara ia memaknai kata <em>kehadiran</em>.</p>

<p>Malam itu Jumat. Bukan Jumat yang istimewa. Tidak ada hujan dramatis, tidak ada lagu kebetulan mengalun dari speaker tetangga. Hanya Jumat biasa di sebuah gedung apartemen kelas menengah yang liftnya selalu lambat dan parfum penghuninya selalu terlalu kencang untuk ukuran ruang tertutup.</p>

<p>Raka baru pulang dari shift malam di sebuah studio rekaman kecil di Kemang — bukan sebagai artis, melainkan sebagai teknisi yang tugasnya memastikan kabel tidak saling bersinggungan dan mic tidak mengangkat suara AC dari ruang sebelah. Pekerjaan yang tidak glamor, tapi cukup untuk membayar cicilan motor dan setengah dari harga kopi yang ia pegang sekarang.</p>

<p>Ia menekan tombol lift. Angka di atas pintu bergerak dari lantai tujuh. Naik. Berhenti di delapan. Raka menarik napas. Ini bukan pertama kalinya lift berhenti di lantai delapan pada tengah malam. Ada penghuni di sana yang tampaknya tidak pernah tidur — atau tidur sangat larut — dan selalu masuk lift dengan wajah yang terlihat seperti baru saja menyelesaikan sesuatu yang penting.</p>

<p>Pintu lift terbuka.</p>

<p>Laki-laki itu berdiri di sana dengan earphone menggantung di leher, jaket oversized abu-abu, dan sebuah tas kanvas coklat yang terlihat penuh. Rambutnya sedikit acak-acakan dengan cara yang tampak disengaja — atau mungkin memang tidak disengaja, tapi hasilnya sama saja. Ia melihat Raka, lalu melihat kopi di tangan Raka, lalu naik ke lift tanpa berkata apa-apa.</p>

<p>Raka masuk juga.</p>

<p>Mereka berdua menekan tombol yang sama: lantai dua belas.</p>

<p>Ini sudah ketiga kalinya dalam dua minggu terakhir mereka berdiri berdampingan di lift ini, menekan tombol yang sama, turun di koridor yang sama, lalu berjalan ke arah yang berlawanan. Raka tinggal di 12B, ujung kiri. Laki-laki itu — yang belum pernah berkenalan secara resmi — tinggal di 12F, ujung kanan.</p>

<p>Enam pintu di antara mereka. Dua puluh tiga langkah kalau dihitung.</p>

<p>Raka tahu karena suatu malam yang lain, saat bosan dan iseng, ia menghitungnya.</p>

<p>"Kopinya masih panas?"</p>

<p>Raka menoleh. Laki-laki itu menatap ke depan, ke pintu lift yang belum juga terbuka karena lift sedang bergerak.</p>

<p>"Sudah dingin," jawab Raka. Ia tidak tahu kenapa ia menjawab dengan jujur. Biasanya kalau orang tidak dikenal mengajak bicara ia akan menjawab sesingkat mungkin lalu menatap hp. "Dari tadi."</p>

<p>"Kenapa masih dipegang?"</p>

<p>Pertanyaan yang bagus. Raka menatap gelas plastik bening di tangannya. Es batu di dalamnya sudah nyaris mencair sempurna, meninggalkan cairan coklat pucat yang lebih mirip air kotor daripada kopi.</p>

<p>"Kebiasaan," kata Raka akhirnya. "Kalau tangan tidak memegang sesuatu waktu naik lift rasanya tidak nyaman."</p>

<p>Laki-laki itu menoleh sekarang. Ada ekspresi yang sulit dibaca di wajahnya — bukan mengejek, bukan juga tertarik secara berlebihan. Lebih ke semacam <em>oh, menarik</em> yang tenang.</p>

<p>"Sama," katanya. Ia mengangkat tangan kirinya yang selama ini tersembunyi di saku jaket. Di sana ada kunci ruangan — kunci dengan gantungan kecil berbentuk kaset pita. "Aku kalau tidak pegang ini tidak nyaman."</p>

<p>Raka menatap kunci itu lebih lama dari yang seharusnya.</p>

<p>"Danu," kata laki-laki itu, mengulurkan tangan kanannya.</p>

<p>"Raka."</p>

<p>Mereka berjabat tangan. Dingin. Mungkin karena AC lift, mungkin karena jam sudah hampir pukul satu malam dan semua hal terasa lebih dingin di jam itu.</p>

<p>Lift berhenti di lantai dua belas. Pintu terbuka.</p>

<p>Mereka berjalan keluar bersama, lalu, sesuai rute masing-masing, mulai berjalan ke arah yang berlawanan.</p>

<p>"Raka."</p>

<p>Ia berhenti. Menoleh.</p>

<p>Danu sudah beberapa langkah ke arah kanannya, tapi berbalik. "Besok pagi ada kopi yang enak di lantai satu. Yang baru buka. Kalau mau coba."</p>

<p>Bukan ajakan. Lebih seperti informasi yang dilempar ke udara, bebas diambil atau tidak.</p>

<p>"Pukul berapa?" tanya Raka, dan ia tidak tahu kenapa ia bertanya itu.</p>

<p>"Tujuh. Kalau masih tidur, tidak apa-apa."</p>

<p>Raka mengangguk. Danu mengangguk juga. Lalu mereka melanjutkan perjalanan masing-masing.</p>

<p>Di balik pintu 12B, Raka meletakkan gelas kopinya di meja — gelas yang akhirnya ia buang juga setelah tiga menit memandanginya — dan duduk di tepi kasur dengan kaos kaki masih terpasang.</p>

<p>Ia membuka hp. Tidak ada notifikasi penting.</p>

<p>Besok pukul tujuh pagi ia biasanya masih tidur. Shift malam membuatnya terbiasa bangun siang, makan siang yang sebenarnya sarapan, dan tidur di waktu orang lain sedang makan malam. Siklus yang tidak sehat tapi sudah cukup nyaman untuk tidak ia ubah.</p>

<p>Tapi entah kenapa, malam itu Raka menyetel alarm pukul enam lima puluh.</p>

<p>Ia tidak langsung tidur. Masih duduk di tepi kasur, menatap dinding di depannya yang kosong kecuali sebuah poster band yang sudah mulai mengelupas di sudutnya. Ia memikirkan gantungan kunci berbentuk kaset pita itu. Memikirkan cara Danu menjawab pertanyaan — tidak berlebihan, tidak pelit — seperti orang yang terbiasa mengukur setiap kata sebelum dikeluarkan.</p>

<p>Menarik, pikir Raka. Bukan dalam arti yang rumit. Hanya menarik.</p>

<p>Ia berbaring. Matanya memandang langit-langit yang memiliki noda kecil bekas kebocoran yang sudah diperbaiki bulan lalu — tambalannya masih terlihat lebih putih dari sekelilingnya.</p>

<p>Pukul tujuh pagi besok.</p>

<p>Raka memejamkan mata.</p>

<p>Alarm berbunyi pukul enam lima puluh. Ia bangun.</p>

<p>Ini sudah cukup aneh untuk dicatat dalam catatan harian, kalau saja Raka punya catatan harian.</p>

<hr>

<p>Kafe di lantai satu gedung itu baru buka tiga minggu lalu — menggantikan minimarket kecil yang sebelumnya ada di sana. Tidak banyak penghuni yang tahu, rupanya, karena ketika Raka turun pukul tujuh kurang lima, hanya ada empat meja yang terisi dan suasananya masih harum kayu dan cat baru yang belum sepenuhnya menguap.</p>

<p>Danu sudah ada. Duduk di meja dekat jendela, menghadap ke luar, dengan laptop terbuka tapi tidak sedang disentuh. Ia memandang jalanan yang mulai ramai, dengan ekspresi seseorang yang sedang memikirkan sesuatu yang tidak ada hubungannya dengan apa yang ia lihat.</p>

<p>Raka berdiri sebentar di ambang pintu. Ia hampir berbalik. Bukan karena tidak mau, tapi karena ada sesuatu yang sedikit canggung dalam kenyataan bahwa ia benar-benar bangun pukul tujuh pagi hanya karena seseorang menyebut ada kopi enak di lantai satu.</p>

<p>Danu menoleh. Melihat Raka. Mengangkat dagu sedikit — isyarat <em>sini</em> tanpa suara.</p>

<p>Raka masuk.</p>

<p>"Sudah pesan?" tanya Raka saat duduk di kursi seberang.</p>

<p>"Belum. Tunggu kamu." Danu mendorong menu ke arahnya. "Kopinya bagus. Aku sudah tiga kali ke sini minggu lalu."</p>

<p>"Tiga kali dalam seminggu?"</p>

<p>"Aku bekerja di sini beberapa jam. Lebih konsentrasi daripada di kamar."</p>

<p>Raka membuka menu. Sederhana — empat jenis kopi, dua jenis teh, roti bakar. Tidak ada yang namanya aneh atau terlalu artsy. Ia memesan Americano panas. Danu memesan yang sama.</p>

<p>"Kamu kerja apa?" tanya Danu setelah pesanan dicatat.</p>

<p>"Teknisi rekaman. Di studio di Kemang."</p>

<p>Danu mengangguk. "Itu yang bikin kamu pulang malam terus?"</p>

<p>"Kebanyakan iya. Shift malamnya kadang sampai subuh kalau sesi rekamannya molor." Raka meletakkan menu di pinggir meja. "Kamu?"</p>

<p>"Penulis. Freelance." Danu menutup laptop-nya. "Script, konten, kadang cerpen kalau ada yang mau beli."</p>

<p>"Bayar sewanya dari nulis?"</p>

<p>"Lebih dari cukup." Ada sesuatu di cara Danu mengatakannya — bukan sombong, lebih ke semacam fakta yang dinyatakan apa adanya. "Tapi tidak ada yang percaya kalau aku bilang itu ke orang baru. Biasanya mereka pikir aku sedang bercanda atau menyembunyikan pekerjaan lain."</p>

<p>Raka tidak menjawab langsung. Kopi datang — uap tipis mengepul dari cangkir putih sederhana.</p>

<p>"Aku percaya," kata Raka akhirnya. "Kamu terlihat seperti orang yang tahu persis apa yang sedang dilakukan."</p>

<p>Danu menatapnya sebentar. Lalu mengangkat cangkirnya. "Minum dulu. Biar tidak dingin lagi kayak semalam."</p>

<p>Raka tertawa kecil. Pertama kalinya dalam beberapa hari.</p>

<p>Mereka duduk di sana sampai pukul sembilan lebih. Bukan karena tidak ada yang perlu dilakukan, tapi karena percakapan itu mengalir dengan cara yang tidak memerlukan alasan untuk dilanjutkan — dan keduanya tampaknya tidak keberatan.</p>

<p>Ketika akhirnya Danu menutup laptop dan merapikan tasnya, ia berkata tanpa melihat ke arah Raka: "Aku biasanya ke sini hari Selasa dan Kamis. Kalau kamu tidak ada shift."</p>

<p>Raka mengangguk. "Bisa dicoba."</p>

<p>Danu berdiri. "Sampai nanti kalau ada."</p>

<p>Dan ia pergi. Tidak berlebihan, tidak meninggalkan nomer hp atau meminta follow Instagram. Hanya pergi.</p>

<p>Raka duduk sebentar lagi sendirian, memandang cangkir kopinya yang sudah hampir habis. Di luar jendela, jalanan sudah ramai. Matahari sudah cukup tinggi untuk menyinari meja mereka dengan cahaya yang hangat tapi tidak menyilaukan.</p>

<p>Selasa depan, pikir Raka.</p>

<p>Ia tidak punya shift Selasa malam.</p>`;

const bab2 = `<p>Selasa pertama itu Raka tidak jadi ke kafe.</p>

<p>Bukan karena tidak mau. Ada telepon mendadak dari studio — sesi rekaman yang harusnya Rabu maju jadi Selasa siang, dan Raka harus datang pukul sebelas untuk setup peralatan. Ia melihat jam, melihat kafe di lantai satu dari balik pintu kaca lobi, dan memutuskan bahwa tidak ada gunanya mampir sebentar hanya untuk duduk lima menit.</p>

<p>Tapi entah kenapa seharian itu ia merasa ada sesuatu yang sedikit tidak tuntas.</p>

<p>Perasaan yang sama seperti waktu kamu meletakkan hp di tempat yang berbeda dari biasanya dan sepanjang hari terus merasa ada yang kurang di sakumu.</p>

<p>Kamis ia datang.</p>

<p>Danu sudah ada, di meja yang sama, dengan posisi yang hampir persis sama — laptop terbuka, memandang ke luar, jari-jari di atas keyboard tapi tidak sedang mengetik. Ketika Raka datang dan duduk, Danu hanya menoleh sebentar.</p>

<p>"Selasa kemarin tidak ada."</p>

<p>"Ada panggilan dadakan dari kerja."</p>

<p>"Oh." Danu kembali ke layarnya. "Tidak apa-apa."</p>

<p>Dan itu saja. Tidak ada keluhan, tidak ada pertanyaan lanjutan, tidak ada ekspresi yang membuat Raka merasa perlu memberi penjelasan lebih panjang. Raka memesan kopi, Danu memesan teh — ternyata tidak selalu kopi — dan mereka kembali ke ritme yang entah kapan mulai terbentuk: duduk berdampingan, masing-masing dengan kesibukannya, sesekali berbicara kalau ada sesuatu yang terlintas.</p>

<p>Tidak ada tuntutan. Tidak ada ekspektasi yang diucapkan.</p>

<p>Ini berlangsung tiga minggu.</p>

<hr>

<p>Pada minggu keempat, Danu mengajak belanja.</p>

<p>Bukan ajakan yang formal. Ia hanya bilang saat mereka naik lift bersama — Jumat malam lagi, sudah hampir tengah malam lagi — bahwa supermarket besar di seberang blok buka sampai jam satu dan ia butuh beli beberapa barang tapi tasnya terlalu kecil untuk dibawa sendiri.</p>

<p>"Kamu mau ikut?"</p>

<p>Raka menatapnya. "Kamu butuh tas tambahan atau butuh teman?"</p>

<p>Danu berpikir sebentar. "Dua-duanya?"</p>

<p>Raka tidak punya alasan untuk menolak — dan tidak ada bagian darinya yang ingin menolak, sebenarnya — jadi ia ikut.</p>

<p>Supermarket itu salah satu yang besar, dengan lorong-lorong yang terlalu terang dan musik latar yang terlalu ceria untuk pukul sebelas malam. Ada beberapa pembeli lain, kebanyakan terlihat seperti orang yang juga baru pulang kerja dan mengambil kesempatan ini untuk belanja sebelum semua toko lebih kecil tutup.</p>

<p>Danu mengambil keranjang — bukan troli — dan langsung menuju lorong bumbu dapur.</p>

<p>"Kamu masak?" tanya Raka, mengikutinya.</p>

<p>"Sesekali. Kalau mood." Danu mengambil dua bungkus kecap tanpa melihat harganya. "Biasanya cuma masak telur atau rebus mie. Tapi minggu ini aku mau coba masak nasi goreng yang beneran."</p>

<p>"Nasi goreng yang beneran artinya apa?"</p>

<p>"Bukan yang dari sachet."</p>

<p>Raka hampir tertawa tapi berhasil menahannya. "Butuh apa?"</p>

<p>Danu mengeluarkan hp dan membuka catatan. "Bawang putih, bawang merah, cabai, kecap, telur, dan saus tiram kalau ada." Ia melihat sekeliling. "Dan minyak goreng. Aku habis."</p>

<p>"Kamu menyimpan resepnya di hp?"</p>

<p>"Aku tidak menghafal hal-hal yang bisa dicatat."</p>

<p>Raka mengangguk pelan. Itu masuk akal. Ia sendiri menyimpan semua nomor telepon di kontak daripada menghafalnya, dengan alasan yang pada dasarnya sama.</p>

<p>Mereka berpencar sebentar — Danu ke lorong bumbu, Raka disuruh mencari minyak goreng yang mereknya sudah disebutkan. Raka berjalan melalui lorong minyak goreng yang rupanya panjang secara mengejutkan, melewati sekitar dua belas merek berbeda sebelum menemukan yang dimaksud, lalu kembali ke titik awal.</p>

<p>Danu sudah ada dengan keranjang yang cukup penuh.</p>

<p>"Hanya untuk nasi goreng?" tanya Raka, melihat isi keranjang.</p>

<p>"Dan beberapa hal lain yang aku ingat butuh waktu di sini." Danu mengambil keranjang dari tangan Raka — yang sudah otomatis memegang keranjang itu cukup lama tanpa sadar. "Terima kasih."</p>

<p>Mereka lanjut ke lorong snack karena Danu bilang ia butuh sesuatu untuk dimakan sambil nulis malam ini. Ini berujung pada percakapan panjang yang tidak terduga tentang jenis snack: Danu ternyata orang yang sangat spesifik soal tekstur — ia tidak bisa makan keripik yang terlalu tebal karena rasanya seperti mengunyah dinding — sementara Raka lebih mempersoalkan rasa asin-manis dan tidak terlalu peduli dengan ketebalan.</p>

<p>"Kamu sudah pernah coba yang ini?" tanya Danu, mengangkat sebungkus keripik singkong tipis dengan rasa keju.</p>

<p>"Belum."</p>

<p>"Ini bagus. Tapi mahal untuk ukurannya." Ia meletakkannya ke keranjang. "Tapi bagus."</p>

<p>Raka menatap bungkus itu. Dua puluh ribu untuk ukuran yang memang kecil. Tapi entah kenapa ia tidak punya komentar soal itu.</p>

<p>Di lorong minuman, Danu berhenti di depan rak teh botol dan menatapnya dengan ekspresi yang serius secara menggelikan — seperti seorang seniman yang sedang memilih warna cat.</p>

<p>"Masalahnya adalah," kata Danu tanpa diminta, "semua rasa di sini itu enak tapi tidak ada yang sempurna. Teh rasa lemon terlalu manis. Teh original terlalu hambar. Teh hijau botolan biasanya rasanya seperti air bekas cuci tangan."</p>

<p>"Itu tidak mungkin."</p>

<p>"Kamu belum minum yang mereknya benar."</p>

<p>Raka mengambil sebotol teh tawar dari rak. "Ini?"</p>

<p>Danu menatap botol itu. Mengangguk pelan. "Itu cukup aman."</p>

<p>Raka meletakkannya ke keranjang Danu. "Hadiah."</p>

<p>Danu menatapnya dengan ekspresi yang sulit dibaca. Sebentar saja — lalu ia bergerak ke lorong berikutnya seolah tidak terjadi apa-apa.</p>

<p>Di kasir, antrian cukup panjang untuk pukul sebelas malam — tiga orang di depan mereka, masing-masing dengan troli yang cukup penuh. Mereka berdiri berdampingan, Danu memegang keranjang, Raka tanpa keranjang karena ternyata ia tidak membeli apa-apa untuk dirinya sendiri.</p>

<p>"Kamu tidak beli apa-apa?" tanya Danu, baru menyadari.</p>

<p>"Tidak perlu apa-apa."</p>

<p>"Kamu ikut ke supermarket tengah malam dan tidak beli apa-apa?"</p>

<p>"Aku membantumu membawa minyak goreng."</p>

<p>Danu diam sebentar. Lalu, tanpa berkata apa-apa, ia mengambil sebungkus permen dari rak kecil di dekat kasir dan meletakkannya di meja belanja.</p>

<p>"Itu buat kamu."</p>

<p>Raka menatap bungkus permen itu. Rasa mint. "Terima kasih."</p>

<p>"Imbal balik atas teh botolnya."</p>

<p>Sistem yang adil, pikir Raka. Tapi ada sesuatu yang hangat dalam cara sistem itu bekerja — cara Danu memastikan tidak ada yang merasa berutang, cara ia menyeimbangkan hal-hal kecil tanpa diminta.</p>

<p>Mereka membayar — terpisah, karena belanjaan Raka hanya sebungkus permen yang akhirnya dibayar Danu duluan sebelum Raka sempat mengeluarkan dompet — dan berjalan keluar bersama ke malam yang sudah lebih dingin dari waktu mereka masuk.</p>

<p>Perjalanan kembali ke apartemen itu singkat — hanya menyeberang jalan dan masuk melalui lobi. Tapi Raka ingat detail kecil itu: cara Danu menggantungkan dua kantong belanjaan di tangan kirinya dan tetap bisa membuka pintu masuk dengan siku kanannya. Cara ia membetulkan earphone yang jatuh ke bahu tanpa berhenti berjalan.</p>

<p>Di lift, mereka berdiri di posisi yang sama seperti pertama kali — Danu di sebelah kiri, Raka di sebelah kanan. Bedanya kali ini ada dua kantong plastik di antara mereka dan Raka memegang permen mint yang belum ia buka.</p>

<p>"Nasi goreng besok?" tanya Raka.</p>

<p>"Malam ini sebenarnya. Sudah lapar dari tadi."</p>

<p>"Kamu mau masak jam sebelas malam?"</p>

<p>"Aku biasa makan malam jam sebelas." Danu menatap ke depan. "Jam biologisku sedikit berbeda."</p>

<p>Raka tidak bisa membantahnya. Jam biologisnya sendiri juga tidak bisa dibilang normal.</p>

<p>Lift sampai di lantai dua belas. Mereka keluar.</p>

<p>"Kalau berhasil," kata Danu saat berjalan ke kanannya, "aku akan bilang."</p>

<p>"Dan kalau tidak berhasil?"</p>

<p>Danu menoleh sebentar, dengan ekspresi yang mungkin merupakan versi tersenyumnya — tipis, sedikit nakal. "Aku tidak akan bilang apa-apa."</p>

<p>Raka menatap punggungnya sampai menghilang di tikungan koridor.</p>

<p>Ia berdiri di depan 12B beberapa detik sebelum masuk. Di tangannya, sebungkus permen mint yang belum dibuka. Di kepalanya, sebuah pertanyaan yang belum ia formulasikan dengan jelas — hanya semacam kesadaran bahwa sesuatu sedang terjadi, perlahan dan tanpa banyak suara, seperti air yang meresap ke dalam tanah.</p>

<p>Tapi malam itu ia tidak terlalu memikirkannya.</p>

<p>Ia masuk kamar, melepas jaket, dan meletakkan permen mint di atas meja kerjanya.</p>

<p>Di sebelah kirinya, gedung-gedung lain berdiri diam dalam gelap. Di suatu tempat di ujung kanan koridor yang sama, Danu mungkin sedang memanaskan wajan dan mempertimbangkan berapa banyak cabai yang perlu dipotong.</p>

<p>Raka tidak menyalakan TV malam itu. Hanya duduk di kursi dengan headphone di telinga, memutar playlist yang ia buat sendiri — campuran lo-fi dan jazz instrumental yang biasa ia putar waktu tidak terlalu lelah tapi juga tidak terlalu ingin berpikir.</p>

<p>Ia membuka sebungkus permen mint.</p>

<p>Rasanya seperti yang ia duga: mint. Segar. Biasa saja.</p>

<p>Tapi ia memakannya sampai habis malam itu, satu per satu, tanpa menyadari.</p>`;

const bab3 = `<p>Ada sesuatu yang aneh dari hujan yang turun pada Kamis malam itu.</p>

<p>Bukan aneh dalam arti buruk. Hanya aneh dalam arti bahwa hujannya turun terlalu cepat, terlalu lebat, dan terlalu tiba-tiba untuk cuaca yang seharian tadi cerah. Langit berubah dari biru muda ke abu gelap dalam waktu kurang dari satu jam, dan ketika tetesan pertama jatuh, sudah tidak ada waktu untuk bersiap.</p>

<p>Raka melihatnya dari jendela kafe — ya, mereka masih ke kafe, sudah hampir enam minggu sekarang, sudah jadi semacam ritual yang tidak pernah benar-benar disepakati tapi toh berjalan — dan sesuatu di dadanya mengencang sedikit waktu ia sadar motor Danu parkir di luar.</p>

<p>"Motormu tidak punya jas hujan?" tanya Raka.</p>

<p>Danu menatap keluar. "Ada di kamar." Ia diam sebentar. "Di laci meja."</p>

<p>"Jadi tidak ada."</p>

<p>"Tidak berguna ada di laci meja, ya."</p>

<p>Raka menahan sebuah komentar tentang kebiasaan Danu yang tampaknya selalu menyiapkan segala sesuatu terlambat satu langkah. Ia menghirup kopinya.</p>

<p>"Tunggu reda," katanya akhirnya.</p>

<p>"Bisa lama."</p>

<p>"Iya."</p>

<p>Danu tidak membalas. Ia menutup laptopnya, menyandarkan diri ke kursi, dan memandang hujan yang memukul kaca jendela dengan ritme yang tidak teratur. Ada sesuatu yang berbeda dalam cara ia duduk malam itu — lebih longgar dari biasanya, seperti orang yang sudah memutuskan untuk tidak ke mana-mana dan menerima itu.</p>

<p>Kafe mulai kosong satu per satu. Pembeli lain menyesuaikan diri dengan hujan: ada yang berlari ke parkiran, ada yang menelepon jemputan, ada yang memesan minuman lagi sambil menunggu. Pukul sembilan, tinggal ada mereka berdua dan seorang bapak tua yang sedang membaca koran cetak di sudut jauh.</p>

<p>"Kamu pernah takut sama hujan?" tanya Danu tiba-tiba.</p>

<p>Raka menatapnya. "Waktu kecil."</p>

<p>"Kenapa?"</p>

<p>Pertanyaan sederhana. Tapi ada sesuatu dalam cara Danu menanyakannya — pelan, tanpa buru-buru — yang membuat Raka tidak secara refleks membelokkan jawabannya ke yang lebih aman.</p>

<p>"Rumah kami dulu sering banjir waktu hujan lebat," kata Raka. "Bukan parah. Tapi cukup untuk bikin tidak nyaman. Setiap hujan, aku dan ibu harus angkat barang-barang ke tempat lebih tinggi, pasang sekat di bawah pintu." Ia memalingkan pandangan ke luar. "Jadi ada saat tertentu waktu kecil di mana aku dengar hujan dan langsung panik."</p>

<p>Danu diam sebentar. Tidak langsung mengisi jeda dengan kata-kata, tidak langsung bilang <em>wah kasian</em> atau <em>syukur sekarang sudah tidak lagi</em>. Ia hanya mengangguk, sangat pelan, seperti mencatat.</p>

<p>"Sekarang?" tanya Danu.</p>

<p>"Sekarang tidak." Raka menarik napas. "Sekarang hujan lebih ke... menenangkan. Kayak semua kebisingan lain ditutup."</p>

<p>"Iya," kata Danu. Singkat. Tapi ada sesuatu di cara ia mengatakannya yang terasa seperti pengakuan.</p>

<p>Hujan tidak menunjukkan tanda-tanda reda. Pukul sepuluh, kasir kafe memberitahu mereka bahwa kafe tutup jam sebelas — minta maaf, tapi memang itu jam operasional. Danu mengangguk, memesan satu lagi teh panas untuk diminum pelan-pelan.</p>

<p>"Motorku bisa mogok kalau kehujanan seperti ini," kata Danu saat teh datang. "Sudah dua kali."</p>

<p>"Servis?"</p>

<p>"Sudah. Tapi mekaniknya bilang memang sensitif air, mesinnya."</p>

<p>"Motor apa yang sensitif air?"</p>

<p>"Motor tua." Danu mengaduk tehnya. "Aku beli murah waktu pertama kali pindah ke Jakarta. Waktu itu tidak terlalu paham harus beli yang mana."</p>

<p>Raka menatap ke luar jendela. Hujan masih deras. Genangan di depan kafe sudah cukup dalam untuk membuat bayangan lampu jalan bergoyang di permukaannya.</p>

<p>"Kamu dari mana aslinya?" tanya Raka. Ia tidak tahu kenapa ia bertanya sekarang — mungkin karena selama enam minggu ini mereka berbicara banyak hal tapi tidak pernah benar-benar yang <em>dasar-dasar</em>.</p>

<p>"Surabaya." Danu meniup tehnya. "Kamu?"</p>

<p>"Bandung."</p>

<p>"Jauh dari rumah."</p>

<p>"Iya." Raka memutar cangkirnya di meja. "Kamu kangen?"</p>

<p>Danu berpikir. Sungguhan, bukan sekadar mengisi waktu berpikir. "Kangen makanannya. Kangen cara orang-orangnya berbicara." Ia mengangkat bahu. "Tidak terlalu kangen situasinya."</p>

<p>Raka mengangguk. Ia mengerti itu — membedakan antara rindu pada tempat versus rindu pada perasaan. Dua hal yang sering tertukar.</p>

<p>Pukul sebelas kurang sepuluh, hujan mulai mereda sedikit. Bukan berhenti, tapi intensitasnya turun dari <em>lebat</em> ke <em>sedang</em>. Danu membereskan laptopnya, membayar, dan mereka keluar bersama ke bawah kanopi kafe.</p>

<p>Motor Danu basah kuyup. Joknya menggenang air di lekukan-lekukan.</p>

<p>Danu menatapnya sebentar, lalu mencoba menyalakannya. Satu kali. Dua kali. Tiga kali.</p>

<p>Tidak nyala.</p>

<p>Ia berdiri dengan kunci di tangan dan ekspresi yang sangat tenang untuk seseorang yang motornya baru saja mogok di bawah hujan pada pukul sebelas malam.</p>

<p>"Mogok?" tanya Raka.</p>

<p>"Mogok."</p>

<p>"Hubungi bengkel?"</p>

<p>"Jam segini tidak akan ada yang mau."</p>

<p>Raka menatap motor itu. Menatap Danu. Menatap hujan yang masih turun walaupun lebih pelan.</p>

<p>"Naik sama aku," kata Raka. "Motorku ada di parkiran bawah."</p>

<p>Danu menoleh padanya. Ada sesuatu di matanya — bukan kelegaan, lebih ke semacam <em>kamu yakin</em> yang tidak diucapkan.</p>

<p>"Tidak mau merepotkan."</p>

<p>"Kita satu gedung," kata Raka. "Itu tidak lebih repot dari naik lift bersama."</p>

<p>Logika yang mungkin tidak seratus persen valid, tapi Danu tidak membantah. Ia mengunci motornya, menyelempangkan tas, dan mengangguk.</p>

<p>Mereka berjalan ke parkiran bawah. Hujan menyertai mereka — bukan deras, cukup untuk membuat rambut sedikit basah kalau tidak buru-buru. Raka tidak buru-buru. Danu juga tidak.</p>

<p>Di atas motornya, dengan Danu di belakang yang memegang tas kanvasnya dengan satu tangan dan pegangan motor dengan tangan yang lain — tidak pada jaket Raka, karena tentu saja Danu tidak akan melakukan itu tanpa diminta — Raka menyadari sesuatu yang kecil tapi tidak bisa ia abaikan:</p>

<p>Ini sudah terlalu terasa nyaman.</p>

<p>Bukan tidak nyaman. Sebaliknya. Terlalu nyaman. Semacam nyaman yang membuat seseorang berhenti mempertanyakan apakah ini normal atau tidak, karena rasanya sudah seperti sesuatu yang selalu ada.</p>

<p>Raka memacu motornya pelan di bawah hujan yang tersisa.</p>

<p>Danu diam di belakang.</p>

<p>Dan di antara mereka, dengan jarak yang tepat dan hujan sebagai pengisi celah, ada sesuatu yang tidak bernama tapi sudah cukup besar untuk tidak muat disembunyikan lebih lama.</p>

<p>Hanya saja, belum ada yang mau menyebutnya.</p>

<p>Belum.</p>`;

const bab4 = `<p>Rencana itu dimulai dari kalimat yang sangat tidak terencana.</p>

<p>"Aku tidak pernah ke Bromo."</p>

<p>Danu mengatakannya di tengah-tengah percakapan tentang hal lain — mereka sedang membahas foto di akun Instagram seseorang yang entah bagaimana muncul di explore Raka, pemandangan lautan pasir yang luas dengan siluet kawah di latar belakang — dan kalimat itu keluar begitu saja, tanpa pengantar, seperti pikiran yang bocor sebelum sempat disaring.</p>

<p>"Seriusan?" Raka menatap Danu di seberangnya. Kafe, Kamis sore, langit sedang mendung ringan tapi tidak hujan. "Kamu dari Surabaya."</p>

<p>"Iya, dan itu paradoks yang selalu ada di kepalaku." Danu memutar cangkirnya. "Orang Jakarta banyak yang sudah ke Bromo. Aku yang dari Surabaya belum pernah."</p>

<p>"Kenapa?"</p>

<p>"Tidak pernah ada yang mengajak. Dan aku tidak terbiasa pergi sendiri ke tempat yang butuh naik jeep di tengah malam."</p>

<p>Raka mempertimbangkan ini sebentar. Di kepalanya ada beberapa hal yang bergerak sekaligus: kalender minggu depan yang cukup kosong, shift yang bisa digeser, dan sebuah kenyataan bahwa sudah cukup lama ia juga tidak keluar dari Jakarta ke mana pun yang lebih jauh dari Bogor.</p>

<p>"Minggu depan aku tidak ada shift Sabtu-Minggu," kata Raka. "Kamu ada deadline?"</p>

<p>Danu menatapnya. "Kamu serius?"</p>

<p>"Cuma tanya."</p>

<p>"Deadline-ku hari Rabu." Danu terdiam sebentar. Ekspresi yang sulit dibaca — bukan tidak mau, lebih ke sedang memverifikasi apakah ini nyata atau bukan. "Kamu mau ke Bromo minggu depan?"</p>

<p>"Kita bisa coba." Raka mengangkat bahu. "Kalau tidak sempat booking yang bagus, ada tempat-tempat lain di sekitar Malang yang tidak kalah menarik."</p>

<p>Danu diam cukup lama. Bukan tidak nyaman — Raka sudah cukup mengenal ritme Danu untuk tahu bahwa diam itu artinya sedang berpikir sungguh-sungguh, bukan menolak halus.</p>

<p>"Oke," kata Danu akhirnya.</p>

<p>Dan begitu saja, mereka pergi ke Bromo.</p>

<hr>

<p>Sabtu pagi mereka berangkat dengan kereta dari Gambir. Danu datang ke lobi apartemen pukul enam kurang sepuluh dengan tas ransel ukuran sedang dan jaket tebal yang terlihat belum pernah dipakai — tag-nya masih menempel di bagian dalam, yang Raka ketahui karena Danu bilang sendiri dengan cara yang sangat datar: <em>aku beli ini kemarin karena tidak punya jaket cukup tebal untuk Bromo</em>.</p>

<p>"Kamu beli jaket kemarin untuk perjalanan besok?"</p>

<p>"Aku baru ingat kemarin bahwa Bromo dingin."</p>

<p>"Kamu dari Surabaya."</p>

<p>"Aku tidak pernah ke Bromo," ulang Danu dengan sabar, seperti menjelaskan sesuatu yang sudah dikatakan sebelumnya.</p>

<p>Raka memutuskan untuk tidak melanjutkan argumen itu.</p>

<p>Kereta berangkat tepat waktu. Mereka duduk bersebelahan — kebetulan, atau karena Raka yang memesan tiket memilih kursi berdampingan, salah satunya — dengan jendela di sisi Danu. Selama dua jam pertama, Danu bekerja: laptop terbuka, mengetik dengan ritme yang konsisten, sesekali berhenti untuk menatap keluar jendela dengan ekspresi seseorang yang sedang mencari kata yang tepat di antara pemandangan yang lewat.</p>

<p>Raka membaca. Atau mencoba membaca — buku yang ia bawa sudah ada di halaman tujuh puluh tiga sejak sebulan lalu karena ia selalu tertidur sebelum terlalu jauh, dan kali ini pun tidak jauh berbeda. Pukul delapan lebih ia sudah mengangguk-angguk.</p>

<p>Ia tidak tahu pasti kapan ia tertidur. Yang ia tahu adalah waktu terbangun, kepala Danu ada di bahunya.</p>

<p>Raka membeku.</p>

<p>Danu tertidur juga — laptop sudah ditutup, tas kecil dijadikan bantal tambahan di sisi lain, dan kepala itu bertumpu di bahunya dengan cara yang tampak sangat tidak disengaja. Napas Danu teratur. Tenang.</p>

<p>Raka tidak bergerak.</p>

<p>Bukan karena takut membangunkannya — walaupun itu juga — tapi lebih karena ada sesuatu yang terasa seperti: kalau ia bergerak, momen ini akan berubah jadi sesuatu yang harus dijelaskan. Dan ia belum siap untuk penjelasan itu. Belum siap untuk menamai apa yang ia rasakan waktu ia sadar bahwa ia tidak keberatan. Sama sekali tidak keberatan.</p>

<p>Ia melihat keluar jendela. Sawah yang membentang, gunung di kejauhan, langit yang mulai biru terang. Pemandangan yang biasa untuk rute ini, tapi pagi itu terasa berbeda — lebih nyata, lebih berwarna, seperti seseorang menaikkan saturasi di semua hal yang bisa ia lihat.</p>

<p>Danu terbangun tiga puluh menit kemudian. Tidak dengan cara dramatis — hanya mengangkat kepala, berkedip beberapa kali, lalu menyadari posisinya.</p>

<p>"Oh." Ia menegakkan diri. "Maaf."</p>

<p>"Tidak apa-apa."</p>

<p>Ada jeda pendek. Danu melihat keluar jendela, lalu ke tangannya, lalu melihat ke depan dengan ekspresi yang tidak bisa Raka baca sepenuhnya.</p>

<p>"Berapa lama lagi?"</p>

<p>"Satu jam lebih dikit," kata Raka.</p>

<p>Danu mengangguk. Tidak membahas yang barusan. Raka juga tidak.</p>

<p>Mereka tiba di Malang siang hari dan langsung menuju penginapan yang Raka sudah booking — sebuah guesthouse kecil dekat pusat kota, bersih dan cukup hangat, dengan pemilik yang memberikan rekomendasi makan siang di warung sebelah tanpa diminta.</p>

<p>Warung itu bagus. Rawon dengan telur asin dan kerupuk. Danu makan dengan khusyuk — cara yang sama seperti ia melakukan hal-hal lain: penuh perhatian, tidak terburu-buru, tidak mengecek hp sampai piring sudah hampir kosong.</p>

<p>"Enak," kata Danu.</p>

<p>"Iya."</p>

<p>"Di Jakarta tidak ada rawon yang seperti ini."</p>

<p>"Ada, tapi harganya tiga kali lipat."</p>

<p>Danu menatap mangkuknya. "Paradoks kota besar."</p>

<p>Sore harinya mereka jalan-jalan ke sekitar kota — tidak dengan rencana pasti, hanya berjalan dan melihat apa yang ada. Danu ternyata tipe orang yang suka masuk ke toko buku bekas kalau menemukan satu di pinggir jalan, dan Malang rupanya punya cukup banyak. Mereka menghabiskan hampir satu jam di sebuah toko yang lebih mirip gudang buku, dengan rak-rak yang tidak beraturan dan pemilik yang duduk di balik meja dengan kalkulator jadul.</p>

<p>Danu membeli tiga buku. Raka membeli satu — buku tentang akustik ruangan yang ia temukan di sudut yang tidak terduga.</p>

<p>"Ini bukan buku hiburan," komentar Danu, melihat sampulnya.</p>

<p>"Aku baca buku kerja kalau sedang santai."</p>

<p>"Itu tidak sehat."</p>

<p>"Kamu beli tiga buku dalam satu kunjungan."</p>

<p>"Buku-buku ini adalah untuk bersenang-senang." Danu memegang tasnya yang kini lebih penuh. "Ada bedanya."</p>

<p>Raka tidak bisa sepenuhnya membantah itu.</p>

<p>Malam sebelum ke Bromo — mereka dijadwalkan naik jeep pukul dua dini hari untuk mengejar sunrise — mereka duduk di halaman belakang penginapan yang kecil, di kursi plastik yang cukup nyaman, di bawah langit yang sudah gelap tapi bersih dari awan.</p>

<p>Danu menatap bintang. Raka menatap Danu.</p>

<p>Bukan dengan cara yang dramatis. Hanya melihat — cara Danu mengangkat wajahnya sedikit, cara matanya bergerak pelan di antara titik-titik cahaya di atas, cara tenangnya yang tidak pernah terasa dipaksakan.</p>

<p>"Raka."</p>

<p>Ia menoleh cepat, pura-pura baru melihat ke arah yang sama. "Hm?"</p>

<p>"Terima kasih sudah ngajakin."</p>

<p>Kalimat sederhana. Diucapkan pelan, ke arah langit, bukan ke arah Raka.</p>

<p>"Aku yang harusnya bilang terima kasih," kata Raka. "Sudah mau."</p>

<p>Danu tersenyum — senyum tipis yang Raka sudah hafal polanya sekarang, yang muncul kalau ada sesuatu yang ia anggap lucu tapi tidak mau dikomentari berlebihan. "Aneh ya kalau dipikir-pikir."</p>

<p>"Apa?"</p>

<p>"Kita baru kenal beberapa bulan. Tapi rasanya sudah lama."</p>

<p>Raka tidak menjawab langsung. Karena Danu benar — dan karena ia tidak tahu harus menjawab apa yang rasanya seperti pengakuan yang tanpa sengaja menyentuh sesuatu yang belum pernah mereka bicarakan sebelumnya.</p>

<p>"Mungkin karena kita bertemu tiap minggu," kata Raka akhirnya. Aman. Netral.</p>

<p>"Mungkin." Danu masih menatap bintang. "Atau mungkin memang seperti itu."</p>

<p><em>Atau mungkin memang seperti itu.</em></p>

<p>Raka memutar kalimat itu di kepalanya dua kali, tiga kali, sambil pura-pura juga menatap langit yang sama. Di dalam dadanya ada sesuatu yang bergerak — bukan dramatis, bukan separuh dunia runtuh — tapi cukup untuk membuat napasnya sedikit tidak teratur selama beberapa detik.</p>

<p>Ia tidak berkata apa-apa.</p>

<p>Danu juga tidak.</p>

<p>Mereka duduk diam di bawah langit yang penuh bintang, masing-masing dengan pikiran yang mungkin menuju ke arah yang sama tapi belum berani sampai ke sana, dan angin malam bertiup cukup dingin untuk jadi alasan yang bagus kalau salah satu dari mereka memutuskan untuk masuk.</p>

<p>Tapi tidak ada yang masuk.</p>

<p>Tidak dulu.</p>`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const story = await Story.findOne({ slug: STORY_SLUG });
  if (!story) {
    console.error("Story not found:", STORY_SLUG);
    process.exit(1);
  }
  console.log("Story found:", story.title);

  const seasons = await Season.find({ storyId: story._id });
  if (!seasons.length) {
    console.error("No seasons found");
    process.exit(1);
  }
  const season = seasons[0];
  console.log("Season found:", season.title);

  // Delete all existing chapters for this season
  const deleted = await Chapter.deleteMany({ seasonId: season._id });
  console.log(`Deleted ${deleted.deletedCount} existing chapters`);

  const now = new Date();
  const week1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const week1b = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

  const chapters = [
    {
      storyId: story._id,
      seasonId: season._id,
      chapterNumber: 1,
      title: "Shift Malam dan Kopi Tanpa Gula",
      content: bab1,
      published: true,
      scheduledAt: null,
    },
    {
      storyId: story._id,
      seasonId: season._id,
      chapterNumber: 2,
      title: "Belanja Tengah Malam dan Permen Mint",
      content: bab2,
      published: true,
      scheduledAt: null,
    },
    {
      storyId: story._id,
      seasonId: season._id,
      chapterNumber: 3,
      title: "Hujan yang Tidak Buru-Buru Pergi",
      content: bab3,
      published: false,
      scheduledAt: week1,
    },
    {
      storyId: story._id,
      seasonId: season._id,
      chapterNumber: 4,
      title: "Bromo dan Bintang yang Tidak Disebutkan",
      content: bab4,
      published: false,
      scheduledAt: week1b,
    },
  ];

  for (const ch of chapters) {
    await Chapter.create(ch);
    const status = ch.published ? "✅ Published" : `⏰ Scheduled: ${ch.scheduledAt?.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
    console.log(`Created Bab ${ch.chapterNumber}: "${ch.title}" — ${status}`);
  }

  console.log("\nDone! 4 chapters created (2 live, 2 scheduled for next week).");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
