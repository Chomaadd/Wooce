import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { TopupModal } from "@/components/payment/TopupModal";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import {
  Coins, Zap, Shield, Clock, ChevronDown, ChevronUp,
  BookOpen, Lock, Gift, CreditCard, Smartphone, Building2,
  QrCode, Star,
} from "lucide-react";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const PACKAGES = [
  { id: "pkg_10",  coins: 10,  price: 5000,  label: "Pemula",    popular: false, bonus: null },
  { id: "pkg_30",  coins: 30,  price: 12000, label: "Standar",   popular: false, bonus: null },
  { id: "pkg_50",  coins: 50,  price: 18000, label: "Populer",   popular: true,  bonus: "+2 bonus" },
  { id: "pkg_100", coins: 100, price: 30000, label: "Terbaik",   popular: false, bonus: "+10 bonus" },
];

const PAYMENT_METHODS = [
  { icon: <Smartphone size={20} />, name: "GoPay / OVO / Dana", desc: "Dompet digital" },
  { icon: <QrCode size={20} />,     name: "QRIS",               desc: "Scan & bayar" },
  { icon: <Building2 size={20} />,  name: "Transfer Bank",      desc: "BCA, Mandiri, BRI, BNI" },
  { icon: <CreditCard size={20} />, name: "Kartu Kredit / Debit", desc: "Visa & Mastercard" },
];

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ID: FaqItem[] = [
  {
    q: "Apa itu Koin WOOCE?",
    a: "Koin WOOCE adalah mata uang virtual di platform WOOCE Novel yang digunakan untuk membuka chapter premium. Kamu membeli koin sekali, lalu gunakan untuk chapter mana saja sesuai kebutuhan.",
  },
  {
    q: "Apakah koin bisa kadaluarsa?",
    a: "Tidak. Koin yang sudah dibeli tidak akan pernah kadaluarsa selama akun kamu aktif di platform WOOCE Novel.",
  },
  {
    q: "Berapa lama proses top up koin?",
    a: "Instan. Setelah pembayaran berhasil dikonfirmasi, koin langsung masuk ke dompet akunmu dalam hitungan detik.",
  },
  {
    q: "Apakah koin bisa dikembalikan (refund)?",
    a: "Koin yang sudah digunakan untuk membuka chapter tidak dapat dikembalikan. Koin yang belum digunakan dapat dikembalikan dalam 24 jam sejak pembelian — hubungi kami melalui halaman Kontak.",
  },
  {
    q: "Bagaimana cara menggunakan koin?",
    a: "Buka halaman chapter premium di novel pilihanmu, lalu klik tombol 'Buka Chapter'. Koin akan otomatis terpotong dari dompetmu.",
  },
  {
    q: "Apakah pembayaran aman?",
    a: "Ya. Semua transaksi diproses oleh Midtrans, payment gateway terpercaya yang sudah digunakan jutaan bisnis di Indonesia dan berlisensi Bank Indonesia.",
  },
];

