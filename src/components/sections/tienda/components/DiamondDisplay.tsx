import { useState } from "react"
import { motion } from "framer-motion"
import { Gem, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useDiamondStore } from "../../../../store/diamondStore"
import { useAuthStore } from "../../../../store/authStore"
import { EarnDiamondsModal } from "./EarnDiamondsModal"

export function DiamondDisplay() {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { diamonds } = useDiamondStore()
  const { user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="inline-flex items-center gap-2.5 rounded-xl border border-sky-500/20 bg-sky-500/6 px-3.5 py-2"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-400"
          aria-hidden
        >
          <Gem className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-sky-400/70 font-medium uppercase tracking-wider">
            {lang === "en" ? "Diamonds" : "Diamantes"}
          </span>
          <span className="font-semibold text-base tabular-nums text-sky-300">{diamonds}</span>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/12 text-sky-400 hover:bg-sky-400/20 active:scale-95 transition-colors duration-150"
            aria-label={lang === "en" ? "Earn diamonds" : "Ganar diamantes"}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        )}
      </motion.div>

      {user && (
        <EarnDiamondsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={user.id}
        />
      )}
    </>
  )
}
