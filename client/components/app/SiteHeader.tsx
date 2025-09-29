import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { SignInModal } from "@/components/auth/SignInModal";
import { useAuth } from "@/lib/auth";
import { BookmarksPanel } from "@/components/app/BookmarksPanel";

export function SiteHeader({ useClerk = false }: { useClerk?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const auth = useAuth();
  const [ClerkModule, setClerkModule] = useState<any>(null);

  // listen for global commands to open bookmarks
  useEffect(() => {
    function onOpen() {
      setShowBookmarks(true);
    }
    window.addEventListener('im.open.bookmarks', onOpen as EventListener);
    return () => window.removeEventListener('im.open.bookmarks', onOpen as EventListener);
  }, []);

  useEffect(() => {
    let canceled = false;
    if (!useClerk) return;
    import('@clerk/clerk-react').then((m) => {
      if (!canceled) setClerkModule(m);
    }).catch((err) => {
      console.warn('Failed to load Clerk for SiteHeader', err);
      setClerkModule(null);
    });
    return () => { canceled = true };
  }, [useClerk]);

  // run initial translation based on stored language
  useEffect(() => {
    try {
      import('@/lib/i18n').then((mod) => {
        const v = mod.getStoredLang ? mod.getStoredLang() : (localStorage.getItem('internmatch_lang') || 'en');
        mod.translateDOM(v as any);
      });
    } catch (e) {}
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight" data-i18n="site.title">InternMatch AI</span>
          </a>
          <nav className="flex items-center gap-2">
            {/* language selector at top */}
            <div className="flex items-center gap-2">
              <label className="sr-only">Language</label>
              <select
                defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('internmatch_lang') || 'en') : 'en'}
                onChange={(e) => {
                  const val = e.target.value as any;
                  try {
                    import('@/lib/i18n').then((mod) => {
                      mod.translateDOM(val);
                    });
                  } catch (err) {}
                }}
                className="rounded-md border px-2 py-1 text-sm"
                aria-label="Language selector"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="mr">MR</option>
                <option value="bn">BN</option>
                <option value="ta">TA</option>
                <option value="te">TE</option>
                <option value="kn">KN</option>
                <option value="gu">GU</option>
                <option value="ur">UR</option>
                <option value="pa">PA</option>
                <option value="or">OR</option>
              </select>
            </div>
            {useClerk ? (
              <>
                <button title="Bookmarks" onClick={() => setShowBookmarks(true)} className="rounded-md border px-2 py-1" data-i18n="header.bookmarks">Bookmarks</button>
                {ClerkModule ? (
                  <>
                    <ClerkModule.SignedIn>
                      <ClerkModule.UserButton />
                    </ClerkModule.SignedIn>
                    <ClerkModule.SignedOut>
                      <ClerkModule.SignInButton mode="modal">
                        <Button variant="outline" data-i18n="header.signin">Sign in / Register</Button>
                      </ClerkModule.SignInButton>
                    </ClerkModule.SignedOut>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading auth...</div>
                )}
              </>
            ) : (
              auth ? (
                auth.user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{auth.user.name || auth.user.email}</span>
                    <button title="Sign out" onClick={() => auth.signout()} className="rounded-md border px-2 py-1" data-i18n="header.signout">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setOpen(true)} data-i18n="header.signin">Sign in / Register</Button>
                )
              ) : null
            )}
          </nav>
        </div>
      </header>
      {!useClerk && <SignInModal open={open} onClose={() => setOpen(false)} />}
      <BookmarksPanel open={showBookmarks} onClose={() => setShowBookmarks(false)} />
    </>
  );
}
