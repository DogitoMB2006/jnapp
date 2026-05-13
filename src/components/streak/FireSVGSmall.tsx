import { motion } from "framer-motion"

interface Props {
  primary: string
  secondary: string
  accent: string
  size?: number
}

export function FireSVGSmall({ primary, secondary, accent, size = 24 }: Props) {
  const id = `fsm-${primary.replace("#", "")}`
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="12" y1="31" x2="12" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accent} />
          <stop offset="55%" stopColor={secondary} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="12" y1="26" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="50%" stopColor={secondary} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <motion.path
        d="M12 31C5 31 2 26 2 21C2 16 6 13 8 10C7 14 9 17 11 18C9 14 10 10 12 6C11 10 13 13 15 16C16 13 15 9 13 5C18 9 22 15 22 21C22 27 18 31 12 31Z"
        fill={`url(#${id}-a)`}
        animate={{
          d: [
            "M12 31C5 31 2 26 2 21C2 16 6 13 8 10C7 14 9 17 11 18C9 14 10 10 12 6C11 10 13 13 15 16C16 13 15 9 13 5C18 9 22 15 22 21C22 27 18 31 12 31Z",
            "M12 31C6 31 2 25 2 21C2 16 7 13 9 10C8 14 10 17 12 18C10 14 11 9 13 6C12 10 14 13 16 16C17 13 16 8 14 5C19 9 22 15 22 21C22 27 17 31 12 31Z",
            "M12 31C5 31 2 26 2 21C2 16 6 13 8 10C7 14 9 17 11 18C9 14 10 10 12 6C11 10 13 13 15 16C16 13 15 9 13 5C18 9 22 15 22 21C22 27 18 31 12 31Z",
          ],
        }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="12"
        cy="23"
        rx="4"
        ry="6"
        fill={`url(#${id}-b)`}
        animate={{ rx: [4, 3.5, 4.5, 4], ry: [6, 6.5, 5.5, 6] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
      />
    </svg>
  )
}
