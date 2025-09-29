import { RequestHandler } from "express";

import { sanitizePrompt } from '../lib/sanitize';

function oneOf<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

// If GEMINI / PaLM API key is present, forward prompts to the Generative API (PaLM / text-bison compatible). Otherwise fall back to local templates.
const GEN_KEY = process.env.Gemini_Api_key || process.env.GENERATIVE_API_KEY || '';

import { getDb } from '../db';

export const handleAI: RequestHandler = async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'missing message' });
  const cleanMessage = sanitizePrompt(String(message));

  // Predefined Q/A knowledge base (quick replies for common questions)
  const PREDEFINED_QA: { patterns: RegExp[]; en: string; hi?: string }[] = [
    { patterns: [/how to apply/i, /application process/i, /apply (for|now)/i], en: 'To apply: 1) Shorten your resume to one page highlighting relevant projects; 2) Find the Apply or contact email on the posting; 3) Submit via the form or send a polite email attaching your resume; 4) Follow up after 7–10 days if no reply.', hi: 'आवेदन करने के चरण: 1) एक पृष्ठ का सार���ंशित रिज्यूम तैयार करें; 2) पोस्टिंग में Apply बटन या संपर्क ईमेल खोजें; 3) फॉर्म के माध्यम से या विनम्र ईमेल भेजकर रिज्यूम संलग्न करें; 4) 7–10 दिन बाद फॉलोअप करें यदि उत्तर न मिले।' },
    { patterns: [/documents needed/i, /what documents/i, /documents (required|needed)/i], en: 'Common documents: resume, academic transcript, government ID (Aadhaar/student ID), and any certificates. Keep scanned PDFs or clear photos ready.', hi: 'आम दस्तावेज़: रिज्यूम, शैक्षणिक ट्रांस्क्रिप्ट, पहचान पत्र (आधार/स्टूडेंट आईडी), और प्रमाण पत्र। स्कैन की हुई PDF या साफ़ तस्वीरें तैयार रखें।' },
    { patterns: [/resume tips/i, /how to make resume/i, /one-page resume/i], en: 'Resume tips: prioritize relevant skills and projects, quantify impact (numbers), use 2–4 concise bullets per project, and include keywords from the job description.', hi: 'रिज्यूम सुझाव: प्रासंगिक कौशल और प्रोजेक्ट्स को प्राथमिकता दें, प्रभाव को संख्याओं में दिखाएँ, प्रति प्रोजेक्ट 2–4 बुलेट रखें, और नौकरी विवरण के कीवर्ड शामिल करें।' },
    { patterns: [/interview tips/i, /interview preparation/i, /phone interview/i], en: 'Interview tips: use STAR (Situation, Task, Action, Result) for behavioral answers, prepare 2–3 project stories, and practice concise technical explanations. If connection is weak ask for a phone interview.', hi: 'इंटरव्यू सुझाव: व्यवहारिक उत्तरों के लिए STAR (स्थिति, कार्य, क्रिया, परिणाम) उपयोग करें, 2–3 प्रोजेक्ट स्टोरीज़ तैयार रखें, और तकनीकी स्पष्टीकरण संक्षेप में तैयार करें। कनेक्शन कमजोर होने पर फोन इंटरव्यू का अनुरोध करें।' },
    { patterns: [/where to find internships/i, /find internships/i, /remote internships/i], en: 'Find internships on major job boards (filter remote), university career pages, company sites, and through open-source/project-based programs that accept GitHub portfolios.', hi: 'प्रमुख जॉब बोर्ड्स पर (रिमोट फिल्टर के साथ), विश्वविद्यालय कैरियर पेज, कंपनी साइट्स और GitHub पोर्टफोलियो स्वीकार करने वाले प्रोजेक्ट-आधारित प्रोग्राम देखें।' },
    { patterns: [/skill gap/i, /missing skills/i, /what should i learn/i], en: 'To identify skill gaps: list target roles, compare required skills to yours, and prioritize 2–3 skills to learn with focused short courses or projects (2–8 weeks).', hi: 'कौशल अंतर पहचानने के लिए: लक्षित भूमिकाएँ सूचीबद्ध करें, आवश्यक कौशल की तुलना अपने कौशल से करें, और 2–3 कौशल सीखने को प्राथमिकता दें छोटे कोर्स या प्रोजेक्ट्स के साथ।' },
    { patterns: [/portfolio|github|showcase/i], en: 'Portfolio tips: include 2–4 meaningful projects with descriptions, links to code or demos, list your role, tech stack, and brief outcomes. Make one demo easy to run or view.', hi: 'पोर्टफोलियो सुझाव: 2–4 महत्वपूर्ण प्रोजेक्ट शामिल करें, वर्णन, कोड/डेमो लिंक, आपकी भूमिका, टेक स्टैक और संक्षिप्त परिणाम बताएं। एक डेमो को आसानी से चलाने योग्य रखें।' },
    { patterns: [/stipend|paid internship|unpaid/i], en: 'Stipend: many internships offer stipends; small organizations may be unpaid. If stipend isn’t mentioned, politely ask during application or in the interview. Consider travel/remote allowances.', hi: 'स्टाइपेंड: कई इंटर्नशिप स्टाइपेंड देती हैं; कुछ संगठन अनपेड हो सकते हैं। यदि स्टाइपेंड का उल्लेख नहीं है, तो आवेदन या इंटरव्यू में विनम्रता से पूछें।' },
    { patterns: [/eligibility|who can apply/i], en: 'Eligibility: check the posting for year/degree restrictions. Many internships accept students from diverse backgrounds; highlight transferable skills if you are non-technical.', hi: 'पात्रता: पद के लिए वर्ष/डिग्री प्रतिबंध देखें। कई इंटर्नशिप विभिन्न पृष्ठभूमि के छात्रों को स्वीकार करती हैं; यदि आप गैर-तकनीकी हैं तो ट्रांसफरेबल स्किल्स को हाईलाइट करें।' },
    { patterns: [/follow up|after applying/i], en: 'Follow-up: wait 7–10 days, send a short polite email referencing your application and interest, and ask if they need more information.', hi: 'फॉलो-अप: 7–10 दिन प्रतीक्षा करें, एक संक्षिप्त विनम्र ईमेल भेजें जिसमें आवेदन और आपकी रुचि का उल्लेख हो, और पूछें क्या उन्हें और जानकारी चाहिए।' },
    { patterns: [/mock interview/i, /practice interviews/i], en: 'Mock interviews: practice with peers or mentors, record answers, time yourself, and iterate on concise explanations for technical questions.', hi: 'मॉक इंटरव्यू: साथियों/मेंटर्स के साथ अभ्यास करें, उत्तर रिकॉर्ड करें, समय जांचें, और तकनीकी प्रश्नों के संक्षिप्त स्पष्टीकरण पर सुधार करें।' },
    { patterns: [/cover letter/i, /motivation letter/i], en: 'Cover letters: keep them short (3–4 short paragraphs), explain why you fit the role, mention a project/skill that matches, and end with a polite call to action.', hi: 'कवर लेटर: संक्षिप्त रखें (3–4 पैराग्राफ), बताएं क्यों आप उपयुक्त हैं, एक प्रोजेक्ट/कौशल का उल्लेख करें जो मेल खाता है, और विनम्र समापन करें।' },
    { patterns: [/timeline|when will i hear/i, /selection process/i], en: 'Timelines vary; many employers respond within 1–3 weeks. Selection often includes resume screen, short assignment or test, and one or two interviews.', hi: 'समय-सीमा बदलती है; कई नियोक्ता 1–3 सप्ताह में उत्तर देते हैं। चयन अक्सर रिज्यूम स्क्रीन, शॉर्ट असाइनमेंट/टेस्ट, और एक या दो इंटरव्यू शामिल करते हैं।' },
    { patterns: [/assessment test|coding test|hackerank|test/i], en: 'For coding/assessment tests: practice on platforms like HackerRank, LeetCode (easy/medium), and review common data structures and algorithms for the role.', hi: 'कーデिंग/अस्सेसमेंट टेस्ट: HackerRank, LeetCode (easy/medium) जैसी साइट्स पर अभ्यास करें और भूमिका के लिए सामान्य डेटा संरचनाएँ और एल्गोरिद्म रिव्यू करें।' },
    { patterns: [/references|recommendation letters/i], en: 'References: provide 1–2 contacts who can vouch for your project work or academics; ask them in advance and share context for the role.', hi: 'संदर्भ: 1–2 ऐसे संपर्क दें जो आपके प्रोजेक्ट कार्य या शैक्षणिक प्रदर्शन की पुष्टि कर ���कें; पहले से पूछें और भूमिका के लिए संदर्भ साझा करें।' },
    { patterns: [/conversion|full time|after internship/i], en: 'Conversion to full-time: sometimes top interns are offered full-time roles; focus on impact, learning quickly, and communication to improve chances.', hi: 'पूर्णकालिक रूपांतरण: कुछ मामलों में शीर्ष इंटर्न्स को पूर्णकालिक प्रस्ताव मिलता है; प्रभाव, तेज़ सीखने और संचार पर ध्यान दें।' },
    { patterns: [/hours per week|time commitment/i], en: 'Time commitment: typical internships are 20–40 hours/week depending on part-time or full-time; check the posting or ask during the interview.', hi: 'समय प्रतिबद्धता: सामान्यत: 20–40 घंटे/सप्ताह, पद के अनुसार; पोस्टिंग देखें या इंटरव्यू में पूछें।' },
    { patterns: [/non[- ]technical|nontechnical/i], en: 'Non-technical internships: roles like content, marketing, research, community, HR, and operations focus on communication, organization, writing, and fieldwork skills.', hi: 'गैर-तकनीकी इंटर्नशिप: कंटेंट, मार्केटिंग, रिसर्च, कम्युनिटी, HR और ऑपरेशंस जैसी भूमिकाएँ संचार, संगठन, लेखन और फील्डवर्क कौशल पर केंद्रित होती हैं।' },
  ];

  // Try to match predefined Q/A first
  try {
    for (const item of PREDEFINED_QA) {
      if (item.patterns.some((p) => p.test(cleanMessage))) {
        const wantsHindi = /[\u0900-\u097F]/.test(cleanMessage);
        const reply = wantsHindi && item.hi ? item.hi : item.en;
        return res.json({ reply });
      }
    }
  } catch (e) {
    // continue to other handlers
  }

  // If we have a generative API key, attempt to call it first.
  if (GEN_KEY) {
    try {
      // If the message is career-related, include a short context of available internships from the DB to help the LLM give targeted answers.
      let context = '';
      try {
        const db = getDb();
        const items = await db.collection('internships').find({}).limit(30).toArray();
        if (items && items.length) {
          context = '\nAvailable internships (sample):\n' + items.slice(0, 12).map((it: any) => `- ${it.title} @ ${it.company} (${it.location}) [${(it.keywords||[]).slice(0,5).join(', ')}]`).join('\n') + '\n';
        }
      } catch (e) {
        // DB not configured or error: ignore
        context = '';
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${encodeURIComponent(GEN_KEY)}`;
      const promptText = `You are an assistant for students seeking internships. Use the following context when helpful: ${context}\nUser: ${cleanMessage}`;
      const body = {
        prompt: { text: promptText },
        temperature: 0.1,
        maxOutputTokens: 1024,
      };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.warn('Generative API error', r.status, txt);
        // fall through to local templates
      } else {
        const data = await r.json().catch(() => null);
        const reply = data?.candidates?.[0]?.output || data?.candidates?.[0]?.content || data?.output || null;
        if (reply) {
          return res.json({ reply: String(reply) });
        }
      }
    } catch (e) {
      console.error('Generative API call failed', e);
      // continue to local fallback
    }
  }

  // Produce varied replies per category to avoid repeating the same text.
  try {
    const q = String(cleanMessage).toLowerCase();

    const resumeTemplates = [
      (m: string) => `Here are quick resume tips: tailor your resume for the role, quantify achievements with metrics, and list relevant skills near the top.`,
      (m: string) => `For resumes: focus on impact — use numbers where possible, keep sections concise, and mirror the job's required keywords in your skills section.`,
      (m: string) => `Resume advice: lead with a strong summary, include 2–3 bullet points per project showing results, and keep formatting clean for quick scanning.`,
    ];

    const gapTemplates = [
      (m: string) => `To find skill gaps, upload your resume or paste your skills. The Recommendation Engine will compare your profile to role requirements and list missing areas with suggested resources.`,
      (m: string) => `I can analyze gaps — provide your resume or skills. I'll highlight missing skills and recommend learning links to close those gaps.`,
      (m: string) => `Share your resume or skills and I'll compare them to target roles, then suggest the top skills you should learn and short resources to get started.`,
    ];

    const interviewTemplates = [
      (m: string) => `Interview prep: use the STAR framework for behavioral answers, prepare 2–3 project stories, and rehearse technical explanations concisely.`,
      (m: string) => `Practice common behavioral questions with STAR (Situation, Task, Action, Result), prepare a short elevator pitch for your project, and review role-specific technical topics.`,
      (m: string) => `For interviews: focus on 3 strong examples, clarify your impact with metrics, and practice answering clearly for 2–3 minutes each.`,
    ];

    const cyberTemplates = [
      (m: string) => `To prepare for cybersecurity: learn networking fundamentals (TCP/IP, DNS), get comfortable with Linux, practice scripting (Python/Bash), and study common vulnerabilities (OWASP Top 10). Use hands-on labs like TryHackMe and Hack The Box.`,
      (m: string) => `Cybersecurity path: start with basics (networks, OS, web tech), take a practical course (TryHackMe/PracticalPentesting), practice CTFs, build a home lab, and aim for a beginner cert (CompTIA Security+ or eJPT).`,
      (m: string) => `Preparing for a role in infosec: focus on systems & networking, learn to use tools (nmap, wireshark, burp), practice exploitation/defense in labs, contribute to small security projects, and document your findings in a portfolio.`,
    ];

    const careerTemplates = [
      (m: string) => `Career guidance: identify 2–3 target roles, map required skills, build small projects demonstrating them, and reach out to people in those roles for advice.`,
      (m: string) => `To progress your career: pick target roles, list gaps vs required skills, tackle one skill at a time with focused projects, and apply consistently with tailored resumes.`,
      (m: string) => `Start by defining what role you want, then reverse-engineer the skills and projects needed. Use the Recommendation Engine to find matching internships.`,
    ];

    const defaultTemplates = [
      (m: string) => `I can help with resumes, internship recommendations, interview tips, and skill-gap analysis — ask me about any of these topics.`,
      (m: string) => `Try asking me to analyze your resume, find skill gaps, or suggest internships based on your skills and interests.`,
      (m: string) => `Ask about resume tips, interview prep, or paste your resume for analysis — I can also generate internship suggestions based on your profile.`,
    ];

    let reply = '';
    if (q.includes('resume') || q.includes('cv')) {
      reply = oneOf(resumeTemplates)(message);
    } else if (q.includes('skill gap') || q.includes('gap')) {
      reply = oneOf(gapTemplates)(message);
    } else if (q.includes('interview')) {
      reply = oneOf(interviewTemplates)(message);
    } else if (q.includes('cyber') || q.includes('security') || q.includes('infosec') || q.includes('penetration') || q.includes('pentest')) {
      reply = oneOf(cyberTemplates)(message);
    } else if (q.includes('intern') || q.includes('internship') || q.includes('job') || q.includes('career')) {
      reply = oneOf(careerTemplates)(message);
    } else {
      reply = oneOf(defaultTemplates)(message);
    }

    // Small personalization: echo first 20 chars of user message to make responses feel distinct
    const snippet = String(cleanMessage).trim().slice(0, 100);
    if (snippet) reply = `${reply} (${snippet.length>0?`About: "${snippet}"`:''})`;

    return res.json({ reply });
  } catch (e) {
    console.error('local AI error', e);
    return res.status(500).json({ error: 'internal' });
  }
};
