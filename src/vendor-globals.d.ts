type KuroshiroConvertOptions = {
  delimiter_end?: string;
  delimiter_start?: string;
  mode?: "furigana" | "normal" | "okurigana" | "spaced";
  romajiSystem?: "hepburn" | "nippon" | "passport";
  to?: "hiragana" | "katakana" | "romaji";
};

type KuroshiroInstance = {
  convert(value: string, options?: KuroshiroConvertOptions): Promise<string>;
  init(analyzer: unknown): Promise<void>;
};

type KuroshiroConstructor = new () => KuroshiroInstance;
type KuromojiAnalyzerConstructor = new (options?: { dictPath?: string }) => unknown;

declare global {
  interface Window {
    Kuroshiro?: KuroshiroConstructor;
    KuromojiAnalyzer?: KuromojiAnalyzerConstructor;
  }
}

export {};
