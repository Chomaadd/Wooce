import { Instagram, Mail } from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-transparent text-muted-foreground py-5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col gap-3 text-sm font-medium">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
            <span>&copy; {new Date().getFullYear()}</span>
            <span className="opacity-30 hidden md:inline">/</span>
            <span className="text-foreground font-semibold">WOOCE</span>
            <span className="opacity-30 hidden md:inline">/</span>
            <span className="italic">{t("footer.rights")}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link href="/terms">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.terms")}</span>
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/privacy">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.privacy")}</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-6">
          <a
            href="https://www.tiktok.com/@wooce_novel"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200"
            aria-label="TikTok"
            data-testid="link-social-tiktok"
          >
            <SiTiktok size={18} />
          </a>
          <a
            href="https://www.facebook.com/wooce.novel"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200"
            aria-label="Facebook"
            data-testid="link-social-facebook"
          >
            <SiFacebook size={18} />
          </a>
          <a
            href="https://instagram.com/wooce.novel"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200"
            aria-label="Instagram"
            data-testid="link-social-instagram"
          >
            <Instagram size={20} strokeWidth={1.5} />
          </a>
          <a
            href="mailto:wooce.novel@gmail.com"
            className="hover:text-foreground transition-colors duration-200"
            aria-label="Email"
            data-testid="link-social-email"
          >
            <Mail size={20} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}