const FAQ_EN: FaqItem[] = [
  {
    q: "What are WOOCE Coins?",
    a: "WOOCE Coins are virtual currency on the WOOCE Novel platform used to unlock premium chapters. Buy coins once, then use them on any chapter you want.",
  },
  {
    q: "Do coins expire?",
    a: "No. Purchased coins never expire as long as your WOOCE Novel account remains active.",
  },
  {
    q: "How fast is the top-up process?",
    a: "Instant. Once payment is confirmed, coins are added to your wallet within seconds.",
  },
  {
    q: "Can I get a refund for coins?",
    a: "Coins already used to unlock chapters are non-refundable. Unused coins may be refunded within 24 hours of purchase — contact us via the Contact page.",
  },
  {
    q: "How do I use coins?",
    a: "Open a premium chapter on any novel and click 'Unlock Chapter'. Coins will be automatically deducted from your wallet.",
  },
  {
    q: "Is the payment secure?",
    a: "Yes. All transactions are processed by Midtrans, a trusted payment gateway licensed by Bank Indonesia and used by millions of businesses.",
  },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-foreground transition-colors"
        onClick={() => setOpen(o => !o)}
        data-testid="button-faq-toggle"
      >
        <span className="font-medium text-sm text-foreground">{item.q}</span>
        {open ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TopupKoin() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isID = language === "id";
  const [showModal, setShowModal] = useState(false);

  const faqItems = isID ? FAQ_ID : FAQ_EN;

  const handleBuyClick = () => {
    if (user) {
      setShowModal(true);
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <SeoHead
        title={isID ? "Top Up Koin — WOOCE Novel" : "Buy Coins — WOOCE Novel"}
        description={
          isID
            ? "Beli koin WOOCE Novel untuk membuka chapter premium. Pembayaran mudah via GoPay, OVO, QRIS, Transfer Bank, dan Kartu Kredit."
            : "Buy WOOCE Novel coins to unlock premium chapters. Easy payment via GoPay, OVO, QRIS, Bank Transfer, and Credit Card."
        }
      />
      <Navbar />

      <main className="min-h-screen bg-background pt-16">

        {/* ── Hero ── */}
        <section className="bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-14 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Coins size={13} />
              {isID ? "Layanan Koin Digital" : "Digital Coin Service"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              {isID ? "Top Up Koin WOOCE" : "Buy WOOCE Coins"}
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
              {isID
                ? "Koin digunakan untuk membuka chapter premium di novel pilihanmu. Beli sekali, pakai kapan saja."
                : "Coins are used to unlock premium chapters on your favorite novels. Buy once, use anytime."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap size={12} className="text-green-500" /> {isID ? "Instan" : "Instant"}</span>
              <span className="flex items-center gap-1"><Shield size={12} className="text-blue-500" /> {isID ? "Pembayaran Aman" : "Secure Payment"}</span>
              <span className="flex items-center gap-1"><Clock size={12} className="text-purple-500" /> {isID ? "Koin Tidak Kadaluarsa" : "Coins Never Expire"}</span>
            </div>
          </div>
        </section>

        {/* ── What are coins for ── */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-foreground mb-5 text-center">
            {isID ? "Koin Digunakan untuk Apa?" : "What are Coins Used For?"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Lock size={20} className="text-amber-500" />,
                title: isID ? "Buka Chapter Premium" : "Unlock Premium Chapters",
                desc: isID
                  ? "Gunakan koin untuk membaca chapter eksklusif yang hanya tersedia bagi pembaca berbayar."
                  : "Use coins to read exclusive chapters only available to paying readers.",
              },
              {
                icon: <BookOpen size={20} className="text-blue-500" />,
                title: isID ? "Dukung Penulis" : "Support Writers",
                desc: isID
                  ? "Setiap koin yang kamu bayarkan langsung mendukung penulis novel favoritmu."
                  : "Every coin you spend directly supports your favorite novel writers.",
              },
              {
                icon: <Gift size={20} className="text-green-500" />,
                title: isID ? "Akses Konten Terbaru" : "Access Latest Content",
                desc: isID
                  ? "Dapatkan akses ke chapter terbaru lebih cepat sebelum tersedia untuk umum."
                  : "Get early access to the latest chapters before they become publicly available.",
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  {item.icon}
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Coin packages ── */}
        <section className="max-w-3xl mx-auto px-4 pb-10">
          <h2 className="text-lg font-bold text-foreground mb-2 text-center">
            {isID ? "Pilih Paket Koin" : "Choose a Coin Package"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isID ? "Semua harga sudah termasuk pajak. Pembayaran diproses oleh Midtrans." : "All prices include tax. Payments processed by Midtrans."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PACKAGES.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.01 }}
                className={`relative rounded-2xl border-2 bg-card p-6 transition-all ${
                  pkg.popular
                    ? "border-amber-500 shadow-md shadow-amber-500/10"
                    : "border-border hover:border-amber-300"
                }`}
                data-testid={`card-package-${pkg.id}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide shadow">
                      <Star size={9} fill="white" />
                      {isID ? "PALING POPULER" : "MOST POPULAR"}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{pkg.label}</p>
                    <div className="flex items-center gap-2">
                      <Coins size={22} className="text-amber-500" />
                      <span className="text-3xl font-extrabold text-foreground">{pkg.coins}</span>
                      <span className="text-sm text-muted-foreground font-medium">{isID ? "Koin" : "Coins"}</span>
                    </div>
                    {pkg.bonus && (
                      <span className="inline-block mt-1 text-[11px] text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                        {pkg.bonus}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-foreground">{formatRupiah(pkg.price)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ≈ {formatRupiah(pkg.price / pkg.coins)}/{isID ? "koin" : "coin"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBuyClick}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                    pkg.popular
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      : "bg-muted hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 text-foreground border border-border hover:border-amber-300"
                  }`}
                  data-testid={`button-buy-${pkg.id}`}
                >
                  {user
                    ? (isID ? `Beli ${pkg.coins} Koin` : `Buy ${pkg.coins} Coins`)
                    : (isID ? "Login untuk Beli" : "Login to Buy")}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Payment methods ── */}
        <section className="bg-muted/40 border-y border-border">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-foreground mb-2 text-center">
              {isID ? "Metode Pembayaran" : "Payment Methods"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {isID
                ? "Bayar dengan cara yang paling nyaman untukmu. Semua metode aman dan terpercaya."
                : "Pay with whatever is most convenient for you. All methods are safe and trusted."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map((m, i) => (
                <div
                  key={i}
                  className="bg-background rounded-xl border border-border p-4 text-center"
                  data-testid={`card-payment-${i}`}
                >
                  <div className="text-muted-foreground flex justify-center mb-2">{m.icon}</div>
                  <p className="text-xs font-semibold text-foreground">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={13} className="text-blue-500" />
              {isID
                ? "Semua transaksi dienkripsi dan diproses secara aman oleh Midtrans — payment gateway berlisensi Bank Indonesia."
                : "All transactions are encrypted and securely processed by Midtrans — a Bank Indonesia licensed payment gateway."}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-foreground mb-6 text-center">
            {isID ? "Cara Kerja Top Up" : "How Top Up Works"}
          </h2>
          <div className="flex flex-col sm:flex-row gap-0">
            {[
              {
                step: "1",
                title: isID ? "Pilih Paket" : "Choose a Package",
                desc: isID ? "Pilih jumlah koin yang sesuai kebutuhanmu dari daftar paket di atas." : "Choose the amount of coins that suits your needs from the packages above.",
              },
              {
                step: "2",
                title: isID ? "Lakukan Pembayaran" : "Make Payment",
                desc: isID ? "Bayar menggunakan metode pembayaran pilihanmu melalui halaman Midtrans yang aman." : "Pay using your preferred payment method through the secure Midtrans page.",
              },
              {
                step: "3",
                title: isID ? "Koin Langsung Masuk" : "Coins Added Instantly",
                desc: isID ? "Setelah pembayaran berhasil, koin langsung ditambahkan ke dompet akunmu." : "After successful payment, coins are instantly added to your account wallet.",
              },
            ].map((s, i, arr) => (
              <div key={i} className="flex sm:flex-col items-start sm:items-center flex-1 gap-3 sm:gap-2 relative pb-6 sm:pb-0">
                {i < arr.length - 1 && (
                  <div className="absolute left-5 sm:left-1/2 top-10 sm:top-5 w-px sm:w-auto sm:h-px h-full sm:bottom-0 bg-border sm:right-0 z-0" />
                )}
                <div className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow">
                  {s.step}
                </div>
                <div className="sm:text-center sm:px-4 pt-0.5">
                  <p className="font-semibold text-sm text-foreground mb-1">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-muted/40 border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-foreground mb-6 text-center">
              {isID ? "Pertanyaan Umum" : "Frequently Asked Questions"}
            </h2>
            <div className="bg-background rounded-2xl border border-border px-5 divide-y divide-border">
              {faqItems.map((item, i) => (
                <FaqRow key={i} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA bottom ── */}
        <section className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {isID ? "Siap mulai membaca?" : "Ready to start reading?"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isID
              ? "Beli koin sekarang dan nikmati ribuan chapter premium di WOOCE Novel."
              : "Buy coins now and enjoy thousands of premium chapters on WOOCE Novel."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBuyClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-sm active:scale-[0.98]"
              data-testid="button-cta-buy-coins"
            >
              <Coins size={16} />
              {isID ? "Beli Koin Sekarang" : "Buy Coins Now"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-sm transition-all"
              data-testid="link-browse-novels"
            >
              <BookOpen size={16} />
              {isID ? "Jelajahi Novel" : "Browse Novels"}
            </Link>
          </div>
        </section>

      </main>

      <Footer />

      {/* Topup modal (only shown when user is logged in) */}
      <AnimatePresence>
        {showModal && (
          <TopupModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
