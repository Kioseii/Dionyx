import { describe, expect, it } from "vitest";
import { isRepeatableShortcut, resolveShortcut } from "./shortcuts";

const key = (value: string, mods: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }> = {}) => ({
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  key: value,
  ...mods,
});

describe("resolveShortcut", () => {
  it("maps the plain keys", () => {
    expect(resolveShortcut(key(" "))).toBe("toggle-playback");
    expect(resolveShortcut(key("ArrowLeft"))).toBe("seek-back");
    expect(resolveShortcut(key("ArrowRight"))).toBe("seek-forward");
    expect(resolveShortcut(key("m"))).toBe("toggle-mute");
    expect(resolveShortcut(key("L"))).toBe("toggle-lyrics");
    expect(resolveShortcut(key("/"))).toBe("focus-search");
  });

  it("maps Ctrl and Cmd combinations alike", () => {
    expect(resolveShortcut(key("ArrowRight", { ctrlKey: true }))).toBe("next-track");
    expect(resolveShortcut(key("ArrowUp", { metaKey: true }))).toBe("volume-up");
    expect(resolveShortcut(key("f", { ctrlKey: true }))).toBe("focus-search");
  });

  it("ignores Alt, unknown keys and Ctrl+other letters", () => {
    expect(resolveShortcut(key("m", { altKey: true }))).toBeNull();
    expect(resolveShortcut(key("x"))).toBeNull();
    expect(resolveShortcut(key("c", { ctrlKey: true }))).toBeNull();
    expect(resolveShortcut(key("ArrowUp"))).toBeNull();
  });

  it("only lets seeking and volume repeat while held", () => {
    expect(isRepeatableShortcut("seek-forward")).toBe(true);
    expect(isRepeatableShortcut("toggle-playback")).toBe(false);
  });
});
