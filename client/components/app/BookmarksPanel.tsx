import { useEffect, useState } from 'react';
import { useCurrentUserId } from '@/lib/userContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INTERNSHIPS } from '@/lib/recommend';

export function BookmarksPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const userId = useCurrentUserId();
  const storageKey = userId ? `im.bookmarks.${userId}` : 'im.bookmarks';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setBookmarks(raw ? JSON.parse(raw) : []);
    } catch {
      setBookmarks([]);
    }

    function onUpdate(e: any) {
      try {
        // prefer updates for current user
        const detailUser = e?.detail?.userId ?? null;
        if (detailUser && detailUser !== userId) return; // ignore other users
        const b = e?.detail?.bookmarks ?? JSON.parse(localStorage.getItem(storageKey) || '[]');
        setBookmarks(b);
      } catch {
        setBookmarks([]);
      }
    }

    window.addEventListener('im.bookmarks.updated', onUpdate as EventListener);
    window.addEventListener('storage', onUpdate as EventListener);
    return () => {
      window.removeEventListener('im.bookmarks.updated', onUpdate as EventListener);
      window.removeEventListener('storage', onUpdate as EventListener);
    };
  }, [storageKey, userId]);

  function remove(id: string) {
    const next = bookmarks.filter((b) => b !== id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('im.bookmarks.updated', { detail: { bookmarks: next, userId } }));
    } catch {}
    setBookmarks(next);
  }

  const items = INTERNSHIPS.filter((i) => bookmarks.includes(i.id));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle data-i18n="bookmarks.title">Your Bookmarks</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} data-i18n="button.close">Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-i18n="bookmarks.empty">You have no bookmarked internships yet.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-semibold">{it.title}</div>
                      <div className="text-sm text-muted-foreground">{it.company} • {it.location}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="text-sm rounded-md bg-primary px-3 py-1 text-primary-foreground" href={it.url} target="_blank" rel="noreferrer" data-i18n="button.apply">Apply</a>
                      <Button variant="outline" onClick={() => remove(it.id)} data-i18n="button.remove">Remove</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
