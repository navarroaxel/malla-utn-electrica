import type { Dictionary } from "./es";

export const en: Dictionary = {
  app: {
    name: "malla-utn-electrica",
    title: "Curriculum map · Electrical Energy Engineering",
    description:
      "Interactive prerequisite map and graduate profile for the Electrical Energy Engineering degree at UTN FRBA.",
  },
  toolbar: {
    search: "Search",
    searchTitle: "Search subjects (/ or Ctrl+K)",
    view: "View",
    viewGraph: "Map",
    viewList: "List",
    progress: "My progress",
  },
  search: {
    title: "Search subjects",
    placeholder: "Subject name or number",
    results: (n: number) => (n === 1 ? "1 subject" : `${n} subjects`),
    none: "No subjects match.",
    close: "Close search",
  },
  progress: {
    region: "My progress",
    summaryRegion: "My progress summary",
    summary: (passed: number, taken: number, available: number) =>
      `${passed} passed · ${taken} taken · ${available} available now`,
    statusLabel: "Status of this subject",
    status: { none: "Not taken", taken: "Course taken", passed: "Passed" },
    state: {
      available: "Available",
      blocked: "Blocked",
      taken: "Course taken",
      passed: "Passed",
    },
    missing: "You are missing",
    missingItem: (name: string, requirement: "taken" | "passed") =>
      `${name} (${requirement === "passed" ? "passed" : "course taken"})`,
    missingTitle: (items: string[]) => `You are missing: ${items.join(", ")}`,
    code: "Your code",
    copyCode: "Copy code",
    copyLink: "Copy link",
    copied: "Copied!",
    importLabel: "Import code",
    importApply: "Apply",
    importInvalid: "The code is not valid for this curriculum.",
    clear: "Clear progress",
    clearConfirm: "Clear all your progress?",
    incoming: "This link carries saved progress.",
    incomingApply: "Replace mine",
    incomingIgnore: "Ignore",
    legendPassed: "Green fill and tag: passed",
    legendTaken: "Amber fill and tag: course taken",
    legendBlocked: "Dashed border and faded: prerequisites missing",
  },
  list: {
    label: "Subjects by level",
    caption: (level: string) => `Level ${level}`,
    number: "No.",
    subject: "Subject",
    taken: "Courses taken",
    passed: "Passed",
    status: "Status",
    lens: (code: string) => `Contribution to ${code}`,
    none: "—",
  },
  page: {
    back: "Back to the map",
    openPage: "Open this subject's page",
    subjectsNav: "Page of each subject",
  },
  notFound: {
    title: "We could not find this page",
    text: "The link may be misspelled or the subject no longer exists.",
    back: "Go to the map",
  },
  canvas: {
    ariaLabel: "Curriculum map: subjects and prerequisites",
    hint: "Click or press Enter on a subject to see its details. Keyboard: ← prerequisite, → subject it unlocks, ↑ ↓ same column, Esc to leave.",
    level: (roman: string) => `Level ${roman}`,
    showAll: "Show all prerequisites",
    legendTitle: "Legend",
    legendPassed: "Solid line: must be passed",
    legendTaken: "Dashed line: must be taken (course completed)",
    legendIntegrative: "Round shape: integrative subject",
    electiveTag: "Elective",
    legendElective: "«Elective» tag, below the map: elective subject",
    nodeAria: (
      name: string,
      level: number,
      taken: string[],
      passed: string[],
    ) => {
      const parts = [`${name}, level ${level}`];
      if (taken.length > 0)
        parts.push(`requires courses taken: ${taken.join(", ")}`);
      if (passed.length > 0)
        parts.push(`requires passed: ${passed.join(", ")}`);
      if (taken.length + passed.length === 0) parts.push("no prerequisites");
      return parts.join(", ");
    },
  },
  profile: {
    title: "What it adds to your profile",
    draft: "Draft",
    draftHint: "Content not yet validated by the faculty or the department.",
    reviewed: "Reviewed",
    reviewedBy: (who: string) => `Reviewed by ${who}`,
    noSummary: "There is no summary for this subject yet.",
    competencies: "Competencies",
    noCompetencies: "No competencies have been assigned to this subject yet.",
    activities: "Scope of the degree",
    scopeLegend:
      "AR: reserved professional activity · AL: other scope of the degree",
    noActivities: "No scope of the degree is linked to this subject yet.",
    showInMap: "Show on the map",
    levels: {
      contributes: "Contributes",
      introduces: "Introduces",
      develops: "Develops",
      consolidates: "Consolidates",
    },
  },
  lens: {
    label: "Competency",
    none: "No lens",
    legend: "Competency lens",
    empty: "No subjects are assigned to this competency yet (draft content).",
    groups: {
      technological: "Generic · technological",
      "social-political-attitudinal":
        "Generic · social, political and attitudinal",
      specific: "Specific",
    },
  },
  schedule: {
    title: "Timetable",
    reference: (year: number, plan: string, target: number) =>
      `Reference: ${year} timetable (${plan}). Not yet confirmed for ${target}.`,
    confirmed: (year: number) => `Timetable confirmed for ${year}.`,
    venue: (name: string) => `Venue: ${name}`,
    division: "Division",
    time: (from: string, to: string) => `${from} to ${to}`,
    timesNote:
      "Times come from the UTN class-hour table, which applies to every degree.",
    modules: (modules: string) => `modules ${modules}`,
    moduleNote:
      "Modules are the slots of the department's grid (0 to 6). When the sheet does not make a day's shift clear, only the modules are shown.",
    none: "No timetable has been loaded for this subject yet.",
    shifts: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
    modality: { annual: "Annual", semester: "Semester" },
    days: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
    },
  },
  panel: {
    title: "Subject details",
    close: "Close details",
    empty: "Pick a subject to see its details.",
    number: "Subject no.",
    level: "Level",
    term: "Delivery",
    hours: "Class hours per week",
    totalHours: "Total hours",
    clockHours: (h: number) => `${h} clock hours`,
    objectives: "Objectives",
    contents: "Minimum contents",
    syllabusNote:
      "Official text of the summary syllabus (Ord. C.S. 1873), in Spanish.",
    block: "Block",
    noData: "No data",
    integrative: "Integrative subject",
    prerequisites: "Prerequisites",
    taken: "Must have taken the course",
    passed: "Must have passed the final",
    none: "None",
    unlocks: "Subjects it unlocks",
    unlocksNone: "Does not unlock other subjects",
    unlocksTaken: "course taken",
    unlocksPassed: "passed",
    specialRule: "Special condition",
    terms: {
      annual: "Annual",
      first: "First semester",
      second: "Second semester",
      either: "Either semester",
    },
    blocks: {
      "basic-sciences": "Basic sciences",
      "basic-technologies": "Basic technologies",
      "applied-technologies": "Applied technologies",
      complementary: "Complementary",
    },
  },
  language: {
    label: "Language",
    switchTo: "Switch to Spanish",
    es: "Español",
    en: "English",
  },
};
