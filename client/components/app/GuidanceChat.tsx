import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function GuidanceChat() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);

  async function answer() {
    if (!q.trim()) return;
    try {
      const res = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setA(data.reply || 'No guidance available.');
    } catch (e) {
      setA('Error contacting guidance service.');
    }
  }

  return (
    <section className="container pb-24">
      <Card>
        <CardHeader>
          <CardTitle data-i18n="guidance.title">Career Guidance Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="e.g., How to improve my resume for a React internship?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-i18n-placeholder="guidance.placeholder"
            />
            <Button onClick={answer} data-i18n="button.ask">Ask</Button>
          </div>
          {a && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{a}</p>}
        </CardContent>
      </Card>
    </section>
  );
}
