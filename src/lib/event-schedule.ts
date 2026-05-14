export type TimePeriod = "morning" | "afternoon" | "evening";

export interface EventSession {
  id: string;
  title: string;
  speaker: string;
  role: string;
  company: string;
  period: TimePeriod;
  time: string;
  duration: string;
  track: string;
  description: string;
  tags: string[];
}

export const EVENT_DATE = "November 14, 2025";
export const EVENT_NAME = "Web Summit 2025";

export const eventSessions: EventSession[] = [
  {
    id: "keynote-1",
    title: "Opening Keynote: The Future of AI-Native Products",
    speaker: "Ana Rodrigues",
    role: "CEO",
    company: "NeuralForge",
    period: "morning",
    time: "9:00 AM",
    duration: "45 min",
    track: "Main Stage",
    description:
      "How AI is reshaping product development from the ground up. Lessons from building AI-native tools used by 50k+ developers.",
    tags: ["AI", "Product", "Keynote"],
  },
  {
    id: "panel-1",
    title: "Panel: Fundraising in the Age of AI",
    speaker: "Multiple Speakers",
    role: "VCs & Founders",
    company: "Various",
    period: "morning",
    time: "10:00 AM",
    duration: "40 min",
    track: "Investor Stage",
    description:
      "Top VCs and founders discuss what's hot, what's not, and how to pitch AI startups in 2025.",
    tags: ["Fundraising", "VC", "Startups"],
  },
  {
    id: "talk-1",
    title: "Building Developer Tools That Scale",
    speaker: "Marcus Chen",
    role: "CTO",
    company: "DevStack",
    period: "morning",
    time: "11:00 AM",
    duration: "30 min",
    track: "Developer Stage",
    description:
      "Technical deep-dive into building developer tools that go from 100 to 100k users without breaking.",
    tags: ["DevTools", "Engineering", "Scale"],
  },
  {
    id: "workshop-1",
    title: "Workshop: Prompt Engineering for Product Teams",
    speaker: "Sophie Laurent",
    role: "Head of AI",
    company: "CraftAI",
    period: "morning",
    time: "11:30 AM",
    duration: "60 min",
    track: "Workshop Room A",
    description:
      "Hands-on workshop for product managers and designers on integrating LLMs into user-facing features.",
    tags: ["AI", "Workshop", "Product"],
  },
  {
    id: "panel-2",
    title: "Panel: AI Ethics & Governance in Practice",
    speaker: "Multiple Speakers",
    role: "Policy & Tech Leaders",
    company: "Various",
    period: "afternoon",
    time: "1:30 PM",
    duration: "40 min",
    track: "Policy Stage",
    description:
      "Moving beyond theory — how companies are actually implementing AI governance frameworks today.",
    tags: ["Ethics", "Governance", "AI Safety"],
  },
  {
    id: "talk-2",
    title: "From Research to Production: Bridging the Gap",
    speaker: "Dr. Yuki Tanaka",
    role: "Research Lead",
    company: "DeepScale AI",
    period: "afternoon",
    time: "2:30 PM",
    duration: "30 min",
    track: "AI Stage",
    description:
      "Practical strategies for taking ML models from Jupyter notebooks to production systems serving millions.",
    tags: ["MLOps", "Engineering", "AI"],
  },
  {
    id: "talk-3",
    title: "The New GTM: Product-Led Growth for AI Startups",
    speaker: "Elena Vasquez",
    role: "VP Growth",
    company: "ScaleAI",
    period: "afternoon",
    time: "3:15 PM",
    duration: "30 min",
    track: "Growth Stage",
    description:
      "Why traditional sales playbooks don't work for AI products and what to do instead.",
    tags: ["Growth", "GTM", "Startups"],
  },
  {
    id: "panel-3",
    title: "Panel: Climate Tech & AI — Real Impact",
    speaker: "Multiple Speakers",
    role: "Climate Founders",
    company: "Various",
    period: "afternoon",
    time: "4:00 PM",
    duration: "40 min",
    track: "Impact Stage",
    description:
      "Founders using AI to tackle climate change share what's working and what's greenwashing.",
    tags: ["Climate", "AI", "Impact"],
  },
  {
    id: "networking-1",
    title: "Networking Mixer: AI & Developer Tools",
    speaker: "Hosted by Agent Bond",
    role: "Community",
    company: "Agent Bond",
    period: "evening",
    time: "6:00 PM",
    duration: "90 min",
    track: "Networking Hall",
    description:
      "Curated networking session for AI and developer tool builders. Your AI twin has already found your best matches.",
    tags: ["Networking", "AI", "DevTools"],
  },
  {
    id: "talk-4",
    title: "Fireside Chat: Building in Public",
    speaker: "James Liu",
    role: "Founder",
    company: "OpenBuild",
    period: "evening",
    time: "7:30 PM",
    duration: "30 min",
    track: "Main Stage",
    description:
      "An honest conversation about the highs and lows of building a startup with radical transparency.",
    tags: ["Startups", "Community", "Open Source"],
  },
  {
    id: "networking-2",
    title: "Investor Dinner (Invite Only)",
    speaker: "Hosted by Horizon Ventures",
    role: "VC Partners",
    company: "Horizon Ventures",
    period: "evening",
    time: "8:00 PM",
    duration: "120 min",
    track: "Private Dining",
    description:
      "Intimate dinner connecting selected founders with top-tier investors for deep conversations.",
    tags: ["Investor", "Dinner", "Networking"],
  },
];

export const PERIOD_INFO: Record<
  TimePeriod,
  { label: string; time: string; description: string }
> = {
  morning: {
    label: "Morning",
    time: "9:00 AM – 12:00 PM",
    description: "Keynotes, talks, and workshops",
  },
  afternoon: {
    label: "Afternoon",
    time: "1:30 PM – 5:00 PM",
    description: "Panels, deep-dives, and demos",
  },
  evening: {
    label: "Evening",
    time: "6:00 PM – 10:00 PM",
    description: "Networking mixers and social events",
  },
};
