import OpenAI from 'openai'
import { MATERIALS, getMaterial, matchMaterial } from '../src/data/materials.ts'
import { massFor, normalizeUnit } from '../src/lib/lines.ts'
import { UNITS, type Receipt, type Unit } from '../src/types.ts'

const MAX_BYTES = 8 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new AiError(
      503,
      'Set OPENAI_API_KEY in .env to read invoices with a cloud model (OpenAI gpt-4o-mini or gpt-4o).',
    )
  }
  return new OpenAI({ apiKey, timeout: 90_000 })
}

function wrapOpenAiError(error: unknown): AiError {
  if (error instanceof AiError) return error
  if (error instanceof OpenAI.APIError && error.status === 401) {
    return new AiError(503, 'OPENAI_API_KEY is invalid. Check the key in .env.')
  }
  return new AiError(502, 'The cloud model could not read this invoice. Try a clearer photo or paste the text.')
}

function modelName(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
}

function catalogPrompt(): string {
  return MATERIALS.map(
    (item) => `${item.id} | ${item.name} | aliases: ${item.aliases.join(', ')}`,
  ).join('\n')
}

function instructions(defaultLocation: string): string {
  return `You extract construction supplier invoices into JSON for a material passport.
Return ONLY JSON with this shape:
{"supplier":string,"invoiceNo":string,"date":"YYYY-MM-DD","location":string,"lines":[{"description":string,"materialId":string,"quantity":number,"unit":string,"unitCost":number}]}
Rules:
- materialId MUST be one of the catalog ids below. Pick the closest match.
- unit MUST be one of: ${UNITS.join(', ')}. Use ea for piece counts, lf for linear feet, m3 for ready-mix.
- quantity is the takeoff amount in that unit, not the line total.
- unitCost is the price per unit if shown, otherwise 0.
- date is ISO YYYY-MM-DD; if missing use today's date.
- location defaults to "${defaultLocation || 'Jobsite'}".
- Ignore taxes, freight, and payment terms unless they are material lines.
- If the image is not an invoice, still return JSON with supplier "" and one best-effort line.

Material catalog:
${catalogPrompt()}`
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asQty(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function parseModelJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  const block = trimmed.startsWith('{') ? trimmed : trimmed.replace(/^```json\s*|\s*```$/g, '')
  try {
    return asRecord(JSON.parse(block))
  } catch {
    const start = block.indexOf('{')
    const end = block.lastIndexOf('}')
    if (start >= 0 && end > start) return asRecord(JSON.parse(block.slice(start, end + 1)))
    throw new AiError(502, 'The cloud model returned data that could not be read. Try a clearer photo.')
  }
}

export function draftFromModel(raw: string, defaultLocation: string): Receipt {
  const data = parseModelJson(raw)
  const linesRaw = Array.isArray(data.lines) ? data.lines : []
  const lines = (linesRaw.length > 0 ? linesRaw : [{}]).map((item) => {
    const row = asRecord(item)
    const description = asText(row.description) || 'Unparsed line — confirm material and quantity'
    const requested = asText(row.materialId)
    const spec = requested && MATERIALS.some((m) => m.id === requested) ? getMaterial(requested) : matchMaterial(description)
    const unit = UNITS.includes(asText(row.unit) as Unit) ? (asText(row.unit) as Unit) : normalizeUnit(asText(row.unit))
    const quantity = asQty(row.quantity) || 1
    return {
      id: crypto.randomUUID(),
      description,
      materialId: spec.id,
      quantity,
      unit,
      unitCost: Math.max(0, asQty(row.unitCost)),
      massKg: massFor(spec.id, quantity, unit),
    }
  })

  const date = asText(data.date)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10)

  return {
    id: crypto.randomUUID(),
    supplier: asText(data.supplier),
    invoiceNo: asText(data.invoiceNo) || `SCN-${Date.now().toString().slice(-6)}`,
    date: iso,
    location: asText(data.location, defaultLocation) || defaultLocation || 'Jobsite',
    status: 'review',
    source: 'scan',
    lines,
  }
}

export async function readInvoiceWithCloud(input: {
  text?: string
  buffer?: Buffer
  mime?: string
  filename?: string
  defaultLocation: string
}): Promise<Receipt> {
  const openai = client()
  const model = modelName()
  const prompt = instructions(input.defaultLocation)
  const text = input.text?.trim() ?? ''

  if (text && !input.buffer) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Invoice text:\n${text.slice(0, 20_000)}` },
        ],
      })
      return draftFromModel(completion.choices[0]?.message?.content ?? '', input.defaultLocation)
    } catch (error) {
      throw wrapOpenAiError(error)
    }
  }

  if (!input.buffer?.length) {
    throw new AiError(400, 'Upload a photo, PDF, or paste invoice text.')
  }
  if (input.buffer.length > MAX_BYTES) {
    throw new AiError(400, 'File is too large (8 MB max).')
  }

  const mime = input.mime || 'application/octet-stream'
  const filename = input.filename || 'invoice'
  const b64 = input.buffer.toString('base64')

  if (IMAGE_TYPES.has(mime)) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Read this supplier invoice (${filename}).` },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          },
        ],
      })
      return draftFromModel(completion.choices[0]?.message?.content ?? '', input.defaultLocation)
    } catch (error) {
      throw wrapOpenAiError(error)
    }
  }

  if (mime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    try {
      const response = await openai.responses.create({
        model,
        temperature: 0,
        text: { format: { type: 'json_object' } },
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: `${prompt}\n\nRead this supplier invoice PDF (${filename}).` },
              {
                type: 'input_file',
                filename,
                file_data: `data:application/pdf;base64,${b64}`,
              },
            ],
          },
        ],
      })
      return draftFromModel(response.output_text ?? '', input.defaultLocation)
    } catch (error) {
      throw wrapOpenAiError(error)
    }
  }

  if (mime.startsWith('text/') || /\.(txt|csv|md)$/i.test(filename)) {
    return readInvoiceWithCloud({ text: input.buffer.toString('utf8'), defaultLocation: input.defaultLocation })
  }

  throw new AiError(400, 'Use a JPG, PNG, WebP, PDF, or text file.')
}
