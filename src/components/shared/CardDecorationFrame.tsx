import type { CSSProperties, ReactNode } from "react"
import { getCardDecorationById } from "../sections/tienda/decorations/decorationDefs"
import { useAuthStore } from "../../store/authStore"
import { useDiamondStore } from "../../store/diamondStore"
import type { Profile } from "../../types"

type CardDecorationFrameProps = {
  decorationId?: string | null
  creator?: Profile | null
  children: ReactNode
  className?: string
  preview?: boolean
  style?: CSSProperties
}

export function CardDecorationFrame({
  decorationId,
  creator,
  children,
  className = "",
  preview = false,
  style,
}: CardDecorationFrameProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const currentCardDecor = useDiamondStore((state) => state.equippedCardDecor)
  const resolvedId = decorationId ?? (
    creator?.user_id === currentUserId ? currentCardDecor : creator?.equipped_card_decor
  )
  const decoration = getCardDecorationById(resolvedId)
  if (!decoration?.variant) return <div className={className} style={style}>{children}</div>

  return (
    <div
      className={`card-decor-frame card-decor-frame--${decoration.variant} ${preview ? "card-decor-frame--preview" : ""} ${className}`}
      style={{ ...style, "--card-decor-accent": decoration.accent } as CSSProperties}
    >
      {children}
    </div>
  )
}
