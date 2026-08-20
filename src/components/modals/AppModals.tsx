import type { ChangeEvent, RefObject } from "react";
import { Check, ChevronDown } from "lucide-react";
import { defaultThemeColor, equalizerPresets, fontPresets, themePresets } from "../../app/constants";
import type { AppLanguage, PersonalizationView, ToolingSupport } from "../../app/types";

type EditMetaCopy = {
  editMetaTitle: string;
  editMetaArtworkChange: string;
  editMetaArtworkHint: string;
  editMetaFieldTitle: string;
  editMetaFieldArtist: string;
  editMetaFieldAlbum: string;
  editMetaCancel: string;
  editMetaSaving: string;
  editMetaSave: string;
};

type EqualizerCopy = {
  equalizerModalTitle: string;
  equalizerHint: string;
  equalizerEnabled: string;
  equalizerDisabled: string;
  equalizerPresetLabel: string;
  done: string;
};

type PersonalizationCopy = {
  personalize: string;
  adjustLook: string;
  personalizationTabs: string;
  themes: string;
  fonts: string;
  settings: string;
  customColor: string;
  hexHint: string;
  hideOnTrayLabel: string;
  hideOnTrayHint: string;
  languageSection: string;
  appLanguage: string;
  appLanguageHint: string;
  spanish: string;
  english: string;
  reset: string;
  done: string;
};

type ToolsCopy = {
  installedEs: string;
  installedEn: string;
  installEs: string;
  installEn: string;
  toolsEs: string;
  toolsEn: string;
  toolsTitleEs: string;
  toolsTitleEn: string;
  toolsHintEs: string;
  toolsHintEn: string;
  recheckEs: string;
  recheckEn: string;
};

type EditMetadataModalProps = {
  copy: EditMetaCopy;
  editMetaAlbum: string;
  editMetaArtist: string;
  editMetaArtworkError: string | null;
  editMetaArtworkInputRef: RefObject<HTMLInputElement | null>;
  editMetaArtworkPreview: string | null;
  editMetaTitle: string;
  isOpen: boolean;
  isSavingMeta: boolean;
  onAlbumChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onArtworkChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onOpenArtworkPicker: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
};

export function EditMetadataModal({
  copy,
  editMetaAlbum,
  editMetaArtist,
  editMetaArtworkError,
  editMetaArtworkInputRef,
  editMetaArtworkPreview,
  editMetaTitle,
  isOpen,
  isSavingMeta,
  onAlbumChange,
  onArtistChange,
  onArtworkChange,
  onClose,
  onOpenArtworkPicker,
  onSave,
  onTitleChange,
}: EditMetadataModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="edit-meta-modal-title"
        aria-modal="true"
        className="modal-shell edit-meta-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="edit-meta-header">
          <h2 className="modal-title" id="edit-meta-modal-title">
            {copy.editMetaTitle}
          </h2>
        </div>

        <div className="edit-meta-artwork-row">
          <div className="edit-meta-artwork-thumb">
            {editMetaArtworkPreview ? (
              <img alt="Portada" src={editMetaArtworkPreview} />
            ) : (
              <div className="edit-meta-artwork-placeholder" />
            )}
          </div>
          <div className="edit-meta-artwork-info">
            <button
              className="edit-meta-artwork-btn"
              onClick={onOpenArtworkPicker}
              type="button"
            >
              {copy.editMetaArtworkChange}
            </button>
            <span className="edit-meta-artwork-hint">{copy.editMetaArtworkHint}</span>
            {editMetaArtworkError ? (
              <span className="edit-meta-artwork-error">{editMetaArtworkError}</span>
            ) : null}
            <input
              accept="image/jpeg,image/png"
              onChange={onArtworkChange}
              ref={editMetaArtworkInputRef}
              style={{ display: "none" }}
              type="file"
            />
          </div>
        </div>

        <div className="edit-meta-fields">
          <label className="edit-meta-label">
            <span>{copy.editMetaFieldTitle}</span>
            <input
              className="edit-meta-input"
              maxLength={120}
              onChange={(e) => onTitleChange(e.target.value)}
              type="text"
              value={editMetaTitle}
            />
          </label>
          <label className="edit-meta-label">
            <span>{copy.editMetaFieldArtist}</span>
            <input
              className="edit-meta-input"
              maxLength={120}
              onChange={(e) => onArtistChange(e.target.value)}
              type="text"
              value={editMetaArtist}
            />
          </label>
          <label className="edit-meta-label">
            <span>{copy.editMetaFieldAlbum}</span>
            <input
              className="edit-meta-input"
              maxLength={120}
              onChange={(e) => onAlbumChange(e.target.value)}
              type="text"
              value={editMetaAlbum}
            />
          </label>
        </div>

        <div className="edit-meta-footer">
          <button
            className="edit-meta-cancel-btn"
            disabled={isSavingMeta}
            onClick={onClose}
            type="button"
          >
            {copy.editMetaCancel}
          </button>
          <button
            className="edit-meta-save-btn"
            disabled={isSavingMeta}
            onClick={onSave}
            type="button"
          >
            {isSavingMeta ? copy.editMetaSaving : copy.editMetaSave}
          </button>
        </div>
      </div>
    </div>
  );
}

