export interface RedFlag {
  pattern: RegExp;
  phrase: string;
  category: "scope" | "timeline" | "budget" | "responsibility" | "vague";
  severity: "high" | "medium" | "low";
  title: string;
  explanation: string;
  tip: string;
}

export const RED_FLAGS: RedFlag[] = [
  // VAGUE LANGUAGE
  {
    pattern: /\bsimple\b/gi,
    phrase: "simple",
    category: "vague",
    severity: "high",
    title: '"Simple" is subjective',
    explanation: "Simple means completely different things to different people. One person's simple is another person's 6-week project.",
    tip: "Define exactly what simple means in your scope. List specific pages, features, and functionality.",
  },
  {
    pattern: /\bbasic\b/gi,
    phrase: "basic",
    category: "vague",
    severity: "high",
    title: '"Basic" has no definition',
    explanation: "Basic is not a measurable requirement. It cannot be approved or rejected objectively.",
    tip: 'Replace with specific deliverables. "Basic website" becomes "5-page website with contact form."',
  },
  {
    pattern: /\bmodern\b/gi,
    phrase: "modern",
    category: "vague",
    severity: "medium",
    title: '"Modern" is unmeasurable',
    explanation: "Modern design is entirely subjective. Without examples this will lead to endless revisions.",
    tip: "Ask client for 3 websites they consider modern before starting any design work.",
  },
  {
    pattern: /\bclean\b/gi,
    phrase: "clean",
    category: "vague",
    severity: "low",
    title: '"Clean" needs definition',
    explanation: "Clean design is subjective. Get visual references before committing to a style.",
    tip: "Request mood board or reference sites from the client before scoping design work.",
  },
  {
    pattern: /\bprofessional\b/gi,
    phrase: "professional",
    category: "vague",
    severity: "low",
    title: '"Professional" varies widely',
    explanation: "Every client has a different idea of what professional looks like for their industry.",
    tip: "Get industry-specific examples of what professional means to this client.",
  },
  {
    pattern: /\bnice[- ]looking\b|\bnice\b/gi,
    phrase: "nice",
    category: "vague",
    severity: "low",
    title: "Vague aesthetic requirement",
    explanation: "Nice is entirely subjective and impossible to scope or approve objectively.",
    tip: "Ask for reference examples of designs the client considers nice.",
  },
  {
    pattern: /\ba few\b/gi,
    phrase: "a few",
    category: "vague",
    severity: "high",
    title: '"A few" is not a number',
    explanation: "A few pages, a few features, a few changes — these are all undefined quantities that will expand.",
    tip: 'Replace with exact numbers in your scope. "A few pages" becomes "4 pages."',
  },
  {
    pattern: /\bsome features?\b/gi,
    phrase: "some features",
    category: "vague",
    severity: "high",
    title: "Undefined feature list",
    explanation: "Some features will grow into many features. List every single feature explicitly.",
    tip: "Define every feature individually in your scope. If it is not listed it is not included.",
  },
  {
    pattern: /\betc\.?\b|\band so on\b|\band more\b/gi,
    phrase: "etc / and so on",
    category: "scope",
    severity: "high",
    title: "Open-ended scope trap",
    explanation: "Etc and and so on are scope creep traps. They imply unlimited additional work.",
    tip: 'Never allow etc in a scope. Explicitly list everything and add "all other items are out of scope."',
  },
  // SCOPE CREEP
  {
    pattern: /\banything else\b/gi,
    phrase: "anything else",
    category: "scope",
    severity: "high",
    title: "Scope creep trap",
    explanation: "Anything else is an open invitation for unlimited unpaid work after the project starts.",
    tip: 'Add a clear "Not included" section to your scope and reference it when this comes up.',
  },
  {
    pattern: /\bmight need\b|\bcould add\b|\bmaybe later\b|\bpossibly\b/gi,
    phrase: "might need / could add",
    category: "scope",
    severity: "medium",
    title: "Undefined future work",
    explanation: "Vague future additions become expected deliverables. Clients remember the maybe, not the might.",
    tip: "Explicitly exclude any features not confirmed. Future additions are new projects with new quotes.",
  },
  {
    pattern: /\bsimilar to\b|\bjust like\b|\blike [a-z]+\.com\b/gi,
    phrase: "similar to [big site]",
    category: "scope",
    severity: "high",
    title: "Comparison to complex product",
    explanation: "Similar to Airbnb or just like Amazon implies building a product that cost millions to develop.",
    tip: "Ask specifically which features of that site they want — not the whole thing.",
  },
  {
    pattern: /\bfigure it out\b|\bas we go\b|\bwe.ll decide later\b/gi,
    phrase: "figure it out as we go",
    category: "scope",
    severity: "high",
    title: "No defined scope",
    explanation: "Figure it out as we go means you have no agreement to protect you when disagreements arise.",
    tip: "Never start a project without a defined scope. This phrase is a major red flag.",
  },
  // TIMELINE
  {
    pattern: /\bASAP\b|\burgent\b|\bas soon as possible\b/gi,
    phrase: "ASAP / urgent",
    category: "timeline",
    severity: "high",
    title: "No real deadline defined",
    explanation: "ASAP is not a deadline. It creates pressure without commitment and will be used against you.",
    tip: 'Always set a specific date. "Project live by April 30" not ASAP.',
  },
  {
    pattern: /\bquickly\b|\bfast\b|\bsoon\b|\bimmediately\b/gi,
    phrase: "quickly / fast / soon",
    category: "timeline",
    severity: "medium",
    title: "Vague timeline expectation",
    explanation: "Quickly means different things to different people. Lock down an exact launch date.",
    tip: "Define a specific milestone date in your scope. Vague timelines always cause disputes.",
  },
  {
    pattern: /\bno rush\b|\bwhenever\b|\btake your time\b/gi,
    phrase: "no rush / whenever",
    category: "timeline",
    severity: "low",
    title: "No deadline set",
    explanation: "No rush becomes a rush when the client suddenly needs it for an event they forgot to mention.",
    tip: "Set a timeline anyway. Protects you from sudden urgency and scope expansion.",
  },
  // BUDGET
  {
    pattern: /\bcheap\b|\baffordable\b|\bbudget[- ]friendly\b|\blow[- ]cost\b/gi,
    phrase: "cheap / affordable",
    category: "budget",
    severity: "high",
    title: "Budget mismatch risk",
    explanation: "Cheap and affordable signal a client whose expectations may not match professional rates.",
    tip: "Clarify budget range before investing time in scoping. Better to know now than after.",
  },
  {
    pattern: /\bdiscuss payment\b|\btalk about price\b|\bwhat.s your rate\b/gi,
    phrase: "discuss payment later",
    category: "budget",
    severity: "high",
    title: "No budget commitment",
    explanation: "Clients who avoid budget discussions early often have unrealistic expectations.",
    tip: "Always establish a budget range before starting the scoping process.",
  },
  // RESPONSIBILITY
  {
    pattern: /\byou can write\b|\byou.ll write\b|\byou provide\b/gi,
    phrase: "you can write the content",
    category: "responsibility",
    severity: "high",
    title: "Hidden content responsibility",
    explanation: "Writing content is a separate billable service. If not scoped separately it becomes unpaid work.",
    tip: "Add a line to scope: Client provides all written content by [date]. Content writing is out of scope.",
  },
  {
    pattern: /\bwe.ll send\b|\bwe.ll provide\b|\bclient will provide\b/gi,
    phrase: "we will provide",
    category: "responsibility",
    severity: "medium",
    title: "Dependency on client deliverables",
    explanation: "Client-provided assets are a common cause of project delays. Late content = late delivery.",
    tip: "Add a clause: Timeline is dependent on client providing assets by [specific date].",
  },
];

