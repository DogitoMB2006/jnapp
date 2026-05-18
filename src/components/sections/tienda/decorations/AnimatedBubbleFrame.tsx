import { memo, type ReactNode } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"

type AnimatedBubbleFrameProps = HTMLMotionProps<"div"> & {
  isMine: boolean
  reducedMotion?: boolean
  children: ReactNode
}

export const AnimatedBubbleFrame = memo(function AnimatedBubbleFrame({
  isMine,
  reducedMotion = false,
  children,
  className = "",
  ...motionProps
}: AnimatedBubbleFrameProps) {
  const staticClass = reducedMotion ? "bubble-nebula--static" : ""

  return (
    <motion.div
      className={`bubble-nebula ${staticClass} ${className}`.trim()}
      data-tail={isMine ? "mine" : "theirs"}
      {...motionProps}
    >
      <div className="bubble-nebula__glow" aria-hidden />
      <motion.div className="bubble-nebula__ring" aria-hidden />
      <motion.div className="bubble-nebula__particles" aria-hidden>
        <span className="bubble-nebula__particle bubble-nebula__particle--1" />
        <span className="bubble-nebula__particle bubble-nebula__particle--2" />
        <span className="bubble-nebula__particle bubble-nebula__particle--3" />
        <span className="bubble-nebula__particle bubble-nebula__particle--4" />
      </motion.div>
      <motion.div className="bubble-nebula__body px-4 py-3 shadow-lg">
        {!reducedMotion ? <div className="bubble-nebula__shimmer" aria-hidden /> : null}
        <div className="relative z-[4]">{children}</div>
      </motion.div>
    </motion.div>
  )
})
