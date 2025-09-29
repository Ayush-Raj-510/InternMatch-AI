import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { from: "user" | "bot"; text: string };

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { sanitizeInputText, detectPromptInjection } from '@/lib/sanitize';
import FAQ from '@/components/app/FAQ';

export function AIChat() {
  const [open, setOpen] = useState(true);
  const [lang, setLang] = useState<'en'|'hi'|'mr'|'bn'|'ta'|'te'|'kn'|'gu'|'ur'|'pa'|'or'>(() => {
    try { const v = localStorage.getItem('internmatch_lang'); return (v && ['hi','mr','bn','ta','te','kn','gu','ur','pa','or'].includes(v)) ? (v as any) : 'en'; } catch { return 'en'; }
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);

  // speech hook
  const { status: speechStatus, start: speechStart, stop: speechStop, error: speechError } = useSpeechRecognition((transcript) => {
    setText(transcript);
  });

  useEffect(() => {
    const el = messagesRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages]);

  useEffect(() => {
    const handler = (e: any) => { try { const l = e?.detail?.lang; if (l) setLang(l); } catch {} };
    window.addEventListener('lang.change', handler as EventListener);
    return () => window.removeEventListener('lang.change', handler as EventListener);
  }, []);

  async function send() {
    const raw = String(text || '').trim();
    const cleaned = sanitizeInputText(raw);
    if (!cleaned) return;
    if (detectPromptInjection(cleaned)) {
      setMessages(m => [...m, { from: 'bot', text: 'Message blocked: prompt injection patterns detected.' }]);
      setText('');
      return;
    }

    const userMsg: Msg = { from: 'user', text: cleaned };
    setMessages(m => [...m, userMsg]);
    setText('');
    setLoading(true);

    try {
      // Local command handlers
      const bookmarkRegex = /\b(open|show|where|find)\b.*\b(bookmarks?|bookmark)\b/i;
      const recommendationsRegex = /\b(open|show|where|find)\b.*\b(recommendations?|results|engine)\b/i;
      const applyRegex = /(how to apply|where to apply|how do i apply|how can i apply|apply now|how to submit)/i;
      const ruralRegex = /\b(rural|village|rural student|village student|aspirational district|remote area|limited internet|limited connectivity|हिंदी|हिन्दी)\b/i;
      const shareRegex = /\b(share|save|download|export|copy)\b.*\b(conversation|chat|transcript|messages)\b/i;
      const summaryRegex = /\b(summary|summarize|short summary|condense)\b/i;

      if (bookmarkRegex.test(cleaned)) {
        try { window.dispatchEvent(new Event('im.open.bookmarks')); } catch {}
        const resultsEl = document.getElementById('results'); if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMessages(m => [...m, { from: 'bot', text: 'Opened bookmarks panel — check the top-right or the Bookmarks modal.' }]);
        setLoading(false); return;
      }

      if (recommendationsRegex.test(cleaned)) {
        const el = document.getElementById('engine') || document.getElementById('results'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setMessages(m => [...m, { from: 'bot', text: 'Scrolled to the Recommendation Engine / Results section — you can generate recommendations or review results below.' }]);
        setLoading(false); return;
      }

      if (applyRegex.test(cleaned)) {
        const anchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
        const applyAnchors = anchors.filter(a => /apply|learn more|apply now/i.test(a.textContent || a.getAttribute('title') || ''));
        if (applyAnchors.length) {
          applyAnchors.forEach((a, idx) => { const el = a as HTMLElement; el.classList.add('ring-4','ring-primary'); a.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.classList.remove('ring-4','ring-primary'), 4000 + idx*150); });
          setMessages(m => [...m, { from: 'bot', text: `I've highlighted ${applyAnchors.length} Apply links in the Recommendations list. Click any "Apply" button to open the job posting.` }]);
        } else {
          setMessages(m => [...m, { from: 'bot', text: 'No Apply links found — generate recommendations first or open a result to see the Apply button.' }]);
        }
        setLoading(false); return;
      }

      if (ruralRegex.test(cleaned)) {
        try {
          const mod = await import('@/lib/i18n');
          const guidance = mod.t('rural.guidance', lang as any);
          setMessages(m => [...m, { from: 'bot', text: guidance }]);
        } catch (e) {
          setMessages(m => [...m, { from: 'bot', text: 'Guidance for students from rural or aspirational districts: prepare a short resume, seek alternate submission methods if online is difficult, and ask local college/NGO for internet or printing support.' }]);
        }
        setLoading(false); return;
      }

      if (shareRegex.test(cleaned)) {
        setMessages(m => [...m, { from: 'bot', text: 'You can download the chat using the "Save as PDF" button and then attach/share the file. Or select the messages and copy/paste them. If you want, ask me to generate a short shareable summary and I will create one you can copy.' }]);
        setLoading(false); return;
      }

      if (summaryRegex.test(cleaned)) {
        const recent = messages.slice(-12); const parts: string[] = [];
        for (let i=0;i<recent.length;i++){ const mm = recent[i]; const role = mm.from === 'user' ? 'You' : 'AI'; const txt = mm.text.length>120? mm.text.slice(0,117)+'...': mm.text; parts.push(`${role}: ${txt}`); }
        setMessages(m => [...m, { from: 'bot', text: 'Conversation summary:\n'+parts.join('\n') }]);
        setLoading(false); return;
      }

      // default: forward to AI backend (guidance vs chat)
      const careerRegex = /\b(resume|cv|interview|internship|intern|career|job|skill gap|skill-gap|gap)\b/i;
      const endpoint = careerRegex.test(cleaned) ? '/api/guidance' : '/api/ai-chat';

      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: cleaned }) });
        if (!r.ok) {
          const txt = await r.text().catch(()=>'');
          setMessages(m => [...m, { from: 'bot', text: `AI service error (${r.status}): ${txt || 'unknown'}` }]);
        } else {
          const data = await r.json().catch(()=>({ reply: undefined }));
          setMessages(m => [...m, { from: 'bot', text: data?.reply || 'Sorry, no response.' }]);
        }
      } catch (err) {
        setMessages(m => [...m, { from: 'bot', text: `Network error contacting AI service: ${String(err?.message||err)}` }]);
      }

    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setLoading(true);
    setMessages(m => [...m, { from: 'user', text: `Uploaded file: ${file.name}` }]);
    try {
      // simplified: only show a preview; detailed extraction left as before
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setMessages(m => [...m, { from: 'bot', text: 'Received PDF — extracting text...' }]);
        // attempt quick extraction using pdf.js if available
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject)=>{
            const s = document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'; s.onload=()=>resolve(); s.onerror=()=>reject(); document.head.appendChild(s);
          });
        }
        try {
          const pdfjs = (window as any).pdfjsLib;
          pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let fullText='';
          for (let i=1;i<=pdf.numPages;i++){ const page = await pdf.getPage(i); const content = await page.getTextContent(); fullText += '\n'+content.items.map((it:any)=>it.str).join(' '); }
          setMessages(m => [...m, { from: 'bot', text: `Extracted text preview: ${fullText.slice(0,400)}${fullText.length>400?'...':''}` }]);
        } catch (e) {
          setMessages(m => [...m, { from: 'bot', text: 'Unable to extract text from PDF.' }]);
        }
      } else {
        setMessages(m => [...m, { from: 'bot', text: 'Unsupported file type for extraction here. Use PDF or image formats.' }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(m => [...m, { from: 'bot', text: 'Failed to process uploaded file.' }]);
    } finally { setLoading(false); }
  }

  async function saveAsPDF() {
    if (!messages.length) return;
    if (!(window as any).jspdf) {
      await new Promise<void>((resolve, reject)=>{ const s = document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload=()=>resolve(); s.onerror=()=>reject(); document.head.appendChild(s); });
    }
    try {
      const win = window as any; const jsPDFModule = win.jspdf || win.jspPDF || win.jsPDF; const jsPDF = jsPDFModule?.jsPDF || jsPDFModule || win.jsPDF;
      if (!jsPDF) throw new Error('jsPDF not available');
      const doc = new jsPDF(); doc.setFontSize(12); let y=20; const margin=10; const maxWidth=190;
      for (let i=0;i<messages.length;i++){ const m=messages[i]; const prefix = m.from==='user'?'You: ':'AI: '; const lines = (doc as any).splitTextToSize(prefix+m.text, maxWidth); for (const line of lines) { if (y>280) { doc.addPage(); y=20; } doc.text(String(line), margin, y); y+=7; } y+=4; }
      doc.save('conversation.pdf');
    } catch (e) { console.error(e); setMessages(m => [...m, { from: 'bot', text: 'Failed to generate PDF.' }]); }
  }

  return (
    <section className="container pb-24">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Chat</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(s => !s)}>{open ? 'Hide' : 'Open'}</Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-lg border bg-white p-4">
          <div ref={messagesRef} className="max-h-80 space-y-3 overflow-auto">
            {messages.map((m,i) => (
              <div key={i} className={`flex ${m.from==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[80%] rounded-md px-3 py-2 ${m.from==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') send(); }} placeholder="Ask the AI about internships, resumes, or careers" data-i18n-placeholder="ai.placeholder" />
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e)=>handleFile(e.target.files?.[0]||undefined)} />
            <Button onClick={()=>fileRef.current?.click()} disabled={loading} variant="outline">Upload PDF/Image</Button>
            <Button onClick={send} disabled={loading}>{loading ? '...' : 'Ask'}</Button>

            <Button onClick={() => { if (speechStatus==='recording') speechStop(); else speechStart(); }} variant={speechStatus==='recording'?undefined:'outline'}>{speechStatus==='recording'?'Stop':'Speak'}</Button>

            <Button onClick={() => { setText('rural'); setTimeout(()=>send(),0); }} variant="outline">{lang==='hi' ? 'ग्रामीण सहायता' : 'Rural help'}</Button>

            <Button onClick={() => setShowFAQ(s=>!s)} variant="outline">{lang==='en' ? 'FAQ' : 'सामान्य प्रश्न'}</Button>

            <Button onClick={saveAsPDF} variant="outline" disabled={messages.length===0} data-i18n="button.save_pdf">Save as PDF</Button>
          </div>

          {showFAQ && <FAQ lang={lang} />}
          {speechError && <div className="mt-2 text-sm text-red-600">Microphone: {speechError}</div>}
        </div>
      )}
    </section>
  );
}
