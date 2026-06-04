import { Instagram, Mail } from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";

const SOCIAL_LINKS = [
  {
    href: "https://www.tiktok.com/@woocenovel",
    icon: <SiTiktok size={15} />,
    label: "TikTok",
    testId: "link-social-tiktok",
    external: true,
  },
  {
    href: "https://www.facebook.com/woocenovel",
    icon: <SiFacebook size={15} />,
    label: "Facebook",
    testId: "link-social-facebook",
    external: true,
  },
  {
    href: "https://instagram.com/woocenovel",
    icon: <Instagram size={15} strokeWidth={1.75} />,
    label: "Instagram",
    testId: "link-social-instagram",
    external: true,
  },
  {
    href: "mailto:support.woocenovel@gmail.com",
    icon: <Mail size={15} strokeWidth={1.75} />,
    label: "Email",
    testId: "link-social-email",
    external: false,
  },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/30 bg-transparent text-muted-foreground py-5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="font-bold text-foreground tracking-wide">
              WOOCE
            </span>
            <span className="hidden sm:block text-border/60">|</span>
            <span className="text-xs text-muted-foreground/70 italic">
              {new Date().getFullYear()} {t("footer.rights")}
            </span>
            <span className="hidden sm:block text-border/60">·</span>
            <div className="flex items-center gap-3 text-xs">
              <Link href="/terms">
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  {t("footer.terms")}
                </span>
              </Link>
              <span className="opacity-30">·</span>
              <Link href="/privacy">
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  {t("footer.privacy")}
                </span>
              </Link>
              <span className="opacity-30">·</span>
              <Link href="/contact">
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  {t("nav.contact")}
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {SOCIAL_LINKS.map(({ href, icon, label, testId, external }) => (
              <a
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={label}
                data-testid={testId}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
