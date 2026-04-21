import type { Profile } from "../../types";

interface AvatarProps {
  profile: Profile | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-xl",
};

export function Avatar({ profile, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const initial = (profile?.display_name || profile?.username || "?")[0].toUpperCase();

  return (
    <div className={`avatar ${className}`}>
      <div className={`${sizeClass} rounded-full ring-2 ring-primary ring-offset-1 ring-offset-base-100`}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name || "avatar"} className="object-cover" />
        ) : (
          <div className="bg-gradient-to-br from-primary to-secondary flex items-center justify-center w-full h-full rounded-full">
            <span className="text-white font-bold">{initial}</span>
          </div>
        )}
      </div>
    </div>
  );
}
