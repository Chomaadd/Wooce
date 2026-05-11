import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { SeoHead } from "@/components/seometa/SeoHead";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground overflow-hidden relative">
      <SeoHead title="Page Not Found" description="This page doesn't exist on Choiril Ahmad's website." />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center px-6"
      >
        <div className="mb-8 flex justify-center">
          <div className="p-5 rounded-2xl bg-primary/10 soft-shadow-lg">
            <Compass className="h-16 w-16 text-primary animate-spin-slow" />
          </div>
        </div>

        <h1 className="font-serif text-8xl md:text-9xl font-bold tracking-tighter mb-2 gradient-text" data-testid="text-404">404</h1>
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">{t("notfound.heading")}</h2>

        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
          {t("notfound.description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full h-12 px-8 shadow-lg shadow-primary/25">
              <Home className="w-4 h-4" /> {t("notfound.home")}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 rounded-full h-12 px-8"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" /> {t("notfound.back")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
