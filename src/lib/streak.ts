import insforge from "./insforge"

export interface StreakCheckInResult {
  streak: number
  longestStreak: number
  isFirstCheckInToday: boolean
  streakBroke: boolean
  previousStreak: number
}

export type StreakTier = "fire" | "blue" | "cyan" | "purple"

export function getStreakTier(streak: number): StreakTier {
  if (streak >= 100) return "purple"
  if (streak >= 50) return "cyan"
  if (streak >= 20) return "blue"
  return "fire"
}

export const STREAK_TIER_COLORS: Record<StreakTier, {
  primary: string
  secondary: string
  accent: string
  glow: string
  bg: string
}> = {
  fire: {
    primary: "#FF5722",
    secondary: "#FF8A00",
    accent: "#FFCC02",
    glow: "rgba(255, 87, 34, 0.55)",
    bg: "rgba(255, 87, 34, 0.12)",
  },
  blue: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    accent: "#BFDBFE",
    glow: "rgba(59, 130, 246, 0.55)",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  cyan: {
    primary: "#06B6D4",
    secondary: "#22D3EE",
    accent: "#A5F3FC",
    glow: "rgba(6, 182, 212, 0.55)",
    bg: "rgba(6, 182, 212, 0.12)",
  },
  purple: {
    primary: "#A855F7",
    secondary: "#C084FC",
    accent: "#E9D5FF",
    glow: "rgba(168, 85, 247, 0.55)",
    bg: "rgba(168, 85, 247, 0.12)",
  },
}

/** Returns today and yesterday as YYYY-MM-DD strings in local time */
function getLocalDateStrings(): { today: string; yesterday: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayDate = new Date(todayDate.getTime() - 86400000)
  return { today: fmt(todayDate), yesterday: fmt(yesterdayDate) }
}

export async function performStreakCheckIn(
  userId: string,
  groupId: string
): Promise<StreakCheckInResult> {
  const { today, yesterday } = getLocalDateStrings()

  // Check if this user already checked in today
  const { data: existingCheckIn } = await insforge.database
    .from("streak_checkins")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("check_in_date", today)
    .limit(1)

  if (existingCheckIn && (existingCheckIn as unknown[]).length > 0) {
    const { data: streakRow } = await insforge.database
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("group_id", groupId)
      .single()
    const row = streakRow as { current_streak: number; longest_streak: number } | null
    return {
      streak: row?.current_streak ?? 1,
      longestStreak: row?.longest_streak ?? 1,
      isFirstCheckInToday: false,
      streakBroke: false,
      previousStreak: 0,
    }
  }

  // Insert check-in (ignore duplicate errors — race condition safety)
  await insforge.database
    .from("streak_checkins")
    .insert([{ group_id: groupId, user_id: userId, check_in_date: today }])

  // Get streak row for group
  const { data: streakData } = await insforge.database
    .from("streaks")
    .select("*")
    .eq("group_id", groupId)
    .single()

  const existing = streakData as {
    current_streak: number
    longest_streak: number
    last_check_in_date: string | null
  } | null

  if (!existing) {
    await insforge.database.from("streaks").insert([{
      group_id: groupId,
      current_streak: 1,
      longest_streak: 1,
      last_check_in_date: today,
    }])
    return { streak: 1, longestStreak: 1, isFirstCheckInToday: true, streakBroke: false, previousStreak: 0 }
  }

  const lastDate = existing.last_check_in_date

  if (lastDate === today) {
    // Partner already checked in today — show current streak without incrementing
    return {
      streak: existing.current_streak,
      longestStreak: existing.longest_streak,
      isFirstCheckInToday: true,
      streakBroke: false,
      previousStreak: 0,
    }
  }

  if (lastDate === yesterday) {
    // Streak continues!
    const newStreak = existing.current_streak + 1
    const newLongest = Math.max(existing.longest_streak, newStreak)
    await insforge.database
      .from("streaks")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_check_in_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("group_id", groupId)
    return {
      streak: newStreak,
      longestStreak: newLongest,
      isFirstCheckInToday: true,
      streakBroke: false,
      previousStreak: 0,
    }
  }

  // Streak broke — missed at least one day
  const prevStreak = existing.current_streak
  await insforge.database
    .from("streaks")
    .update({
      current_streak: 1,
      last_check_in_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("group_id", groupId)
  return {
    streak: 1,
    longestStreak: existing.longest_streak,
    isFirstCheckInToday: true,
    streakBroke: true,
    previousStreak: prevStreak,
  }
}

export async function fetchCurrentStreak(
  groupId: string
): Promise<{ streak: number; longestStreak: number } | null> {
  const { data } = await insforge.database
    .from("streaks")
    .select("current_streak, longest_streak")
    .eq("group_id", groupId)
    .single()
  if (!data) return null
  const row = data as { current_streak: number; longest_streak: number }
  return { streak: row.current_streak, longestStreak: row.longest_streak }
}
