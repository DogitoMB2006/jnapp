const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const

type Section = "planes" | "salidas" | "peliculas" | "lista"

type Body = {
  section?: Section
  language?: "en" | "es"
  existingTitles?: string[]
  existingItems?: string[]
  shuffleSeed?: number
}

type Idea = {
  title: string
  description: string
  tag?: string
  location?: string
  genre?: string
}

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })

const clean = (value: unknown, max = 180) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max)

const fallback = (section: Section, language: "en" | "es", seed = 0): Idea[] => {
  const ideas: Record<Section, Record<"en" | "es", Idea[]>> = {
    planes: {
      en: [
        { title: "Cozy recipe night", description: "Cook a new recipe together and rate it like a tiny restaurant.", tag: "At home" },
        { title: "Memory walk", description: "Visit a special place and take one new photo there.", tag: "Romantic" },
        { title: "No-phone dessert date", description: "Share dessert, put phones away, and ask each other fun questions.", tag: "Chill" },
        { title: "Mini spa night", description: "Face masks, soft music, tea, and a shared playlist.", tag: "Relax" },
      ],
      es: [
        { title: "Noche de receta nueva", description: "Cocinen algo nuevo juntos y califíquenlo como restaurante pequeño.", tag: "En casa" },
        { title: "Paseo de recuerdos", description: "Vayan a un lugar especial y tómense una foto nueva ahí.", tag: "Romántico" },
        { title: "Postre sin celulares", description: "Compartan postre, guarden celulares y háganse preguntas divertidas.", tag: "Tranqui" },
        { title: "Mini spa en casa", description: "Mascarillas, música suave, té y una playlist juntos.", tag: "Relax" },
      ],
    },
    salidas: {
      en: [
        { title: "Sunset walk", description: "Walk before sunset and end with a drink or snack.", location: "Park or viewpoint", tag: "Cheap" },
        { title: "Tiny food tour", description: "Try one snack from three places and pick the winner.", location: "Nearby food spots", tag: "Fun" },
        { title: "Bookstore mini date", description: "Pick books for each other and compare over coffee.", location: "Bookstore", tag: "Chill" },
        { title: "Arcade challenge", description: "Play three games and winner chooses dessert.", location: "Arcade", tag: "Playful" },
      ],
      es: [
        { title: "Paseo al atardecer", description: "Caminen antes del atardecer y terminen con bebida o snack.", location: "Parque o mirador", tag: "Barato" },
        { title: "Mini tour de comida", description: "Prueben un snack de tres lugares y elijan ganador.", location: "Lugares cercanos", tag: "Divertido" },
        { title: "Cita en librería", description: "Elijan libros para el otro y comparen con café.", location: "Librería", tag: "Tranqui" },
        { title: "Reto de arcade", description: "Jueguen tres partidas y quien gane elige postre.", location: "Arcade", tag: "Juguetón" },
      ],
    },
    peliculas: {
      en: [
        { title: "About Time", description: "Warm romantic movie with cozy couple energy.", genre: "Romance" },
        { title: "The Grand Budapest Hotel", description: "Stylish, funny, colorful, and easy to watch together.", genre: "Comedy" },
        { title: "Your Name", description: "Emotional animated story with romance and adventure.", genre: "Anime" },
        { title: "Palm Springs", description: "Funny time-loop romcom with a playful mood.", genre: "Comedy" },
      ],
      es: [
        { title: "Cuestión de tiempo", description: "Romántica, cálida y perfecta para ver juntos.", genre: "Romance" },
        { title: "El gran hotel Budapest", description: "Bonita, rara, divertida y visualmente preciosa.", genre: "Comedia" },
        { title: "Your Name", description: "Historia animada emocional, romántica y con aventura.", genre: "Anime" },
        { title: "Palm Springs", description: "Comedia romántica de bucle temporal, ligera y divertida.", genre: "Comedia" },
      ],
    },
    lista: {
      en: [
        { title: "Plan a picnic kit", description: "Blanket, drinks, snacks, napkins, speaker, and one small surprise.", tag: "Checklist" },
        { title: "Weekend reset", description: "Laundry, groceries, clean one shared space, then choose a reward.", tag: "Home" },
        { title: "Date night prep", description: "Pick outfit, confirm place, charge phones, and choose backup plan.", tag: "Useful" },
        { title: "Movie night setup", description: "Snacks, drinks, cozy blanket, lights low, movie shortlist.", tag: "Cozy" },
      ],
      es: [
        { title: "Preparar kit de picnic", description: "Manta, bebidas, snacks, servilletas, bocina y una sorpresa pequeña.", tag: "Checklist" },
        { title: "Reset del finde", description: "Ropa, compras, ordenar un espacio compartido y elegir recompensa.", tag: "Casa" },
        { title: "Preparar cita", description: "Elegir ropa, confirmar lugar, cargar celulares y tener plan B.", tag: "Útil" },
        { title: "Preparar noche de peli", description: "Snacks, bebidas, manta, luces bajas y lista corta de películas.", tag: "Cómodo" },
      ],
    },
  }
  const start = Math.abs(seed) % ideas[section][language].length
  return [...ideas[section][language].slice(start), ...ideas[section][language].slice(0, start)].slice(0, 3)
}