export function detectRedFlags(
  text: string
): { flag: RedFlag; index: number; matchedText: string }[] {
  const results: { flag: RedFlag; index: number; matchedText: string }[] = [];

  for (const flag of RED_FLAGS) {
    const regex = new RegExp(flag.pattern.source, flag.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ flag, index: match.index, matchedText: match[0] });
    }
  }

  return results.sort((a, b) => a.index - b.index);
}

export function highlightRedFlags(text: string): {
  segments: { text: string; flag?: RedFlag; matchedText?: string }[];
} {
  const detectedFlags = detectRedFlags(text);

  if (detectedFlags.length === 0) {
    return { segments: [{ text }] };
  }

  const segments: { text: string; flag?: RedFlag; matchedText?: string }[] = [];
  let lastIndex = 0;

  // Remove overlapping matches - keep first occurrence
  const nonOverlapping: typeof detectedFlags = [];
  for (const detection of detectedFlags) {
    const end = detection.index + detection.matchedText.length;
    const overlaps = nonOverlapping.some((existing) => {
      const existingEnd = existing.index + existing.matchedText.length;
      return detection.index < existingEnd && end > existing.index;
    });
    if (!overlaps) nonOverlapping.push(detection);
  }

  for (const detection of nonOverlapping) {
    if (detection.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, detection.index) });
    }
    segments.push({
      text: detection.matchedText,
      flag: detection.flag,
      matchedText: detection.matchedText,
    });
    lastIndex = detection.index + detection.matchedText.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return { segments };
}
