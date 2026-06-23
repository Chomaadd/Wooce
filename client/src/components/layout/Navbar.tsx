import { useRef, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Shield, Search, X, BookOpen, Bookmark, Library, PenLine, LogIn, LogOut, User, Clock, Bell, CheckCircle2, AlertCircle, AlertTriangle, BellOff, ChevronDown, Megaphone, BookMarked, BookHeart, FileText, Coins, XCircle, Flame, Newspaper } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSearchContext } from "@/lib/search-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { NovelStory, AppNotification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { LoginModal } from "@/components/layout/LoginModal";
import { TopupModal } from "@/components/payment/TopupModal";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

function CoinBalanceRow({ onBuy }: { onBuy?: () => void }) {
  const { user } = useAuth();
  const { data } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    queryFn: () => fetch("/api/coins/balance", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });
  if (!user || user.isAdmin) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 mb-0.5">
      <Coins size={12} className="text-amber-500 flex-shrink-0" />
      <span className="text-xs text-muted-foreground flex-1">Koin</span>
      <span className="text-xs font-bold text-foreground mr-2" data-testid="text-coin-balance">{data?.coins ?? 0}</span>
      {onBuy && (
        <button
          onClick={onBuy}
          className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          data-testid="button-navbar-buy-coins"
        >
          + Beli
        </button>
      )}
    </div>
  );
}

