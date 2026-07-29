// backend/seeds/seedQuestions.js
const mongoose = require('mongoose');
const Question = require('../school-backend/models/Questions');
require('dotenv').config();

// ── STEP 1: paste your real IDs here ──────────────
const IDS = {
  // Classes
  Grade9A:  '6a26b5064c72193be6a55af5',
  Grade10A: '6a26b4c9daceb4f16086a45c',
  Grade8A: '6a28b8d5f0bbe9ee69a0fcda',

  // Subjects
  maths:     '6a26b7364c72193be6a55af9',
  English:     '6a2b578b543e85633b08a642',
  Chimistry:     '6a2b5963543e85633b08a653',
};

// ── STEP 2: define your questions ─────────────────
const questions = [

  // ════════ GRADE 9 — MATHEMATICS — ALGEBRA ════════
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Linear Equations',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Solve: x + 5 = 12',
    options: ['5', '6', '7', '8'],
    answer: '7'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Linear Equations',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Simplify: 2x + 3x',
    options: ['5', '5x', '6x', '2x³'],
    answer: '5x'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Quadratic Equations',
    type: 'mcq', difficulty: 'medium', marks: 2,
    question: 'Factorise: x² − 9',
    options: ['(x+3)²', '(x−3)²', '(x+3)(x−3)', '(x+9)(x−1)'],
    answer: '(x+3)(x−3)'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Linear Equations',
    type: 'short', difficulty: 'easy', marks: 3,
    wordLimit: 50,
    question: 'Solve for x: 2x + 4 = 14. Show full working.',
    answer: '2x = 10, x = 5'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Simultaneous Equations',
    type: 'short', difficulty: 'medium', marks: 5,
    wordLimit: 80,
    question: 'Solve simultaneously: 2x + y = 7 and x − y = 2.',
    answer: 'Adding equations: 3x = 9, x = 3. Substituting: y = 1.'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Algebra', topic: 'Quadratic Equations',
    type: 'long', difficulty: 'hard', marks: 10,
    wordLimit: 200,
    question: 'Using the quadratic formula, solve 2x² + 3x − 2 = 0. Show all steps and verify your answers.',
    answer: 'a=2, b=3, c=−2. Discriminant=9+16=25. x=(−3±5)/4. x=0.5 or x=−2. Verify by substitution.'
  },

  // ════════ GRADE 9 — MATHEMATICS — GEOMETRY ════════
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Geometry', topic: 'Triangles',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Sum of all angles in a triangle?',
    options: ['90°', '180°', '270°', '360°'],
    answer: '180°'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Geometry', topic: 'Pythagoras Theorem',
    type: 'short', difficulty: 'easy', marks: 3,
    wordLimit: 60,
    question: 'Find the hypotenuse of a right triangle with legs 3 cm and 4 cm.',
    answer: 'c² = 9 + 16 = 25, c = 5 cm'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.math,
    chapter: 'Geometry', topic: 'Circles',
    type: 'long', difficulty: 'medium', marks: 8,
    wordLimit: 150,
    question: 'Find the area and circumference of a circle with radius 7 cm. (π = 22/7)',
    answer: 'Area = πr² = 22/7 × 49 = 154 cm². Circumference = 2πr = 2 × 22/7 × 7 = 44 cm.'
  },

  // ════════ GRADE 9 — PHYSICS — MOTION ════════
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Motion', topic: 'Speed and Velocity',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'SI unit of velocity?',
    options: ['m', 'm/s²', 'm/s', 'km/h'],
    answer: 'm/s'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Motion', topic: 'Acceleration',
    type: 'mcq', difficulty: 'medium', marks: 2,
    question: 'A car accelerates from 0 to 30 m/s in 6 s. Its acceleration is?',
    options: ['3 m/s²', '4 m/s²', '5 m/s²', '6 m/s²'],
    answer: '5 m/s²'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Motion', topic: 'Speed and Velocity',
    type: 'short', difficulty: 'easy', marks: 3,
    wordLimit: 60,
    question: 'Define velocity and state how it differs from speed.',
    answer: 'Velocity = displacement/time, is a vector. Speed = distance/time, is a scalar. Velocity has direction, speed does not.'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Motion', topic: 'Equations of Motion',
    type: 'long', difficulty: 'hard', marks: 12,
    wordLimit: 250,
    question: 'A train accelerates from 20 m/s to 50 m/s in 6 seconds. Calculate (a) acceleration (b) distance covered and (c) velocity after 10 seconds from rest.',
    answer: '(a) a=(50−20)/6=5 m/s². (b) d=ut+½at²=20×6+½×5×36=120+90=210 m. (c) v=0+5×10=50 m/s.'
  },

  // ════════ GRADE 9 — PHYSICS — FORCES ════════
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Forces', topic: 'Newton Laws',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'SI unit of force?',
    options: ['Joule', 'Watt', 'Newton', 'Pascal'],
    answer: 'Newton'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Forces', topic: 'Newton Laws',
    type: 'short', difficulty: 'medium', marks: 5,
    wordLimit: 80,
    question: 'State Newton\'s Second Law of Motion and write its mathematical form.',
    answer: 'The acceleration of an object is directly proportional to the net force and inversely proportional to its mass. F = ma.'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.physics,
    chapter: 'Forces', topic: 'Newton Laws',
    type: 'long', difficulty: 'medium', marks: 9,
    wordLimit: 200,
    question: 'State all three Newton\'s Laws of Motion with one real-life example of each.',
    answer: '1st: Inertia — seatbelt. 2nd: F=ma — heavier trolley needs more force. 3rd: Action-reaction — rocket propulsion.'
  },

  // ════════ GRADE 9 — ENGLISH — GRAMMAR ════════
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Grammar', topic: 'Parts of Speech',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Identify the noun: "The brave soldier fought valiantly."',
    options: ['brave', 'soldier', 'fought', 'valiantly'],
    answer: 'soldier'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Grammar', topic: 'Tenses',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Which sentence is in passive voice?',
    options: [
      'She ate the cake.',
      'The cake was eaten by her.',
      'She will eat the cake.',
      'She is eating.'
    ],
    answer: 'The cake was eaten by her.'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Grammar', topic: 'Indirect Speech',
    type: 'short', difficulty: 'medium', marks: 4,
    wordLimit: 60,
    question: 'Convert to indirect speech: He said, "I am going to school."',
    answer: 'He said that he was going to school.'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Grammar', topic: 'Tenses',
    type: 'long', difficulty: 'medium', marks: 10,
    wordLimit: 300,
    question: 'Explain the 12 tenses in English. Give one example sentence and state when each tense is used.',
    answer: 'Simple/Continuous/Perfect/Perfect Continuous × Present/Past/Future. Each defined with example and usage context.'
  },

  // ════════ GRADE 9 — ENGLISH — LITERATURE ════════
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Literature', topic: 'Literary Devices',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: '"The wind whispered through the trees." This is an example of?',
    options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
    answer: 'Personification'
  },
  {
    classId: IDS.grade9A, subjectId: IDS.english,
    chapter: 'Literature', topic: 'Essay Writing',
    type: 'long', difficulty: 'hard', marks: 15,
    wordLimit: 350,
    question: 'Write a persuasive essay (min 250 words): "Social media does more harm than good to teenagers."',
    answer: 'Thesis + 3 supporting arguments (mental health, distraction, misinformation) + counterargument + conclusion.'
  },

  // ════════ GRADE 10 — MATHEMATICS — CALCULUS ════════
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Differentiation',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Derivative of x²?',
    options: ['x', '2x', '2', 'x²'],
    answer: '2x'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Differentiation',
    type: 'mcq', difficulty: 'medium', marks: 2,
    question: 'Derivative of f(x) = x³ + 4x² − 2x + 7?',
    options: ['3x²+8x+2', '3x²+8x−2', '3x²−8x−2', 'x²+8x−2'],
    answer: '3x²+8x−2'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Integration',
    type: 'mcq', difficulty: 'hard', marks: 3,
    question: '∫(3x² + 2x) dx = ?',
    options: ['x³+x²+C', '6x+2+C', '3x³+2x²+C', 'x³+x+C'],
    answer: 'x³+x²+C'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Differentiation',
    type: 'short', difficulty: 'easy', marks: 3,
    wordLimit: 60,
    question: 'Differentiate f(x) = 3x² + 2x + 5',
    answer: "f'(x) = 6x + 2"
  },
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Integration',
    type: 'short', difficulty: 'medium', marks: 6,
    wordLimit: 100,
    question: 'Find the area under f(x) = x² from x = 0 to x = 3 using integration.',
    answer: '∫₀³ x² dx = [x³/3]₀³ = 27/3 − 0 = 9 square units.'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.math,
    chapter: 'Calculus', topic: 'Applications',
    type: 'long', difficulty: 'hard', marks: 15,
    wordLimit: 300,
    question: 'A ball is thrown upward. Height: h(t) = 20t − 5t². Find (a) maximum height (b) time to reach it (c) when it hits the ground.',
    answer: "(a) h'(t)=20−10t=0 → t=2s. h(2)=40−20=20m. (b) t=2s. (c) h(t)=0 → t(20−5t)=0 → t=4s."
  },

  // ════════ GRADE 10 — CHEMISTRY ════════
  {
    classId: IDS.grade10A, subjectId: IDS.chemistry,
    chapter: 'Atomic Structure', topic: 'Atoms and Elements',
    type: 'mcq', difficulty: 'easy', marks: 1,
    question: 'Atomic number of Carbon?',
    options: ['4', '6', '8', '12'],
    answer: '6'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.chemistry,
    chapter: 'Chemical Bonding', topic: 'Ionic Bonds',
    type: 'short', difficulty: 'medium', marks: 4,
    wordLimit: 80,
    question: 'Explain the formation of an ionic bond between sodium and chlorine.',
    answer: 'Na loses 1 electron → Na⁺. Cl gains 1 electron → Cl⁻. Electrostatic attraction between oppositely charged ions forms NaCl.'
  },
  {
    classId: IDS.grade10A, subjectId: IDS.chemistry,
    chapter: 'Acids and Bases', topic: 'Neutralisation',
    type: 'long', difficulty: 'medium', marks: 8,
    wordLimit: 200,
    question: 'Define acids and bases. Give two examples of each and write one balanced neutralisation reaction.',
    answer: 'Acids: HCl, H₂SO₄. Bases: NaOH, KOH. HCl + NaOH → NaCl + H₂O.'
  },
];

// ── STEP 3: run the seed ───────────────────────────
async function seed() {
  await mongoose.connect('mongodb://localhost:27017/school');
  console.log('Connected to MongoDB');

  // Optional: clear existing questions first
  // await Question.deleteMany({});
  // console.log('Cleared existing questions');

  const result = await Question.insertMany(questions, { ordered: false });
  console.log(`✅ Inserted ${result.length} questions`);

  // Show a summary
  const byClass = {};
  result.forEach(q => {
    const key = q.classId.toString();
    byClass[key] = (byClass[key] || 0) + 1;
  });
  console.table(byClass);

  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});