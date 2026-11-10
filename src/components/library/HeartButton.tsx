import { memo } from "react";
import { Heart } from "lucide-react";
import { favoritesStore, useIsFavorite } from "../../app/favorites-store";

type HeartButtonProps = {
  artist: string;
  className?: string;
  labels: { add: string; remove: string };
  size?: number;
  title: string;
};

/** ❤ toggle for one song; only this button re-renders when it changes. */
export const HeartButton = memo(function HeartButton({ artist, className = "", labels, size = 16, title }: HeartButtonProps) {
  const isFavorite = useIsFavorite(artist, title);
  const label = isFavorite ? labels.remove : labels.add;

  return (
    <button
      aria-label={label}
      aria-pressed={isFavorite}
      className={`heart-button${isFavorite ? " active" : ""} ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        favoritesStore.toggle({ artist, title });
      }}
      title={label}
      type="button"
    >
      <Heart aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} size={size} strokeWidth={2.1} />
    </button>
  );
});
