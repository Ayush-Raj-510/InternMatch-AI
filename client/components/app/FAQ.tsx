import React from 'react';

export default function FAQ({ lang }: { lang: 'en'|'hi'|'mr'|'bn'|'ta'|'te'|'kn'|'gu'|'ur'|'pa'|'or' }) {
  const faqs = [
    { q_en: 'How do I apply for an internship with limited internet access?', a_en: 'Prepare a concise 1-page resume, look for roles that accept email or phone submissions, ask local college placement cells or NGOs for help, and request phone interviews if video is unreliable.', q_hi: 'सीमित इंटरनेट कनेक्शन के साथ इंटर्नशिप के लिए कैसे आवेदन करें?', a_hi: 'एक संक्षिप्त 1-पेज रिज्यूम तैयार करें, ऐसे रोल देखें जो ईमेल/फोन से आवेदन स्वीकार करते हैं, कॉलेज प्लेसमेंट सेल या स्थानीय NGO से मदद लें, और वीडियो असुविधा होने पर फोन इंटरव्यू का अनुरोध करें।' },
    { q_en: 'What documents do I need to keep ready?', a_en: 'Resume, academic transcript, government ID (Aadhaar or student ID), and scanned copies or clear photos of certificates.', q_hi: 'कौन से दस्तावेज़ तैयार रखें?', a_hi: 'रिज्यूम, शैक्षणिक ट्रांसक्रिप्ट, सरकारी पहचान (आधार/स्टूडेंट आईडी), और प्रमाण पत्रों की स्कैन/सीधी तस्वीरें।' },
    { q_en: 'How can I prepare a 1-page resume?', a_en: 'Keep contact details brief, list 2–4 strongest projects or experiences with bullet points showing impact and technologies, add skills keywords, and remove unrelated details.', q_hi: '1-पेज रिज्यूम कैसे तैयार करें?', a_hi: 'संपर्क जानकारी संक्षेप में रखें, 2–4 प्रमुख प्रोजेक्ट/अनुभव बुलेट में रखें जिनमें प्रभाव और तकनीकें बताएं, कौशल शब्द जोड़ें और अप्रासंगिक जानकारी हटाएं।' },
    { q_en: 'How do I ask companies for alternate submission methods?', a_en: 'Write a short polite email explaining internet constraints, attach your resume, and request alternate submission or phone interview details.', q_hi: 'कंपनियों से वैकल्पिक सबमिशन कैसे मांगें?', a_hi: 'एक छोटा विनम्र ईमेल लिखें जिसमें इंटरनेट की समस्या बताएं, रिज्यूम संलग्न करें, और विकल्प सबमिशन या फोन इंटरव्यू का अनुरोध करें।' },
    { q_en: 'Interview tips when internet is unreliable?', a_en: 'Request a phone call instead, schedule during good connectivity windows, prepare concise STAR answers, and have 2–3 projects ready to explain simply.', q_hi: 'जब इंटरनेट अस्थिर हो तो इंटरव्यू टिप्स?', a_hi: 'फोन कॉल का अनुरोध करें, अच्छे कनेक्टिविटी समय में शेड्यूल करें, संक्षेप STAR उत्तर तैयार रखें, और 2–3 प्रोजेक्ट्स सरलता से बताने के लिए तैयार रखें।' },
    { q_en: 'Where can I find internships that support remote work?', a_en: 'Search platforms like remote internship filters on job sites, check university portals, and look for open-source or project-based internships that accept GitHub links.', q_hi: 'कहाँ रिमोट इंटर्नशिप ढूंढें?', a_hi: 'जॉब साइट्स पर रिमोट फिल्टर देखें, यूनिवर्सिटी पोर्टल चेक करें, और ओपन-सोर्स/प्रोजेक्ट-आधारित इंटर्नशिप देखें जो GitHub लिंक स्वीकार करते हैं।' },
    { q_en: 'How can local NGOs or colleges help?', a_en: 'They may provide internet/printing support, help with application submissions, or connect you with local employers and mentors.', q_hi: 'स्थानीय NGO या कॉलेज कैसे मदद कर सकते हैं?', a_hi: 'वे इंटरनेट/प्रिंटिंग सहायता दे सकते हैं, आवेदन जमा करने में मदद कर सकते हैं, या स्थानीय नियोक्ताओं और मेंटर्स से जोड़ सकते हैं।' },
    { q_en: 'How to practice interviews offline?', a_en: 'Use phone mock interviews with a friend or mentor, write and rehearse answers on paper, and record audio practice to review answers for clarity.', q_hi: 'ऑफलाइन इंटरव्यू कैसे प्रैक्टिस करें?', a_hi: 'दोस्त/मेंटॉर के साथ फोन मॉक इंटरव्यू करें, कागज पर उत्तर लिखकर रिहर्सल करें, और ऑडियो रिकॉर्ड करके स्पष्टता पर काम क��ें।' },
    { q_en: 'How to highlight practical projects if you lack formal experience?', a_en: 'Describe personal or coursework projects, link GitHub/drive, explain your role and technologies, and quantify outcomes (e.g., features built).', q_hi: 'यदि औपचारिक अनुभव नहीं है तो व्यावहारिक प्रोजेक्ट कैसे हाइलाइट करें?', a_hi: 'व्यक्तिगत/कोर्सवर्क प्रोजेक्ट्स बताएं, GitHub/Drive लिंक साझा करें, अपनी भूमिका और तकनीकें स्पष्ट करें और परिणामों को संख्या में बताएं (जैसे बनायी गई फीचर्स)।' },

    { q_en: 'What is the typical selection process for internships?', a_en: 'Common stages: resume screening, short assignment or coding test (role-dependent), and one or two interviews (technical or behavioral).', q_hi: 'इंटर्नशिप के लिए सामान्य चयन प्रक्रिया क्या है?', a_hi: 'सामान्य चरण: रिज्यूम स्क्रीनिंग, शॉर्ट असाइनमेंट य�� परीक्षण (भूमिका पर निर्भर), और एक या दो इंटरव्यू (तकनीकी या व्यवहारिक)।' },
    { q_en: 'Do internships provide certificates?', q_hi: 'क्या इंटर्नशिप प्रमाणपत्र देती हैं?', a_en: 'Many internships provide a completion certificate or letter; universities may also issue credit if partnered. Ask the employer for details.', a_hi: 'कई इंटर्नशिप पूर्णता प्रमाणपत्र देती हैं; यदि विश्वविद्यालय साझेदारी में है तो क्रेडिट मिल सकता है।' },
    { q_en: 'How long do internships usually last?', a_en: 'Internships typically range from 4 weeks (short) to 12–24 weeks (typical summer or semester internships). Check the posting for exact duration.', q_hi: 'इंटर्नशिप आमतौर पर कितनी लंबी होती हैं?', a_hi: 'इंटर्नशिप आमतौर पर 4 सप्ताह से 12–24 सप्ताह तक होती हैं। सटीक अवधि के लिए पोस्टिंग देखें।' },
    { q_en: 'Can first-year students apply?', a_en: 'Some internships accept first-year students, especially non-technical or community roles. Check eligibility in the posting and highlight willingness to learn.', q_hi: 'क्या पहले वर्ष के छात्र आवेदन कर सकते हैं?', a_hi: 'कुछ इंटर्नशिप पहले वर्ष के छात्रों को स्वीकार करती हैं, खासकर गैर-तकनीकी या सामुदायिक भूमिकाओं में। पात्रता चेक करें और सीखने की इच्छा दर्शाएं।' },
    { q_en: 'How to negotiate stipend or travel support?', a_en: 'Be polite: ask if stipend or travel allowances are available during the interview or in a follow-up email, and provide reasons (costs, relocation).', q_hi: 'स्टाइपेंड या यात्रा सहायता का कैसे नेगोशिएट करें?', a_hi: 'विनम्र रहें: इंटरव्यू या फॉलो-अप ईमेल में पूछें कि क्या स्टाइपेंड या यात्रा भत्ता उपलब्ध है, और आवश्यकताएँ बताएं।' },
    { q_en: 'Are remote internships flexible with hours?', a_en: 'Many remote internships offer flexible hours, but confirm expected weekly commitment in the posting or interview.', q_hi: 'क्या रिमोट इंटर्नशिप घंटे लचीले होते हैं?', a_hi: 'कई रिमोट इंटर्नशिप लचीले घंटे देती हैं, लेकिन अपेक्षित साप्ताहिक प्रतिबद्धता की पुष्टि करें।' },
    { q_en: 'What skills are valuable for product management interns?', a_en: 'Useful PM skills: communication, empathy, basic analytics (SQL/Excel), prioritization, roadmap thinking, and writing clear requirement notes.', q_hi: 'प्रोडक्ट मैनेजमेंट इंटर्न के लिए कौन से कौशल मूल्यवान हैं?', a_hi: 'महत्वपूर्ण कौशल: संचार, सहानुभूति, बुनियादी एनालिटिक्स (SQL/Excel), प्राथमिकता निर्धारण, रोडमैप सोच, और स्पष्ट आवश्यकता नोट लिखना।' },
    { q_en: 'How to prepare for data analyst internships?', a_en: 'Learn SQL, Excel, Python basics, data cleaning, and visualization tools (Tableau/PowerBI). Build a small dashboard project demonstrating insights.', q_hi: 'डेटा एनालिस्ट इंटर्नशिप के लिए कैसे तैयार करें?', a_hi: 'SQL, Excel, Python मूल बातें, डेटा क्लीनिंग और विज़ुअलाइज़ेशन टूल (Tableau/PowerBI) सीखें। एक छोटा डैशबोर्ड प्रोजेक्ट बनाएं।' },
    { q_en: 'What should non-technical students highlight?', a_en: 'Highlight communication, project coordination, research, writing samples, community work, and any tools (Google Sheets, CMS) you used.', q_hi: 'गैर-तकनीकी छात्रों को क्या हाइलाइट करना चाहिए?', a_hi: 'संचार, प्रोजेक्ट समन्वय, अनुसंधान, लेखन नमूने, सामुदायिक कार्य और किसी भी उपकरण (Google Sheets, CMS) का उल्लेख करें।' },
  ];

  return (
    <div className="mt-3 rounded-md border bg-gray-50 p-3">
      <h4 className="mb-2 text-sm font-semibold">{lang === 'en' ? 'FAQ' : 'सच में पूछे जाने वाले प्रश्न'} </h4>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details key={i} className="group rounded-md border bg-white p-3">
            <summary className="cursor-pointer font-medium">{lang === 'en' ? f.q_en : f.q_hi}</summary>
            <div className="mt-2 text-sm whitespace-pre-wrap">{lang === 'en' ? f.a_en : f.a_hi}</div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded bg-primary px-2 py-1 text-white"
                onClick={() => {
                  try { window.dispatchEvent(new CustomEvent('im.ask', { detail: { text: lang === 'en' ? f.q_en : f.q_hi } })); } catch {}
                }}
              >
                {lang === 'en' ? 'Ask' : 'पूछें'}
              </button>
              <button
                className="rounded border px-2 py-1"
                onClick={() => {
                  const text = lang === 'en' ? f.q_en + '\n\n' + f.a_en : f.q_hi + '\n\n' + f.a_hi;
                  navigator.clipboard?.writeText(text).catch(() => {});
                }}
              >
                {lang === 'en' ? 'Copy' : 'कॉपी'}
              </button>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
