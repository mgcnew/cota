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

/**
 * Optimized thumbnail sizes for avatars by context
 * Requirements: 17.3
 */
const thumbnailSizes = {
  sm: 32,   // 32x32 for small avatars (lists, comments)
  md: 40,   // 40x40 for medium avatars (headers, cards)
  lg: 64,   // 64x64 for large avatars (profiles)
  xl: 96,   // 96x96 for extra large avatars (profile pages)
};

/**
 * Generate optimized avatar URL with size parameters
 * Works with Supabase Storage URLs
 */
function getOptimizedAvatarUrl(url: string | undefined, size: keyof typeof thumbnailSizes): string | undefined {
  if (!url) return undefined;
  
  // If it's a Supabase storage URL, we can add transform parameters
  // Supabase supports image transformations via URL parameters
  if (url.includes('supabase') && url.includes('/storage/')) {
    const targetSize = thumbnailSizes[size];
    // Add width and height parameters for Supabase image transformation
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${targetSize}&height=${targetSize}&resize=cover`;
  }
  
  return url;
}

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

  // Get optimized avatar URL based on size
  const optimizedAvatarUrl = getOptimizedAvatarUrl(profile?.avatar_url, size);

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
        {optimizedAvatarUrl && (
          <AvatarImage 
            src={optimizedAvatarUrl} 
            alt={profile?.full_name || "User"} 
            loading="lazy"
            decoding="async"
          />
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
