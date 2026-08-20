import dionyxLogoRaw from "../../assets/dionyx-logo.svg?raw";
import { Maximize2, Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  return (
    <div
      className="titlebar"
      data-tauri-drag-region
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest(".titlebar-controls")) return;
        e.preventDefault();
        void getCurrentWindow().startDragging();
      }}
    >
      <div className="titlebar-left">
        <span className="titlebar-logo" dangerouslySetInnerHTML={{ __html: dionyxLogoRaw }} />
        <span className="titlebar-name">DIONYX</span>
      </div>
      <div className="titlebar-controls">
        <button
          aria-label="Minimizar"
          className="titlebar-btn titlebar-minimize"
          onClick={() => void getCurrentWindow().minimize()}
          type="button"
        >
          <Minus size={12} strokeWidth={2} />
        </button>
        <button
          aria-label="Maximizar"
          className="titlebar-btn titlebar-maximize"
          onClick={() => void getCurrentWindow().toggleMaximize()}
          type="button"
        >
          <Maximize2 size={11} strokeWidth={2} />
        </button>
        <button
          aria-label="Cerrar"
          className="titlebar-btn titlebar-close"
          onClick={() => void getCurrentWindow().close()}
          type="button"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
