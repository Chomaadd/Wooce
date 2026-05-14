import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { SearchProvider } from "@/lib/search-context";
import { AuthProvider } from "@/hooks/use-auth";

import Novel from "./pages/public/Novel";
import AllNovels from "./pages/public/AllNovels";
import NovelDetail from "./pages/public/NovelDetail";
import NovelRead from "./pages/public/NovelRead";
import Bookmarks from "./pages/public/Bookmarks";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";
import AuthorProfile from "./pages/public/AuthorProfile";
import BecomeWriter from "./pages/public/BecomeWriter";
import Login from "./pages/admin/Login";
import ManageNovel from "./pages/admin/ManageNovel";
import NotFound from "@/pages/public/Not-Found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Novel} />
      <Route path="/novels" component={AllNovels} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/penulis/:slug" component={AuthorProfile} />
      <Route path="/daftar-penulis" component={BecomeWriter} />
      <Route path="/login" component={Login} />
      <Route path="/admin/novel" component={ManageNovel} />
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
                <Toaster />
                <Router />
              </TooltipProvider>
            </SearchProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
