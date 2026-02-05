
import { Course } from './types';

export const ADMIN_PIN = '1234';

export const VIDEO_STORYBOARD = [
  {
    start: 0,
    end: 20,
    subtitle: "Moduli 1",
    title: "Korniza Ligjore dhe Etika",
    body: "Kuptimi i Ligjit të Kosovës Nr. 04/L-161 dhe bazat etike të sigurisë në vendin e punës."
  },
  {
    start: 20,
    end: 45,
    subtitle: "Moduli 2",
    title: "Të Drejtat dhe Përgjegjësitë",
    body: "Punëdhënësit duhet të ofrojnë një mjedis të sigurt; punëmarrësit duhet të ndjekin protokollet dhe të raportojnë rreziqet."
  },
  {
    start: 45,
    end: 75,
    subtitle: "Moduli 3",
    title: "Identifikimi i Rreziqeve",
    body: "Nga rreziqet elektrike te derdhjet kimike, mësoni si të dalloni rreziqet e mundshme para se të shkaktojnë dëm."
  },
  {
    start: 75,
    end: 95,
    subtitle: "Moduli 4",
    title: "Ergonomia dhe Qëndrimi",
    body: "Teknikat e sakta të uljes dhe ngritjes së peshave janë thelbësore për shëndetin afatgjatë dhe parandalimin e lëndimeve."
  },
  {
    start: 95,
    end: 110,
    subtitle: "Moduli 5",
    title: "Plani i Veprimit në Emergjenca",
    body: "Hapat që duhen marrë gjatë zjarrit, emergjencave mjekësore ose evakuimeve për të garantuar sigurinë e të gjithëve."
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'safety-general',
    title: 'SSHP: Siguria dhe Shëndeti në Punë',
    isActive: true,
    createdAt: new Date().toISOString(),
    videoUrl: 'https://vimeo.com/placeholder1',
    introText: `Siguria dhe Shëndeti në Punë (SSHP) nuk është vetëm kërkesë ligjore – është përkushtim për mirëqenien e çdo personi në ndërtesë.

Bazuar në Ligjin e Kosovës Nr. 04/L-161, ky trajnim ofron njohuri praktike për të mbajtur veten dhe kolegët tuaj të sigurt.

**Çfarë do të mësoni:**
• Të drejtat tuaja dhe përgjegjësitë ligjore në vendin e punës.
• Si të identifikoni dhe trajtoni rreziqet (Zjarri, Energjia elektrike, Kimikatet).
• Hapat praktikë për raste emergjente dhe qëndrimin e shëndetshëm gjatë punës.

Ky trajnim zgjat rreth 25 minuta. Ju lutemi sigurohuni që jeni në një vend të qetë ku mund të dëgjoni audion ose të lexoni udhëzimet me kujdes.`,
    videoChapters: [
      { title: "Ligji dhe Etika", startTime: 0 },
      { title: "Përgjegjësitë", startTime: 20 },
      { title: "Rreziqet në Punë", startTime: 45 },
      { title: "Ergonomia", startTime: 75 },
      { title: "Plani i Veprimit", startTime: 95 }
    ],
    checkpoints: [
      {
        time: 30,
        question: "A është punëdhënësi përgjegjës për kostot e pajisjeve të sigurisë?",
        options: ["Po, gjithmonë", "Jo, punëtori paguan vetë"],
        correctIndex: 0
      },
      {
        time: 65,
        question: "Cila klasë e fikësit të zjarrit është posaçërisht për zjarret elektrike?",
        options: ["Klasa A", "Klasa E"],
        correctIndex: 1
      },
      {
        time: 100,
        question: "Në një emergjencë, cili është prioriteti i parë?",
        options: ["Kontrolli i viktimës", "Sigurimi që vendi i ngjarjes është i sigurt"],
        correctIndex: 1
      }
    ],
    questions: [
      { 
        id: 1, 
        text: "Siguria dhe shëndeti është përgjegjësi vetëm e menaxherit.", 
        options: ["E saktë", "E gabuar"], 
        correctIndex: 1, 
        type: 'true-false',
        imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=600&h=300" 
      },
      { 
        id: 2, 
        text: "Punëdhënësit duhet të ofrojnë trajnime sigurie pa asnjë kosto për punëtorin.", 
        options: ["E saktë", "E gabuar"], 
        correctIndex: 0, 
        type: 'true-false',
        imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb28f74b573?auto=format&fit=crop&q=80&w=600&h=300"
      },
      { 
        id: 3, 
        text: "Cili ligj rregullon sigurinë në punë në Kosovë?", 
        options: ["Ligji Nr. 04/L-161", "Ligji Nr. 03/L-212"], 
        correctIndex: 0, 
        type: 'multiple-choice',
        imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600&h=300"
      },
      { 
        id: 4, 
        text: "Raportimi i rrezikut duhet të ndodhë menjëherë sapo të vërehet një rrezik.", 
        options: ["E saktë", "E gabuar"], 
        correctIndex: 0, 
        type: 'true-false',
        imageUrl: "https://images.unsplash.com/photo-1590105577767-e21a46b530f6?auto=format&fit=crop&q=80&w=600&h=300"
      },
      { 
        id: 5, 
        text: "Skenari: Shohni një kabllo të shtrirë përgjatë rrugës ku kalojnë njerëzit. Cili është veprimi juaj i parë?", 
        options: ["Kaloj sipër saj", "E raportoj/rregulloj menjëherë", "Pres derisa të rrëzohet dikush"], 
        correctIndex: 1, 
        type: 'multiple-choice', 
        isScenario: true,
        imageUrl: "https://images.unsplash.com/photo-1581235720704-06d3acfc136f?auto=format&fit=crop&q=80&w=600&h=300" 
      }
    ]
  }
];
