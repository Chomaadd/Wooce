import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

const storySchema = new mongoose.Schema({
  title: String, slug: String, coverUrl: String, description: String,
  category: String, status: String, tags: [String],
  published: Boolean, featured: Boolean, viewCount: { type: Number, default: 0 },
}, { timestamps: true });

const seasonSchema = new mongoose.Schema({
  storyId: mongoose.Schema.Types.ObjectId,
  seasonNumber: Number, title: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

const chapterSchema = new mongoose.Schema({
  storyId: mongoose.Schema.Types.ObjectId,
  seasonId: mongoose.Schema.Types.ObjectId,
  chapterNumber: Number, title: String, content: String, published: Boolean,
}, { timestamps: true });

const Story   = mongoose.model('NovelStory',   storySchema);
const Season  = mongoose.model('NovelSeason',  seasonSchema);
const Chapter = mongoose.model('NovelChapter', chapterSchema);

await mongoose.connect(uri);

// Cek dulu apakah slug sudah ada
const existing = await Story.findOne({ slug: 'ruang-di-antara-kita' });
if (existing) {
  console.log('Novel sudah ada, skip.');
  await mongoose.disconnect();
  process.exit(0);
}

const story = await Story.create({
  title: 'Ruang di Antara Kita',
  slug: 'ruang-di-antara-kita',
  description: 'Raka adalah Top Security yang tenang dan tak banyak bicara. Danu, rekan kerjanya di bagian gudang, adalah satu-satunya orang yang selalu berhasil membuatnya tersenyum. Mereka pergi belanja bersama, liburan bersama, keluar malam bersama — tapi Raka tidak pernah tahu bahwa di balik semua itu, Danu menyimpan perasaan yang jauh lebih dalam dari sekadar persahabatan.',
  category: 'novel',
  status: 'ongoing',
  tags: ['BL', 'Romance', 'SliceofLife', 'SlowBurn'],
  published: true,
  featured: false,
});
console.log('Story OK:', story._id);

const season = await Season.create({
  storyId: story._id,
  seasonNumber: 1,
  title: 'Musim Pertama: Diam yang Berbicara',
});
console.log('Season OK:', season._id);

const chapters = [
  {
    chapterNumber: 1,
    title: 'Shift Malam dan Kopi Tanpa Gula',
    content: `Gedung itu sepi di atas jam sebelas malam.

Hanya suara langkah sepatu yang sesekali bergema di lorong basement — dan itupun biasanya milik Raka.

Raka Satria, dua puluh delapan tahun, Top Security gedung perkantoran Aruna Tower. Badannya tinggi, rahangnya tegas, matanya selalu sedikit menyipit seolah sedang menilai sesuatu. Rekan-rekannya bilang dia dingin. Atasan bilang dia profesional. Raka sendiri tidak peduli mereka bilang apa.

Yang penting tugasnya beres.

"Kak Raka."

Suara itu muncul dari balik pintu gudang lantai B2. Raka berhenti. Dia sudah hafal suara itu.

Danu muncul sambil menenteng dua gelas kopi dari vending machine. Rambut ikal pendeknya sedikit berantakan — tanda dia sudah di sini sejak sore. Anak gudang memang begitu: datang pagi, pulang malam, dan entah kenapa selalu kelihatan bahagia.

"Shift malem lagi?" tanya Danu, mengulurkan salah satu gelas.

"Kamu harusnya tahu jadwal saya."

Danu nyengir. "Ya tahu. Makanya beli dua."

Raka menatap gelas itu sebentar, lalu menerimanya tanpa komentar. Kopi hitam. Tanpa gula. Persis yang dia suka — dan dia tidak pernah secara eksplisit memberitahu Danu soal itu.

Mereka duduk di bangku panjang dekat loker. Danu mengoceh soal laporan stok yang berantakan, soal bos gudang yang sering lupa password, soal kucing liar yang tidur di depan pintu darurat tadi sore. Raka mendengarkan. Sesekali mengangguk. Sesekali menimpali satu-dua kata.

Orang lain mungkin mengira Raka tidak tertarik.

Tapi sebenarnya — ini adalah bagian favoritnya dari shift malam.`,
  },
  {
    chapterNumber: 2,
    title: 'Belanja Mingguan dan Kebiasaan yang Tidak Terencana',
    content: `Awalnya hanya kebetulan.

Tiga bulan lalu, Raka dan Danu pulang bareng karena arah rumah mereka searah. Di tengah jalan, Danu mampir ke supermarket dengan alasan "sebentar doang, Kak, lima menit."

Empat puluh menit kemudian, mereka keluar dengan dua kantong belanjaan penuh — dan Raka yang membawakan semuanya tanpa diminta.

Setelah itu jadi kebiasaan.

Setiap Sabtu sore, Danu mengetuk pintu pos security dengan wajah paling innocent yang bisa dia pasang. "Kak Raka mau ikut ke supermarket nggak?"

Dan Raka selalu bilang, "Buat apa?"

Dan Danu selalu menjawab, "Temen jalan."

Dan Raka selalu akhirnya ikut.

Hari ini tidak berbeda. Mereka menyusuri lorong produk rumah tangga — Danu memilih-milih sabun cuci piring sambil membandingkan harga per mililiter dengan serius, sementara Raka berdiri dua langkah di belakangnya, tangan di saku, mata menelusuri sekitar dengan kebiasaan lama seorang security.

"Kak, ini mending yang mana?" Danu mengangkat dua botol.

Raka melirik sebentar. "Yang kiri."

"Kok yang kiri?"

"Lebih berat. Isinya lebih banyak."

Danu membalikkan botol, mengecek gramase-nya, lalu menatap Raka dengan ekspresi separuh kagum separuh geli. "Kak Raka notice hal-hal kayak gini?"

"Saya notice semua hal."

Danu ketawa kecil. Suaranya hangat, agak serak, dan — entah kenapa — selalu berhasil membuat sudut bibir Raka sedikit terangkat.

Mereka lanjut ke lorong berikutnya. Tanpa disadari, jarak di antara mereka mengecil — bahu Danu hampir menyentuh lengan Raka di lorong yang sempit.

Raka tidak menjauh.

Danu pura-pura tidak memperhatikan.

Dan keduanya tidak membicarakan apa-apa tentang itu.`,
  },
  {
    chapterNumber: 3,
    title: 'Malam Minggu dan Kota yang Tidak Tidur',
    content: `Ide itu muncul dari Danu, seperti biasa.

"Kak, kita jalan-jalan malam ini yuk. Kota lagi bagus."

Raka sedang mengisi laporan shift di mejanya. Dia mengangkat kepala. "Bagus gimana?"

"Ya bagus. Lampu-lampu. Orang-orang. Hidup." Danu bersandar di kusen pintu pos security, tangannya memeluk dada. "Kak Raka terlalu sering di dalam gedung."

"Itu kerjaan saya."

"Ini hari libur, Kak."

Raka menatapnya beberapa detik. Lalu menutup laptopnya.

Mereka pergi tanpa tujuan yang jelas — naik motor Danu, menembus angin malam yang mulai dingin. Raka duduk di boncengan dengan tubuh tegak, tidak memegang apa-apa, meski Danu kadang menikung lebih dari yang perlu.

Kota memang sedang bagus malam itu.

Mereka berhenti di pinggir sungai kecil yang dikelilingi warung kaki lima. Pesan mie ayam — Danu minta tambah bakso, Raka tidak. Duduk di bangku plastik merah yang sedikit goyang.

"Kak pernah kepikiran nggak," Danu mulai, suaranya lebih pelan dari biasanya, "kerja di sini sampai kapan?"

Raka menyeruput kuah. "Selama masih digaji."

Danu ketawa tipis. "Serius, Kak."

Hening sebentar. Di kejauhan, suara motor berlalu. Seseorang di warung sebelah sedang karaoke lagu lawas dengan penuh penghayatan.

"Belum kepikiran," kata Raka akhirnya. "Kamu?"

"Aku..." Danu menatap sungai. Refleksi lampu jembatan bergoyang di permukaan air. "Aku betah di sini. Mungkin karena ada hal yang bikin betah."

Raka tidak bertanya hal apa.

Danu tidak menjelaskan.

Tapi malam itu, dalam perjalanan pulang, Danu tidak menikung berlebihan — dan punggung Raka menyentuh dada Danu karena angin kencang, dan tidak ada yang meminta maaf karenanya.`,
  },
];

for (const ch of chapters) {
  await Chapter.create({
    storyId: story._id,
    seasonId: season._id,
    ...ch,
    published: true,
  });
  console.log(`Chapter ${ch.chapterNumber} OK: ${ch.title}`);
}

console.log('\nSelesai! Novel sudah terpublish.');
await mongoose.disconnect();
