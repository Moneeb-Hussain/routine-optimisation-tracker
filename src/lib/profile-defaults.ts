export type StrongestProject = {
  name: string;
  bullets: string[];
};

export const DEFAULT_RESEARCH_INTERESTS = [
  "Computer vision",
  "Applied artificial intelligence",
  "Intelligent automation",
  "Mechatronics",
  "Robotics and autonomous systems",
  "Hardware-software integrated systems",
  "Intelligent sensing",
  "Embedded systems",
  "Multimodal AI",
  "Computational imaging",
  "Robust perception",
  "Cyber-physical systems",
  "AI for agriculture",
  "AI for healthcare",
  "AI for environmental applications",
  "Software engineering",
] as const;

export const DEFAULT_STRONGEST_PROJECT: StrongestProject = {
  name: "Automatic Retail Checkout V-3",
  bullets: [
    "YOLOv4-tiny and OpenCV",
    "Barcode-free product detection, counting and billing",
    "Custom dataset of 3,500 conveyor-captured images",
    "70 retail-product classes",
    "Conveyor hardware integration",
    "Controlled lighting",
    "GUI billing and receipt generation",
    "98.78% detection accuracy in controlled testing",
    "Reduced per-item processing time from ~4s to under 1s",
  ],
};

export const DEFAULT_ACHIEVEMENTS = [
  "Winner, Harvard CS50x Puzzle Day, perfect 10/10",
  "Top 4%, HackerRank Orchestrate, among 10,000+ participants",
  "Top 8% worldwide, UCLA CodeSprint, among 220+ teams",
  "Pre-Finalist and Special Honour, International Computer Science Competition 2026",
  "Trainer and Curriculum Contributor at iCodeGuru",
  "Mentored more than 150 learners in Python, DSA, AI/ML and Generative AI",
] as const;

export const DEFAULT_GOAL_TREE = [
  {
    title: "Reach the United States for Graduate Study",
    horizon: "long_term" as const,
    children: [
      "Build a competitive research profile",
      "Identify high-fit professors",
      "Send strong personalized emails",
      "Secure professor conversations",
      "Prepare applications",
      "Improve technical skills",
      "Prepare for interviews",
      "Secure funding",
      "Complete visa and travel preparation",
    ],
  },
];

export const defaultProfileFields = {
  full_name: "Moneeb Hussain",
  degree: "BS in Mechatronics and Control Engineering",
  university: "UET Lahore",
  cgpa: 3.16,
  ielts_academic: 7.0,
  target_primary: "Funded MS or PhD opportunities in the United States",
  target_secondary: "Funded opportunities in Canada",
  target_intake: "2027",
  timezone: "Asia/Karachi",
  research_interests: [...DEFAULT_RESEARCH_INTERESTS],
  strongest_project: DEFAULT_STRONGEST_PROJECT,
  achievements: [...DEFAULT_ACHIEVEMENTS],
};