type EqualizerModalProps = {
  appLanguage: AppLanguage;
  copy: EqualizerCopy;
  equalizerBandsConfig: Array<{ id: string; frequency: string }>;
  equalizerPresetMenuRef: RefObject<HTMLDivElement | null>;
  equalizerValues: number[];
  isEqualizerEnabled: boolean;
  isEqualizerPresetMenuOpen: boolean;
  isEqualizerSupported: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPresetMenuToggle: () => void;
  onPresetSelect: (presetId: string) => void;
  onPresetMenuClose: () => void;
  onSliderChange: (index: number, nextValue: number) => void;
  onToggle: (nextEnabled: boolean) => void;
  selectedEqualizerPresetId: string;
  selectedEqualizerPresetLabel: string;
};

export function EqualizerModal({
  appLanguage,
  copy,
  equalizerBandsConfig,
  equalizerPresetMenuRef,
  equalizerValues,
  isEqualizerEnabled,
  isEqualizerPresetMenuOpen,
  isEqualizerSupported,
  isOpen,
  onClose,
  onPresetMenuToggle,
  onPresetSelect,
  onPresetMenuClose,
  onSliderChange,
  onToggle,
  selectedEqualizerPresetId,
  selectedEqualizerPresetLabel,
}: EqualizerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="equalizer-modal-title"
        aria-modal="true"
        className="modal-shell equalizer-modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <div className="equalizer-modal-header">
          <div className="equalizer-modal-title-block">
            <h3 id="equalizer-modal-title">{copy.equalizerModalTitle}</h3>
            <p className="muted equalizer-modal-copy">{copy.equalizerHint}</p>
          </div>
          <label className={`equalizer-toggle ${isEqualizerEnabled ? "active" : ""}`}>
            <input
              checked={isEqualizerEnabled}
              disabled={!isEqualizerSupported}
              onChange={(event) => {
                onToggle(event.currentTarget.checked);
              }}
              type="checkbox"
            />
            <span className="equalizer-toggle-label">
              {isEqualizerEnabled ? copy.equalizerEnabled : copy.equalizerDisabled}
            </span>
            <span className="equalizer-toggle-track">
              <span className="equalizer-toggle-thumb" />
            </span>
          </label>
        </div>

        <div className={`equalizer-stage ${isEqualizerEnabled ? "" : "disabled"}`}>
          <div className="equalizer-slider-strip">
            {equalizerBandsConfig.map((band, index) => (
              <label className="equalizer-slider-band" key={band.id}>
                <span className="equalizer-slider-shell">
                  <input
                    aria-label={band.frequency}
                    className="equalizer-slider-vertical"
                    disabled={!isEqualizerEnabled || !isEqualizerSupported}
                    max="12"
                    min="-12"
                    onChange={(event) => {
                      onSliderChange(index, Number(event.currentTarget.value));
                    }}
                    step="1"
                    type="range"
                    value={equalizerValues[index]}
                  />
                </span>
                <span className="equalizer-frequency-short">{band.id}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="equalizer-footer">
          <div className="equalizer-preset-block" ref={equalizerPresetMenuRef}>
            <span className="equalizer-preset-label">{copy.equalizerPresetLabel}</span>
            <button
              aria-expanded={isEqualizerPresetMenuOpen}
              className={`sort-trigger equalizer-preset-trigger ${isEqualizerPresetMenuOpen ? "open" : ""}`}
              onClick={onPresetMenuToggle}
              type="button"
            >
              <span>{selectedEqualizerPresetLabel}</span>
              <ChevronDown aria-hidden="true" className="sort-trigger-icon" strokeWidth={2.1} />
            </button>
            {isEqualizerPresetMenuOpen ? (
              <div className="sort-menu equalizer-preset-menu">
                {equalizerPresets.map((preset) => {
                  const isSelected = selectedEqualizerPresetId === preset.id;

                  return (
                    <button
                      className={`sort-menu-item ${isSelected ? "selected" : ""}`}
                      key={preset.id}
                      onClick={() => {
                        onPresetSelect(preset.id);
                      }}
                      type="button"
                    >
                      <span>{appLanguage === "es" ? preset.labelEs : preset.labelEn}</span>
                      {isSelected ? (
                        <Check aria-hidden="true" className="sort-menu-check" strokeWidth={2.1} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="mini-button active"
            onClick={() => {
              onPresetMenuClose();
              onClose();
            }}
            type="button"
          >
            {copy.done}
          </button>
        </div>
      </div>
    </div>
  );
}

type PersonalizationModalProps = {
  appLanguage: AppLanguage;
  copy: PersonalizationCopy;
  ffmpegInstallError: string | null;
  ffmpegInstallProgress: number;
  ffmpegVersion: string | null;
  fontPresetId: string;
  hideOnTray: boolean;
  isFfmpegAvailable: boolean | null;
  isInstallingFfmpeg: boolean;
  isInstallingYtdlp: boolean;
  isOpen: boolean;
  isYtdlpAvailable: boolean | null;
  onClose: () => void;
  onDone: () => void;
  onFfmpegInstall: () => void;
  onFontPresetChange: (presetId: string) => void;
  onHideOnTrayChange: (nextValue: boolean) => void;
  onLanguageChange: (language: AppLanguage) => void;
  onOpenSettingsTab: () => void;
  onPersonalizationViewChange: (view: PersonalizationView) => void;
  onRecheckDeps: () => void;
  onReset: () => void;
  onThemeColorChange: (color: string) => void;
  onThemeHexBlur: () => void;
  onThemeHexDraftChange: (value: string) => void;
  onYtdlpInstall: () => void;
  personalizationView: PersonalizationView;
  themeColor: string;
  themeHexDraft: string;
  toolingSupport: ToolingSupport;
  toolsCopy: ToolsCopy;
  ytdlpInstallError: string | null;
  ytdlpInstallProgress: number;
  ytdlpVersion: string | null;
};

export function PersonalizationModal({
  appLanguage,
  copy,
  ffmpegInstallError,
  ffmpegInstallProgress,
  ffmpegVersion,
  fontPresetId,
  hideOnTray,
  isFfmpegAvailable,
  isInstallingFfmpeg,
  isInstallingYtdlp,
  isOpen,
  isYtdlpAvailable,
  onClose,
  onDone,
  onFfmpegInstall,
  onFontPresetChange,
  onHideOnTrayChange,
  onLanguageChange,
  onOpenSettingsTab,
  onPersonalizationViewChange,
  onRecheckDeps,
  onReset,
  onThemeColorChange,
  onThemeHexBlur,
  onThemeHexDraftChange,
  onYtdlpInstall,
  personalizationView,
  themeColor,
  themeHexDraft,
  toolingSupport,
  toolsCopy,
  ytdlpInstallError,
  ytdlpInstallProgress,
  ytdlpVersion,
}: PersonalizationModalProps) {
  if (!isOpen) {
    return null;
  }

  const toolsPlatformHint =
    toolingSupport.platform === "macos"
      ? (appLanguage === "es"
          ? "En macOS DIONYX descarga yt-dlp por su cuenta y usa Homebrew para ffmpeg."
          : "On macOS DIONYX downloads yt-dlp itself and uses Homebrew for ffmpeg.")
      : toolingSupport.platform === "windows"
        ? (appLanguage === "es"
            ? "En Windows DIONYX descarga yt-dlp por su cuenta y usa winget para ffmpeg."
            : "On Windows DIONYX downloads yt-dlp itself and uses winget for ffmpeg.")
        : (appLanguage === "es"
            ? "La instalacion de herramientas puede variar segun la plataforma."
            : "Tool setup may vary depending on the platform.");

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="personalization-modal-title"
        aria-modal="true"
        className="modal-shell theme-modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <p className="eyebrow">{copy.personalize}</p>
        <h3 id="personalization-modal-title">{copy.adjustLook}</h3>

        <div className="personalization-tabs" role="tablist" aria-label={copy.personalizationTabs}>
          <button
            aria-selected={personalizationView === "theme"}
            className={`personalization-tab ${personalizationView === "theme" ? "active" : ""}`}
            onClick={() => {
              onPersonalizationViewChange("theme");
            }}
            role="tab"
            type="button"
          >
            {copy.themes}
          </button>
          <button
            aria-selected={personalizationView === "font"}
            className={`personalization-tab ${personalizationView === "font" ? "active" : ""}`}
            onClick={() => {
              onPersonalizationViewChange("font");
            }}
            role="tab"
            type="button"
          >
            {copy.fonts}
          </button>
          <button
            aria-selected={personalizationView === "settings"}
            className={`personalization-tab ${personalizationView === "settings" ? "active" : ""}`}
            onClick={onOpenSettingsTab}
            role="tab"
            type="button"
          >
            {copy.settings}
          </button>
        </div>

        <div className="personalization-panel">
          {personalizationView === "theme" ? (
            <>
              <div className="theme-preview" style={{ backgroundColor: themeColor }}>
                <span>{themeColor.toUpperCase()}</span>
              </div>

              <div className="theme-swatches">
                {themePresets.map((preset) => (
                  <button
                    aria-label={`Usar tema ${preset.name}`}
                    className={`theme-swatch ${themeColor === preset.value ? "selected" : ""}`}
                    key={preset.value}
                    onClick={() => {
                      onThemeColorChange(preset.value);
                    }}
                    style={{ backgroundColor: preset.value }}
                    type="button"
                  />
                ))}
              </div>

              <label className="modal-field" htmlFor="theme-color-input">
                <span>{copy.customColor}</span>
                <div className="theme-picker-row">
                  <input
                    className="theme-color-input"
                    id="theme-color-input"
                    onChange={(event) => {
                      onThemeColorChange(event.currentTarget.value);
                    }}
                    type="color"
                    value={themeColor}
                  />
                  <input
                    className="modal-input theme-hex-input"
                    onBlur={onThemeHexBlur}
                    onChange={(event) => {
                      onThemeHexDraftChange(event.currentTarget.value);
                    }}
                    placeholder={defaultThemeColor}
                    spellCheck={false}
                    type="text"
                    value={themeHexDraft}
                  />
                </div>
                <p className="muted modal-hint">{copy.hexHint}</p>
              </label>
            </>
          ) : personalizationView === "font" ? (
            <div className="font-preset-grid">
              {fontPresets.map((preset) => (
                <button
                  aria-label={`Usar fuente ${preset.label}`}
                  className={`font-preset-card ${fontPresetId === preset.id ? "selected" : ""}`}
                  key={preset.id}
                  onClick={() => {
                    onFontPresetChange(preset.id);
                  }}
                  type="button"
                >
                  <span className="font-preset-label">{preset.label}</span>
                  <strong style={{ fontFamily: preset.displayFamily, ...preset.sampleStyle }}>{preset.sample}</strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="settings-panel">
              <div className="settings-card">
                <strong>{copy.hideOnTrayLabel}</strong>
                <p className="muted settings-copy">{copy.hideOnTrayHint}</p>
                <button
                  className={`settings-toggle ${hideOnTray ? "active" : ""}`}
                  onClick={() => {
                    onHideOnTrayChange(!hideOnTray);
                  }}
                  role="switch"
                  aria-checked={hideOnTray}
                  type="button"
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <div className="settings-card settings-card--tools">
                <span className="font-preset-label">{appLanguage === "es" ? toolsCopy.toolsEs : toolsCopy.toolsEn}</span>
                <strong>{appLanguage === "es" ? toolsCopy.toolsTitleEs : toolsCopy.toolsTitleEn}</strong>
                <p className="muted settings-copy">
                  {appLanguage === "es" ? toolsCopy.toolsHintEs : toolsCopy.toolsHintEn}{" "}
                  {toolsPlatformHint}
                </p>

                <div className="settings-tools-rows">
                  <div className="settings-tool-row">
                    <span className={`setup-tool-status ${isYtdlpAvailable === null ? "checking" : isYtdlpAvailable ? "ok" : "missing"}`}>
                      {isYtdlpAvailable === null ? "…" : isYtdlpAvailable ? "✓" : "✗"}
                    </span>
                    <div className="settings-tool-info">
                      <strong>yt-dlp</strong>
                      {isYtdlpAvailable && ytdlpVersion ? (
                        <span className="setup-tool-version">{ytdlpVersion}</span>
                      ) : isYtdlpAvailable ? (
                        <span className="setup-tool-version">{appLanguage === "es" ? toolsCopy.installedEs : toolsCopy.installedEn}</span>
                      ) : null}
                    </div>
                    {!isYtdlpAvailable ? (
                      isInstallingYtdlp ? (
                        <div className="settings-tool-progress">
                          <div className="setup-progress-bar" style={{ width: 120 }}>
                            <div className="setup-progress-fill" style={{ width: `${ytdlpInstallProgress}%` }} />
                          </div>
                          <span className="setup-tool-version">{ytdlpInstallProgress}%</span>
                        </div>
                      ) : (
                        <button className="setup-install-btn" onClick={onYtdlpInstall} type="button">
                          {appLanguage === "es" ? toolsCopy.installEs : toolsCopy.installEn}
                        </button>
                      )
                    ) : null}
                  </div>

                  <div className="settings-tool-row">
                    <span className={`setup-tool-status ${isFfmpegAvailable === null ? "checking" : isFfmpegAvailable ? "ok" : "missing"}`}>
                      {isFfmpegAvailable === null ? "…" : isFfmpegAvailable ? "✓" : "✗"}
                    </span>
                    <div className="settings-tool-info">
                      <strong>ffmpeg</strong>
                      {isFfmpegAvailable ? (
                        <span className="setup-tool-version">
                          {ffmpegVersion ?? (appLanguage === "es" ? toolsCopy.installedEs : toolsCopy.installedEn)}
                        </span>
                      ) : null}
                    </div>
                    {isFfmpegAvailable === false ? (
                      isInstallingFfmpeg ? (
                        <div className="settings-tool-progress">
                          <div className="setup-progress-bar" style={{ width: 120 }}>
                            <div className="setup-progress-fill" style={{ width: `${ffmpegInstallProgress > 0 ? ffmpegInstallProgress : 30}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button className="setup-install-btn" onClick={onFfmpegInstall} type="button">
                          {appLanguage === "es" ? toolsCopy.installEs : toolsCopy.installEn}
                        </button>
                      )
                    ) : null}
                  </div>
                </div>

                {(ytdlpInstallError || ffmpegInstallError) ? (
                  <p className="setup-tool-error">
                    {ytdlpInstallError ?? ffmpegInstallError}
                  </p>
                ) : null}

                <button
                  className="setup-recheck-btn"
                  onClick={onRecheckDeps}
                  style={{ alignSelf: "flex-start", marginTop: 2 }}
                  type="button"
                >
                  ↻ {appLanguage === "es" ? toolsCopy.recheckEs : toolsCopy.recheckEn}
                </button>
              </div>

              <div className="settings-card">
                <span className="font-preset-label">{copy.languageSection}</span>
                <strong>{copy.appLanguage}</strong>
                <p className="muted settings-copy">{copy.appLanguageHint}</p>
                <div className="settings-options">
                  <button
                    className={`settings-option ${appLanguage === "es" ? "selected" : ""}`}
                    onClick={() => {
                      onLanguageChange("es");
                    }}
                    type="button"
                  >
                    {copy.spanish}
                  </button>
                  <button
                    className={`settings-option ${appLanguage === "en" ? "selected" : ""}`}
                    onClick={() => {
                      onLanguageChange("en");
                    }}
                    type="button"
                  >
                    {copy.english}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="mini-button"
            onClick={onReset}
            type="button"
          >
            {copy.reset}
          </button>
          <button
            className="mini-button active"
            onClick={onDone}
            type="button"
          >
            {copy.done}
          </button>
        </div>
      </div>
    </div>
  );
}
