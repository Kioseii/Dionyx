import { memo, useCallback, useRef } from "react";
import { Disc3, Play, UserRound } from "lucide-react";
import { countLabel, filterGroups, type TrackGroup } from "../../app/library-groups";
import { getTrackArtworkSrc } from "../../app/utils";
import { useShell } from "../layout/ShellContext";

type LibraryGroupsGridProps = {
  kind: "album" | "artist";
  normalizedSearch: string;
};

/** Album or artist cards. Clicking a card opens it; the round button plays it. */
export function LibraryGroupsGrid({ kind, normalizedSearch }: LibraryGroupsGridProps) {
  const shell = useShell();
  const groups = filterGroups(kind === "album" ? shell.albumGroups : shell.artistGroups, normalizedSearch);
  // Stable callbacks so memoized cards skip the re-render on every playback tick.
  const latestRef = useRef({ kind, shell });
  latestRef.current = { kind, shell };
  const onOpen = useCallback((key: string) => {
    const { kind: currentKind, shell: currentShell } = latestRef.current;
    (currentKind === "album" ? currentShell.onOpenAlbum : currentShell.onOpenArtist)(key);
  }, []);
  const onPlay = useCallback((indices: number[]) => {
    latestRef.current.shell.onPlayLibraryIndices(indices);
  }, []);

  if (shell.libraryTrackCount === 0) {
    return (
      <div className="table-empty">
        <strong>{shell.copy.noSongsTitle}</strong>
        <p>{shell.copy.noSongsBody}</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="table-empty">
        <strong>{shell.copy.noGroupResults}</strong>
      </div>
    );
  }

  return (
    <div className={`group-grid group-grid--${kind}`}>
      {groups.map((group) => (
        <GroupCard
          group={group}
          key={group.key}
          kind={kind}
          onOpen={onOpen}
          onPlay={onPlay}
          playLabel={shell.copy.playGroup}
          subtitle={
            kind === "album"
              ? `${group.artistName ?? ""} · ${countLabel(group.indices.length, shell.copy.trackCountSingular, shell.copy.tracksCountLabel)}`
              : `${countLabel(group.indices.length, shell.copy.trackCountSingular, shell.copy.tracksCountLabel)} · ${countLabel(group.albumCount, shell.copy.albumCountSingular, shell.copy.albumsCountLabel)}`
          }
        />
      ))}
    </div>
  );
}

type GroupCardProps = {
  group: TrackGroup;
  kind: "album" | "artist";
  onOpen: (key: string) => void;
  onPlay: (indices: number[], shuffle?: boolean) => void;
  playLabel: string;
  subtitle: string;
};

const GroupCard = memo(function GroupCard({ group, kind, onOpen, onPlay, playLabel, subtitle }: GroupCardProps) {
  const coverSrc = group.coverTrack ? getTrackArtworkSrc(group.coverTrack) : null;

  return (
    <div className="group-card">
      <div className="group-card-cover">
        {/* Mouse target for the cover; keyboard/screen readers use the title button. */}
        <button
          aria-hidden="true"
          className="group-card-cover-button"
          onClick={() => onOpen(group.key)}
          tabIndex={-1}
          type="button"
        >
          {coverSrc ? (
            <img alt="" className="group-card-image" decoding="async" loading="lazy" src={coverSrc} />
          ) : kind === "album" ? (
            <Disc3 aria-hidden="true" className="group-card-placeholder" size={36} strokeWidth={1.6} />
          ) : (
            <UserRound aria-hidden="true" className="group-card-placeholder" size={36} strokeWidth={1.6} />
          )}
        </button>
        <button
          aria-label={`${playLabel} ${group.name}`}
          className="group-card-play"
          onClick={() => onPlay(group.indices)}
          title={`${playLabel} ${group.name}`}
          type="button"
        >
          <Play aria-hidden="true" size={18} strokeWidth={2.4} />
        </button>
      </div>
      <button className="group-card-main" onClick={() => onOpen(group.key)} type="button">
        <span className="group-card-name">{group.name}</span>
        <span className="group-card-meta">{subtitle}</span>
      </button>
    </div>
  );
});
