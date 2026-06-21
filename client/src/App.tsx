import { Switch, Route, Redirect } from "wouter";
import { Component } from "react";
import type { ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { SearchProvider } from "@/lib/search-context";
import { AuthProvider } from "@/hooks/use-auth";
import { RefreshCw, Home } from "lucide-react";

import Novel from "./pages/public/Novel";
import AllNovels from "./pages/public/AllNovels";
import NovelDetail from "./pages/public/NovelDetail";
import NovelRead from "./pages/public/NovelRead";
import Bookmarks from "./pages/public/Bookmarks";
import FollowedStories from "./pages/public/FollowedStories";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";
import Contact from "./pages/public/Contact";
import AuthorProfile from "./pages/public/AuthorProfile";
import BecomeWriter from "./pages/public/BecomeWriter";
import VerifyAuthor from "./pages/public/VerifyAuthor";
import UserProfile from "./pages/public/UserProfile";
import WriterStories from "./pages/writer/WriterStories";
import WriterProfileSettings from "./pages/writer/WriterProfileSettings";
import Login from "./pages/admin/Login";
import ManageNovel from "./pages/admin/ManageNovel";
import CoinHistory from "./pages/public/CoinHistory";
import LoginBonusPage from "./pages/public/LoginBonusPage";
import PaymentFinish from "./pages/public/PaymentFinish";
import Blog from "./pages/public/blog/Blog";
import BlogDetail from "./pages/public/blog/BlogDetail";
import LinkExpired from "./pages/public/LinkExpired";
import NotFound from "@/pages/public/Not-Found";
import { DailyLoginBonus } from "@/components/daily-login/DailyLoginBonus";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
            <RefreshCw size={28} className="text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Halaman ini mengalami masalah teknis. Coba refresh atau kembali ke beranda.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-all"
            >
              <Home size={14} /> Beranda
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Novel} />
      <Route path="/novels" component={AllNovels} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/mengikuti" component={FollowedStories} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      <Route path="/penulis/:slug" component={AuthorProfile} />
      <Route path="/daftar-penulis" component={BecomeWriter} />
      <Route path="/verify-author" component={VerifyAuthor} />
      <Route path="/profile" component={UserProfile} />
      <Route path="/writer/cerita" component={WriterStories} />
      <Route path="/writer/profil" component={WriterProfileSettings} />
      <Route path="/login" component={Login} />
      <Route path="/admin/novel" component={ManageNovel} />

      <Route path="/admin/credentials"><Redirect to="/admin/novel" /></Route>
      <Route path="/koin/riwayat" component={CoinHistory} />
      <Route path="/login-bonus" component={LoginBonusPage} />
      <Route path="/payment/finish" component={PaymentFinish} />
      <Route path="/artikel/:slug" component={BlogDetail} />
      <Route path="/blog" component={Blog} />
      <Route path="/link-kedaluwarsa" component={LinkExpired} />
      <Route path="/:slug/:seasonSlug/:chapterSlug" component={NovelRead} />
      <Route path="/:slug" component={NovelDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <SearchProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <Toaster />
                  <DailyLoginBonus />
                  <Router />
                </ErrorBoundary>
              </TooltipProvider>
            </SearchProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
