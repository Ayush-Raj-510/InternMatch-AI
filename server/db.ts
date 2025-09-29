let client: any = null;
let connected = false;

export async function initDb(url?: string) {
  const mongoUrl = (url || process.env.MongoDB_url || '').trim();
  if (!mongoUrl) {
    console.info('[db] MongoDB_url not set; skipping DB initialization.');
    return;
  }

  let MongoClient: any;
  try {
    // dynamically import to avoid hard dependency during dev if package not installed
    const mod = await import('mongodb');
    MongoClient = mod.MongoClient;
  } catch (e) {
    console.warn('[db] mongodb package is not installed. Run `npm install mongodb` to enable DB features.');
    throw e;
  }

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db();
    console.info('[db] Connected to MongoDB', db.databaseName);

    // Ensure collections
    const collections = await db.listCollections().toArray();
    const names = new Set(collections.map((c: any) => c.name));

    if (!names.has('users')) await db.createCollection('users');
    if (!names.has('bookmarks')) await db.createCollection('bookmarks');
    if (!names.has('internships')) await db.createCollection('internships');

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }).catch(() => {});
    await db.collection('bookmarks').createIndex({ userId: 1 }).catch(() => {});
    await db.collection('internships').createIndex({ id: 1 }, { unique: true }).catch(() => {});

    // Seed internships if empty
    const internships = [
      { id: 'pm-remote-1', title: 'Product Management Intern', company: 'Acme Apps', location: 'Remote', keywords: ['product management','roadmap','user research','sql','analytics'], url: 'https://www.google.com/search?q=Product+Management+Intern', capacity: 4, affirmativePreferences: ['rural','OBC','SC'] },
      { id: 'data-analyst-ldn', title: 'Data Analyst Intern', company: 'Northbridge', location: 'London, UK', keywords: ['python','sql','dashboards','powerbi','statistics'], url: 'https://www.google.com/search?q=Data+Analyst+Intern', capacity: 3, affirmativePreferences: ['rural'] },
      { id: 'frontend-nyc', title: 'Frontend Engineer Intern', company: 'PixelWorks', location: 'New York, USA', keywords: ['react','typescript','ui','css','testing'], url: 'https://www.google.com/search?q=Frontend+Engineer+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'ml-berlin', title: 'ML Research Intern', company: 'DeepVision', location: 'Berlin, DE', keywords: ['machine learning','python','pytorch','nlp'], url: 'https://www.google.com/search?q=ML+Research+Intern', capacity: 1, affirmativePreferences: ['ST','SC'] },
      { id: 'pm-sf', title: 'Associate PM Intern', company: 'Orbit Labs', location: 'San Francisco, USA', keywords: ['product','agile','ux','analytics','a/b testing'], url: 'https://www.google.com/search?q=Associate+PM+Intern', capacity: 2, affirmativePreferences: ['rural'] },
      { id: 'cyber-soc-remote', title: 'Cybersecurity SOC Intern', company: 'SecureOps', location: 'Remote', keywords: ['cybersecurity','soc','incident response','linux','wireshark','nmap'], url: 'https://www.google.com/search?q=Cybersecurity+SOC+Intern', capacity: 3, affirmativePreferences: ['rural'] },
      { id: 'cyber-pen-test', title: 'Penetration Testing Intern', company: 'RedProbe Labs', location: 'Bengaluru, India', keywords: ['penetration testing','ethical hacking','burp','nmap','metasploit','linux'], url: 'https://www.google.com/search?q=Penetration+Testing+Intern', capacity: 2, affirmativePreferences: ['OBC','SC'] },

      // Additional seeded internships (technical & non-technical)
      { id: 'backend-remote-1', title: 'Backend Engineer Intern', company: 'CloudStack', location: 'Remote', keywords: ['node.js','express','databases','sql','api'], url: 'https://www.google.com/search?q=Backend+Engineer+Intern', capacity: 3, affirmativePreferences: [] },
      { id: 'mobile-android', title: 'Android Developer Intern', company: 'AppForge', location: 'Mumbai, India', keywords: ['android','kotlin','java','mobile','ui'], url: 'https://www.google.com/search?q=Android+Developer+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'ios-intern', title: 'iOS Developer Intern', company: 'Pocket Labs', location: 'Bengaluru, India', keywords: ['swift','ios','mobile','ui'], url: 'https://www.google.com/search?q=iOS+Developer+Intern', capacity: 1, affirmativePreferences: [] },
      { id: 'devops-ny', title: 'DevOps Intern', company: 'SkyOps', location: 'New York, USA', keywords: ['devops','docker','kubernetes','ci/cd','aws'], url: 'https://www.google.com/search?q=DevOps+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'qa-remote', title: 'QA Tester Intern', company: 'Testify', location: 'Remote', keywords: ['qa','testing','automation','selenium','cypress'], url: 'https://www.google.com/search?q=QA+Tester+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'data-engineer', title: 'Data Engineering Intern', company: 'DataFlow', location: 'Bengaluru, India', keywords: ['etl','spark','python','sql','data pipelines'], url: 'https://www.google.com/search?q=Data+Engineering+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'ux-design', title: 'UX Designer Intern', company: 'DesignEra', location: 'Remote', keywords: ['ux','design','figma','user research'], url: 'https://www.google.com/search?q=UX+Designer+Intern', capacity: 1, affirmativePreferences: [] },
      { id: 'graphic-design', title: 'Graphic Design Intern', company: 'CreativeCo', location: 'Delhi, India', keywords: ['photoshop','illustrator','design','branding'], url: 'https://www.google.com/search?q=Graphic+Design+Intern', capacity: 1, affirmativePreferences: [] },
      { id: 'content-marketing', title: 'Content Marketing Intern', company: 'BrandLift', location: 'Remote', keywords: ['content','seo','writing','social media'], url: 'https://www.google.com/search?q=Content+Marketing+Intern', capacity: 3, affirmativePreferences: [] },
      { id: 'sales-associate', title: 'Sales Intern', company: 'MarketReach', location: 'Remote', keywords: ['sales','crm','communication','outreach'], url: 'https://www.google.com/search?q=Sales+Intern', capacity: 4, affirmativePreferences: [] },
      { id: 'hr-operations', title: 'HR Operations Intern', company: 'PeopleOps', location: 'Remote', keywords: ['hr','operations','recruiting','communication'], url: 'https://www.google.com/search?q=HR+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'business-ops', title: 'Business Operations Intern', company: 'OpsWorks', location: 'Remote', keywords: ['operations','analysis','excel','communication'], url: 'https://www.google.com/search?q=Business+Operations+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'research-assistant', title: 'Research Assistant Intern', company: 'UrbanThink', location: 'Chennai, India', keywords: ['research','data collection','reporting','field work'], url: 'https://www.google.com/search?q=Research+Assistant+Intern', capacity: 2, affirmativePreferences: [] },
      { id: 'community-engagement', title: 'Community Engagement Intern', company: 'NGOConnect', location: 'Remote', keywords: ['community','engagement','field','communications'], url: 'https://www.google.com/search?q=Community+Engagement+Intern', capacity: 3, affirmativePreferences: [] },
      { id: 'teaching-intern', title: 'Teaching Assistant Intern', company: 'TeachPlus', location: 'Patna, India', keywords: ['teaching','education','content','mentoring'], url: 'https://www.google.com/search?q=Teaching+Assistant+Intern', capacity: 5, affirmativePreferences: ['rural'] },
      { id: 'finance-analyst', title: 'Finance Intern', company: 'LedgerWorks', location: 'Mumbai, India', keywords: ['finance','excel','analysis','accounting'], url: 'https://www.google.com/search?q=Finance+Intern', capacity: 2, affirmativePreferences: [] },
    ];

    const col = db.collection('internships');
    const count = await col.countDocuments();
    if (count === 0) {
      await col.insertMany(internships, { ordered: false }).catch(() => {});
      console.info('[db] Seeded internships collection');
    }

    connected = true;
  } catch (e) {
    console.error('[db] Failed to init MongoDB', e);
  }
}

export function getDb() {
  if (!client) throw new Error('MongoDB client not initialized');
  return client.db();
}

export async function closeDb() {
  try {
    await client?.close();
  } catch {}
  client = null;
  connected = false;
}
