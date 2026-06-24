import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Mail, MessageSquare, Send, Instagram, HelpCircle, ArrowRight } from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";

export default function Contact() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({
        title: language === "id" ? "Semua field wajib diisi" : "All fields are required",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({
        title: t("contact.toast.success.title"),
        description: t("contact.toast.success.desc"),
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({
        title: t("contact.toast.error.title"),
        description: t("contact.toast.error.desc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title={language === "id" ? "Kontak — WOOCE Novel" : "Contact — WOOCE Novel"}
        description={language === "id" ? "Hubungi tim WOOCE Novel. Kirim pesan, saran, atau pertanyaan langsung ke kami." : "Contact the WOOCE Novel team. Send us a message, suggestion, or question."}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
                <MessageSquare size={11} />
                {t("contact.badge")}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-3">
                {language === "id" ? "Hubungi Kami" : "Contact Us"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                {language === "id"
                  ? "Ada pertanyaan, saran, atau ingin bekerja sama? Kirim pesan dan kami akan segera merespons."
                  : "Have a question, suggestion, or want to collaborate? Send us a message and we'll get back to you soon."}
              </p>
            </div>

            {/* FAQ Banner */}
            <Link href="/faq">
              <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {language === "id" ? "Cek FAQ dulu, mungkin pertanyaanmu sudah terjawab" : "Check our FAQ first — your question might already be answered"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === "id" ? "Lihat 40+ pertanyaan umum seputar akun, pembayaran, dan fitur" : "Browse 40+ common questions about account, payment, and features"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <div className="grid sm:grid-cols-5 gap-6">
              <div className="sm:col-span-2 flex flex-col gap-4">
                <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-col gap-4">
                  <a
                    href="mailto:support@woocenovel.my.id"
                    className="flex items-start gap-3 group"
                    data-testid="link-contact-email"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{t("contact.email")}</p>
                      <p className="text-sm text-foreground font-semibold">support@woocenovel.my.id</p>
                    </div>
                  </a>

                  <div className="border-t border-border/40 pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-3">
                      {language === "id" ? "Ikuti Kami" : "Follow Us"}
                    </p>
                    <div className="flex gap-2">
                      {[
                        { href: "https://www.tiktok.com/@wooce_novel", icon: <SiTiktok size={14} />, label: "TikTok" },
                        { href: "https://www.facebook.com/wooce.novel", icon: <SiFacebook size={14} />, label: "Facebook" },
                        { href: "https://instagram.com/wooce.novel", icon: <Instagram size={14} strokeWidth={1.75} />, label: "Instagram" },
                      ].map(({ href, icon, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                          {icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground text-xs mb-1.5">
                    {language === "id" ? "Waktu Respon" : "Response Time"}
                  </p>
                  <p className="text-xs">
                    {language === "id"
                      ? "Biasanya kami membalas dalam 1–2 hari kerja."
                      : "We usually reply within 1–2 business days."}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-3">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col gap-4"
                  data-testid="form-contact"
                >
                  <p className="font-semibold text-foreground text-sm">{t("contact.form.title")}</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{t("contact.form.name")}</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t("contact.form.name.placeholder")}
                        data-testid="input-contact-name"
                        className="w-full bg-background border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{t("contact.form.email")}</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t("contact.form.email.placeholder")}
                        data-testid="input-contact-email"
                        className="w-full bg-background border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      />
                      {user && (user as any).email && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground/70">{language === "id" ? "Pakai:" : "Use:"}</span>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, email: (user as any).email }))}
                            data-testid="button-use-my-email"
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                          >
                            <Mail size={9} />
                            {(user as any).email}
                          </button>
                          {form.email === (user as any).email && (
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, email: "" }))}
                              data-testid="button-use-custom-email"
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80 transition-colors"
                            >
                              {language === "id" ? "Email lain" : "Other email"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("contact.form.subject")}</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder={t("contact.form.subject.placeholder")}
                      data-testid="input-contact-subject"
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("contact.form.message")}</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder={t("contact.form.message.placeholder")}
                      rows={5}
                      data-testid="textarea-contact-message"
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="button-contact-submit"
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold text-sm py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        {language === "id" ? "Mengirim..." : "Sending..."}
                      </span>
                    ) : (
                      <>
                        <Send size={14} />
                        {t("contact.form.submit")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}
