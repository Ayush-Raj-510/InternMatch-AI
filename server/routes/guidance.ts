import { RequestHandler } from "express";

// Topics with detailed guidance and recommended resources (at least 10 topics)
const TOPICS: { keyphrases: string[]; reply: string }[] = [
  {
    keyphrases: ["cyber", "security", "infosec", "pentest", "penetration"],
    reply: `Preparing for Cybersecurity / InfoSec:\n\n1) Foundations:\n - Networking (TCP/IP, DNS), Linux, and scripting (Python/Bash).\n\n2) Hands-on:\n - Labs: TryHackMe, Hack The Box, OverTheWire.\n - Tools: nmap, Wireshark, Burp Suite.\n\n3) Projects & Portfolio:\n - Home lab, CTFs, writeups, GitHub portfolio.\n\n4) Certs & Learning:\n - CompTIA Security+, eJPT, OSCP (advanced).\n\nResources:\n - https://tryhackme.com\n - https://www.hackthebox.com\n - https://owasp.org/www-project-top-ten/`,
  },
  {
    keyphrases: ["web", "web development", "webtech", "web technology"],
    reply: `Web Development roadmap:\n\n1) Basics:\n - HTML, CSS, JavaScript.\n\n2) Frontend:\n - Frameworks (React/Vue), responsive design, accessibility.\n\n3) Backend:\n - Node/Express or Python/Flask, databases (Postgres/Mongo).\n\n4) Deploy:\n - Docker, CI/CD, Netlify/Vercel/Heroku.\n\nResources:\n - https://www.freecodecamp.org\n - https://developer.mozilla.org`,
  },
  {
    keyphrases: ["frontend", "ui", "react", "vue"],
    reply: `Frontend focus:\n\n1) Core skills:\n - HTML/CSS, JavaScript, responsive layouts.\n\n2) Advanced:\n - React, state management, testing (Jest, RTL).\n\n3) Portfolio:\n - Build 2–3 polished projects and include accessible design.\n\nResources:\n - https://reactjs.org\n - https://www.frontendmentor.io`,
  },
  {
    keyphrases: ["backend", "server", "api", "database"],
    reply: `Backend focus:\n\n1) Skills:\n - Node.js/Express or Python/Django, REST/GraphQL.\n\n2) Data:\n - SQL (Postgres), NoSQL (MongoDB), data modeling.\n\n3) Production:\n - Authentication, security, testing, deployment.\n\nResources:\n - https://www.postgresql.org\n - https://www.mongodb.com/docs`,
  },
  {
    keyphrases: ["fullstack", "full stack"],
    reply: `Fullstack path:\n\n1) Combine frontend + backend skills.\n2) Build end-to-end projects with auth, persistence, and deployment.\n3) Learn basic cloud concepts and CI/CD.\n\nResources:\n - https://fullstackopen.com/en`,
  },
  {
    keyphrases: ["data", "data science", "data analysis"],
    reply: `Data Science roadmap:\n\n1) Python, pandas, NumPy, data cleaning.\n2) Statistics and visualization, ML basics with scikit-learn.\n3) Projects: Kaggle notebooks, dashboards.\n\nResources:\n - https://www.kaggle.com/learn\n - https://www.coursera.org/learn/machine-learning`,
  },
  {
    keyphrases: ["ml", "machine learning", "deep learning"],
    reply: `Machine Learning path:\n\n1) Math foundations: linear algebra, probability.\n2) Classical ML: scikit-learn; then deep learning (PyTorch/TensorFlow).\n3) Projects: image/text models and model deployment.\n\nResources:\n - https://www.fast.ai\n - https://pytorch.org/tutorials/`,
  },
  {
    keyphrases: ["devops", "cloud", "infrastructure"],
    reply: `DevOps & Cloud:\n\n1) Linux, shell scripting, and networking.\n2) Containerization (Docker), orchestration (Kubernetes).\n3) CI/CD pipelines, IaC (Terraform).\n\nResources:\n - https://docs.docker.com\n - https://kubernetes.io/docs/`,
  },
  {
    keyphrases: ["mobile", "android", "ios", "flutter", "react native"],
    reply: `Mobile development:\n\n1) Native (Kotlin/Swift) or cross-platform (Flutter/React Native).\n2) Focus on app lifecycle, performance, and publishing to stores.\n\nResources:\n - https://flutter.dev\n - https://reactnative.dev`,
  },
  {
    keyphrases: ["product", "product management", "pm"],
    reply: `Product Management basics:\n\n1) Learn product lifecycle, user research, and metrics.\n2) Prioritization: RICE/MoSCoW; write case studies.\n\nResources:\n - https://productschool.com\n - https://www.reforge.com/blog`,
  },
  {
    keyphrases: ["ux", "ui design", "design"],
    reply: `UX/UI design:\n\n1) Learn design principles, prototyping (Figma), and user testing.\n2) Create case studies showing process and outcomes.\n\nResources:\n - https://www.figma.com/community\n - https://www.nngroup.com/articles/`,
  },
  {
    keyphrases: ["qa", "testing", "quality assurance"],
    reply: `QA & Testing:\n\n1) Manual testing fundamentals and test case design.\n2) Automation: Selenium, Playwright, Cypress.\n3) Integrate tests into CI.\n\nResources:\n - https://www.cypress.io`,
  },
];

import { sanitizePrompt } from '../lib/sanitize';

export const handleGuidance: RequestHandler = async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'missing message' });

  const clean = sanitizePrompt(String(message));
  const q = clean.toLowerCase();

  for (const t of TOPICS) {
    if (t.keyphrases.some((k) => q.includes(k))) {
      return res.json({ reply: t.reply });
    }
  }

  const defaultReply = `I can help with many career topics. Try asking about one of these:\n- Cybersecurity (how to prepare for cybersecurity)\n- Web development (how to learn web dev)\n- Frontend / Backend / Fullstack\n- Data Science / Machine Learning\n- DevOps / Cloud\n- Mobile Development\n- Product Management\n- UX/UI Design\n- QA / Testing\n\nAsk for a topic and I'll give a step-by-step plan and recommended resources.`;
  return res.json({ reply: defaultReply });
};
