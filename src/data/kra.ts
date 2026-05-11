export type Objective =
  | "P&L Delivery"
  | "Future Proofing"
  | "Talent Development"
  | "Capex"
  | "BD, M&A & Growth"
  | "Digitization & Tech";

export const objectiveStyles: Record<Objective, { gradient: string; chip: string; dot: string }> = {
  "P&L Delivery": {
    gradient: "var(--gradient-primary)",
    chip: "bg-[oklch(0.95_0.06_240)] text-[oklch(0.4_0.18_250)]",
    dot: "bg-[oklch(0.6_0.2_250)]",
  },
  "Future Proofing": {
    gradient: "var(--gradient-magenta)",
    chip: "bg-[oklch(0.95_0.06_320)] text-[oklch(0.4_0.2_320)]",
    dot: "bg-[oklch(0.6_0.24_320)]",
  },
  "Talent Development": {
    gradient: "var(--gradient-success)",
    chip: "bg-[oklch(0.95_0.06_160)] text-[oklch(0.4_0.16_160)]",
    dot: "bg-[oklch(0.62_0.18_160)]",
  },
  "Capex": {
    gradient: "var(--gradient-warm)",
    chip: "bg-[oklch(0.95_0.06_60)] text-[oklch(0.42_0.18_50)]",
    dot: "bg-[oklch(0.7_0.18_50)]",
  },
  "BD, M&A & Growth": {
    gradient: "linear-gradient(135deg, oklch(0.7 0.2 200), oklch(0.55 0.22 230))",
    chip: "bg-[oklch(0.95_0.06_210)] text-[oklch(0.4_0.18_215)]",
    dot: "bg-[oklch(0.62_0.2_215)]",
  },
  "Digitization & Tech": {
    gradient: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.24 270))",
    chip: "bg-[oklch(0.95_0.06_290)] text-[oklch(0.4_0.2_285)]",
    dot: "bg-[oklch(0.6_0.22_285)]",
  },
};

export type CascadeAssignment = {
  code: string;
  target: number | string;
  weight: number;
};

export type KRA = {
  id: string;
  objective: Objective;
  subObjective: string;
  description: string;
  uom: string;
  target: number | string;
  weight: number;
  progress: number;
  cascadedTo: CascadeAssignment[];
  timeFrame: "Annually" | "Quarterly" | "Monthly";
  evaluation: "Quantitative" | "Qualitative";
  status: "Submitted" | "Draft" | "In Review";
  owner: string;
};

/** Build default per-member cascade assignments by evenly splitting weight
 *  and (when numeric) target across members. */
export function defaultCascade(
  codes: string[],
  parentTarget: number | string,
  parentWeight: number,
): CascadeAssignment[] {
  if (codes.length === 0) return [];
  const w = Math.round((parentWeight / codes.length) * 10) / 10;
  const isNum = typeof parentTarget === "number";
  const t = isNum
    ? Math.round(((parentTarget as number) / codes.length) * 10) / 10
    : parentTarget;
  return codes.map((code) => ({ code, target: t, weight: w }));
}

export const ceo = {
  name: "Ashish Rajvanshi",
  initials: "AR",
  role: "CEO — ADSTL",
  reports: 16,
};

export const seniorTeam = [
  { code: "SJ", name: "Sandeep Jain", area: "UAV / CDS / Loitering Munitions", category: "Line" },
  { code: "AW", name: "Ashok Wadhawan", area: "Land Systems & Ammunition", category: "Line" },
  { code: "AS", name: "Ajay Soni", area: "Small Arms", category: "Line" },
  { code: "RT", name: "Rakesh Tated", area: "AEWACS", category: "Line" },
  { code: "AB", name: "Anand Bhide", area: "MRO", category: "Line" },
  { code: "PK", name: "Prakash Kulkarni", area: "Rotary Platforms", category: "Line" },
  { code: "VA", name: "Vinay Acharya", area: "Commercial Jets", category: "Line" },
  { code: "VRRK", name: "V. Ramakrishna", area: "DCPP Programs", category: "Line" },
  { code: "SU", name: "Suresh Unni", area: "International BD", category: "Line" },
  { code: "HV", name: "Harshad Vyas", area: "M&A", category: "Staff" },
  { code: "VP", name: "Vikram Patel", area: "CPO", category: "Staff" },
  { code: "RV", name: "Rajeev Verma", area: "Digital / CDO", category: "Staff" },
  { code: "MJ", name: "Manish Jain", area: "CFO", category: "Staff" },
  { code: "KK", name: "Krishna Kumar", area: "Capex Projects", category: "Staff" },
];

