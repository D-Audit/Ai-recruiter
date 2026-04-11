import { CandidateResult } from "../types/index";

// ─────────────────────────────────────────────────────────────────
// Unicode sets
// ─────────────────────────────────────────────────────────────────
const SMART_DOUBLE = new Set([0x201C, 0x201D, 0x201E, 0x201F, 0x2033, 0x2036]);
const SMART_SINGLE = new Set([0x2018, 0x2019, 0x201A, 0x201B, 0x2032, 0x2035]);

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** First non-whitespace character at or after `from`. */
function peekNext(s: string, from: number): string {
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return c;
  }
  return "";
}

/**
 * In valid JSON, a closing " is always followed by , } ] or :
 * If the next char is anything else the " is probably content, not a delimiter.
 */
function isStructural(ch: string): boolean {
  return ch === "," || ch === "}" || ch === "]" || ch === ":";
}

// ─────────────────────────────────────────────────────────────────
// One-pass context-aware character fixer
// ─────────────────────────────────────────────────────────────────
function onePassFix(s: string): string {
  let fixed    = "";
  let inString = false;
  let i        = 0;

  while (i < s.length) {
    const ch   = s[i];
    const code = s.charCodeAt(i);

    // Already-escaped pair — copy verbatim
    if (ch === "\\" && inString) {
      fixed += ch + (s[i + 1] ?? "");
      i += 2;
      continue;
    }

    // Straight double-quote
    if (ch === '"') {
      if (inString) {
        // Lookahead: if next non-WS is not a JSON structural char,
        // this " is content inside the value — escape it
        const next = peekNext(s, i + 1);
        if (next && !isStructural(next)) {
          fixed += '\\"';
          i++;
          continue;
        }
      }
      inString = !inString;
      fixed += ch;
      i++;
      continue;
    }

    // Smart / curly DOUBLE quote
    if (SMART_DOUBLE.has(code)) {
      fixed += inString ? '\\"' : '"';
      if (!inString) inString = true;
      i++;
      continue;
    }

    // Smart / curly SINGLE quote → plain apostrophe
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
      if (code <= 0x1F || code === 0x7F) { i++; continue; }
    }

    fixed += ch;
    i++;
  }

  return fixed;
}

// ─────────────────────────────────────────────────────────────────
// JSON.parse with 3 progressive fallbacks
// ─────────────────────────────────────────────────────────────────
function parseJsonSafe(raw: string): any {
  let s = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  const fixed = onePassFix(s).replace(/,\s*([\]}])/g, "$1");

  try { return JSON.parse(fixed); } catch (_) {}

  try {
    return JSON.parse(fixed.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ""));
  } catch (_) {}

  try {
    return JSON.parse(fixed.replace(/\n/g, " ").replace(/\r/g, ""));
  } catch (lastErr) {
    throw new Error(
      `JSON parsing failed.\nLast error: ${(lastErr as Error).message}\nSnippet: ${fixed.slice(0, 400)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Manual field-level extraction (last-resort fallback)
// ─────────────────────────────────────────────────────────────────
function extractNumber(obj: string, field: string): number | null {
  const m = new RegExp(`"${field}"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`).exec(obj);
  return m ? parseFloat(m[1]) : null;
}

function extractStr(obj: string, field: string): string {
  const m = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s").exec(obj);
  return m ? m[1].replace(/\\n/g, " ").trim() : "";
}

function extractStrArray(obj: string, field: string): string[] {
  const m = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*?)\\]`, "s").exec(obj);
  if (!m) return [];
  const items: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(m[1])) !== null) items.push(hit[1]);
  return items;
}

/**
 * Gemini may return strengths/gaps as an array OR a plain string.
 * CandidateResult.strengths / .gaps are typed as `string`,
 * so we always join to a single string.
 */
function extractAsString(obj: string, field: string): string {
  // Try array first
  const arr = extractStrArray(obj, field);
  if (arr.length) return arr.join(". ");
  // Fall back to plain string
  return extractStr(obj, field);
}