function TermsReadModal({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }) {
  const { language } = useLanguage();
  const isID = language === "id";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) setScrolledToBottom(true);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {isID ? "Syarat & Kebijakan Privasi" : "Terms of Service & Privacy Policy"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isID ? "Baca hingga selesai untuk melanjutkan" : "Read to the end to continue"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm leading-relaxed min-h-0">
          {isID ? (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Ketentuan Layanan</p>
                <div className="space-y-4 text-muted-foreground">
                  {[
                    ["1. Penerimaan Ketentuan", "Dengan mengakses atau menggunakan platform WOOCE Novel, kamu menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan ini secara penuh. Jika tidak setuju, mohon hentikan penggunaan layanan segera."],
                    ["2. Deskripsi Layanan", "WOOCE Novel adalah platform digital untuk membaca dan mempublikasikan novel, komik, dan cerita pendek. Layanan mencakup dashboard penulis untuk mengelola karya dalam struktur Season dan Bab, sistem notifikasi, dan fitur komunitas pendukung."],
                    ["3. Akun Pengguna", "Login dilakukan melalui Google OAuth. Kamu bertanggung jawab atas seluruh aktivitas yang terjadi di bawah akunmu. Kamu tidak diperbolehkan berbagi akses dengan pihak lain, menggunakan akun orang lain, atau membuat akun palsu."],
                    ["4. Program Penulis", "Untuk menjadi penulis, kamu perlu mengajukan permohonan yang akan ditinjau admin dalam 3–5 hari kerja. Penulis yang disetujui dapat mempublikasikan karya di platform dan wajib memperbarui karya secara rutin. Akun penulis dapat ditangguhkan atau dihapus jika melanggar ketentuan."],
                    ["5. Konten yang Dilarang", "Dilarang keras mengunggah konten: mengandung kekerasan ekstrem, eksploitasi atau pelecehan seksual terhadap anak (CSAM), ujaran kebencian, konten rasis atau diskriminatif, plagiarisme atau terjemahan tanpa izin, spam, atau konten ilegal dalam bentuk apapun."],
                    ["6. Hak Kekayaan Intelektual", "Penulis mempertahankan hak atas karya yang mereka unggah, namun memberikan WOOCE Novel lisensi non-eksklusif untuk menampilkan karya di platform. Seluruh elemen desain, antarmuka, dan kode platform adalah milik WOOCE Novel."],
                    ["7. Pelanggaran & Sanksi", "Pelanggaran terhadap ketentuan dapat mengakibatkan peringatan, penangguhan sementara (30 hari), atau penghapusan akun secara permanen tanpa pemberitahuan. Keputusan admin bersifat final untuk kasus pelanggaran konten."],
                    ["8. Perubahan Layanan", "WOOCE Novel berhak mengubah, membatasi, atau menghentikan fitur kapan saja tanpa pemberitahuan terlebih dahulu. Ketentuan layanan dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan atas ketentuan baru."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-foreground text-xs mb-1.5">{title}</p>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Kebijakan Privasi</p>
                <div className="space-y-4 text-muted-foreground">
                  {[
                    ["1. Data yang Dikumpulkan", "Kami mengumpulkan: data akun Google (nama, email, foto profil, Google ID), data profil penulis (bio, tautan sosial, tautan donasi), konten karya yang diunggah (judul, sinopsis, chapter, cover), data sesi login, dan data penggunaan anonim (view count, rating)."],
                    ["2. Penggunaan Data", "Data digunakan untuk: mengautentikasi login, menampilkan profil dan karya, mengirimkan notifikasi terkait status akun, meningkatkan kualitas layanan, dan memproses permohonan penulis. Kami tidak menjual data pribadimu kepada pihak ketiga manapun."],
                    ["3. Penyimpanan & Keamanan", "Data disimpan di server MongoDB yang aman. Sesi login dienkripsi menggunakan session secret. Preferensi bahasa dan tema disimpan di localStorage perangkatmu. Foto profil dan cover novel disimpan menggunakan sistem GridFS."],
                    ["4. Hak Pengguna", "Kamu berhak mengakses data pribadimu dan meminta penghapusan akun kapan saja. Untuk permintaan penghapusan data, hubungi kami melalui formulir kontak. Setelah permintaan diproses, data akunmu akan dihapus dari sistem kami."],
                    ["5. Cookie & Pelacakan", "Platform menggunakan session cookie untuk menjaga status login. Tidak ada iklan berbasis pelacakan atau analytics pihak ketiga. Preferensi lokal (bahasa, tema) tersimpan di localStorage browser — tidak dikirimkan ke server."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-foreground text-xs mb-1.5">{title}</p>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Terms of Service</p>
                <div className="space-y-4 text-muted-foreground">
                  {[
                    ["1. Acceptance", "By accessing or using WOOCE Novel, you confirm you have read, understood, and fully agree to all terms herein. If you disagree, please stop using the service immediately."],
                    ["2. Service Description", "WOOCE Novel is a digital platform for reading and publishing novels, comics, and short stories. Services include a writer dashboard to manage works in Season and Chapter structure, notification system, and community features."],
                    ["3. User Accounts", "Login is via Google OAuth. You are responsible for all activity under your account. Do not share access with others, use someone else's account, or create fake accounts."],
                    ["4. Writer Program", "To become a writer, submit an application reviewed by admin within 3–5 business days. Approved writers may publish on the platform and must update works regularly. Accounts may be suspended or deleted for violations."],
                    ["5. Prohibited Content", "Strictly prohibited: extreme violence, child sexual abuse material (CSAM), hate speech, racist or discriminatory content, plagiarism or unauthorized translations, spam, or any illegal content."],
                    ["6. Intellectual Property", "Writers retain rights to uploaded works but grant WOOCE Novel a non-exclusive license to display them. All platform design, interface, and code are WOOCE Novel's property."],
                    ["7. Violations & Sanctions", "Violations may result in warnings, temporary suspension (30 days), or permanent account deletion without notice. Admin decisions are final for content violations."],
                    ["8. Service Changes", "WOOCE Novel may modify, limit, or discontinue features at any time without notice. Continued use after changes constitutes acceptance of updated terms."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-foreground text-xs mb-1.5">{title}</p>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Privacy Policy</p>
                <div className="space-y-4 text-muted-foreground">
                  {[
                    ["1. Data We Collect", "We collect: Google account data (name, email, photo, Google ID), writer profile data (bio, social links, donation links), uploaded content (title, synopsis, chapters, cover), login session data, and anonymous usage data (view count, ratings)."],
                    ["2. How We Use Data", "Data is used to authenticate login, display profiles and works, send account notifications, improve the platform, and process writer applications. We do not sell your personal data to any third parties."],
                    ["3. Storage & Security", "Data is stored on secure MongoDB servers. Login sessions are encrypted using a session secret. Language and theme preferences are in your device's localStorage. Profile and cover images use GridFS storage."],
                    ["4. Your Rights", "You may access your personal data and request account deletion at any time. Contact us via the contact form for data removal requests. After processing, your account data will be removed from our system."],
                    ["5. Cookies & Tracking", "The platform uses session cookies to maintain login status. No ad tracking or third-party analytics. Local preferences (language, theme) are in localStorage — not sent to our servers."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-foreground text-xs mb-1.5">{title}</p>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <AnimatePresence mode="wait">
            {!scrolledToBottom ? (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-0.5"
              >
                <ChevronDown size={14} className="animate-bounce" />
                {isID ? "Scroll ke bawah untuk melanjutkan" : "Scroll to the bottom to continue"}
              </motion.div>
            ) : (
              <motion.div
                key="accept"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${accepted ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 hover:border-border/80"}`}>
                  <div className="relative shrink-0 mt-0.5">
                    <input type="checkbox" className="sr-only" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
                    <div className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${accepted ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                      {accepted && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[11.5px] text-muted-foreground leading-relaxed">
                    {isID
                      ? "Saya telah membaca dan menyetujui Ketentuan Layanan serta Kebijakan Privasi WOOCE Novel."
                      : "I have read and agree to WOOCE Novel's Terms of Service and Privacy Policy."}
                  </span>
                </label>
                <button
                  onClick={() => { if (accepted) { onAccept(); onClose(); } }}
                  disabled={!accepted}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isID ? "Setuju & Lanjutkan" : "Agree & Continue"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function WriterModal({ onClose, onLoginClick }: { onClose: () => void; onLoginClick: () => void }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isLoggedIn = !!user && !user.isAdmin;
  const isPending = user?.role === "writer" && user?.status === "pending";
  const isActive = user?.role === "writer" && user?.status === "active";
  const isID = language === "id";

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[88vh] overflow-y-auto"
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-close-writer-modal"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PenLine size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-tight">{t("writer.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("writer.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{t("writer.req.title")}</h3>
            <ol className="space-y-3">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <li key={n} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`writer.req.${n}`)}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">{t("writer.note")}</p>
          </div>

          {isPending ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock size={18} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t("navbar.writer.pending")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("navbar.writer.pendingDesc")}</p>
              </div>
            </div>
          ) : isActive ? (
            <Link href="/writer/cerita">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-go-writer-dashboard"
              >
                {t("navbar.writer.manage")}
              </button>
            </Link>
          ) : isLoggedIn ? (
            <div className="space-y-3">
              {/* Terms acceptance row */}
              <button
                onClick={() => !termsAccepted && setTermsOpen(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  termsAccepted
                    ? "border-green-500/30 bg-green-500/5 cursor-default"
                    : "border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                }`}
                data-testid="button-open-terms"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${termsAccepted ? "bg-green-500/15" : "bg-muted"}`}>
                  {termsAccepted
                    ? <CheckCircle2 size={14} className="text-green-500" />
                    : <FileText size={14} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {isID ? "Syarat & Kebijakan Privasi" : "Terms & Privacy Policy"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {termsAccepted
                      ? (isID ? "Sudah dibaca & disetujui ✓" : "Read & accepted ✓")
                      : (isID ? "Ketuk untuk membaca — wajib sebelum mendaftar" : "Tap to read — required before registering")}
                  </p>
                </div>
              </button>

              {termsAccepted ? (
                <Link href="/daftar-penulis">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    data-testid="button-register-writer"
                  >
                    {t("navbar.writer.register")}
                  </button>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold opacity-40 cursor-not-allowed"
                  data-testid="button-register-writer-disabled"
                >
                  {t("navbar.writer.register")}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onLoginClick(); }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              data-testid="button-writer-contact"
            >
              <LogIn size={15} className="inline mr-2" />
              {t("navbar.writer.loginToRegister")}
            </button>
          )}
        </div>
      </motion.div>

      {/* Terms reading modal — appears on top of WriterModal */}
      <AnimatePresence>
        {termsOpen && (
          <TermsReadModal
            onClose={() => setTermsOpen(false)}
            onAccept={() => setTermsAccepted(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function notifIcon(type: AppNotification["type"]) {
  if (type === "approved") return <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />;
  if (type === "rejected") return <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />;
  if (type === "suspended") return <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />;
  if (type === "announcement") return <Megaphone size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />;
  if (type === "chapter_new") return <BookMarked size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />;
  if (type === "story_removed") return <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />;
  if (type === "report_rejected") return <XCircle size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />;
  if (type === "topup_success") return <Coins size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />;
  if (type === "topup_failed") return <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />;
  return <Clock size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />;
}

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { search, setSearch } = useSearchContext();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const parts = location.split("/").filter(Boolean);
  const isReading = parts.length === 3;
  const isHome = location === "/";
  const [writerModalOpen, setWriterModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  const showNotifBell = !!user && !user.isAdmin;

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
    enabled: showNotifBell,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const { data: stories } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
    enabled: isHome,
  });

  const results = useMemo(() => {
    if (!search.trim() || !stories) return [];
    const q = search.toLowerCase().trim();
    return stories.filter(s => s.title.toLowerCase().includes(q)).slice(0, 8);
  }, [search, stories]);

  const showDropdown = isHome && search.trim().length > 0;

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setSearch]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-14 items-center gap-3 px-5 lg:px-8">

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              <img
                src="/image/icon-navbar.png"
                alt="WOOCE Novel"
                className="w-full h-full object-cover scale-[1.4] object-center"
              />
            </div>
          </Link>

          <button
            onClick={() => setWriterModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            data-testid="button-become-writer"
          >
            <PenLine size={11} />
            <span>{t("writer.button")}</span>
          </button>

          {isHome ? (
            <div className="flex-1 max-w-sm mx-auto relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t("novel.search.placeholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-full border border-border bg-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-search-novel"
                autoComplete="off"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X size={12} />
                </button>
              )}

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {results.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <p className="text-sm text-muted-foreground">{t("navbar.search.noResults")}</p>
                      </div>
                    ) : (
                      <div className="py-2 max-h-[420px] overflow-y-auto">
                        {results.map(story => (
                          <Link key={story.id} href={`/${story.slug}`}>
                            <div
                              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors cursor-pointer"
                              onClick={() => setSearch("")}
                              data-testid={`search-result-${story.id}`}
                            >
                              <div className="w-9 aspect-[2/3] rounded-md overflow-hidden bg-muted flex-shrink-0">
                                {story.coverUrl ? (
                                  <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen size={12} className="text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{story.title}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{story.category}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Link href="/novels">
              <button
                className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                data-testid="button-all-novels"
                aria-label="Semua Novel"
              >
                <Library size={15} />
              </button>
            </Link>

            {/* Desktop-only: Blog & Top Up links */}
            <Link href="/blog">
              <button
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                data-testid="button-blog-desktop"
              >
                <Newspaper size={13} />
                Blog
              </button>
            </Link>
            <Link href="/topup-koin">
              <button
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                data-testid="button-topup-desktop"
              >
                <Coins size={13} />
                Top Up
              </button>
            </Link>

            {user?.isAdmin && (
              <Link href="/admin/novel">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-1"
                  data-testid="button-admin-link"
                >
                  <Shield size={13} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </Link>
            )}
            {user && !user.isAdmin && user.role === "writer" && user.status === "active" && (
              <Link href="/writer/cerita">
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  data-testid="button-writer-dashboard-nav"
                  aria-label="Dapur Cerita"
                >
                  <PenLine size={13} />
                  <span className="hidden sm:inline">Cerita</span>
                </button>
              </Link>
            )}

            {/* ── Notification Bell ── */}
            {showNotifBell && (
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(prev => !prev);
                    if (!notifOpen && unreadCount > 0) {
                      markAllReadMutation.mutate();
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="button-notification-bell"
                  aria-label="Notifikasi"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{t("navbar.notif.title")}</p>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-[11px] text-primary hover:underline"
                            data-testid="button-mark-all-read"
                          >
                            {t("navbar.notif.markAllRead")}
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                            <BellOff size={24} strokeWidth={1.5} />
                            <p className="text-xs">{t("navbar.notif.empty")}</p>
                          </div>
                        ) : (
                          notifications.map(n => {
                            const inner = (
                              <>
                                {notifIcon(n.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                  {n.createdAt && (
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                      {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  )}
                                </div>
                                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                              </>
                            );
                            const cls = `flex gap-3 px-4 py-3 border-b border-border/50 transition-colors ${!n.read ? "bg-primary/5" : ""} ${(n as any).link ? "hover:bg-muted/60 cursor-pointer" : ""}`;
                            return (n as any).link ? (
                              <Link key={n.id} href={(n as any).link}>
                                <div className={cls} data-testid={`notif-item-${n.id}`}>{inner}</div>
                              </Link>
                            ) : (
                              <div key={n.id} className={cls} data-testid={`notif-item-${n.id}`}>{inner}</div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── User menu (click-based, no hover gap issue) ── */}
            {user && !user.isAdmin && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(prev => !prev)}
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="button-user-avatar"
                  aria-expanded={userMenuOpen}
                >
                  {((user as any).authorPhotoUrl || user.photoUrl) ? (
                    <img
                      src={(user as any).authorPhotoUrl || user.photoUrl!}
                      alt={user.name ?? ""}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20"
                      data-testid="img-user-avatar"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs"
                      data-testid="img-user-avatar-fallback"
                    >
                      {(user.name ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-border">
                        <div className="flex items-center gap-2 mb-1">
                          {((user as any).authorPhotoUrl || user.photoUrl) && (
                            <img src={(user as any).authorPhotoUrl || user.photoUrl!} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          )}
                          <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        {user.role === "writer" && user.status === "pending" && (
                          <span className="text-[10px] text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1">
                            <Clock size={9} /> {t("navbar.user.writerPending")}
                          </span>
                        )}
                        {user.role === "writer" && user.status === "active" && (
                          <span className="text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full mt-1.5 inline-block">
                            {t("navbar.user.writerActive")}
                          </span>
                        )}
                      </div>

                      <CoinBalanceRow onBuy={() => { setUserMenuOpen(false); setShowTopupModal(true); }} />

                      <Link href="/profile">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-profile-menu"
                        >
                          <User size={12} /> {t("navbar.user.profile")}
                        </button>
                      </Link>

                      <Link href="/koin/riwayat">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-coin-history-menu"
                        >
                          <Coins size={12} /> Riwayat Koin
                        </button>
                      </Link>

                      <Link href="/login-bonus">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-login-bonus-menu"
                        >
                          <Flame size={12} className="text-amber-500" /> Login Harian
                        </button>
                      </Link>

                      <div className="hidden sm:block">
                        <Link href="/bookmarks">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-bookmarks-menu"
                          >
                            <Bookmark size={12} /> Bookmark
                          </button>
                        </Link>
                        <Link href="/mengikuti">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-followed-menu"
                          >
                            <BookHeart size={12} /> Cerita Diikuti
                          </button>
                        </Link>
                      </div>

                      {/* Mobile-only: Bookmark & Notifikasi */}
                      <Link href="/bookmarks">
                        <button
                          className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-bookmarks-mobile-menu"
                        >
                          <Bookmark size={12} /> Bookmark
                        </button>
                      </Link>
                      <Link href="/mengikuti">
                        <button
                          className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-followed-mobile-menu"
                        >
                          <BookHeart size={12} /> Cerita Diikuti
                        </button>
                      </Link>
                      <button
                        className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-between"
                        onClick={() => { setUserMenuOpen(false); setNotifOpen(true); }}
                        data-testid="button-notif-mobile-menu"
                      >
                        <span className="flex items-center gap-2"><Bell size={12} /> {t("navbar.user.notifications")}</span>
                        {unreadCount > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                      </button>
                      <Link href="/blog">
                        <button
                          className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-blog-mobile-menu"
                        >
                          <Newspaper size={12} /> Blog
                        </button>
                      </Link>
                      <Link href="/topup-koin">
                        <button
                          className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-topup-mobile-menu"
                        >
                          <Coins size={12} /> Top Up Koin
                        </button>
                      </Link>
                      {user.role === "writer" && user.status === "active" && (
                        <Link href="/writer/cerita">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-writer-menu"
                          >
                            <PenLine size={12} /> {t("navbar.user.manageStories")}
                          </button>
                        </Link>
                      )}

                      {user.role === "reader" && (
                        <Link href="/daftar-penulis">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-become-writer-menu"
                          >
                            <PenLine size={12} /> {t("navbar.user.becomeWriter")}
                          </button>
                        </Link>
                      )}

                      {/* Mobile-only: Bahasa & Tampilan expandable */}
                      <div className="sm:hidden border-t border-border">
                        <button
                          onClick={() => setSettingsOpen(p => !p)}
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><Globe size={12} /> Bahasa & Tampilan</span>
                          <ChevronDown size={11} className={`transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
                        </button>
                        {settingsOpen && (
                          <div className="bg-muted/40 border-t border-border/50 px-3 py-2 space-y-1">
                            <button
                              onClick={() => setLanguage(language === "id" ? "en" : "id")}
                              className="w-full text-left py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <Globe size={11} />
                              <span>Bahasa: <strong>{language.toUpperCase()}</strong></span>
                              <span className="ml-auto text-[10px] opacity-60">→ {language === "id" ? "EN" : "ID"}</span>
                            </button>
                            <button
                              onClick={toggleTheme}
                              className="w-full text-left py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              {theme === "light" ? <Moon size={11} /> : <Sun size={11} />}
                              <span>Tema: <strong>{theme === "light" ? "Terang" : "Gelap"}</strong></span>
                              <span className="ml-auto text-[10px] opacity-60">→ {theme === "light" ? "Gelap" : "Terang"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await fetch("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 border-t border-border"
                        data-testid="button-user-logout"
                      >
                        <LogOut size={12} /> Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!user && !isLoading && (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                data-testid="button-google-login"
              >
                <LogIn size={13} />
                <span className="hidden sm:inline">Masuk</span>
              </button>
            )}
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-xs font-semibold"
              data-testid="button-language-toggle"
            >
              <Globe size={14} />
              {language === "id" ? "EN" : "ID"}
            </button>
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
      <AnimatePresence>
        {writerModalOpen && <WriterModal onClose={() => setWriterModalOpen(false)} onLoginClick={() => setLoginModalOpen(true)} />}
        {loginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}
        {showTopupModal && <TopupModal onClose={() => setShowTopupModal(false)} />}
      </AnimatePresence>

      {/* Mobile notification bottom sheet */}
      <AnimatePresence>
        {notifOpen && (
          <div
            className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60"
            onClick={() => setNotifOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="bg-background border-t border-border rounded-t-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Notifikasi</p>
                <div className="flex items-center gap-3">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <BellOff size={24} strokeWidth={1.5} />
                    <p className="text-xs">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-border/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      {notifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        {n.createdAt && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
              <div className="h-safe-area-inset-bottom pb-4" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
