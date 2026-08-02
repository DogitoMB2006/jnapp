import { useMemo } from "react"
import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { useShallow } from "zustand/react/shallow"
import { DECORATIONS } from "./decorationDefs"
import { DecorationCard } from "./DecorationCard"
import { useDiamondStore } from "../../../../store/diamondStore"
import { useAuthStore } from "../../../../store/authStore"

export function DecorationsSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
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

  const equipped = useMemo(
    () => DECORATIONS.find((d) => d.id === equippedDecor) ?? null,
    [equippedDecor],
  )

  const catalog = useMemo(
    () => [...DECORATIONS].sort((a, b) => b.cost - a.cost),
    [],
  )

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
      toast.success(t("store.decor.applied"))
    } catch {
      toast.error(t("store.decor.equipFail"))
    }
  }

  const equippedName = equipped
    ? lang === "en"
      ? equipped.nameEn
      : equipped.nameEs
    : null

  return (
    <motion.div className="flex flex-col gap-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-1.5 text-center text-[11px] leading-snug text-base-content/45 justify-center"
      >
        <MessageCircle size={12} className="mt-0.5 shrink-0 text-sky-400" strokeWidth={2.25} aria-hidden />
        <span>{t("store.decor.hint")}</span>
      </motion.p>

      {equipped && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-xl border px-2.5 py-2"
          style={{
            borderColor: `${equipped.accent}40`,
            background: `${equipped.accent}12`,
          }}
          aria-label={`${t("store.yourSpace")}: ${equippedName}`}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold shadow-sm"
            style={equipped.previewStyle}
            aria-hidden
          >
            <span style={equipped.textStyle ?? {}}>{lang === "en" ? "Hi" : "Hola"}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/40">
              {t("store.decor.bubbleStyles")}
            </p>
            <p className="truncate text-sm font-bold text-base-content">{equippedName}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: `${equipped.accent}28`, color: equipped.accent }}
          >
            {t("store.on")}
          </span>
        </motion.div>
      )}

      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5"
        role="list"
        aria-label={t("store.decor.bubbleStyles")}
      >
        {catalog.map((decor, i) => (
          <div key={decor.id} role="listitem" className="min-w-0">
            <DecorationCard
              decor={decor}
              owned={ownedDecor.has(decor.id)}
              equipped={equippedDecor === decor.id}
              diamonds={diamonds}
              index={i}
              onBuy={() => handleBuy(decor.id, decor.cost)}
              onEquip={() => handleEquip(decor.id)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
