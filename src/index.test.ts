import { describe, it, expect } from "vitest";
import { AtomFeed } from "./index";
import { xml2js } from "xml-js";

describe("AtomFeed", () => {
  const minimumOptions = {
    id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
    title: "Example Feed",
    updated: new Date("2024-01-01T00:00:00Z"),
  };

  describe("Constructor validation", () => {
    it("should create a feed with minimum required options", () => {
      expect(() => new AtomFeed(minimumOptions)).not.toThrow();
    });

    it("should throw error when required fields are missing", () => {
      expect(() => new AtomFeed({ ...minimumOptions, id: "" })).toThrowError(
        "Feed id is required"
      );
      expect(() => new AtomFeed({ ...minimumOptions, title: "" })).toThrowError(
        "Feed title is required"
      );
      expect(
        () => new AtomFeed({ ...minimumOptions, updated: undefined as any })
      ).toThrowError("Feed updated date is required");
    });

    it("should throw error when updated is not a Date object", () => {
      expect(
        () => new AtomFeed({ ...minimumOptions, updated: "2024-01-01" as any })
      ).toThrowError("Feed updated must be a Date object");
    });
  });

  describe("Entry validation", () => {
    const feed = new AtomFeed(minimumOptions);
    const minimumEntry = {
      id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
      title: "First Entry",
      updated: new Date("2024-01-01T00:00:00Z"),
    };

    it("should add entry with minimum required fields", () => {
      expect(() => feed.addEntry(minimumEntry)).not.toThrow();
    });

    it("should throw error when required entry fields are missing", () => {
      expect(() => feed.addEntry({ ...minimumEntry, id: "" })).toThrowError(
        "Entry id is required"
      );
      expect(() => feed.addEntry({ ...minimumEntry, title: "" })).toThrowError(
        "Entry title is required"
      );
      expect(() =>
        feed.addEntry({ ...minimumEntry, updated: undefined as any })
      ).toThrowError("Entry updated date is required");
    });
  });

  describe("XML generation", () => {
    it("should generate valid XML without namespace prefix", () => {
      const feed = new AtomFeed(minimumOptions);
      const xml = feed.toXml();

      expect(xml).includes('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).includes('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(xml).includes(`<id>${minimumOptions.id}</id>`);
    });

    it("should generate valid XML with namespace prefix", () => {
      const feed = new AtomFeed(minimumOptions, true);
      const xml = feed.toXml();

      expect(xml).includes('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).includes(
        '<atom:feed xmlns:atom="http://www.w3.org/2005/Atom">'
      );
      expect(xml).includes(`<atom:id>${minimumOptions.id}</atom:id>`);
    });

    it("should properly format dates", () => {
      const feed = new AtomFeed(minimumOptions);
      const xml = feed.toXml();
      expect(xml).includes("<updated>2024-01-01T00:00:00.000Z</updated>");
    });
  });

  describe("Complex feed generation", () => {
    it("should generate feed with all optional elements", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        authors: [
          {
            name: "John Doe",
            email: "john@example.com",
            uri: "http://example.com/john",
          },
        ],
        contributors: [
          {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        ],
        categories: [
          {
            term: "technology",
            scheme: "http://example.com/categories",
            label: "Technology",
          },
        ],
        generator: {
          name: "Test Generator",
          version: "1.0",
          uri: "http://example.com/generator",
        },
        icon: "http://example.com/icon.png",
        logo: "http://example.com/logo.png",
        rights: "Copyright 2024",
        subtitle: "A test feed",
      });

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;

      const getFeedElement = (name: string) =>
        parsed.elements[0].elements.find((el: any) => el.name === name);

      expect(getFeedElement("author").elements[0].elements[0].text).toBe(
        "John Doe"
      );
      expect(getFeedElement("contributor").elements[0].elements[0].text).toBe(
        "Jane Smith"
      );
      expect(getFeedElement("category").attributes.term).toBe("technology");
      expect(getFeedElement("generator").elements[0].text).toBe(
        "Test Generator"
      );
      expect(getFeedElement("icon").elements[0].text).toBe(
        "http://example.com/icon.png"
      );
      expect(getFeedElement("rights").elements[0].text).toBe("Copyright 2024");
      expect(getFeedElement("subtitle").elements[0].text).toBe("A test feed");
    });

    it("should generate feed with complete entries", () => {
      const feed = new AtomFeed(minimumOptions);
      const entryDate = new Date("2024-01-01T00:00:00Z");

      feed.addEntry({
        id: "entry-1",
        title: "Test Entry",
        updated: entryDate,
        authors: [
          {
            name: "John Doe",
            email: "john@example.com",
          },
        ],
        content: {
          content: "Test content",
          type: "text",
        },
        links: [
          {
            href: "http://example.com/entry-1",
            rel: "alternate",
            type: "text/html",
          },
        ],
        published: entryDate,
        summary: "Test summary",
      });

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;

      const entry = parsed.elements[0].elements.find(
        (el: any) => el.name === "entry"
      );

      expect(
        entry.elements.find((el: any) => el.name === "title").elements[0].text
      ).toBe("Test Entry");
      expect(
        entry.elements.find((el: any) => el.name === "author").elements[0]
          .elements[0].text
      ).toBe("John Doe");
      expect(
        entry.elements.find((el: any) => el.name === "content").elements[0].text
      ).toBe("Test content");
      expect(
        entry.elements.find((el: any) => el.name === "link").attributes.href
      ).toBe("http://example.com/entry-1");
      expect(
        entry.elements.find((el: any) => el.name === "summary").elements[0].text
      ).toBe("Test summary");
    });
  });

  describe("Special cases", () => {
    it("should handle content with src attribute", () => {
      const feed = new AtomFeed(minimumOptions);
      const minimumEntry = {
        id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
        title: "First Entry",
        updated: new Date("2024-01-01T00:00:00Z"),
      };

      feed.addEntry({
        ...minimumEntry,
        content: {
          content: "",
          src: "http://example.com/content.html",
          type: "text/html",
        },
      });

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;
      const content = parsed.elements[0].elements
        .find((el: any) => el.name === "entry")
        .elements.find((el: any) => el.name === "content");

      expect(content.attributes.src).toBe("http://example.com/content.html");
      expect(content.attributes.type).toBe("text/html");
      expect(content.elements).toBeUndefined();
    });

    it("should properly escape XML special characters", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        title: "Title with & and <>",
      });

      const xml = feed.toXml();
      expect(xml).includes("Title with &amp; and &lt;&gt;");
    });

    it("should handle multiple entries", () => {
      const feed = new AtomFeed(minimumOptions);
      const entryDate = new Date("2024-01-01T00:00:00Z");

      for (let i = 0; i < 3; i++) {
        feed.addEntry({
          id: `entry-${i}`,
          title: `Entry ${i}`,
          updated: entryDate,
        });
      }

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;
      const entries = parsed.elements[0].elements.filter(
        (el: any) => el.name === "entry"
      );

      expect(entries).toHaveLength(3);
      expect(
        entries[0].elements.find((el: any) => el.name === "title").elements[0]
          .text
      ).toBe("Entry 0");
    });

    it("should handle empty optional arrays", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        authors: [],
        contributors: [],
        categories: [],
        links: [],
      });

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;

      // Using Vitest's type-aware matchers
      expect(
        parsed.elements[0].elements.some((el: any) => el.name === "author")
      ).toBe(false);
      expect(
        parsed.elements[0].elements.some((el: any) => el.name === "contributor")
      ).toBe(false);
      expect(
        parsed.elements[0].elements.some((el: any) => el.name === "category")
      ).toBe(false);
      expect(
        parsed.elements[0].elements.some((el: any) => el.name === "link")
      ).toBe(false);
    });
  });
});
