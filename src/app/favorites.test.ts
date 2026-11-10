import { describe, expect, it } from "vitest";
import { addPending, reconcileFavorites, type FavoriteEntry } from "./favorites";
import { songIdentity } from "./history";

const fav = (artist: string, title: string, syncedAt?: number): FavoriteEntry => ({
  addedAt: 1,
  artist,
  id: songIdentity(artist, title),
  syncedAt,
  title,
});
const change = (artist: string, title: string, love: boolean) => ({ artist, id: songIdentity(artist, title), love, title });

describe("reconcileFavorites", () => {
  it("first sync is a union: Last.fm loves come in, local ones go out", () => {
    const result = reconcileFavorites([fav("A", "Local")], [{ artist: "B", title: "Remote" }], [], 100);
    expect(result.entries.map((entry) => entry.title).sort()).toEqual(["Local", "Remote"]);
    expect(result.toLove.map((item) => item.title)).toEqual(["Local"]);
    expect(result.toUnlove).toEqual([]);
  });

  it("matches songs whatever the case or spacing", () => {
    const result = reconcileFavorites([fav("Mrs. GREEN APPLE", "Soranji", 50)], [{ artist: "mrs green apple", title: "SORANJI" }], [], 100);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].syncedAt).toBe(100);
    expect(result.toLove).toEqual([]);
  });

  it("a synced favorite removed on Last.fm is removed here", () => {
    const result = reconcileFavorites([fav("A", "Song", 50)], [], [], 100);
    expect(result.entries).toEqual([]);
    expect(result.toLove).toEqual([]);
  });

  it("an un-❤ made here wins over the old Last.fm love", () => {
    const result = reconcileFavorites([], [{ artist: "A", title: "Song" }], [change("A", "Song", false)], 100);
    expect(result.entries).toEqual([]);
    expect(result.toUnlove.map((item) => item.title)).toEqual(["Song"]);
  });

  it("a ❤ made here after a sync is sent again, not dropped", () => {
    const result = reconcileFavorites([fav("A", "Song", 50)], [], [change("A", "Song", true)], 100);
    expect(result.entries).toHaveLength(1);
    expect(result.toLove.map((item) => item.title)).toEqual(["Song"]);
  });
});

describe("addPending", () => {
  it("keeps only the latest change per song", () => {
    const pending = addPending([change("A", "Song", true)], change("A", "Song", false));
    expect(pending).toEqual([change("A", "Song", false)]);
  });
});
