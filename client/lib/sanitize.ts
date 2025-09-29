export function sanitizeInputText(s: string) {
  if (!s) return s;
  // remove script tags
  let out = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  // encode angle brackets to avoid XSS when injecting into DOM
  out = out.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // remove null chars
  out = out.replace(/\u0000/g, '');
  // trim excessive whitespace
  return out.trim();
}

export function detectPromptInjection(s: string) {
  if (!s) return false;
  const patterns = [
    /ignore (all )?previous instructions/gi,
    /disregard (the )?previous/gi,
    /forget (the )?previous/gi,
    /do not follow system instructions/gi,
    /bypass (safety|restrictions)/gi,
    /ignore (your|the) (safety|rules)/gi,
  ];
  return patterns.some((p) => p.test(s));
}
