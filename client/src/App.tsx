import { Switch, Route, Redirect } from "wouter";
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
import NotFound from "@/pages/public/Not-Found";

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
