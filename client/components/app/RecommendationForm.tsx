import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Upload, MapPin } from "lucide-react";
import { ChipInput } from "./ChipInput";
import { recommend, Recommendation } from "@/lib/recommend";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export function RecommendationForm({
  onResults,
}: {
  onResults: (recs: Recommendation[]) => void;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [location, setLocation] = useState("");
  const [resumeText, setResumeText] = useState("");

  const { status, start, stop, error } = useSpeechRecognition((t) => {
    // Append interim/final transcripts so the user sees the recording progressively
    setResumeText((prev) => {
      const next = (t || "").trim();
      if (!next) return prev;
      if (!prev) return next;
      // Avoid duplicating the entire transcript: replace last line if it's similar
      return next;
    });
  });

  // Geolocation
  async function detectLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept": "application/json" } },
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const country = data.address?.country || "";
          setLocation([city, country].filter(Boolean).join(", "));
        } catch (_e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => alert("Unable to detect location"),
    );
  }

  async function onUploadFile(file: File) {
    if (file.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = () => setResumeText(String(reader.result || ""));
      reader.readAsText(file);
      return;
    }

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
      // Read as ArrayBuffer then use pdf.js from CDN to extract text
      const arrayBuffer = await file.arrayBuffer();
      // load pdfjs if needed
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load pdfjs'));
          document.head.appendChild(s);
        });
      }
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      try {
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          // eslint-disable-next-line no-await-in-loop
          const page = await pdf.getPage(i);
          // eslint-disable-next-line no-await-in-loop
          const content = await page.getTextContent();
          const pageText = content.items.map((it: any) => it.str).join(' ');
          fullText += '\n' + pageText;
        }
        setResumeText(fullText.trim());
      } catch (e) {
        console.error(e);
        alert('Unable to extract text from PDF.');
      }
      return;
    }

    alert('For best results, upload TXT or PDF or paste text below.');
  }

  const canGenerate = useMemo(() => skills.length > 0 || resumeText.trim().length > 10 || interests.trim().length > 0, [skills, resumeText, interests]);

  // handle events triggered by Hero buttons
  useEffect(() => {
    function openSkills() {
      const el = document.getElementById('chip-input') as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const section = document.getElementById('engine');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function toggleVoice() {
      // use status variable from hook
      if ((status as string) === 'recording') stop();
      else start();
    }

    function detectLoc() {
      detectLocation();
    }

    window.addEventListener('im.open.skills', openSkills as EventListener);
    window.addEventListener('im.voice.toggle', toggleVoice as EventListener);
    window.addEventListener('im.detect.location', detectLoc as EventListener);

    return () => {
      window.removeEventListener('im.open.skills', openSkills as EventListener);
      window.removeEventListener('im.voice.toggle', toggleVoice as EventListener);
      window.removeEventListener('im.detect.location', detectLoc as EventListener);
    };
  }, [status, start, stop]);

  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      // sanitize inputs before sending
      const { sanitizeInputText } = await import('@/lib/sanitize');
      const safeSkills = skills.map((s) => sanitizeInputText(s));
      const safeInterests = sanitizeInputText(interests);
      const safeLocation = sanitizeInputText(location);
      const safeResume = sanitizeInputText(resumeText);

      // persist last input so other components (skill gap analyzer) can access
      try {
        localStorage.setItem('im.lastInput', JSON.stringify({ skills: safeSkills, interests: safeInterests, location: safeLocation, resumeText: safeResume }));
      } catch {}
      const recs = await recommend({ skills: safeSkills, interests: safeInterests, location: safeLocation, resumeText: safeResume });
      onResults(recs as Recommendation[]);
      window.scrollTo({ top: document.getElementById('results')?.offsetTop || 0, behavior: 'smooth' });
    } catch (e) {
      console.error('generate error', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="engine" className="container pb-14">
      <Card>
        <CardHeader>
          <CardTitle data-i18n="engine.title">Internship Recommendation Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block" data-i18n="label.your_skills">Your skills</Label>
                  <ChipInput
                    value={skills}
                    onChange={setSkills}
                    placeholder={typeof window !== 'undefined' ? (localStorage.getItem('internmatch_lang') ? undefined : undefined) : undefined}
                    inputId="chip-input"
                    data-i18n-placeholder="chip.placeholder"
                  />

                  {/* Listen for open/voice/location commands from hero or other UI */}
                </div>
                <div>
                  <Label className="mb-2 block" data-i18n="label.interests">Interests</Label>
                  <Input
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. product management, data, research"
                    data-i18n-placeholder="label.interests"
                  />
                </div>
                <div>
                  <Label className="mb-2 block" data-i18n="label.location">Location</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country or coordinates"
                      data-i18n-placeholder="label.location"
                    />
                    <Button type="button" variant="secondary" onClick={detectLocation} title="Detect location">
                      <MapPin className="h-4 w-4" />
                      <span className="sr-only" data-i18n="button.detect_location">Detect location</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Button size="lg" disabled={!canGenerate || loading} onClick={generate} className="px-6" data-i18n="button.generate">
                    Get recommendations
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground" data-i18n="confidence.note">Confidence score based on provided skills and resume keywords — recommendations also consider representation and internship capacity on the backend.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Analyze your resume</Label>
                  <span className="text-sm text-muted-foreground">Voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent/30">
                    <Upload className="h-4 w-4" /> <span data-i18n="button.upload_resume">Upload Resume</span>
                    <input
                      type="file"
                      accept=".txt,.md,.text,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => e.target.files && onUploadFile(e.target.files[0])}
                    />
                  </label>
                  <Button
                    type="button"
                    variant={status === "recording" ? "destructive" : "secondary"}
                    onClick={status === "recording" ? stop : start}
                    title={status === "recording" ? "Stop recording" : "Start voice input"}
                  >
                    <Mic className="h-4 w-4" /> <span data-i18n={status === 'recording' ? 'button.stop' : 'button.speak'}>{status === "recording" ? 'Stop' : 'Speak'}</span>
                  </Button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <Textarea
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text or speak..."
                  data-i18n-placeholder="textarea.resume.placeholder"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
