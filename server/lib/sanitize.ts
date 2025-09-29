export function stripScriptTags(s: string) {
  if (!s) return s;
  // Remove script tags and their contents
  return s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

export function encodeAngles(s: string) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeForStorage(s: string) {
  if (!s) return s;
  let out = stripScriptTags(s);
  out = encodeAngles(out);
  // remove NULL chars
  out = out.replace(/\u0000/g, '');
  return out;
}

export function sanitizeForMongo(obj: any) {
  // Recursively remove keys that start with $ or contain dots
  if (Array.isArray(obj)) return obj.map(sanitizeForMongo);
  if (obj && typeof obj === 'object') {
    const copy: any = {};
    for (const k of Object.keys(obj)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      copy[k] = sanitizeForMongo(obj[k]);
    }
    return copy;
  }
  if (typeof obj === 'string') return sanitizeForStorage(obj);
  return obj;
}

export function sanitizePrompt(s: string) {
  if (!s) return s;
  let out = s;
  // Remove obvious prompt-injection attempts
  const injPatterns = [
    /ignore (all )?previous instructions/gi,
    /disregard (the )?previous/gi,
    /forget (the )?previous/gi,
    /do not follow system instructions/gi,
    /bypass (safety|restrictions)/gi,
    /ignore (your|the) (safety|rules)/gi,
  ];
  for (const p of injPatterns) out = out.replace(p, '[redacted]');
  // strip script tags, encode angles
  out = sanitizeForStorage(out);
  return out;
}