function manualExtractCandidates(raw: string): CandidateResult[] {
  const results: CandidateResult[] = [];
  const idRe = /"candidateId"\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;

  while ((m = idRe.exec(raw)) !== null) {
    const candidateId = m[1];
    const pos         = m.index;
    const objStart    = raw.lastIndexOf("{", pos);
    if (objStart === -1) continue;

    let depth = 0, objEnd = -1;
    for (let k = objStart; k < raw.length; k++) {
      if (raw[k] === "{") depth++;
      else if (raw[k] === "}") { if (--depth === 0) { objEnd = k; break; } }
    }
    if (objEnd === -1) continue;

    const obj = raw.substring(objStart, objEnd + 1);

    results.push({
      candidateId,
      rank:           extractNumber(obj, "rank")  ?? results.length + 1,
      score:          extractNumber(obj, "score") ?? 0,
      strengths:      extractAsString(obj, "strengths"),   // string ✓
      gaps:           extractAsString(obj, "gaps"),         // string ✓
      recommendation: extractStr(obj, "recommendation"),
      skillsMatched:  extractStrArray(obj, "skillsMatched"),
      skillsMissing:  extractStrArray(obj, "skillsMissing"),
      confidence:     (extractStr(obj, "confidence") || "Medium") as any,
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────
// Boundary extractors
// ─────────────────────────────────────────────────────────────────
function extractArray(raw: string): string {
  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start)
    throw new Error("No JSON array found in AI response");
  return raw.substring(start, end + 1);
}

function extractObject(raw: string): string {
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start)
    throw new Error("No JSON object found in AI response");
  return raw.substring(start, end + 1);
}

// ─────────────────────────────────────────────────────────────────
// Sanitize a parsed array → CandidateResult[]
// Handles Gemini returning strengths/gaps as array OR string,
// and always produces the `string` type required by CandidateResult.
// ─────────────────────────────────────────────────────────────────
function sanitizeCandidates(parsed: any[]): CandidateResult[] {
  return parsed.map((item: any, idx: number) => {
    const toStr = (v: any): string => {
      if (!v) return "";
      if (Array.isArray(v)) return v.join(". ");
      return String(v);
    };

    return {
      candidateId:    item.candidateId ?? item.id ?? "",
      rank:           typeof item.rank  === "number" ? item.rank  : idx + 1,
      score:          typeof item.score === "number" ? item.score : 0,
      strengths:      toStr(item.strengths),   // string ✓
      gaps:           toStr(item.gaps),         // string ✓
      recommendation: toStr(item.recommendation),
      skillsMatched:  Array.isArray(item.skillsMatched) ? item.skillsMatched : [],
      skillsMissing:  Array.isArray(item.skillsMissing) ? item.skillsMissing : [],
      confidence:     item.confidence ?? "Medium",
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC: parse screening response → CandidateResult[]
// ─────────────────────────────────────────────────────────────────
export function parseScreeningResponse(rawText: string): CandidateResult[] {
  if (!rawText?.trim()) throw new Error("Empty response from AI");

  // Strategy 1: clean + JSON.parse
  try {
    const parsed = parseJsonSafe(extractArray(rawText));
    if (Array.isArray(parsed)) return sanitizeCandidates(parsed);
  } catch (e1) {
    console.warn("⚠️  Strategy 1 (JSON parse) failed:", (e1 as Error).message);
  }

  // Strategy 2: manual field-level extraction
  console.warn("⚠️  Falling back to manual field extraction...");
  const manual = manualExtractCandidates(rawText);
  if (manual.length > 0) {
    console.log(`✅ Manual extraction recovered ${manual.length} candidates`);
    return manual;
  }

  throw new Error("All parsing strategies failed — no candidates extracted from AI response");
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC: parse comparison response → any
// ─────────────────────────────────────────────────────────────────
export function parseComparisonResponse(rawText: string): any {
  if (!rawText?.trim()) throw new Error("Empty comparison response from AI");
  return parseJsonSafe(extractObject(rawText));
}