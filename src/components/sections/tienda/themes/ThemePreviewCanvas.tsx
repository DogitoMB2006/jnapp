import { useTranslation } from "react-i18next"
import type { Profile, ThemeDef } from "../../../../types"

type ThemePreviewCanvasProps = {
  theme: ThemeDef
  profile?: Profile | null
  compact?: boolean
  className?: string
}

export function ThemePreviewCanvas({
  theme,
  profile,
  compact = false,
  className = "",
}: ThemePreviewCanvasProps) {
  const { t } = useTranslation()
  const { bg, primary, secondary, accent, text } = theme.preview
  const displayName = profile?.display_name || profile?.username || t("store.themePreview.you")
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div
      className={`relative overflow-hidden ${compact ? "p-3" : "p-5"} ${className}`}
      style={{
        color: text,
        background: `linear-gradient(155deg, ${bg} 10%, ${primary}38 58%, ${bg} 100%)`,
      }}
    >
      <span
        className="absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl"
        style={{ background: `${accent}42` }}
        aria-hidden
      />
      <span
        className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${primary}32` }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-2">
          <div
            className={`shrink-0 overflow-hidden rounded-full border-2 ${compact ? "h-7 w-7" : "h-10 w-10"}`}
            style={{ borderColor: primary, background: `${secondary}55` }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-extrabold" style={{ color: text }}>
                {initial}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className={`${compact ? "text-[7px]" : "text-[10px]"} font-semibold opacity-45`}>
              {t("store.themePreview.welcome")}
            </p>
            <p className={`${compact ? "text-[10px]" : "text-sm"} truncate font-extrabold`}>{displayName}</p>
          </div>
          <span className="ml-auto h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
        </div>

        <div
          className={`mt-auto rounded-2xl border ${compact ? "p-2.5" : "p-4"}`}
          style={{ borderColor: `${primary}55`, background: `${bg}cc`, boxShadow: `0 14px 35px ${bg}88` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`${compact ? "text-[10px]" : "text-sm"} truncate font-extrabold`}>
                {t("store.themePreview.planTitle")}
              </p>
              <p className={`${compact ? "mt-0.5 text-[7px]" : "mt-1 text-[11px]"} opacity-45`}>
                {t("store.themePreview.planText")}
              </p>
            </div>
            <span
              className={`${compact ? "h-5 w-5" : "h-7 w-7"} shrink-0 rounded-full`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            />
          </div>
          <div className={`${compact ? "mt-2" : "mt-4"} flex gap-1.5`}>
            <span className="h-1 flex-1 rounded-full" style={{ background: primary }} />
            <span className="h-1 w-1/3 rounded-full" style={{ background: `${secondary}70` }} />
          </div>
        </div>

        <div className={`${compact ? "mt-2" : "mt-4"} flex items-center justify-center gap-2`}>
          {[primary, secondary, accent].map((color) => (
            <span key={color} className={`${compact ? "h-1 w-5" : "h-1.5 w-8"} rounded-full`} style={{ background: color }} />
          ))}
        </div>
      </div>
    </div>
  )
}
