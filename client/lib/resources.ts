export type Resource = { skill: string; title: string; url: string; provider?: string };

const RESOURCE_MAP: Record<string, Resource[]> = {
  react: [
    { skill: 'react', title: 'React Official Tutorial', url: 'https://react.dev/learn', provider: 'React' },
    { skill: 'react', title: 'Full Stack Open - React', url: 'https://fullstackopen.com/en/', provider: 'University of Helsinki' },
  ],
  python: [
    { skill: 'python', title: 'Python.org Tutorials', url: 'https://docs.python.org/3/tutorial/', provider: 'Python' },
    { skill: 'python', title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', provider: 'Al Sweigart' },
  ],
  sql: [
    { skill: 'sql', title: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/', provider: 'Mode' },
    { skill: 'sql', title: 'SQLBolt', url: 'https://sqlbolt.com/', provider: 'SQLBolt' },
  ],
  'machine learning': [
    { skill: 'machine learning', title: 'Andrew Ng - ML Course', url: 'https://www.coursera.org/learn/machine-learning', provider: 'Coursera' },
  ],
  'product management': [
    { skill: 'product management', title: 'Intro to Product Management', url: 'https://www.coursera.org/learn/product-management', provider: 'Coursera' },
  ],
  'data analysis': [
    { skill: 'data analysis', title: 'Data Analysis with Python (freeCodeCamp)', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', provider: 'freeCodeCamp' },
  ],
  default: [
    { skill: 'general', title: 'Coursera - Career Skills', url: 'https://www.coursera.org/courses?query=career%20skills', provider: 'Coursera' },
  ],
};

export function getResourcesForSkills(skills: string[]) {
  const seen = new Set<string>();
  const res: Resource[] = [];
  skills.forEach((s) => {
    const key = s.toLowerCase();
    const picks = RESOURCE_MAP[key] || RESOURCE_MAP[Object.keys(RESOURCE_MAP).find(k => key.includes(k) && k !== 'default') as string] || RESOURCE_MAP.default;
    picks.forEach((p) => {
      const id = p.url;
      if (!seen.has(id)) {
        seen.add(id);
        res.push(p);
      }
    });
  });
  return res.slice(0, 10);
}
