import { useMemo } from "react"
import { motion } from "framer-motion"
import { Gem, MessageCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { useShallow } from "zustand/react/shallow"
import { DECORATIONS } from "./decorationDefs"
import { DecorationCard } from "./DecorationCard"
import { useDiamondStore } from "../../../../store/diamondStore"
import { useAuthStore } from "../../../../store/authStore"
import { staggerDelay } from "../../../../lib/motion"

export function DecorationsSection() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { diamonds, ownedDecor, equippedDecor, buyDecoration, equipDecoration } = useDiamondStore(
    useShallow((s) => ({
      diamonds: s.diamonds,
      ownedDecor: s.ownedDecor,
      equippedDecor: s.equippedDecor,
      buyDecoration: s.buyDecoration,
      equipDecoration: s.equipDecoration,
    })),
  )

  const { featured, catalog } = useMemo(() => {
    const equipped = DECORATIONS.find((d) => d.id === equippedDecor)
    const rest = DECORATIONS.filter((d) => d.id !== equippedDecor)
    return {
      featured: equipped ?? null,
      catalog: [...rest].sort((a, b) => b.cost - a.cost),
    }
  }, [equippedDecor])

  async function handleBuy(decorId: string, cost: number) {
    if (!user) return
    try {
      await buyDecoration(user.id, decorId, cost)
      toast.success(t("store.decor.unlocked"))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "not_enough_diamonds") {
        toast.error(t("store.decor.notEnough"))
      } else {
        toast.error(t("store.decor.buyFail"))
      }
    }
  }

  async function handleEquip(decorId: string) {
    if (!user) return
    try {
      await equipDecoration(user.id, decorId)
      toast.success(t("store.decor.applied"), { icon: "✨" })
    } catch {
      toast.error(t("store.decor.equipFail"))
    }
  }

  return (
    <motion.div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-2.5 rounded-2xl border border-sky-500/15 bg-sky-500/8 px-4 py-3"
      >
        <MessageCircle size={14} className="mt-0.5 shrink-0 text-sky-400" strokeWidth={2.25} aria-hidden />
        <p className="text-xs leading-relaxed text-base-content/60">{t("store.decor.hint")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="flex items-center justify-between gap-3 px-0.5"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-base-content/35">
          {t("store.decor.bubbleStyles")}
        </span>
        <motion.div
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-sky-400"
          aria-label={t("store.diamonds")}
        >
          <Gem size={13} strokeWidth={2.5} aria-hidden />
          {diamonds}
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-3"
        role="list"
        aria-label={t("store.decor.bubbleStyles")}
      >
        {featured && (
          <motion.div
            key={featured.id}
            role="listitem"
            className="col-span-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(0, 0.05) }}
          >
            <DecorationCard
              decor={featured}
              owned={ownedDecor.has(featured.id)}
              equipped
              diamonds={diamonds}
              layout="featured"
              onBuy={() => handleBuy(featured.id, featured.cost)}
              onEquip={() => handleEquip(featured.id)}
            />
          </motion.div>
        )}

        {catalog.map((decor, i) => (
          <motion.div
            key={decor.id}
            role="listitem"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(i + (featured ? 1 : 0), 0.05, 0.3) }}
            className="min-w-0"
          >
            <DecorationCard
              decor={decor}
              owned={ownedDecor.has(decor.id)}
              equipped={equippedDecor === decor.id}
              diamonds={diamonds}
              layout="compact"
              onBuy={() => handleBuy(decor.id, decor.cost)}
              onEquip={() => handleEquip(decor.id)}
            />
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  )
}
