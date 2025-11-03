import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/hooks/useUserProfile";

interface UserAvatarProps {
  user?: User | null;
  profile?: UserProfile | null;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function UserAvatar({
  user,
  profile,
  size = "md",
  showStatus = false,
  clickable = false,
  onClick,
  className,
}: UserAvatarProps) {
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getColorFromId = (id?: string) => {
    if (!id) return "hsl(var(--primary))";
    const hash = id.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(
          sizeClasses[size],
          clickable && "cursor-pointer transition-all hover:ring-4 hover:ring-primary/30",
          className
        )}
        onClick={clickable ? onClick : undefined}
      >
        {profile?.avatar_url && (
          <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
        )}
        <AvatarFallback
          style={{
            background: `linear-gradient(135deg, ${getColorFromId(user?.id)}, ${getColorFromId(
              user?.id?.split("").reverse().join("")
            )})`,
            color: "white",
          }}
        >
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
      )}
    </div>
  );
}
