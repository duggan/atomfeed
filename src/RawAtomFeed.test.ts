import { describe, it, expect, beforeEach } from "vitest";
import { xml2js } from "xml-js";
import { RawAtomFeed } from "./RawAtomFeed";
import type { Entry, FeedOptions } from "./types";

describe("AtomFeed RFC 4287 Compliance", () => {
  describe("Text Constructs (Section 3.1)", () => {
    const baseOptions = {
      id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
      updated: new Date("2024-01-01T00:00:00Z"),
    };

    it("should handle plain text content", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        title: { content: "Simple Title", type: "text" },
      });
      const xml = feed.toXml();
      expect(xml).includes('<title type="text">Simple Title</title>');
    });

    it("should handle HTML content", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        title: { content: "<em>HTML</em> Title", type: "html" },
      });
      const xml = feed.toXml();
      expect(xml).includes(
        '<title type="html">&lt;em&gt;HTML&lt;/em&gt; Title</title>'
      );
    });

    it("should handle XHTML content", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        title: {
          content:
            '<div xmlns="http://www.w3.org/1999/xhtml"><em>XHTML</em> Title</div>',
          type: "xhtml",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('type="xhtml"');
      expect(xml).includes('xmlns="http://www.w3.org/1999/xhtml"');
    });

    it("should reject invalid XHTML content", () => {
      expect(
        () =>
          new RawAtomFeed({
            ...baseOptions,
            title: {
              content: "<em>Invalid XHTML</em>",
              type: "xhtml",
            },
          })
      ).toThrow(/must contain a single div element/);
    });

    it("should handle xml:lang attribute", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        title: {
          content: "Title in English",
          type: "text",
          lang: "en-US",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('xml:lang="en-US"');
    });
  });

  describe("Person Constructs (Section 3.2)", () => {
    const baseOptions: FeedOptions = {
      id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
      title: { content: "Test Feed" },
      updated: new Date("2024-01-01T00:00:00Z"),
    };

    it("should require name in person constructs", () => {
      expect(
        () => new RawAtomFeed({ ...baseOptions, authors: [{ name: "" }] })
      ).toThrow(/name is required/);
    });

    it("should validate email format", () => {
      expect(
        () =>
          new RawAtomFeed({
            ...baseOptions,
            authors: [
              {
                name: "John Doe",
                email: "not-an-email",
              },
            ],
          })
      ).toThrow(/Invalid person email/);
    });

    it("should validate URI format", () => {
      expect(
        () =>
          new RawAtomFeed({
            ...baseOptions,
            authors: [
              {
                name: "John Doe",
                uri: "not-a-uri",
              },
            ],
          })
      ).toThrow(/Invalid person URI/);
    });

    it("should handle complete person construct", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        authors: [
          {
            name: "John Doe",
            email: "john@example.com",
            uri: "https://example.com/john",
          },
        ],
      });
      const xml = feed.toXml();
      expect(xml).includes("<name>John Doe</name>");
      expect(xml).includes("<email>john@example.com</email>");
      expect(xml).includes("<uri>https://example.com/john</uri>");
    });
  });

  describe("Date Constructs (Section 3.3)", () => {
    const baseOptions = {
      id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
      title: { content: "Test Feed" },
    };

    it("should validate RFC 3339 dates", () => {
      expect(
        () =>
          new RawAtomFeed({
            ...baseOptions,
            updated: new Date("invalid"),
          })
      ).toThrow(/Invalid RFC 3339 date/);
    });

    it("should format dates according to RFC 3339", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        updated: new Date("2024-01-01T12:00:00Z"),
      });
      const xml = feed.toXml();
      expect(xml).includes("<updated>2024-01-01T12:00:00.000Z</updated>");
    });

    it("should handle timezone offsets", () => {
      const feed = new RawAtomFeed({
        ...baseOptions,
        updated: new Date("2024-01-01T12:00:00-05:00"),
      });
      const xml = feed.toXml();
      // Should be converted to UTC
      expect(xml).includes("<updated>2024-01-01T17:00:00.000Z</updated>");
    });
  });

  describe("Content (Section 4.1.3)", () => {
    let feed: RawAtomFeed;
    const baseEntry = {
      id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
      title: { content: "Test Entry" },
      updated: new Date("2024-01-01T00:00:00Z"),
    };

    beforeEach(() => {
      feed = new RawAtomFeed({
        id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
        title: { content: "Test Feed" },
        updated: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should handle text content", () => {
      feed.addEntry({
        ...baseEntry,
        content: {
          content: "Plain text content",
          type: "text",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('<content type="text">Plain text content</content>');
    });

    it("should handle HTML content", () => {
      feed.addEntry({
        ...baseEntry,
        content: {
          content: "<p>HTML content</p>",
          type: "html",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes(
        '<content type="html">&lt;p&gt;HTML content&lt;/p&gt;</content>'
      );
    });

    it("should handle XHTML content", () => {
      feed.addEntry({
        ...baseEntry,
        content: {
          content:
            '<div xmlns="http://www.w3.org/1999/xhtml"><p>XHTML content</p></div>',
          type: "xhtml",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('type="xhtml"');
      expect(xml).includes('xmlns="http://www.w3.org/1999/xhtml"');
    });

    it("should handle base64 content", () => {
      feed.addEntry({
        ...baseEntry,
        content: {
          content: btoa("Binary content"),
          type: "base64",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('type="base64"');
      expect(xml).includes(btoa("Binary content"));
    });

    it("should handle src attribute", () => {
      feed.addEntry({
        ...baseEntry,
        content: {
          content: "",
          src: "https://example.com/content",
          type: "text/html",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes('src="https://example.com/content"');
      expect(xml).includes('type="text/html"');
    });

    it("should reject both content and src", () => {
      expect(() =>
        feed.addEntry({
          ...baseEntry,
          content: {
            content: "Content",
            src: "https://example.com/content",
          },
        })
      ).toThrow(/cannot have both content and src/);
    });
  });

  describe("Categories (Section 4.2.2)", () => {
    let feed: RawAtomFeed;

    beforeEach(() => {
      feed = new RawAtomFeed({
        id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
        title: { content: "Test Feed" },
        updated: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should require term attribute", () => {
      expect(() =>
        feed.addEntry({
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
          categories: [{ term: "" }],
        })
      ).toThrow(/term is required/);
    });

    it("should validate scheme IRI", () => {
      expect(() =>
        feed.addEntry({
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
          categories: [
            {
              term: "technology",
              scheme: "not-a-uri",
            },
          ],
        })
      ).toThrow(/Invalid category scheme/);
    });

    it("should handle complete category", () => {
      feed.addEntry({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        categories: [
          {
            term: "technology",
            scheme: "https://example.com/categories",
            label: "Technology",
          },
        ],
      });
      const xml = feed.toXml();
      expect(xml).includes('term="technology"');
      expect(xml).includes('scheme="https://example.com/categories"');
      expect(xml).includes('label="Technology"');
    });
  });

  describe("Links (Section 4.2.7)", () => {
    let options: FeedOptions;

    beforeEach(() => {
      options = {
        id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
        title: { content: "Test Feed" },
        updated: new Date("2024-01-01T00:00:00Z"),
      };
    });

    it("should validate href IRI", () => {
      expect(
        () => new RawAtomFeed({ ...options, links: [{ href: "not-a-uri" }] })
      ).toThrow(/Invalid link href/);
    });

    it("should handle all link attributes", () => {
      const feed = new RawAtomFeed({
        ...options,
        links: [
          {
            href: "https://example.com",
            rel: "alternate",
            type: "text/html",
            hreflang: "en-US",
            title: "Homepage",
            length: "1000",
          },
        ],
      });
      const xml = feed.toXml();
      expect(xml).includes('href="https://example.com"');
      expect(xml).includes('rel="alternate"');
      expect(xml).includes('type="text/html"');
      expect(xml).includes('hreflang="en-US"');
      expect(xml).includes('title="Homepage"');
      expect(xml).includes('length="1000"');
    });
  });

  describe("Extensibility (Section 6)", () => {
    it("should support namespace prefixing", () => {
      const feed = new RawAtomFeed(
        {
          id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
          title: { content: "Test Feed" },
          updated: new Date("2024-01-01T00:00:00Z"),
        },
        true
      );

      const xml = feed.toXml();
      expect(xml).includes("atom:feed");
      expect(xml).includes('xmlns:atom="http://www.w3.org/2005/Atom"');
    });
  });

  describe("Entry Management", () => {
    let feed: RawAtomFeed;

    beforeEach(() => {
      feed = new RawAtomFeed({
        id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
        title: { content: "Test Feed" },
        updated: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should sort entries by date when enabled", () => {
      const feed = new RawAtomFeed(
        {
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
        },
        false,
        true
      );

      const entries: Entry[] = [
        {
          id: "1",
          title: { content: "First" },
          updated: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "2",
          title: { content: "Second" },
          updated: new Date("2024-01-02T00:00:00Z"),
        },
        {
          id: "3",
          title: { content: "Third" },
          updated: new Date("2024-01-03T00:00:00Z"),
        },
      ];

      entries.forEach((entry) => feed.addEntry(entry));
      const xml = feed.toXml();
      const matches = xml.match(/<id>(\d+)<\/id>/g);
      expect(matches?.[0]).includes("3");
      expect(matches?.[1]).includes("2");
      expect(matches?.[2]).includes("1");
    });

    it("should maintain entry order when sorting disabled", () => {
      const feed = new RawAtomFeed(
        {
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
        },
        false,
        false
      );

      const entries: Entry[] = [
        {
          id: "1",
          title: { content: "First" },
          updated: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "2",
          title: { content: "Second" },
          updated: new Date("2024-01-02T00:00:00Z"),
        },
        {
          id: "3",
          title: { content: "Third" },
          updated: new Date("2024-01-03T00:00:00Z"),
        },
      ];
      entries.forEach((entry) => feed.addEntry(entry));
      const xml = feed.toXml();
      const matches = xml.match(/<id>(\d+)<\/id>/g);
      expect(matches?.[0]).includes("1");
      expect(matches?.[1]).includes("2");
      expect(matches?.[2]).includes("3");
    });

    it("should return immutable entries array", () => {
      const entry = {
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
      };
      feed.addEntry(entry);
      const entries = feed.getEntries();

      expect(() => (entries as any).push(entry)).toThrow();
      expect(Object.isFrozen(entries)).toBe(true);
    });

    it("should remove entries by id", () => {
      const entry = {
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
      };
      feed.addEntry(entry);
      expect(feed.getEntries()).toHaveLength(1);

      expect(feed.removeEntry("test")).toBe(true);
      expect(feed.getEntries()).toHaveLength(0);
      expect(feed.removeEntry("non-existent")).toBe(false);
    });

    it("should clear all entries", () => {
      for (let i = 0; i < 3; i++) {
        feed.addEntry({
          id: `test-${i}`,
          title: { content: `Test ${i}` },
          updated: new Date(),
        });
      }
      expect(feed.getEntries()).toHaveLength(3);

      feed.clear();
      expect(feed.getEntries()).toHaveLength(0);
    });
  });

  describe("XML Generation", () => {
    it("should generate valid XML declaration", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
      });
      const xml = feed.toXml();
      expect(xml).toMatch(/^<\?xml version="1.0" encoding="utf-8"\?>/);
    });

    it("should properly escape special characters", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test & <Demo>" },
        updated: new Date(),
      });
      const xml = feed.toXml();
      expect(xml).includes("Test &amp; &lt;Demo&gt;");
    });

    it("should handle stylesheet processing instruction", () => {
      const feed = new RawAtomFeed(
        {
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
        },
        false,
        false,
        {
          href: "style.xsl",
          type: "text/xsl",
        }
      );
      const xml = feed.toXml();
      expect(xml).includes(
        '<?xml-stylesheet type="text/xsl" href="style.xsl"?>'
      );
    });

    it("should use default stylesheet type when not provided", () => {
      const feed = new RawAtomFeed(
        {
          id: "test",
          title: { content: "Test" },
          updated: new Date(),
        },
        false,
        false,
        {
          href: "style.xsl",
        }
      );
      const xml = feed.toXml();
      expect(xml).includes('type="text/xsl"');
    });

    it("should properly encode URIs in href attributes", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        links: [{ href: "https://example.com/path with spaces" }],
      });
      const xml = feed.toXml();
      expect(xml).includes('href="https://example.com/path%20with%20spaces"');
    });
  });

  describe("Generator Element", () => {
    it("should include generator information", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        generator: {
          name: "Test Generator",
          version: "1.0",
          uri: "https://example.com/generator",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes("<generator");
      expect(xml).includes('version="1.0"');
      expect(xml).includes('uri="https://example.com/generator"');
      expect(xml).includes(">Test Generator</generator>");
    });

    it("should handle minimal generator information", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        generator: {
          name: "Test Generator",
        },
      });
      const xml = feed.toXml();
      expect(xml).includes("<generator>Test Generator</generator>");
    });
  });

  describe("Language and Base URI Support", () => {
    it("should handle xml:lang attribute", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        lang: "en-US",
      });
      const xml = feed.toXml();
      expect(xml).includes('xml:lang="en-US"');
    });

    it("should handle xml:base attribute", () => {
      const feed = new RawAtomFeed({
        id: "test",
        title: { content: "Test" },
        updated: new Date(),
        base: "https://example.com/",
      });
      const xml = feed.toXml();
      expect(xml).includes('xml:base="https://example.com/"');
    });

    it("should validate base URI", () => {
      expect(
        () =>
          new RawAtomFeed({
            id: "test",
            title: { content: "Test" },
            updated: new Date(),
            base: "not-valid",
          })
      ).toThrow(/Invalid xml:base IRI/);
    });
  });

  describe("Full Feed Generation", () => {
    it("should generate a complete feed with all features", () => {
      const feed = new RawAtomFeed(
        {
          id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
          title: { content: "Example Feed", type: "text" },
          updated: new Date("2024-01-01T00:00:00Z"),
          authors: [
            {
              name: "John Doe",
              email: "john@example.com",
              uri: "https://example.com/john",
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
              scheme: "https://example.com/categories",
              label: "Technology",
            },
          ],
          generator: {
            name: "Test Generator",
            version: "1.0",
            uri: "https://example.com/generator",
          },
          icon: "https://example.com/icon.png",
          logo: "https://example.com/logo.png",
          rights: { content: "© 2024", type: "text" },
          subtitle: { content: "A test feed", type: "text" },
          lang: "en-US",
          base: "https://example.com/",
        },
        false,
        false,
        {
          href: "style.xsl",
          type: "text/xsl",
        }
      );

      // Add an entry with all possible elements
      feed.addEntry({
        id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
        title: { content: "Test Entry", type: "text" },
        updated: new Date("2024-01-01T00:00:00Z"),
        authors: [{ name: "John Doe" }],
        content: {
          content: "<p>Test content</p>",
          type: "html",
        },
        summary: { content: "Entry summary", type: "text" },
        published: new Date("2024-01-01T00:00:00Z"),
        rights: { content: "© 2024", type: "text" },
        categories: [{ term: "test" }],
        links: [{ href: "https://example.com/entry1", rel: "alternate" }],
      });

      const xml = feed.toXml();
      const parsed = xml2js(xml, { compact: false }) as any;

      // Verify feed structure
      expect(parsed.declaration.attributes.version).toBe("1.0");
      expect(parsed.declaration.attributes.encoding).toBe("utf-8");

      // Verify stylesheet
      expect(xml).includes("<?xml-stylesheet");

      // Verify feed attributes
      const feedElement = parsed.elements.find((el: any) => el.name === "feed");
      expect(feedElement.attributes.xmlns).toBe("http://www.w3.org/2005/Atom");
      expect(feedElement.attributes["xml:lang"]).toBe("en-US");
      expect(feedElement.attributes["xml:base"]).toBe("https://example.com/");
    });
  });
});
