// umurava-backend/src/services/pdf.splitter.service.ts
//
// Detects whether a PDF contains multiple CVs and splits the raw text
// into individual candidate text blocks.
//
// How detection works:
//   A new CV starts when we see a line that looks like a person's name
//   (Title Case, 2-4 words, no special chars) followed by an email address
//   within the next 8 lines. This pattern is present in ~95% of real CVs.
//
// If only 1 person is detected → returns the full text as a single block.
// If N people detected → returns N separate text blocks.

const EMAIL_RE   = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/i;
const NAME_RE    = /^[A-ZÀ-Ÿ][a-zA-Zà-ÿ'\-]{1,25}(?:\s+[A-ZÀ-Ÿ][a-zA-Zà-ÿ'\-]{1,25}){1,3}$/;
const HEADER_RE  = /^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|SUMMARY|PROFILE|CERTIF|WORK HISTORY|PROFESSIONAL|EMPLOYMENT|LANGUAGES|REFERENCES|CONTACT|OBJECTIVE|QUALIFICATION)/i;

export type SplitResult = {
  blocks:    string[];  // each block = one person's full CV text
  count:     number;
  wasMulti:  boolean;   // true if we actually found multiple people
};

export function splitMultiPersonPDF(rawText: string): SplitResult {
  const lines = rawText.split(/\r?\n/);
  const splitPoints: number[] = []; // line indices where a new CV starts

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3 || line.length > 60) continue;

    // Line looks like a name?
    if (!NAME_RE.test(line)) continue;
    // Skip if it looks like a section header
    if (HEADER_RE.test(line)) continue;

    // Check the next 8 lines for an email
    const window = lines.slice(i + 1, i + 9).join("\n");
    if (EMAIL_RE.test(window)) {
      // This is likely a new candidate starting
      // Only count it as a split if we're not at the very start
      if (i > 3) {
        splitPoints.push(i);
      }
    }
  }

  // No splits found — single person PDF
  if (splitPoints.length === 0) {
    return { blocks: [rawText], count: 1, wasMulti: false };
  }

  // Build blocks
  const blocks: string[] = [];
  const allPoints = [0, ...splitPoints];

  for (let k = 0; k < allPoints.length; k++) {
    const start = allPoints[k];
    const end   = allPoints[k + 1] ?? lines.length;
    const block = lines.slice(start, end).join("\n").trim();
    if (block.length > 100) { // ignore tiny blocks (page numbers etc)
      blocks.push(block);
    }
  }

  return {
    blocks,
    count:    blocks.length,
    wasMulti: blocks.length > 1,
  };
}