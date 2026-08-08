import { useState } from "react"
import { Gem } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar } from "../../../shared/Avatar"
import { CardDecorationFrame } from "../../../shared/CardDecorationFrame"
import { Modal } from "../../../shared/Modal"
import { usePrefersReducedMotion } from "../../../../lib/motion"
import type { Profile } from "../../../../types"
import { AnimatedBubbleFrame } from "./AnimatedBubbleFrame"
import type { DecorationDef } from "./decorationDefs"

type DecorationPreviewModalProps = {
  decor: DecorationDef | null
  profile: Profile | null
  diamonds: number
  onClose: () => void
  onBuy: (decorId: string) => Promise<void>
}

export function DecorationPreviewModal({
  decor,
  profile,
  diamonds,
  onClose,
  onBuy,
}: DecorationPreviewModalProps) {
  const { t, i18n } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const [buying, setBuying] = useState(false)
  const lang = i18n.language === "en" ? "en" : "es"
  const name = decor ? (lang === "en" ? decor.nameEn : decor.nameEs) : ""
  const description = decor ? (lang === "en" ? decor.descEn : decor.descEs) : ""
  const displayName = profile?.display_name || profile?.username || t("store.decor.you")
  const canAfford = decor ? diamonds >= decor.cost : false

  async function handleBuy() {
    if (!decor || buying || !canAfford) return
    setBuying(true)
    try {
      await onBuy(decor.id)
    } finally {
      setBuying(false)
    }
  }

  return (
    <Modal open={Boolean(decor)} onClose={onClose} title={name || t("store.decor.previewTitle")}>
      {decor && (
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[26px] border border-base-300 bg-base-100/65 p-4 shadow-inner">
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-base-content/35">
              {t("store.decor.previewTitle")}
            </p>

            {decor.target === "card" ? (
              <CardDecorationFrame decorationId={decor.id}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#211129] to-[#120b19] shadow-xl">
                  <div className="p-4">
                    <p className="text-base font-extrabold tracking-tight text-white/95">
                      {t("store.decor.previewCardTitle")}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                      {t("store.decor.previewCardText")}
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3">
                      <Avatar profile={profile} size="sm" />
                      <span className="truncate text-xs font-semibold text-white/55">{displayName}</span>
                    </div>
                  </div>
                </div>
              </CardDecorationFrame>
            ) : (
              <div className="flex min-h-36 items-end justify-end gap-3 rounded-2xl bg-base-200/55 p-4">
                <div className="min-w-0 max-w-[78%]">
                  <p className="mb-1.5 text-right text-[10px] font-bold text-base-content/35">{displayName}</p>
                  {decor.variant === "bubble-nebula" ? (
                    <AnimatedBubbleFrame isMine reducedMotion={reducedMotion}>
                      <p className="bubble-nebula__label text-sm font-semibold leading-relaxed">
                        {t("store.decor.previewBubbleText")}
                      </p>
                    </AnimatedBubbleFrame>
                  ) : (
                    <div className="px-4 py-3 text-sm font-semibold leading-relaxed shadow-md" style={decor.previewStyle}>
                      <span style={decor.textStyle ?? {}}>{t("store.decor.previewBubbleText")}</span>
                    </div>
                  )}
                </div>
                <Avatar profile={profile} size="md" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-extrabold text-base-content">{name}</p>
            <p className="mt-1 text-xs leading-relaxed text-base-content/50">{description}</p>
            <p className="mt-2 text-[11px] font-medium text-base-content/35">{t("store.decor.afterBuyHint")}</p>
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
                <Gem size={17} strokeWidth={2.5} aria-hidden />
                {canAfford
                  ? t("store.decor.buyFor", { count: decor.cost })
                  : t("store.decor.needMore")}
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  )
}
