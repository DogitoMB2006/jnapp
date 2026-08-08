import type { CSSProperties } from "react"
import { getDecorationById } from "../components/sections/tienda/decorations/decorationDefs"

export type CommentBubbleAppearance = {
  className: string
  style: CSSProperties
  textStyle: CSSProperties
  animated?: boolean
  labelClassName?: string
  metaClassName?: string
  messageClassName?: string
}

const DEFAULT_MINE =
  "rounded-[22px] rounded-tr-md border border-primary/25 bg-primary/20 px-4 py-3 shadow-lg shadow-black/10 transition-colors duration-200"

const DEFAULT_THEIRS =
  "rounded-[22px] rounded-tl-md border border-white/10 bg-base-200/85 px-4 py-3 shadow-lg shadow-black/10 transition-colors duration-200"

/** Bubble decoration for a comment author (visible to everyone in the group). */
export function getCommentBubbleAppearance(
  equippedDecorId: string | null,
  isMine: boolean,
): CommentBubbleAppearance | null {
  if (!equippedDecorId) return null
  const decor = getDecorationById(equippedDecorId)
  if (!decor || decor.target !== "bubble") return null

  if (decor.variant === "bubble-nebula") {
    return {
      className: "",
      style: {},
      textStyle: {},
      animated: true,
      labelClassName: "bubble-nebula__label",
      metaClassName: "bubble-nebula__meta",
      messageClassName: "bubble-nebula__message",
    }
  }

  const tailRadius = isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px"

  return {
    className: isMine
      ? "rounded-[22px] rounded-tr-md border border-transparent px-4 py-3 shadow-lg transition-colors duration-200"
      : "rounded-[22px] rounded-tl-md border border-transparent px-4 py-3 shadow-lg transition-colors duration-200",
    style: { ...decor.previewStyle, borderRadius: tailRadius },
    textStyle: decor.textStyle ?? {},
  }
}

export function getCommentBubbleClassName(isMine: boolean): string {
  return isMine ? DEFAULT_MINE : DEFAULT_THEIRS
}
