import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRTL, t } from "./i18n";

// Chrome i18n mock

vi.stubGlobal("chrome", {
  i18n: {
    getMessage: vi.fn((key: string) => `[${key}]`),
    getUILanguage: vi.fn(() => "en"),
  },
});

// t()

describe("t", () => {
  it("returns the message from chrome.i18n", () => {
    expect(t("btn_save")).toBe("[btn_save]");
  });

  it("falls back to the key when getMessage returns empty string", () => {
    vi.mocked(chrome.i18n.getMessage).mockReturnValueOnce("");
    expect(t("missing_key")).toBe("missing_key");
  });
});

// isRTL()

describe("isRTL", () => {
  beforeEach(() => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("en");
  });

  it("returns false for English", () => {
    expect(isRTL()).toBe(false);
  });

  it("returns false for German", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("de");
    expect(isRTL()).toBe(false);
  });

  it("returns false for Kurmanji Kurdish (Latin script)", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("ku");
    expect(isRTL()).toBe(false);
  });

  it("returns true for Arabic", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("ar");
    expect(isRTL()).toBe(true);
  });

  it("returns true for Arabic regional variant", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("ar-SA");
    expect(isRTL()).toBe(true);
  });

  it("returns true for Persian", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("fa");
    expect(isRTL()).toBe(true);
  });

  it("returns true for Sorani Kurdish", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("ckb");
    expect(isRTL()).toBe(true);
  });
});