type KraSeed = Omit<KRA, "cascadedTo"> & { cascadedTo: string[] };
const _kraSeeds: KraSeed[] = [
  {
    id: "kra-001",
    objective: "P&L Delivery",
    subObjective: "Business Development",
    description: "Generate qualified opportunity pipeline across responsibility areas",
    uom: "# of Leads",
    target: 40,
    weight: 8,
    progress: 62,
    cascadedTo: ["AW", "AS", "RT", "PK", "VA", "VRRK"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-002",
    objective: "P&L Delivery",
    subObjective: "Revenue",
    description: "Achieve invoiced revenue target across all line functions",
    uom: "Rs Cr",
    target: 4500,
    weight: 12,
    progress: 48,
    cascadedTo: ["AW", "AS", "RT", "AB", "VA", "VRRK"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-003",
    objective: "P&L Delivery",
    subObjective: "EBITDA",
    description: "Reported EBITDA as % of invoiced revenue",
    uom: "% of Revenue",
    target: 18,
    weight: 10,
    progress: 71,
    cascadedTo: ["AW", "AS", "VRRK", "MJ"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-004",
    objective: "P&L Delivery",
    subObjective: "Stakeholder Management",
    description: "Engagement with MOD & Tri-services stakeholders",
    uom: "# of stakeholders",
    target: 25,
    weight: 5,
    progress: 80,
    cascadedTo: ["SU", "SJ"],
    timeFrame: "Quarterly",
    evaluation: "Qualitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-005",
    objective: "Future Proofing",
    subObjective: "DPSU Partnerships",
    description: "MOUs signed with Defence Public Sector Undertakings",
    uom: "# of MOUs",
    target: 5,
    weight: 6,
    progress: 40,
    cascadedTo: ["AW", "AS", "RT", "VA"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-006",
    objective: "Future Proofing",
    subObjective: "GCC Implementation",
    description: "Transition IT, HR, Finance & TC to Global Capability Centers",
    uom: "Y/N (4 functions)",
    target: "4/4",
    weight: 7,
    progress: 50,
    cascadedTo: ["RV", "VP", "MJ"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-007",
    objective: "Future Proofing",
    subObjective: "Business Excellence Maturity",
    description: "Achieve target AWMA rating across locations",
    uom: "AWMA Rating",
    target: 4.2,
    weight: 4,
    progress: 65,
    cascadedTo: ["AW", "AS", "VRRK", "AB"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "In Review",
    owner: "CEO",
  },
  {
    id: "kra-008",
    objective: "Talent Development",
    subObjective: "Capacity Building",
    description: "Hire Seeker team and capacity expansion crews across plants",
    uom: "# hired",
    target: 320,
    weight: 7,
    progress: 55,
    cascadedTo: ["VRRK", "AW", "VP"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-009",
    objective: "Talent Development",
    subObjective: "Succession Proofing (N-1, N-2)",
    description: "Identify immediate & short-term replacements for direct reportees",
    uom: "# vs reportees",
    target: "100%",
    weight: 5,
    progress: 70,
    cascadedTo: ["VP"],
    timeFrame: "Annually",
    evaluation: "Qualitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-010",
    objective: "Talent Development",
    subObjective: "Future Ready Organization",
    description: "Young leaders identified to groom into larger roles",
    uom: "# leaders",
    target: 30,
    weight: 4,
    progress: 45,
    cascadedTo: ["VP", "AW", "AS", "RT"],
    timeFrame: "Annually",
    evaluation: "Qualitative",
    status: "Draft",
    owner: "CEO",
  },
  {
    id: "kra-011",
    objective: "Capex",
    subObjective: "Capex Deployment",
    description: "Achieve overall capex budget for FY 2025-26",
    uom: "Rs Cr",
    target: 1200,
    weight: 8,
    progress: 58,
    cascadedTo: ["AW", "VRRK", "KK"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-012",
    objective: "Capex",
    subObjective: "Project Commissioning",
    description: "Small caliber (300Mn) & large caliber (150K) on time with QA",
    uom: "Y/N",
    target: "On time",
    weight: 6,
    progress: 42,
    cascadedTo: ["AW", "KK"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-013",
    objective: "BD, M&A & Growth",
    subObjective: "International Partnerships",
    description: "Step up partnerships with strategic international cos",
    uom: "# partnerships",
    target: 3,
    weight: 5,
    progress: 33,
    cascadedTo: ["SU"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-014",
    objective: "BD, M&A & Growth",
    subObjective: "M&A Closures",
    description: "Close any 2 of identified M&A transactions",
    uom: "# closed",
    target: 2,
    weight: 5,
    progress: 50,
    cascadedTo: ["HV"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "In Review",
    owner: "CEO",
  },
  {
    id: "kra-015",
    objective: "Digitization & Tech",
    subObjective: "AI for Quality (Ammunition)",
    description: "AI network on shopfloor & MES integration — Kanpur",
    uom: "Y/N",
    target: "Live",
    weight: 4,
    progress: 60,
    cascadedTo: ["RV"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Submitted",
    owner: "CEO",
  },
  {
    id: "kra-016",
    objective: "Digitization & Tech",
    subObjective: "MES SAP Integration",
    description: "Across Small Arms (Gwalior) & Missile complex (Hyderabad)",
    uom: "Y/N",
    target: "Both live",
    weight: 4,
    progress: 35,
    cascadedTo: ["RV", "VRRK"],
    timeFrame: "Annually",
    evaluation: "Quantitative",
    status: "Draft",
    owner: "CEO",
  },
];

export const kras: KRA[] = _kraSeeds.map((s) => ({
  ...s,
  cascadedTo: defaultCascade(s.cascadedTo, s.target, s.weight),
}));

export const objectiveTotals = () => {
  const m = new Map<Objective, { weight: number; progress: number; count: number }>();
  for (const k of kras) {
    const cur = m.get(k.objective) ?? { weight: 0, progress: 0, count: 0 };
    cur.weight += k.weight;
    cur.progress += k.progress * k.weight;
    cur.count += 1;
    m.set(k.objective, cur);
  }
  return Array.from(m.entries()).map(([objective, v]) => ({
    objective,
    weight: v.weight,
    count: v.count,
    avgProgress: Math.round(v.progress / Math.max(v.weight, 1)),
  }));
};

export const totals = () => {
  const totalWeight = kras.reduce((s, k) => s + k.weight, 0);
  const weighted = kras.reduce((s, k) => s + k.progress * k.weight, 0);
  return {
    total: kras.length,
    submitted: kras.filter((k) => k.status === "Submitted").length,
    drafts: kras.filter((k) => k.status === "Draft").length,
    inReview: kras.filter((k) => k.status === "In Review").length,
    cascaded: kras.filter((k) => k.cascadedTo.length > 0).length,
    weight: totalWeight,
    avgProgress: Math.round(weighted / Math.max(totalWeight, 1)),
  };
};