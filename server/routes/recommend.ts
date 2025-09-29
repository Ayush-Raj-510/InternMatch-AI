import { RequestHandler } from "express";
import { sanitizeForMongo, sanitizePrompt } from '../lib/sanitize';

export const handleRecommend: RequestHandler = async (req, res) => {
  const raw = req.body || {};
  const input = sanitizeForMongo(raw as any);

  // Prefer generative API if provided
  const key = process.env.Gemini_Api_key;
  if (key) {
    try {
      // Instruct model to return JSON array of recommendations with specific fields
      let prompt = `You are an assistant that generates internship recommendations. Given the user input as JSON, return a JSON object with a single property "recommendations" which is an array of recommendation objects. Each recommendation object must have: id, title, company, location, keywords (array), url, score (0-100), and reasons (array of strings). Return ONLY valid JSON.\n\nUser input:\n${JSON.stringify(input)}`;
      // sanitize prompt to guard against prompt injection
      prompt = sanitizePrompt(prompt);

      const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${key}`;
      const body = {
        prompt: { text: prompt },
        temperature: 0.2,
        maxOutputTokens: 512,
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const txt = await r.clone().text();
      if (!r.ok) {
        console.error('generative api error', r.status, txt);
      } else {
        // try to parse JSON from response text
        try {
          const json = JSON.parse(txt);
          // attempt to extract reply
          const candidates = json?.candidates || [];
          const reply = candidates[0]?.content || json?.output?.[0]?.content || JSON.stringify(json);
          // reply should be JSON string
          const parsed = typeof reply === 'string' ? JSON.parse(reply) : reply;
          return res.json(parsed);
        } catch (e) {
          console.error('failed to parse generative reply', e, txt);
        }
      }
    } catch (e) {
      console.error('AI recommend proxy error', e);
      // fallthrough
    }
  }

  // Fallback: simple heuristic scoring using built-in internship list
  const INTERNSHIPS = [
    {
      id: 'pm-remote-1',
      title: 'Product Management Intern',
      company: 'Acme Apps',
      location: 'Remote',
      keywords: ['product management', 'roadmap', 'user research', 'sql', 'analytics'],
      url: 'https://www.google.com/search?q=Product+Management+Intern',
      capacity: 4,
      affirmativePreferences: ['rural','OBC','SC']
    },
    {
      id: 'data-analyst-ldn',
      title: 'Data Analyst Intern',
      company: 'Northbridge',
      location: 'London, UK',
      keywords: ['python', 'sql', 'dashboards', 'powerbi', 'statistics'],
      url: 'https://www.google.com/search?q=Data+Analyst+Intern',
      capacity: 3,
      affirmativePreferences: ['rural']
    },
    {
      id: 'frontend-nyc',
      title: 'Frontend Engineer Intern',
      company: 'PixelWorks',
      location: 'New York, USA',
      keywords: ['react', 'typescript', 'ui', 'css', 'testing'],
      url: 'https://www.google.com/search?q=Frontend+Engineer+Intern',
      capacity: 2,
      affirmativePreferences: []
    },
    {
      id: 'ml-berlin',
      title: 'ML Research Intern',
      company: 'DeepVision',
      location: 'Berlin, DE',
      keywords: ['machine learning', 'python', 'pytorch', 'nlp'],
      url: 'https://www.google.com/search?q=ML+Research+Intern',
      capacity: 1,
      affirmativePreferences: ['ST','SC']
    },
    {
      id: 'pm-sf',
      title: 'Associate PM Intern',
      company: 'Orbit Labs',
      location: 'San Francisco, USA',
      keywords: ['product', 'agile', 'ux', 'analytics', 'a/b testing'],
      url: 'https://www.google.com/search?q=Associate+PM+Intern',
      capacity: 2,
      affirmativePreferences: ['rural']
    },
    {
      id: 'cyber-soc-remote',
      title: 'Cybersecurity SOC Intern',
      company: 'SecureOps',
      location: 'Remote',
      keywords: ['cybersecurity', 'soc', 'incident response', 'linux', 'wireshark', 'nmap'],
      url: 'https://www.google.com/search?q=Cybersecurity+SOC+Intern',
      capacity: 3,
      affirmativePreferences: ['rural']
    },
    {
      id: 'cyber-pen-test',
      title: 'Penetration Testing Intern',
      company: 'RedProbe Labs',
      location: 'Bengaluru, India',
      keywords: ['penetration testing', 'ethical hacking', 'burp', 'nmap', 'metasploit', 'linux'],
      url: 'https://www.google.com/search?q=Penetration+Testing+Intern',
      capacity: 2,
      affirmativePreferences: ['OBC','SC']
    },
  ];

  function tokenize(s: string) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9+ ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  const resumeTokens = new Set(tokenize(input.resumeText || ''));
  (input.skills || []).forEach((s: string) => tokenize(s).forEach((t) => resumeTokens.add(t)));
  tokenize(input.interests || '').forEach((t) => resumeTokens.add(t));

  const social = String(input.socialCategory || '').toLowerCase();
  const district = String(input.districtType || '').toLowerCase();
  const past = Number(input.pastParticipation || 0);

  const scored = INTERNSHIPS.map((job: any) => {
    const jobTokens = new Set(job.keywords.flatMap((k: string) => tokenize(k)));
    const overlap = [...jobTokens].filter((t) => resumeTokens.has(t));
    let score = Math.min(100, Math.round((overlap.length / (jobTokens.size || 1)) * 75));

    // location matching
    const loc = String(input.location || '').toLowerCase();
    const isRemote = job.location.toLowerCase().includes('remote');
    if (loc) {
      if (isRemote) score += 6;
      if (job.location.toLowerCase().includes(loc)) score += 10;
    }

    // Equity adjustments: affirmative action preferences
    const prefs = (job.affirmativePreferences || []).map((p: string) => String(p).toLowerCase());
    let equityBoost = 0;
    if (social && prefs.includes(social)) {
      equityBoost += 18; // significant boost for matching social category
    }
    if (district && prefs.includes(district)) {
      equityBoost += 12; // boost for rural/aspirational match
    }

    // Past participation: prefer first-time participants
    if (past > 0) {
      score -= 8; // slight penalty if user has prior internships
    } else {
      score += 4; // small boost for no past internships
    }

    // Capacity consideration: penalize very small capacity roles for general applicants
    const cap = Number(job.capacity || 0);
    if (cap > 0 && cap <= 2) {
      // if user matches affirmative pref, don't penalize; otherwise small penalty
      const matchesPref = (social && prefs.includes(social)) || (district && prefs.includes(district));
      if (!matchesPref) score -= 10;
    } else if (cap > 0) {
      // larger capacity slightly favors the role
      score += Math.min(6, Math.round(cap));
    }

    score += equityBoost;

    score = Math.max(0, Math.min(100, score));
    const reasons: string[] = [];
    if (overlap.length) reasons.push(`Skill match: ${overlap.join(', ')}`);
    if (loc) {
      if (isRemote) reasons.push('Remote-friendly role');
      if (job.location.toLowerCase().includes(loc)) reasons.push('Near your location');
    }
    if (equityBoost > 0) reasons.push('Matched affirmative action preferences — priority considered');
    if (past > 0) reasons.push('Prior internships on record — some roles prefer first-time participants');
    if (cap > 0) reasons.push(`Capacity: ${cap} slot(s)`);

    return { ...job, score, reasons };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  res.json({ recommendations: scored });
};