const parseIdeas = (text: string): Idea[] | null => {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.slice(0, 3).map((item) => {
      const row = item as Record<string, unknown>
      return {
        title: clean(row.title, 70),
        description: clean(row.description, 220),
        tag: clean(row.tag, 35) || undefined,
        location: clean(row.location, 60) || undefined,
        genre: clean(row.genre, 35) || undefined,
      }
    }).filter((item) => item.title && item.description)
  } catch {
    return null
  }
}

const sectionPrompt: Record<Section, string> = {
  planes:
    "Recommend couple plans they can do together. These are general date/quality-time plans, not movies, not outing places unless the plan needs it. Use title + description + tag.",
  salidas:
    "Recommend outings outside the house: places to go, date spots, activities around town, short trips, food spots, parks, bookstores, arcades, museums. Do NOT recommend movies or TV shows. Use title + description + location + tag.",
  peliculas:
    "Recommend actual movies to watch. Titles must be real movie titles or very recognizable franchises. Do NOT recommend places to go or outings. Use title + description + genre + tag.",
  lista:
    "Recommend useful to-do/list items or small checklists for the couple. Do NOT recommend movies or places as standalone recommendations. Use title + description + tag.",
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  const section = body.section
  if (!section || !["planes", "salidas", "peliculas", "lista"].includes(section)) {
    return json({ error: "Invalid section" }, 400)
  }
  const language = body.language === "en" ? "en" : "es"
  const seed = Number(body.shuffleSeed ?? 0)
  const existing = Array.isArray(body.existingTitles)
    ? body.existingTitles.map((title) => clean(title, 80)).filter(Boolean).slice(0, 12)
    : []
  const context = Array.isArray(body.existingItems)
    ? body.existingItems.map((item) => clean(item, 220)).filter(Boolean).slice(0, 12)
    : []

  const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN")
  if (!hfToken) return json({ error: "HUGGINGFACE_API_TOKEN missing" }, 503)

  const prompt = `Generate exactly 3 fresh recommendations for app section "${section}". Language: ${language}.

Section rule: ${sectionPrompt[section]}

Current saved items with details:
${context.length ? context.map((item, index) => `${index + 1}. ${item}`).join("\n") : "none"}

Infer their taste from current saved items and recommend similar or adjacent ideas, but do not duplicate existing titles: ${existing.join(", ") || "none"}.
Example: if movies include Spider-Man, suggest similar superhero/action/adventure movies, not Spider-Man again.
Return ONLY a JSON object with key "ideas" containing an array of 3 items. Each item: title, description, optional tag, optional location, optional genre. Keep mobile-friendly, warm, practical, not generic.`

  try {
    const hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("HUGGINGFACE_MODEL") || "Qwen/Qwen2.5-7B-Instruct-1M",
        messages: [
          { role: "system", content: "You write concise JSON only. No markdown." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.9,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
    })
    const hfJson = await hfRes.json() as { choices?: Array<{ message?: { content?: string; reasoning?: string } }>; error?: unknown; message?: unknown }
    const content = hfJson.choices?.[0]?.message?.content ?? hfJson.choices?.[0]?.message?.reasoning ?? ""
    const ideas = parseIdeas(content)
    if (hfRes.ok && ideas?.length) return json({ ideas, fallback: false })
    console.error("[ai-ideas] hf failed", hfRes.status, JSON.stringify(hfJson).slice(0, 500))
    return json(
      {
        ideas: fallback(section, language, seed),
        fallback: true,
        hfStatus: hfRes.status,
        hfError: clean(JSON.stringify(hfJson), 500),
      },
      502,
    )
  } catch (error) {
    console.error("[ai-ideas] hf error", error)
    return json(
      {
        ideas: fallback(section, language, seed),
        fallback: true,
        hfError: clean(error instanceof Error ? error.message : String(error), 500),
      },
      502,
    )
  }
}
