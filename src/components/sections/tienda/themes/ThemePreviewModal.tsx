import { useState } from "react"
import { Coins, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Modal } from "../../../shared/Modal"
import type { Profile, ThemeDef } from "../../../../types"
import { ThemePreviewCanvas } from "./ThemePreviewCanvas"

type ThemePreviewModalProps = {
  theme: ThemeDef | null
  profile: Profile | null
  coins: number
  onClose: () => void
  onBuy: (theme: ThemeDef) => Promise<void>
}

export function ThemePreviewModal({ theme, profile, coins, onClose, onBuy }: ThemePreviewModalProps) {
  const { t, i18n } = useTranslation()
  const [buying, setBuying] = useState(false)
  const lang = i18n.language === "en" ? "en" : "es"
  const name = theme ? (lang === "en" ? theme.nameEn : theme.nameEs) : ""
  const canAfford = theme ? coins >= theme.cost : false

  async function handleBuy() {
    if (!theme || buying || !canAfford) return
    setBuying(true)
    try {
      await onBuy(theme)
    } finally {
      setBuying(false)
    }
  }

  return (
    <Modal open={Boolean(theme)} onClose={onClose} title={name || t("store.themePreview.title")}>
      {theme && (
        <div className="flex flex-col gap-4">
          <ThemePreviewCanvas theme={theme} profile={profile} className="h-[330px] rounded-[26px] border border-white/10 shadow-2xl" />

          <div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-primary" aria-hidden />
              <p className="text-sm font-extrabold text-base-content">{t("store.themePreview.sharedTitle")}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-base-content/50">
              {t("store.themePreview.sharedText")}
            </p>
            <p className="mt-2 text-[11px] font-medium text-base-content/35">
              {t("store.themePreview.afterBuyHint")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleBuy()}
            disabled={buying || !canAfford}
            className="btn btn-primary min-h-12 w-full rounded-2xl gap-2 disabled:bg-base-300 disabled:text-base-content/35"
          >
            {buying ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Coins size={17} strokeWidth={2.5} aria-hidden />
                {canAfford
                  ? t("store.themePreview.buyFor", { count: theme.cost })
                  : t("store.themePreview.needMore")}
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  )
}
