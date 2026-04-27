import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, Sparkles, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Modal } from "./Modal"
import { fetchAiIdeas, type AiIdea, type AiIdeaSection } from "../../lib/aiIdeas"

type Props = {
  open: boolean
  section: AiIdeaSection
  existingTitles: string[]
  existingItems?: string[]
  onClose: () => void
  onUse: (idea: AiIdea) => void
}

export function AiIdeasModal({ open, section, existingTitles, existingItems = [], onClose, onUse }: Props) {
  const { t, i18n } = useTranslation()
  const [ideas, setIdeas] = useState<AiIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const existingTitlesKey = useMemo(
    () => existingTitles.map((title) => title.trim()).filter(Boolean).join("\n"),
    [existingTitles],
  )
  const existingItemsKey = useMemo(
    () => existingItems.map((item) => item.trim()).filter(Boolean).join("\n"),
    [existingItems],
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetchAiIdeas({
      section,
      language: i18n.language,
      existingTitles: existingTitlesKey ? existingTitlesKey.split("\n") : [],
      existingItems: existingItemsKey ? existingItemsKey.split("\n") : [],
      shuffleSeed,
    }).then((nextIdeas) => {
      if (cancelled) return
      setIdeas(nextIdeas)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [existingItemsKey, existingTitlesKey, i18n.language, open, section, shuffleSeed])

  return (
    <Modal open={open} onClose={onClose} title={t("aiIdeas.title")}>
      <div className="flex flex-col gap-4">
        <div className="rounded-[26px] border border-primary/20 bg-primary/10 px-4 py-4 shadow-inner">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/20 p-2 text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-base-content">{t(`aiIdeas.sections.${section}`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-base-content/60">{t("aiIdeas.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-[28px] border border-white/10 bg-base-200/60">
              <span className="loading loading-dots loading-md text-primary" />
            </div>
          ) : (
            ideas.map((idea, index) => (
              <motion.div
                key={`${idea.title}-${index}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring", damping: 24, stiffness: 320 }}
                className="rounded-[28px] border border-white/10 bg-base-200/80 p-4 shadow-lg shadow-black/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {idea.tag || idea.genre || idea.location ? (
                      <span className="mb-2 inline-flex rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
                        {idea.tag || idea.genre || idea.location}
                      </span>
                    ) : null}
                    <h4 className="text-base font-bold leading-tight text-base-content">{idea.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-base-content/65">{idea.description}</p>
                    {idea.location && idea.tag ? (
                      <p className="mt-2 text-xs font-semibold text-secondary">{idea.location}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => onUse(idea)}
                  className="btn btn-primary mt-4 min-h-12 w-full rounded-2xl"
                >
                  <Wand2 size={17} />
                  {t("aiIdeas.use")}
                </button>
              </motion.div>
            ))
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShuffleSeed((seed) => seed + 1)}
          disabled={loading}
          className="btn btn-ghost min-h-12 w-full rounded-2xl border border-white/10 bg-base-200/50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          {t("aiIdeas.shuffle")}
        </motion.button>
      </div>
    </Modal>
  )
}
