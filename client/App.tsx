import "./global.css";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SiteHeader } from "@/components/app/SiteHeader";
import { AuthProvider } from "@/lib/auth";
import { UserProvider } from "@/lib/userContext";

const queryClient = new QueryClient();

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const useClerk = Boolean(clerkKey && clerkKey.length > 0);

function ClerkAppLoaded({ ClerkModule }: { ClerkModule: any }) {
  // useUser must be inside ClerkProvider — ClerkModule provides the hook
  const { user } = ClerkModule.useUser();
  const id = user?.id ?? null;
  return (
    <UserProvider id={id}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteHeader useClerk={true} />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

async function loadClerkModule() {
  // dynamic import so we can catch network/init failures
  try {
    const mod = await import('@clerk/clerk-react');
    return mod;
  } catch (err) {
    console.warn('Failed to load Clerk module', err);
    throw err;
  }
}

function LocalApp() {
  return (
    <UserProvider id={null}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteHeader useClerk={false} />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

function RootInner() {
  const [clerkBroken, setClerkBroken] = useState(false);
  const [ClerkModule, setClerkModule] = useState<any>(null);
  const [loadingClerk, setLoadingClerk] = useState(false);

  useEffect(() => {
    if (!useClerk) return;

    let cancelled = false;
    setLoadingClerk(true);
    loadClerkModule()
      .then((mod) => {
        if (cancelled) return;
        setClerkModule(mod);
      })
      .catch((err) => {
        console.warn('Failed to initialize Clerk, falling back to local auth', err);
        setClerkBroken(true);
      })
      .finally(() => setLoadingClerk(false));

    const onUnhandled = (e: PromiseRejectionEvent) => {
      try {
        const reason = (e && (e.reason || '') ) as any;
        const msg = String(reason && (reason.message || reason)).toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('clerk')) {
          console.warn('Detected Clerk network error, falling back to local auth:', reason);
          setClerkBroken(true);
          e.preventDefault?.();
        }
      } catch (err) {
        console.warn('unhandledrejection handler error', err);
      }
    };

    const onError = (ev: ErrorEvent) => {
      try {
        const msg = String(ev && (ev.message || '')).toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('clerk')) {
          console.warn('Detected Clerk error via window.onerror, falling back to local auth:', ev.message);
          setClerkBroken(true);
        }
      } catch (err) {
        console.warn('window.onerror handler error', err);
      }
    };

    window.addEventListener('unhandledrejection', onUnhandled as any);
    window.addEventListener('error', onError as any);

    return () => {
      cancelled = true;
      window.removeEventListener('unhandledrejection', onUnhandled as any);
      window.removeEventListener('error', onError as any);
    };
  }, []);

  if (useClerk && !clerkBroken && ClerkModule) {
    const CMP = ClerkModule;
    return (
      <CMP.ClerkProvider publishableKey={clerkKey}>
        <ClerkAppLoaded ClerkModule={CMP} />
      </CMP.ClerkProvider>
    );
  }

  if (useClerk && (clerkBroken || !ClerkModule)) {
    return (
      <AuthProvider>
        <LocalApp />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <LocalApp />
    </AuthProvider>
  );
}

const Root = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RootInner />
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<Root />);
