import { useEffect, useState } from "react";
import { useCurrentUserId } from "@/lib/userContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { tokenize, type Recommendation } from "@/lib/recommend";

export function RecommendationsList({ results }: { results: Recommendation[] }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [lastInput, setLastInput] = useState<{ skills: string[]; resumeText: string } | null>(null);

  const userId = useCurrentUserId();

  const storageKey = userId ? `im.bookmarks.${userId}` : 'im.bookmarks';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {
      setBookmarks([]);
    }
    try {
      const li = localStorage.getItem('im.lastInput');
      if (li) {
        const parsed = JSON.parse(li);
        setLastInput({ skills: parsed.skills || [], resumeText: parsed.resumeText || '' });
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
      // notify other components in the same window (include userId for listeners)
      try {
        window.dispatchEvent(new CustomEvent('im.bookmarks.updated', { detail: { bookmarks, userId } }));
      } catch {}
    } catch {}
  }, [bookmarks, storageKey, userId]);

  // hydrate resources when component mounts and when results change
  useEffect(() => {
    import('@/lib/resources').then(({ getResourcesForSkills }) => {
      results.forEach((r) => {
        const el = document.getElementById(`resources-${r.id}`);
        if (!el) return;
        const lastInputRaw = localStorage.getItem('im.lastInput');
        let userSkills: string[] = [];
        try {
          if (lastInputRaw) {
            const parsed = JSON.parse(lastInputRaw);
            userSkills = parsed.skills || [];
          }
        } catch {}
        const jobTokens = Array.from(new Set(r.keywords.flatMap((k) => tokenize(k))));
        const missing = jobTokens.filter((t) => !new Set(userSkills.map(s=>s.toLowerCase())).has(t));
        const resources = getResourcesForSkills(missing.slice(0,6));
        if (resources.length === 0) {
          el.innerHTML = '<div class="text-sm text-muted-foreground">No resources available for these skills.</div>';
        } else {
          el.innerHTML = resources.map(res => `
            <div class=\"rounded-md border p-2 bg-white\">
              <a class=\"font-medium text-sm\" href=\"${res.url}\" target=\"_blank\">${res.title}</a>
              <div class=\"text-xs text-muted-foreground\">${res.provider || ''} • ${res.skill}</div>
            </div>
          `).join('');
        }
        el.style.display = 'none';
      });
    });
  }, [results]);

  function toggleBookmark(id: string) {
    setBookmarks((b) => {
      const next = b.includes(id) ? b.filter((x) => x !== id) : [...b, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('im.bookmarks.updated', { detail: { bookmarks: next, userId } }));
      } catch {}
      return next;
    });
  }

  if (!results.length) {
    return (
      <section id="results" className="container">
        <Card>
          <CardHeader>
            <CardTitle data-i18n="recommendations.title">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground" data-i18n="recommendations.empty">No recommendations yet. Upload your resume or search to begin.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // prepare user tokens for gap analysis
  const resumeTokens = new Set<string>();
  if (lastInput) {
    const { skills, resumeText } = lastInput;
    skills.forEach((s) => tokenize(s).forEach((t) => resumeTokens.add(t)));
    tokenize(resumeText || '').forEach((t) => resumeTokens.add(t));
  }

  return (
    <section id="results" className="container">
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-2">
            {results.map((r) => {
              const saved = bookmarks.includes(r.id);
              const jobTokens = Array.from(new Set(r.keywords.flatMap((k) => tokenize(k))));
              const missing = jobTokens.filter((t) => !resumeTokens.has(t));
              return (
                <li key={r.id} data-bookmarked={saved ? 'true' : 'false'} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{r.title}</h3>
                      <p className="text-sm text-muted-foreground">{r.company} • {r.location}</p>
                    </div>
                    <button
                      aria-pressed={saved}
                      onClick={() => toggleBookmark(r.id)}
                      className={`rounded-md p-1 ${saved ? 'text-yellow-600' : 'text-muted-foreground'}`}
                      title={saved ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <Star className={`h-5 w-5 ${saved ? 'text-yellow-500' : ''}`} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Confidence {r.score}%</span>
                    {r.reasons.map((rs, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{rs}</span>
                    ))}
                  </div>

                  {missing.length > 0 && (
                    <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm">
                      <strong data-i18n="skillgaps.title">Skill gaps:</strong> {missing.slice(0,6).join(', ')}{missing.length>6?` and ${missing.length-6} more`:''}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            // toggle resource display by storing a data attribute on the element (simple stateful approach)
                            const el = document.getElementById(`resources-${r.id}`);
                            if (!el) return;
                            el.style.display = el.style.display === 'none' ? 'block' : 'none';
                          }}
                          className="text-sm rounded-md bg-primary px-3 py-1 text-primary-foreground"
                          data-i18n="button.recommend_resources"
                        >
                          Recommend resources
                        </button>
                        <span className="text-xs text-muted-foreground" data-i18n="resources.empty">Curated learning links for missing skills</span>
                      </div>
                      <div id={`resources-${r.id}`} style={{display: 'none'}} className="mt-3 space-y-2">
                        {/* resources will be hydrated by client mapping */}
                        {/** Placeholder while client populates via script */}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button asChild>
                      <a href={r.url} target="_blank" rel="noreferrer" data-i18n="button.apply">Apply / Learn more</a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
