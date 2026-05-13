import { useEffect, useRef } from "react"
import { useAuthStore } from "../store/authStore"
import { useGroupStore } from "../store/groupStore"
import { useStreakStore } from "../store/streakStore"
import { performStreakCheckIn } from "../lib/streak"
import insforge from "../lib/insforge"
import i18n from "../i18n"
import { requestPartnerFcmPush } from "../lib/requestPartnerFcmPush"

export function useStreak() {
  const { user } = useAuthStore()
  const { group, partnerId } = useGroupStore()
  const { setStreakResult, triggerAnimation, triggerBreakAnimation, reset } = useStreakStore()
  const checkedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !group) {
      reset()
      return
    }

    // Only run once per user+group session (prevents double fire on re-render)
    const key = `${user.id}:${group.id}`
    if (checkedRef.current === key) return
    checkedRef.current = key

    void (async () => {
      try {
        const result = await performStreakCheckIn(user.id, group.id)
        setStreakResult(result.streak, result.longestStreak)

        if (result.isFirstCheckInToday) {
          if (result.streakBroke && result.previousStreak > 1) {
            // Show countdown animation from old streak → 1
            triggerBreakAnimation(result.previousStreak)
          } else {
            // Show normal fire animation with new streak
            triggerAnimation(result.streak)
          }
        }

        if (result.streakBroke && result.previousStreak > 1) {
          const title = i18n.t("streak.streakLostTitle")
          const msg = i18n.t("streak.streakLostMessage", {
            count: result.previousStreak,
          })

          // Notify myself
          await insforge.database.from("notifications").insert([{
            user_id: user.id,
            title,
            message: msg,
            type: "streak_broke",
            created_by: user.id,
            group_id: group.id,
            reference_id: null,
            reference_type: "streak",
          }])

          // Notify partner + FCM push
          if (partnerId) {
            await insforge.database.from("notifications").insert([{
              user_id: partnerId,
              title,
              message: msg,
              type: "streak_broke",
              created_by: user.id,
              group_id: group.id,
              reference_id: null,
              reference_type: "streak",
            }])

            void requestPartnerFcmPush({
              targetUserId: partnerId,
              title,
              body: msg,
              referenceId: null,
              referenceType: "streak",
            })
          }
        }
      } catch (e) {
        console.warn("[useStreak]", e)
      }
    })()
  }, [user?.id, group?.id, partnerId, setStreakResult, triggerAnimation, triggerBreakAnimation, reset])
}
