import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-amber-50 to-transparent">
      <div className="container py-16 md:py-24">
        <div className="mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <Badge variant="secondary" className="rounded-full bg-white" data-i18n="hero.badge">Web-only PM Internship Scheme</Badge>
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
          <span data-i18n="hero.h1.line1">AI-Based Internship</span>
          <br />
          <span data-i18n="hero.h1.line2">Recommendation Engine</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground" data-i18n="hero.p">
          Hybrid voice + text input, smart location, confidence scoring, and bookmarking — designed for students finding the right internship track.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#engine">
            <Button size="lg" className="px-6" data-i18n="hero.cta">
              Get recommendations →
            </Button>
          </a>
          <span className="text-sm text-muted-foreground" data-i18n="hero.nosignup">No signup required</span>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Feature labelKey="feature.skills.label" valueKey="feature.skills.value" onClick={() => window.dispatchEvent(new Event('im.open.skills'))} />
          <Feature labelKey="feature.voice.label" valueKey="feature.voice.value" onClick={() => window.dispatchEvent(new Event('im.voice.toggle'))} />
          <Feature labelKey="feature.location.label" valueKey="feature.location.value" onClick={() => window.dispatchEvent(new Event('im.detect.location'))} />
          <Feature labelKey="feature.bookmarks.label" valueKey="feature.bookmarks.value" onClick={() => window.dispatchEvent(new Event('im.open.bookmarks'))} />
        </div>
      </div>
    </section>
  );
}

function Feature({ labelKey, valueKey, onClick }: { labelKey: string; valueKey: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} type="button" className="rounded-xl border bg-white px-4 py-3 shadow-sm text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground" data-i18n={labelKey}>{labelKey}</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900" data-i18n={valueKey}>{valueKey}</span>
      </div>
    </button>
  );
}
