/** Shared ANSH ecosystem apps — used on landing + in-app sidebar. */
export type AnshEcosystemApp = {
  name: string;
  subtitle: string;
  description: string;
  status: "BUILDING" | "LIVE" | "CURRENT";
  isLive: boolean;
  badgeText: string;
  badgeColor: string;
  dotColor: string;
  borderColor: string;
  image?: string;
  link: string;
};

export const ANSH_ECOSYSTEM_APPS: AnshEcosystemApp[] = [
  {
    name: "ANSH Booking",
    subtitle: "Meeting room & resource booking",
    description: "Reserve rooms, assets and slots with ease",
    status: "BUILDING",
    isLive: false,
    badgeText: "BUILDING",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    dotColor: "bg-rose-500",
    borderColor: "hover:border-rose-500/35 hover:shadow-rose-500/5",
    link: "https://anshapps.com",
  },
  {
    name: "ANSH Visitor",
    subtitle: "Smart lobby & guest management",
    description: "QR passes, ID verification, check-in logs",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    dotColor: "bg-violet-500",
    borderColor: "hover:border-violet-500/30 hover:shadow-violet-500/5",
    image: "/ANSH Visitor.jpg",
    link: "https://visitor.anshapps.com",
  },
  {
    name: "ANSH Tasks",
    subtitle: "Team task & project tracker",
    description: "Assign, track and close tasks across teams",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    dotColor: "bg-sky-500",
    borderColor: "hover:border-sky-500/35 hover:shadow-sky-500/5",
    image: "/Ansh Task.jpg",
    link: "https://tasks.anshapps.com",
  },
  {
    name: "ANSH HR",
    subtitle: "Human resource management",
    description: "Employee records, leaves, payroll & more",
    status: "CURRENT",
    isLive: true,
    badgeText: "YOU ARE HERE",
    badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30 animate-pulse",
    dotColor: "bg-[#7000FF]",
    borderColor: "border-violet-500/40 hover:border-violet-500/60 shadow-violet-500/5",
    image: "/ANSH HR.jpg",
    link: "https://hr.anshapps.com",
  },
  {
    name: "ANSH Expense",
    subtitle: "Expense & reimbursement tracking",
    description: "Submit, approve and audit business expenses",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-500",
    borderColor: "hover:border-amber-500/35 hover:shadow-amber-500/5",
    image: "/ANSH Expense.jpg",
    link: "https://expense.anshapps.com",
  },
  {
    name: "ANSH Forms",
    subtitle: "Smart form builder",
    description: "Create forms, collect responses & track submissions",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-500",
    borderColor: "hover:border-emerald-500/35 hover:shadow-emerald-500/5",
    image: "/ANSH Forms.jpg",
    link: "https://forms.anshapps.com",
  },
  {
    name: "ANSH Links",
    subtitle: "Link-in-bio profile builder",
    description: "Showcase identity, social links, WhatsApp & UPI in one page",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25",
    dotColor: "bg-pink-500",
    borderColor: "hover:border-pink-500/35 hover:shadow-pink-500/5",
    image: "/ANSH Links.jpg",
    link: "https://links.anshapps.com",
  },
];
