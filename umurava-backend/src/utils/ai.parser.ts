import { CandidateResult } from "../types/index";

// ─────────────────────────────────────────────────────────────────
// Smart / curly quote code-points
// ─────────────────────────────────────────────────────────────────
const SMART_DOUBLE = new Set([0x201C, 0x201D, 0x201E, 0x201F, 0x2033, 0x2036]); // " " „ ‟ ″ ‶
const SMART_SINGLE = new Set([0x2018, 0x2019, 0x201A, 0x201B, 0x2032, 0x2035]); // ' ' ‚ ‛ ′ ‵

// ─────────────────────────────────────────────────────────────────
// parseJsonSafe
//
// Why one pass instead of global replaces?
// ─────────────────────────────────────────
// JSON characters have different meanings depending on context.
// A smart " OUTSIDE a string is a delimiter → replace with ".
// A smart " INSIDE  a string is a literal   → replace with \".
// A global replace of curly→straight quotes turns interior curly
// quotes into unescaped ", which breaks JSON.parse every time.
// ─────────────────────────────────────────────────────────────────
function parseJsonSafe(raw: string): any {
  // ── Step 1: strip markdown fences and JS comments ───────────────
  let s = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // ── Step 2: one-pass context-aware character fixer ───────────────
  let fixed    = "";
  let inString = false;
  let i        = 0;

  while (i < s.length) {
    const ch   = s[i];
    const code = s.charCodeAt(i);

    // Already-escaped sequence — copy both chars verbatim
    if (ch === "\\" && inString) {
      fixed += ch + (s[i + 1] ?? "");
      i += 2;
      continue;
    }

    // Straight double-quote — toggle string tracking
    if (ch === '"') {
      inString = !inString;
      fixed += ch;
      i++;
      continue;
    }

    // Smart / curly DOUBLE quote
    if (SMART_DOUBLE.has(code)) {
      if (inString) {
        fixed += '\\"'; // inside a value → escape so it's a literal char
      } else {
        inString = !inString;
        fixed += '"';   // outside → use as delimiter
      }
      i++;
      continue;
    }

    // Smart / curly SINGLE quote → plain apostrophe (always safe)
    if (SMART_SINGLE.has(code)) {
      fixed += "'";
      i++;
      continue;
    }

    // Inside a string: escape bare whitespace, strip control chars
    if (inString) {
      if (ch === "\n") { fixed += "\\n"; i++; continue; }
      if (ch === "\r") { fixed += "\\r"; i++; continue; }
      if (ch === "\t") { fixed += "\\t"; i++; continue; }
      if (code <= 0x1F || code === 0x7F) { i++; continue; } // strip
    }

    fixed += ch;
    i++;
  }

  // ── Step 3: remove trailing commas before ] or } ────────────────
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");

  // ── Step 4: parse with 3 progressive fallbacks ──────────────────

  // Attempt 1: cleaned string as-is
  try { return JSON.parse(fixed); } catch (_) {}

  // Attempt 2: strip remaining non-printable / non-ASCII junk
  try {
    return JSON.parse(fixed.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ""));
  } catch (_) {}

  // Attempt 3: collapse any surviving literal newlines to spaces
  try {
    return JSON.parse(fixed.replace(/\n/g, " ").replace(/\r/g, ""));
  } catch (lastErr) {
    throw new Error(
      `JSON parsing failed after 3 attempts.\n` +
      `Last error: ${(lastErr as Error).message}\n` +
      `Snippet: ${fixed.slice(0, 400)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Extract the outermost JSON array from a raw AI response string
// ─────────────────────────────────────────────────────────────────
function extractArray(raw: string): string {
  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON array found in AI response");
  }
  return raw.substring(start, end + 1);
}

// ─────────────────────────────────────────────────────────────────
// Extract the outermost JSON object from a raw AI response string
// ─────────────────────────────────────────────────────────────────
function extractObject(raw: string): string {
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in AI response");
  }
  return raw.substring(start, end + 1);
}

// ─────────────────────────────────────────────────────────────────
// Public: parse screening response → CandidateResult[]
// ─────────────────────────────────────────────────────────────────
export function parseScreeningResponse(rawText: string): CandidateResult[] {
  if (!rawText?.trim()) throw new Error("Empty response from AI");

  const parsed = parseJsonSafe(extractArray(rawText));

  if (!Array.isArray(parsed)) throw new Error("AI response is not an array");

  return parsed.map((item: any, idx: number) => ({
    candidateId:    item.candidateId ?? item.id ?? "",
    rank:           typeof item.rank  === "number" ? item.rank  : idx + 1,
    score:          typeof item.score === "number" ? item.score : 0,
    // strengths / gaps: Gemini sometimes returns a string, sometimes an array
    strengths:      Array.isArray(item.strengths) ? item.strengths : (item.strengths ? [item.strengths] : []),
    gaps:           Array.isArray(item.gaps)      ? item.gaps      : (item.gaps      ? [item.gaps]      : []),
    recommendation: item.recommendation ?? "",
    skillsMatched:  Array.isArray(item.skillsMatched) ? item.skillsMatched : [],
    skillsMissing:  Array.isArray(item.skillsMissing) ? item.skillsMissing : [],
    confidence:     item.confidence ?? "Medium",
  })) as CandidateResult[];
}

// ─────────────────────────────────────────────────────────────────
// Public: parse comparison response → any
// ─────────────────────────────────────────────────────────────────
export function parseComparisonResponse(rawText: string): any {
  if (!rawText?.trim()) throw new Error("Empty comparison response from AI");
  return parseJsonSafe(extractObject(rawText));
}