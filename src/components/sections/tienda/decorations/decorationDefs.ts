export type DecorationTarget = "bubble" | "card"
export type DecorationVariant = "bubble-nebula" | "aurora-circuit" | "ember-crown" | "celestial-bloom"

export interface DecorationDef {
  id: string
  nameEn: string
  nameEs: string
  descEn: string
  descEs: string
  cost: number
  target: DecorationTarget
  /** CSS style object applied to the preview bubble wrapper */
  previewStyle: React.CSSProperties
  /** CSS style object applied to the preview bubble text */
  textStyle?: React.CSSProperties
  /** Accent color for UI accents (badge, glow) */
  accent: string
  /** Named animated renderer; omitted for static bubble styles. */
  variant?: DecorationVariant
}

export const DECORATIONS: DecorationDef[] = [
  {
    id: "bubble-spark",
    nameEn: "Golden Spark",
    nameEs: "Chispa Dorada",
    descEn: "Shimmer gold border on your messages",
    descEs: "Borde dorado brillante en tus mensajes",
    cost: 5,
    target: "bubble",
    accent: "#f59e0b",
    previewStyle: {
      background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      boxShadow: "0 0 0 2px #f59e0b, 0 0 14px #f59e0b55",
      borderRadius: "18px 18px 4px 18px",
    },
    textStyle: { color: "#78350f" },
  },
  {
    id: "bubble-rose",
    nameEn: "Petal Rose",
    nameEs: "Pétalo Rosa",
    descEn: "Soft rose gradient border",
    descEs: "Borde degradado rosa suave",
    cost: 8,
    target: "bubble",
    accent: "#ec4899",
    previewStyle: {
      background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
      boxShadow: "0 0 0 2px #ec4899, 0 0 14px #ec489955",
      borderRadius: "18px 18px 4px 18px",
    },
    textStyle: { color: "#831843" },
  },
  {
    id: "bubble-midnight",
    nameEn: "Midnight Blue",
    nameEs: "Azul Medianoche",
    descEn: "Cool electric-blue aura",
    descEs: "Aura eléctrica azul fría",
    cost: 12,
    target: "bubble",
    accent: "#3b82f6",
    previewStyle: {
      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      boxShadow: "0 0 0 2px #3b82f6, 0 0 18px #3b82f660",
      borderRadius: "18px 18px 4px 18px",
    },
    textStyle: { color: "#1e3a8a" },
  },
  {
    id: "bubble-nebula",
    nameEn: "Nebula Pulse",
    nameEs: "Pulso Nebulosa",
    descEn: "Living aurora rim, drifting stardust & shimmer text",
    descEs: "Aurora viva, polvo estelar y texto brillante",
    cost: 30,
    target: "bubble",
    accent: "#a855f7",
    variant: "bubble-nebula",
    previewStyle: {},
    textStyle: {},
  },
  {
    id: "card-aurora-circuit",
    nameEn: "Aurora Circuit",
    nameEs: "Circuito Aurora",
    descEn: "Electric cyan and violet light travels around your cards",
    descEs: "Luz eléctrica cian y violeta recorre tus tarjetas",
    cost: 3,
    target: "card",
    accent: "#22d3ee",
    variant: "aurora-circuit",
    previewStyle: {},
  },
  {
    id: "card-ember-crown",
    nameEn: "Ember Crown",
    nameEs: "Corona de Brasas",
    descEn: "Molten gold edge with a warm cinematic shimmer",
    descEs: "Borde dorado fundido con brillo cinematográfico",
    cost: 3,
    target: "card",
    accent: "#f59e0b",
    variant: "ember-crown",
    previewStyle: {},
  },
  {
    id: "card-celestial-bloom",
    nameEn: "Celestial Bloom",
    nameEs: "Flor Celestial",
    descEn: "A deep cosmic rim with orbiting rose-blue starlight",
    descEs: "Un borde cósmico con luz estelar rosa y azul en órbita",
    cost: 3,
    target: "card",
    accent: "#c084fc",
    variant: "celestial-bloom",
    previewStyle: {},
  },
]

export function getDecorationById(id: string): DecorationDef | undefined {
  return DECORATIONS.find((d) => d.id === id)
}

export function getCardDecorationById(id: string | null | undefined): DecorationDef | undefined {
  if (!id) return undefined
  const decoration = getDecorationById(id)
  return decoration?.target === "card" ? decoration : undefined
}
