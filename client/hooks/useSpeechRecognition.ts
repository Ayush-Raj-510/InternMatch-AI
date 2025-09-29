import { useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "recording" | "unsupported" | "error";

export function useSpeechRecognition(onResult?: (text: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setStatus("unsupported");
      setError("SpeechRecognition API is not available in this browser.");
      return;
    }

    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setError(null);
      setStatus("recording");
    };
    rec.onend = () => setStatus("idle");

    rec.onresult = (e: any) => {
      // Combine interim/final results into a single transcript string
      try {
        const transcripts: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          transcripts.push(e.results[i][0].transcript);
        }
        const transcript = transcripts.join(" ");
        onResult?.(transcript);
      } catch (err) {
        console.error("speech onresult error", err);
        setError(String(err ?? "onresult error"));
      }
    };

    rec.onerror = (e: any) => {
      // SpeechRecognitionErrorEvent typically contains `error` (string) and optionally `message`.
      const code = (e && (e.error || e.message || e.type)) || String(e);
      const normalized = String(code).toLowerCase();
      console.error("speech recognition error", normalized, e);

      // Provide user-friendly messages and reasonable state transitions
      switch (normalized) {
        case 'no-speech':
          setError('No speech detected. Try speaking clearly into your microphone.');
          setStatus('idle');
          try { rec.stop(); } catch {};
          break;
        case 'aborted':
          setError('Recording was aborted. You can try again.');
          setStatus('idle');
          try { rec.stop(); } catch {};
          break;
        case 'network':
          setError('Network error while recognizing speech. Check your connection and try again.');
          setStatus('error');
          break;
        case 'not-allowed':
        case 'permission-denied':
          setError('Microphone access denied. Allow microphone permissions and reload the page.');
          setStatus('error');
          break;
        default:
          setError(String(code));
          setStatus('error');
          break;
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      recognitionRef.current = null;
    };
  }, [onResult]);

  const start = async () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not initialized or not supported.");
      return;
    }
    try {
      // Some browsers require a user gesture; starting may throw
      recognitionRef.current.start();
      setStatus("recording");
      setError(null);
    } catch (err) {
      console.error("speech start error", err);
      const msg = (err && (err.message || err.toString())) || 'Failed to start speech recognition.';
      setError(String(msg));
      setStatus("error");
    }
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("speech stop error", err);
      setError(String(err ?? 'stop error'));
    }
    setStatus("idle");
  };

  return { status, start, stop, error };
}
