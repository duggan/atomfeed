import { describe, it, expect } from "vitest";
import { isValidLanguageTag } from "./bcp47";

describe("BCP 47 Language Tag Validation (Strict)", () => {
  describe("Valid tags", () => {
    it("should accept basic languages", () => {
      expect(isValidLanguageTag("en")).toBe(true);
      expect(isValidLanguageTag("eng")).toBe(true);
      expect(isValidLanguageTag("fr")).toBe(true);
      expect(isValidLanguageTag("zh")).toBe(true);
    });

    it("should accept longer language subtags", () => {
      expect(isValidLanguageTag("abcd")).toBe(true); // 4 letters
      expect(isValidLanguageTag("abcde")).toBe(true); // 5 letters
      expect(isValidLanguageTag("abcdefgh")).toBe(true); // 8 letters
    });

    it("should accept language + script + region", () => {
      expect(isValidLanguageTag("zh-Hans-CN")).toBe(true);
      expect(isValidLanguageTag("en-Latn-US")).toBe(true);
    });

    it("should accept variants", () => {
      expect(isValidLanguageTag("zh-Hans-CN-1901")).toBe(true);
      expect(isValidLanguageTag("sl-rozaj")).toBe(true);
      expect(isValidLanguageTag("sl-rozaj-biske")).toBe(true);
    });

    it("should accept extensions", () => {
      expect(isValidLanguageTag("en-US-u-islamcal")).toBe(true);
      expect(isValidLanguageTag("zh-CN-a-myext-x-private")).toBe(true);
      expect(isValidLanguageTag("en-GB-u-co-trad")).toBe(true);
    });

    it("should accept private use", () => {
      expect(isValidLanguageTag("x-private")).toBe(true);
      expect(isValidLanguageTag("en-x-custom")).toBe(true);
      expect(isValidLanguageTag("en-GB-u-co-trad-x-foo-bar")).toBe(true);
    });

    it("should accept extlangs", () => {
      expect(isValidLanguageTag("zh-yue")).toBe(true);
      expect(isValidLanguageTag("zh-yue-hak")).toBe(true);
    });
  });

  describe("Invalid tags", () => {
    it("should reject too short primary or invalid chars in primary", () => {
      expect(isValidLanguageTag("e")).toBe(false);
      expect(isValidLanguageTag("abc1")).toBe(false);
    });

    it("should reject invalid regions", () => {
      expect(isValidLanguageTag("en-U")).toBe(false);
      expect(isValidLanguageTag("en-12")).toBe(false);
      expect(isValidLanguageTag("en-12A")).toBe(false);
    });

    it("should reject invalid variants", () => {
      // Too long
      expect(isValidLanguageTag("en-GB-123456789")).toBe(false);
      // Too short (needs at least 4 chars if starting with digit and total 4, or 5 chars otherwise)
      expect(isValidLanguageTag("en-GB-OX")).toBe(false);
    });

    it("should reject invalid extensions", () => {
      // No extension subtag after singleton
      expect(isValidLanguageTag("en-US-u-")).toBe(false);
      // invalid chars in extension subtag
      expect(isValidLanguageTag("en-US-u-@#!")).toBe(false);
    });

    it("should reject invalid private use", () => {
      expect(isValidLanguageTag("x")).toBe(false);
      expect(isValidLanguageTag("x-")).toBe(false);
      expect(isValidLanguageTag("en-x-")).toBe(false);
    });
  });
});
