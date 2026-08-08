import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { LayoutPanelTop, MessageCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { useShallow } from "zustand/react/shallow"
import { DECORATIONS, type DecorationDef } from "./decorationDefs"
import { DecorationCard } from "./DecorationCard"
import { DecorationPreviewModal } from "./DecorationPreviewModal"
import { useDiamondStore } from "../../../../store/diamondStore"
import { useAuthStore } from "../../../../store/authStore"

export function DecorationsSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [previewDecor, setPreviewDecor] = useState<DecorationDef | null>(null)
  const { diamonds, ownedDecor, equippedDecor, equippedCardDecor, buyDecoration, equipDecoration } = useDiamondStore(
    useShallow((s) => ({
      diamonds: s.diamonds,
      ownedDecor: s.ownedDecor,
      equippedDecor: s.equippedDecor,
      equippedCardDecor: s.equippedCardDecor,
      buyDecoration: s.buyDecoration,
      equipDecoration: s.equipDecoration,
    })),
  )

  const catalogs = useMemo(
    () => ({
      bubble: DECORATIONS.filter((item) => item.target === "bubble").sort((a, b) => b.cost - a.cost),
      card: DECORATIONS.filter((item) => item.target === "card").sort((a, b) => a.id.localeCompare(b.id)),
    }),
    [],
  )

  async function handleBuy(decorId: string) {
    if (!user) return
    try {
      await buyDecoration(decorId)
      toast.success(t("store.decor.unlocked"))
      setPreviewDecor(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "not_enough_diamonds") {
        toast.error(t("store.decor.notEnough"))
      } else {
        toast.error(t("store.decor.buyFail"))
      }
    }
  }

  async function handleEquip(decorId: string, target: "bubble" | "card") {
    if (!user) return
    try {
      await equipDecoration(decorId, target)
      toast.success(t("store.decor.applied"))
    } catch {
      toast.error(t("store.decor.equipFail"))
    }
  }

  const groups = [
    {
      target: "card" as const,
      title: t("store.decor.cardStyles"),
      subtitle: t("store.decor.cardHint"),
      icon: LayoutPanelTop,
      items: catalogs.card,
      equippedId: equippedCardDecor,
      color: "#c084fc",
    },
    {
      target: "bubble" as const,
      title: t("store.decor.bubbleStyles"),
      subtitle: t("store.decor.bubbleHint"),
      icon: MessageCircle,
      items: catalogs.bubble,
      equippedId: equippedDecor,
      color: "#38bdf8",
    },
  ]

  return (
    <motion.div className="flex flex-col gap-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-1.5 text-center text-[11px] leading-snug text-base-content/45 justify-center"
      >
        <LayoutPanelTop size={12} className="mt-0.5 shrink-0 text-violet-400" strokeWidth={2.25} aria-hidden />
        <span>{t("store.decor.hint")}</span>
      </motion.p>

      {groups.map((group, groupIndex) => {
        const active = group.items.find((item) => item.id === group.equippedId)
        const Icon = group.icon
        return (
          <motion.section
            key={group.target}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.06 }}
            className="rounded-2xl border border-base-300/80 bg-base-200/35 p-3"
          >
            <div className="mb-3 flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ color: group.color, background: `${group.color}18` }}>
                <Icon size={17} strokeWidth={2.3} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-base-content">{group.title}</h3>
                  {active && (
                    <span className="max-w-[45%] truncate rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: active.accent, background: `${active.accent}1f` }}>
                      {lang === "en" ? active.nameEn : active.nameEs}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-base-content/40">{group.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5" role="list" aria-label={group.title}>
              {group.items.map((decor, i) => (
                <div key={decor.id} role="listitem" className="min-w-0">
                  <DecorationCard
                    decor={decor}
                    owned={ownedDecor.has(decor.id)}
                    equipped={group.equippedId === decor.id}
                    diamonds={diamonds}
                    index={i}
                    onPreview={() => setPreviewDecor(decor)}
                    onEquip={() => handleEquip(decor.id, group.target)}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )
      })}
      <DecorationPreviewModal
        decor={previewDecor}
        profile={profile}
        diamonds={diamonds}
        onClose={() => setPreviewDecor(null)}
        onBuy={handleBuy}
      />
    </motion.div>
  )
}
