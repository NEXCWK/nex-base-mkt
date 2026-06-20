import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const SUMMARY_MODEL = "claude-haiku-4-5-20251001";
const MAX_TEXT_CHARS = 30000;

// ─── Types ──────────────────────────────────────────────────────────────────

interface SummaryHighlight {
  emoji: string;
  text: string;
}
interface SummarySection {
  heading: string;
  points: string[];
}
interface PdfSummary {
  title: string;
  tagline: string;
  highlights: SummaryHighlight[];
  sections: SummarySection[];
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeSection(section: string) {
  return section.replace(/\.\./g, "").replace(/[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ _/-]/g, "_");
}

function summaryStorePath(sectionDir: string) {
  return path.join(sectionDir, "_summaries.json");
}

function readSummaries(sectionDir: string): Record<string, PdfSummary> {
  const p = summaryStorePath(sectionDir);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return {};
  }
}

function writeSummaries(sectionDir: string, data: Record<string, PdfSummary>) {
  fs.mkdirSync(sectionDir, { recursive: true });
  fs.writeFileSync(summaryStorePath(sectionDir), JSON.stringify(data, null, 2));
}

// Guards against two simultaneous first-time requests both calling the LLM.
const inFlight = new Map<string, Promise<PdfSummary>>();

// pdfjs (used by pdf-parse) expects the browser global DOMMatrix, which Node
// does not provide. Some environments crash with "DOMMatrix is not defined"
// while parsing real PDFs. Polyfill it before pdfjs is loaded.
async function ensurePdfGlobals() {
  const g = globalThis as unknown as { DOMMatrix?: unknown };
  if (typeof g.DOMMatrix === "undefined") {
    const DOMMatrixImpl = (await import("dommatrix")).default;
    g.DOMMatrix = DOMMatrixImpl;
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  await ensurePdfGlobals();
  const { PDFParse } = await import("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy?.();
  }
}

async function generateSummary(text: string, fileName: string): Promise<PdfSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("no_api_key");

  const anthropic = new Anthropic({ apiKey });

  const clipped = text.slice(0, MAX_TEXT_CHARS);

  const msg = await anthropic.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 1500,
    system:
      "Você é um assistente que resume documentos institucionais e de marketing em português do Brasil. " +
      "Produza resumos claros, elegantes e diretos. Responda SEMPRE e SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem blocos de código.",
    messages: [
      {
        role: "user",
        content:
          `Resuma o documento a seguir (nome do arquivo: "${fileName}") no seguinte formato JSON exato:\n\n` +
          `{\n` +
          `  "title": "título curto e atraente do documento (máx 6 palavras)",\n` +
          `  "tagline": "uma frase de uma linha que captura a essência do documento",\n` +
          `  "highlights": [ { "emoji": "um emoji relevante", "text": "destaque curto (máx 10 palavras)" } ],\n` +
          `  "sections": [ { "heading": "título da seção", "points": ["ponto conciso", "outro ponto"] } ]\n` +
          `}\n\n` +
          `Regras: 3 a 4 highlights. 2 a 4 sections, cada uma com 2 a 5 points curtos. ` +
          `Tom profissional porém leve. Não invente informações que não estejam no texto.\n\n` +
          `--- CONTEÚDO DO DOCUMENTO ---\n${clipped}`,
      },
    ],
  });

  const raw = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip accidental code fences just in case.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: Omit<PdfSummary, "generatedAt">;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("parse_error");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  return {
    title: parsed.title || fileName,
    tagline: parsed.tagline || "",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [],
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    generatedAt: new Date().toISOString(),
  };
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { section, id, storedName } = body as { section?: string; id?: string; storedName?: string };
  if (!section || !id || !storedName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const sectionDir = path.join(UPLOADS_DIR, safeSection(section));

  // 1) Return cached summary if it exists — NEVER regenerate.
  const cache = readSummaries(sectionDir);
  if (cache[id]) {
    return NextResponse.json({ summary: cache[id], cached: true });
  }

  const filePath = path.join(sectionDir, path.basename(storedName));
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (path.extname(filePath).toLowerCase() !== ".pdf") {
    return NextResponse.json({ error: "Not a PDF" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no_api_key" }, { status: 503 });
  }

  // 2) Dedupe concurrent first-time generations for the same file.
  const lockKey = `${sectionDir}::${id}`;
  try {
    let task = inFlight.get(lockKey);
    if (!task) {
      task = (async () => {
        const text = await extractPdfText(filePath);
        if (!text || text.length < 30) {
          throw new Error("no_text");
        }
        const summary = await generateSummary(text, path.basename(storedName.replace(/^\d+_/, "")));
        // Re-read just before writing in case another request finished meanwhile.
        const fresh = readSummaries(sectionDir);
        if (!fresh[id]) {
          fresh[id] = summary;
          writeSummaries(sectionDir, fresh);
        }
        return (readSummaries(sectionDir))[id] ?? summary;
      })();
      inFlight.set(lockKey, task);
    }
    const summary = await task;
    return NextResponse.json({ summary, cached: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    if (message === "no_text") {
      return NextResponse.json(
        { error: "no_text", message: "Não foi possível extrair texto deste PDF (pode ser um documento escaneado/só imagem)." },
        { status: 422 }
      );
    }
    if (message === "no_api_key") {
      return NextResponse.json({ error: "no_api_key" }, { status: 503 });
    }
    return NextResponse.json({ error: "generation_failed", message }, { status: 500 });
  } finally {
    inFlight.delete(lockKey);
  }
}
