import Anthropic from "@anthropic-ai/sdk";
import type { AnalyseResultaat } from "@/lib/types";
import { parseJsonSafe } from "@/lib/utils";

const MODEL = "claude-sonnet-4-20250514";

export async function analyseGesprek(
  transcript: string,
  vacatureData: {
    functie: string;
    eisen: string;
    salaris: { min: number; max: number };
    beschikbaarheid: string;
    screeningVragen: string[];
  },
): Promise<AnalyseResultaat> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ontbreekt");
  }

  const client = new Anthropic({ apiKey });

  const prompt = `
Analyseer dit recruitment gesprek en geef een gestructureerde beoordeling.

VACATURE: ${vacatureData.functie}
EISEN: ${vacatureData.eisen}
SALARIS BUDGET: €${vacatureData.salaris.min}-${vacatureData.salaris.max}
BESCHIKBAARHEID: ${vacatureData.beschikbaarheid}

VRAGEN: ${vacatureData.screeningVragen.join("; ")}

TRANSCRIPT:
${transcript}

Geef je analyse als JSON:
{
  "score": [1-10],
  "aanbeveling": "GESCHIKT" | "TWIJFEL" | "NIET_GESCHIKT",
  "samenvatting": "[2-3 zinnen in Nederlands]",
  "antwoorden": {
    "beschikbaarheid": "",
    "salariswens": "",
    "rijbewijs": "",
    "ervaring": "",
    "motivatie": ""
  },
  "positieve_punten": ["punt1", "punt2"],
  "negatieve_punten": ["punt1", "punt2"]
}

SCORINGSRICHTLIJNEN:
8-10: Uitstekend, direct doorsturen
6-7: Goed, verdient persoonlijk gesprek
4-5: Twijfelachtig
1-3: Niet geschikt

Geef ALLEEN JSON terug, zonder markdown fences.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Onverwacht antwoord van Claude");
  }

  const cleaned = text.text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = parseJsonSafe<AnalyseResultaat>(cleaned, {
    score: 5,
    aanbeveling: "TWIJFEL",
    samenvatting: "Kon antwoord niet parsen.",
    antwoorden: {},
    positieve_punten: [],
    negatieve_punten: [],
  });

  return {
    ...parsed,
    score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
    positieve_punten: parsed.positieve_punten ?? [],
    negatieve_punten: parsed.negatieve_punten ?? [],
    antwoorden: parsed.antwoorden ?? {},
  };
}
