import insforge from "./insforge"
import type { Section } from "../types"

export type AiIdeaSection = Exclude<Section, "perfil">

export type AiIdea = {
  title: string
  description: string
  tag?: string
  location?: string
  genre?: string
}

type AiIdeasResponse = {
  ideas?: AiIdea[]
  fallback?: boolean
}

const fallbackIdeas: Record<AiIdeaSection, Record<"en" | "es", AiIdea[]>> = {
  planes: {
    en: [
      { title: "Cozy recipe night", description: "Pick a new recipe, cook together, and rate it like a tiny restaurant.", tag: "At home" },
      { title: "Memory walk", description: "Visit a place that means something to both of you and take one new photo there.", tag: "Romantic" },
      { title: "No-phone dessert date", description: "Make or buy dessert, put phones away, and ask each other 5 fun questions.", tag: "Chill" },
    ],
    es: [
      { title: "Noche de receta nueva", description: "Elijan una receta, cocinen juntos y califíquenla como si fuera un restaurante pequeño.", tag: "En casa" },
      { title: "Paseo de recuerdos", description: "Vayan a un lugar especial para los dos y tómense una foto nueva ahí.", tag: "Romántico" },
      { title: "Postre sin celulares", description: "Preparen o compren un postre, guarden los celulares y háganse 5 preguntas divertidas.", tag: "Tranqui" },
    ],
  },
  salidas: {
    en: [
      { title: "Sunset walk", description: "Go for a short walk before sunset and end with a drink or snack.", location: "Park or viewpoint", tag: "Cheap" },
      { title: "Tiny food tour", description: "Try one snack from three different places and pick the winner.", location: "Nearby food spots", tag: "Fun" },
      { title: "Bookstore mini date", description: "Each picks one book the other would like, then compare choices over coffee.", location: "Bookstore", tag: "Chill" },
    ],
    es: [
      { title: "Paseo al atardecer", description: "Den un paseo corto antes del atardecer y terminen con una bebida o snack.", location: "Parque o mirador", tag: "Barato" },
      { title: "Mini tour de comida", description: "Prueben un snack de tres lugares distintos y elijan ganador.", location: "Lugares cercanos", tag: "Divertido" },
      { title: "Cita en librería", description: "Cada uno elige un libro que al otro le gustaría y luego comparan con café.", location: "Librería", tag: "Tranqui" },
    ],
  },
  peliculas: {
    en: [
      { title: "About Time", description: "Warm romantic movie with time-travel and cozy couple energy.", genre: "Romance" },
      { title: "The Grand Budapest Hotel", description: "Stylish, funny, colorful, and easy to watch together.", genre: "Comedy" },
      { title: "Your Name", description: "Emotional animated story, romantic but still adventurous.", genre: "Anime" },
    ],
    es: [
      { title: "Cuestión de tiempo", description: "Romántica, cálida y con viajes en el tiempo. Buena para ver juntos.", genre: "Romance" },
      { title: "El gran hotel Budapest", description: "Bonita, rara, divertida y visualmente preciosa.", genre: "Comedia" },
      { title: "Your Name", description: "Historia animada emocional, romántica y con aventura.", genre: "Anime" },
    ],
  },
  lista: {
    en: [
      { title: "Plan a picnic kit", description: "Blanket, drinks, snacks, napkins, speaker, and one small surprise.", tag: "Checklist" },
      { title: "Weekend reset", description: "Laundry, groceries, clean one shared space, choose one reward after.", tag: "Home" },
      { title: "Date night prep", description: "Pick outfit, confirm place, charge phones, and choose backup plan.", tag: "Useful" },
    ],
    es: [
      { title: "Preparar kit de picnic", description: "Manta, bebidas, snacks, servilletas, bocina y una sorpresa pequeña.", tag: "Checklist" },
      { title: "Reset del finde", description: "Ropa, compras, ordenar un espacio compartido y elegir una recompensa.", tag: "Casa" },
      { title: "Preparar cita", description: "Elegir ropa, confirmar lugar, cargar celulares y tener plan B.", tag: "Útil" },
    ],
  },
}

export const getFallbackAiIdeas = (section: AiIdeaSection, language: string) => {
  const lang = language === "en" ? "en" : "es"
  return fallbackIdeas[section][lang]
}

export const fetchAiIdeas = async (args: {
  section: AiIdeaSection
  language: string
  existingTitles: string[]
  existingItems?: string[]
  shuffleSeed: number
}) => {
  try {
    const { data, error } = await insforge.functions.invoke("ai-ideas", {
      body: {
        section: args.section,
        language: args.language === "en" ? "en" : "es",
        existingTitles: args.existingTitles.slice(0, 12),
        existingItems: (args.existingItems ?? []).slice(0, 12),
        shuffleSeed: args.shuffleSeed,
      },
    })
    if (error) throw error
    const result = data as AiIdeasResponse | null
    const ideas = result?.ideas
    if (Array.isArray(ideas) && ideas.length && !result?.fallback) return ideas.slice(0, 3)
  } catch (error) {
    if (import.meta.env.DEV) console.warn("[fetchAiIdeas] fallback", error)
  }
  return getFallbackAiIdeas(args.section, args.language)
}
