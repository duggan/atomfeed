import { describe, it, expect, beforeEach } from "vitest";
import { AtomFeed } from "./index";
import { xml2js } from "xml-js";

describe("AtomFeed", () => {
  const minimumOptions = {
    id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
    title: "Example Feed",
    updated: new Date("2024-01-01T00:00:00Z"),
  };

  const minimumEntry = {
    id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
    title: "First Entry",
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
    it("should include xml-stylesheet processing instruction when stylesheet is provided", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        stylesheet: {
          href: "atom.xsl",
          type: "text/xsl",
        },
      });

      const xml = feed.toXml();

      // Check that processing instructions are in correct order
      expect(xml).toMatch(
        /^<\?xml version="1.0" encoding="utf-8"\?><\?xml-stylesheet.*?\?>/
      );

      // Check stylesheet instruction content
      expect(xml).includes(
        '<?xml-stylesheet type="text/xsl" href="atom.xsl"?>'
      );

      // Verify feed element follows the processing instructions
      expect(xml).toMatch(/<\?xml.*?\?><\?xml-stylesheet.*?\?>\s*<feed/);
    });

    it("should use default type for stylesheet when not provided", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        stylesheet: {
          href: "atom.xsl",
        },
      });

      const xml = feed.toXml();
      expect(xml).includes(
        '<?xml-stylesheet type="text/xsl" href="atom.xsl"?>'
      );
    });

    it("should not include xml-stylesheet when stylesheet is not provided", () => {
      const feed = new AtomFeed(minimumOptions);
      const xml = feed.toXml();

      expect(xml).not.includes("<?xml-stylesheet");
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

  describe("Enhanced features", () => {
    it("should validate URIs", () => {
      expect(
        () =>
          new AtomFeed({
            ...minimumOptions,
            icon: "not-a-url",
          })
      ).toThrow("Invalid icon URI");
    });

    it("should support entry management", () => {
      const feed = new AtomFeed(minimumOptions);
      feed.addEntry(minimumEntry);
      expect(feed.getEntries()).toHaveLength(1);
      expect(feed.removeEntry(minimumEntry.id)).toBe(true);
      expect(feed.getEntries()).toHaveLength(0);
    });

    it("should support xml:lang and xml:base", () => {
      const feed = new AtomFeed({
        ...minimumOptions,
        lang: "en-US",
        base: "https://example.com",
      });
      const xml = feed.toXml();
      expect(xml).toContain('xml:lang="en-US"');
      expect(xml).toContain('xml:base="https://example.com"');
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

describe("AtomFeed Interface Methods", () => {
  let feed: AtomFeed;

  beforeEach(() => {
    feed = new AtomFeed({
      id: "urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6",
      title: "Example Feed",
      updated: new Date("2024-01-01T00:00:00Z"),
    });
  });

  describe("Author management", () => {
    it("should add authors using addAuthor method", () => {
      feed.addAuthor({ name: "John Doe", email: "john@example.com" });
      const xml = feed.toXml();

      expect(xml).includes("<author>");
      expect(xml).includes("<name>John Doe</name>");
      expect(xml).includes("<email>john@example.com</email>");
    });

    it("should handle multiple authors added via addAuthor", () => {
      feed.addAuthor({ name: "John Doe" });
      feed.addAuthor({ name: "Jane Smith" });
      const xml = feed.toXml();

      const authorMatches = xml.match(/<author>/g);
      expect(authorMatches).toHaveLength(2);
      expect(xml).includes("<name>John Doe</name>");
      expect(xml).includes("<name>Jane Smith</name>");
    });

    it("should validate author URI when provided", () => {
      expect(() =>
        feed.addAuthor({ name: "John Doe", uri: "not-a-valid-uri" })
      ).toThrow("Invalid person URI");

      expect(() =>
        feed.addAuthor({ name: "John Doe", uri: "https://example.com" })
      ).not.toThrow();
    });

    it("should handle authors with special characters", () => {
      feed.addAuthor({
        name: "John & Jane Doe",
        email: "john+jane@example.com",
      });
      const xml = feed.toXml();

      expect(xml).includes("<name>John &amp; Jane Doe</name>");
      expect(xml).includes("<email>john+jane@example.com</email>");
    });
  });

  describe("Link management", () => {
    it("should add links using addLink method", () => {
      feed.addLink({
        href: "https://example.com",
        rel: "alternate",
        type: "text/html",
      });

      const xml = feed.toXml();
      expect(xml).includes('href="https://example.com"');
      expect(xml).includes('rel="alternate"');
      expect(xml).includes('type="text/html"');
    });

    it("should add self link using addSelfLink helper", () => {
      feed.addSelfLink("https://example.com/feed.xml");
      const xml = feed.toXml();

      expect(xml).includes('rel="self"');
      expect(xml).includes('href="https://example.com/feed.xml"');
    });

    it("should add alternate link using addAlternateLink helper", () => {
      feed.addAlternateLink("https://example.com");
      const xml = feed.toXml();

      expect(xml).includes('rel="alternate"');
      expect(xml).includes('type="text/html"');
      expect(xml).includes('href="https://example.com"');
    });

    it("should add navigation links using helper methods", () => {
      feed.addFirstLink("https://example.com/page1");
      feed.addLastLink("https://example.com/page10");
      feed.addNextLink("https://example.com/page2");
      feed.addPreviousLink("https://example.com/page0");

      const xml = feed.toXml();
      expect(xml).includes('rel="first"');
      expect(xml).includes('rel="last"');
      expect(xml).includes('rel="next"');
      expect(xml).includes('rel="previous"');
    });

    it("should validate link hrefs", () => {
      expect(() => feed.addLink({ href: "not-a-valid-url" })).toThrow(
        "Invalid link href"
      );
    });

    it("should handle multiple links with the same rel", () => {
      feed.addLink({ href: "https://example.com/en", hreflang: "en" });
      feed.addLink({ href: "https://example.com/fr", hreflang: "fr" });
      const xml = feed.toXml();

      expect(xml.match(/<link/g)).toHaveLength(2);
      expect(xml).includes('hreflang="en"');
      expect(xml).includes('hreflang="fr"');
    });

    it("should handle links with all optional attributes", () => {
      feed.addLink({
        href: "https://example.com",
        rel: "alternate",
        type: "text/html",
        hreflang: "en",
        title: "Homepage",
        length: "1000",
      });

      const xml = feed.toXml();
      expect(xml).includes('title="Homepage"');
      expect(xml).includes('length="1000"');
    });
  });

  describe("Stylesheet management", () => {
    it("should add stylesheet using addStylesheet method", () => {
      feed.addStylesheet({
        href: "styles.xsl",
        type: "text/xsl",
      });

      const xml = feed.toXml();
      expect(xml).includes("<?xml-stylesheet");
      expect(xml).includes('href="styles.xsl"');
      expect(xml).includes('type="text/xsl"');
    });

    it("should use default stylesheet type when not provided", () => {
      feed.addStylesheet({ href: "styles.xsl" });
      const xml = feed.toXml();

      expect(xml).includes('type="text/xsl"');
    });

    it("should override existing stylesheet", () => {
      feed.addStylesheet({ href: "first.xsl" });
      feed.addStylesheet({ href: "second.xsl" });
      const xml = feed.toXml();

      expect(xml).includes('href="second.xsl"');
      expect(xml).not.includes('href="first.xsl"');
    });

    it("should handle stylesheets with special characters in href", () => {
      feed.addStylesheet({ href: "my styles & templates.xsl" });
      const xml = feed.toXml();

      expect(xml).includes('href="my%20styles%20&%20templates.xsl"');
    });
  });

  describe("Entry management", () => {
    const entry = {
      id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
      title: "Test Entry",
      updated: new Date("2024-01-01T00:00:00Z"),
    };

    it("should retrieve entries using getEntries method", () => {
      feed.addEntry(entry);
      const entries = feed.getEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe("Test Entry");
    });

    it("should return frozen entries array", () => {
      feed.addEntry(entry);
      const entries = feed.getEntries();

      expect(Object.isFrozen(entries)).toBe(true);
      expect(() => (entries as any).push(entry)).toThrow();
    });

    it("should clear all entries using clear method", () => {
      feed.addEntry(entry);
      expect(feed.getEntries()).toHaveLength(1);

      feed.clear();
      expect(feed.getEntries()).toHaveLength(0);
    });

    it("should handle entry removal", () => {
      feed.addEntry(entry);
      expect(feed.removeEntry(entry.id)).toBe(true);
      expect(feed.getEntries()).toHaveLength(0);

      // Removing non-existent entry
      expect(feed.removeEntry("non-existent")).toBe(false);
    });

    it("should maintain entry order when sortEntries is false", () => {
      const feed = new AtomFeed(
        {
          id: "test",
          title: "Test Feed",
          updated: new Date("2024-01-01T00:00:00Z"),
        },
        false,
        false
      );

      const entry1 = {
        ...entry,
        id: "1",
        updated: new Date("2024-01-01T00:00:00Z"),
      };
      const entry2 = {
        ...entry,
        id: "2",
        updated: new Date("2024-01-02T00:00:00Z"),
      };
      const entry3 = {
        ...entry,
        id: "3",
        updated: new Date("2024-01-03T00:00:00Z"),
      };

      feed.addEntry(entry2);
      feed.addEntry(entry1);
      feed.addEntry(entry3);

      const entries = feed.getEntries();
      expect(entries[0].id).toBe("2");
      expect(entries[1].id).toBe("1");
      expect(entries[2].id).toBe("3");
    });

    it("should sort entries by updated date when sortEntries is true", () => {
      const feed = new AtomFeed(
        {
          id: "test",
          title: "Test Feed",
          updated: new Date("2024-01-01T00:00:00Z"),
        },
        false,
        true
      );

      const entry1 = {
        ...entry,
        id: "1",
        updated: new Date("2024-01-01T00:00:00Z"),
      };
      const entry2 = {
        ...entry,
        id: "2",
        updated: new Date("2024-01-02T00:00:00Z"),
      };
      const entry3 = {
        ...entry,
        id: "3",
        updated: new Date("2024-01-03T00:00:00Z"),
      };

      feed.addEntry(entry1);
      feed.addEntry(entry2);
      feed.addEntry(entry3);

      const xml = feed.toXml();
      const entries = xml.match(/<entry>/g);
      expect(entries).toHaveLength(3);

      // Check that entries appear in reverse chronological order
      const idMatches = Array.from(xml.matchAll(/<id>(.*?)<\/id>/g));
      expect(idMatches[1][1]).toBe("3"); // First entry (after feed id)
      expect(idMatches[2][1]).toBe("2");
      expect(idMatches[3][1]).toBe("1");
    });
  });

  describe("Content handling", () => {
    it("should handle HTML content with special characters", () => {
      feed.addEntry({
        id: "test",
        title: "Test Entry",
        updated: new Date("2024-01-01T00:00:00Z"),
        content: {
          content: "<p>Hello & goodbye</p>",
          type: "html",
        },
      });

      const xml = feed.toXml();
      expect(xml).includes("&lt;p&gt;Hello &amp; goodbye&lt;/p&gt;");
    });

    it("should handle content with src attribute", () => {
      feed.addEntry({
        id: "test",
        title: "Test Entry",
        updated: new Date("2024-01-01T00:00:00Z"),
        content: {
          content: "",
          src: "https://example.com/content.html",
          type: "text/html",
        },
      });

      const xml = feed.toXml();
      expect(xml).includes('src="https://example.com/content.html"');
      expect(xml).not.includes("<content></content>");
    });
  });
});
