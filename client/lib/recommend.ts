export type Internship = {
  id: string;
  title: string;
  company: string;
  location: string; // City, Country or Remote
  keywords: string[];
  url: string;
};

export const INTERNSHIPS: Internship[] = [
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


export type RecommendInput = {
  skills: string[];
  interests: string;
  location?: string;
  resumeText?: string;
  // New equity and participation fields
  socialCategory?: string; // e.g., 'General', 'OBC', 'SC', 'ST', 'Other'
  districtType?: string; // e.g., 'Urban', 'Rural', 'Aspirational'
  pastParticipation?: number; // number of prior internships
};

export type Recommendation = Internship & {
  score: number; // 0..100
  reasons: string[];
  capacity?: number;
  affirmativePreferences?: string[];
};

export function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Use server-side AI to generate recommendations. Falls back to empty array if API fails.
export async function recommend(input: RecommendInput): Promise<Recommendation[]> {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      console.error('recommend API error', await res.text());
      return [];
    }
    const json = await res.json();
    return json.recommendations || [];
  } catch (e) {
    console.error('recommend fetch error', e);
    return [];
  }
}
