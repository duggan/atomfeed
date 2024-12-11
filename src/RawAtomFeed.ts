import { js2xml } from "xml-js";
import {
  TextConstruct,
  Person,
  Category,
  Link,
  Content,
  Entry,
  FeedOptions,
  Stylesheet,
} from "./types";
import {
  validateFeedOptions,
  validateEntry,
  isValidRfc3339Date,
  isValidLanguageTag,
  validateLink,
} from "./validators";

/**
 * RFC 4287 compliant Atom feed generator
 */
export class RawAtomFeed {
  private options: FeedOptions;
  private entries: Entry[] = [];
  private useNamespacePrefix: boolean;
  private sortEntries: boolean;
  private stylesheet?: Stylesheet;

  /**
   * Create a new Atom feed
   * @param options Feed configuration options
   * @param useNamespacePrefix Whether to use 'atom:' namespace prefix
   * @param sortEntries Whether to sort entries by updated date
   */
  constructor(
    options: FeedOptions,
    useNamespacePrefix: boolean = false,
    sortEntries: boolean = false,
    stylesheet?: Stylesheet
  ) {
    if (options.lang && !isValidLanguageTag(options.lang)) {
      throw new Error("Invalid language tag in feed");
    }
    if (options.title.lang && !isValidLanguageTag(options.title.lang)) {
      throw new Error("Invalid language tag in title");
    }
    if (options.subtitle?.lang && !isValidLanguageTag(options.subtitle.lang)) {
      throw new Error("Invalid language tag in subtitle");
    }
    if (options.rights?.lang && !isValidLanguageTag(options.rights.lang)) {
      throw new Error("Invalid language tag in rights");
    }
    validateFeedOptions(options);
    this.options = options;
    this.useNamespacePrefix = useNamespacePrefix;
    this.sortEntries = sortEntries;
    this.stylesheet = stylesheet;
  }

  /**
   * Add an entry to the feed
   */
  addEntry(entry: Entry): void {
    validateEntry(entry);
    this.entries.push(entry);
  }

  /**
   * Remove an entry from the feed
   */
  removeEntry(entryId: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.id !== entryId);
    return this.entries.length !== initialLength;
  }

  /**
   * Get all entries in the feed
   */
  getEntries(): readonly Entry[] {
    return Object.freeze([...this.entries]);
  }

  /**
   * Get all links in the feed
   */
  getLinks(): readonly Link[] {
    return this.options.links || [];
  }

  /**
   * Set links if all are valid.
   */
  setLinks(links: Link[]): void {
    let updatedLinks = [];
    for (const link of links) {
      validateLink(link);
      updatedLinks.push(link);
    }
    this.options.links = updatedLinks;
  }

  /**
   * Remove all entries from the feed
   */
  clear(): void {
    this.entries = [];
  }

  private getSortedEntries(): Entry[] {
    if (!this.sortEntries) {
      return this.entries;
    }
    return [...this.entries].sort(
      (a, b) => b.updated.getTime() - a.updated.getTime()
    );
  }

  private getElementName(name: string): string {
    return this.useNamespacePrefix ? `atom:${name}` : name;
  }

  private formatDate(date: Date): string {
    if (isNaN(date.getTime())) {
      throw new Error("Invalid RFC 3339 date");
    }
    if (!isValidRfc3339Date(date)) {
      throw new Error("Invalid RFC 3339 date");
    }
    return date.toISOString();
  }

  private createTextConstructElement(text: TextConstruct, name: string): any {
    const element: any = {
      type: "element",
      name: this.getElementName(name),
    };

    const attributes: Record<string, string> = {};
    if (text.type) {
      attributes.type = text.type;
    }
    if (text.lang) {
      attributes["xml:lang"] = text.lang;
    }
    if (text.base) {
      attributes["xml:base"] = text.base;
    }

    if (Object.keys(attributes).length > 0) {
      element.attributes = attributes;
    }

    if (text.type === "xhtml") {
      // Parse and include XHTML as structured elements
      element.elements = [
        {
          type: "element",
          name: "div",
          attributes: {
            xmlns: "http://www.w3.org/1999/xhtml",
          },
          elements: [{ type: "text", text: text.content }],
        },
      ];
    } else {
      element.elements = [{ type: "text", text: text.content }];
    }

    return element;
  }

  private createPersonElement(person: Person, name: string): any {
    const elements = [
      {
        type: "element",
        name: this.getElementName("name"),
        elements: [{ type: "text", text: person.name }],
      },
    ];

    if (person.email) {
      elements.push({
        type: "element",
        name: this.getElementName("email"),
        elements: [{ type: "text", text: person.email }],
      });
    }

    if (person.uri) {
      elements.push({
        type: "element",
        name: this.getElementName("uri"),
        elements: [{ type: "text", text: person.uri }],
      });
    }

    return {
      type: "element",
      name: this.getElementName(name),
      elements,
    };
  }

  private createCategoryElement(category: Category): any {
    const attributes: Record<string, string> = { term: category.term };
    if (category.scheme) attributes.scheme = category.scheme;
    if (category.label) attributes.label = category.label;

    return {
      type: "element",
      name: this.getElementName("category"),
      attributes,
    };
  }

  private createLinkElement(link: Link): any {
    const attributes: Record<string, string> = {
      href: encodeURI(link.href),
    };

    if (link.rel) attributes.rel = link.rel;
    if (link.type) attributes.type = link.type;
    if (link.hreflang) attributes.hreflang = link.hreflang;
    if (link.title) attributes.title = link.title;
    if (link.length) attributes.length = link.length;

    return {
      type: "element",
      name: this.getElementName("link"),
      attributes,
    };
  }

  private createContentElement(content: Content): any {
    const element: any = {
      type: "element",
      name: this.getElementName("content"),
    };

    const attributes: Record<string, string> = {};
    if (content.type) {
      attributes.type = content.type;
    }
    if (content.lang) {
      attributes["xml:lang"] = content.lang;
    }
    if (content.base) {
      attributes["xml:base"] = content.base;
    }
    if (content.src) {
      attributes.src = content.src;
    }

    if (Object.keys(attributes).length > 0) {
      element.attributes = attributes;
    }

    if (!content.src) {
      if (content.type === "xhtml") {
        element.elements = [
          {
            type: "element",
            name: "div",
            attributes: {
              xmlns: "http://www.w3.org/1999/xhtml",
            },
            elements: [{ type: "text", text: content.content }],
          },
        ];
      } else {
        element.elements = [{ type: "text", text: content.content }];
      }
    }

    return element;
  }

  private createEntryElement(entry: Entry): any {
    const elements: any[] = [
      {
        type: "element",
        name: this.getElementName("id"),
        elements: [{ type: "text", text: entry.id }],
      },
      this.createTextConstructElement(entry.title, "title"),
      {
        type: "element",
        name: this.getElementName("updated"),
        elements: [{ type: "text", text: this.formatDate(entry.updated) }],
      },
    ];

    if (entry.authors) {
      entry.authors.forEach((author) => {
        elements.push(this.createPersonElement(author, "author"));
      });
    }

    if (entry.contributors) {
      entry.contributors.forEach((contributor) => {
        elements.push(this.createPersonElement(contributor, "contributor"));
      });
    }

    if (entry.categories) {
      entry.categories.forEach((category) => {
        elements.push(this.createCategoryElement(category));
      });
    }

    if (entry.content) {
      elements.push(this.createContentElement(entry.content));
    }

    if (entry.links) {
      entry.links.forEach((link) => {
        elements.push(this.createLinkElement(link));
      });
    }

    if (entry.published) {
      elements.push({
        type: "element",
        name: this.getElementName("published"),
        elements: [{ type: "text", text: this.formatDate(entry.published) }],
      });
    }

    if (entry.rights) {
      elements.push(this.createTextConstructElement(entry.rights, "rights"));
    }

    if (entry.source) {
      elements.push({
        type: "element",
        name: this.getElementName("source"),
        elements: [{ type: "text", text: entry.source }],
      });
    }

    if (entry.summary) {
      elements.push(this.createTextConstructElement(entry.summary, "summary"));
    }

    return {
      type: "element",
      name: this.getElementName("entry"),
      elements,
    };
  }

  /**
   * Generate the Atom feed XML
   */
  toXml(): string {
    const elements: any[] = [
      {
        type: "element",
        name: this.getElementName("id"),
        elements: [{ type: "text", text: this.options.id }],
      },
      this.createTextConstructElement(this.options.title, "title"),
      {
        type: "element",
        name: this.getElementName("updated"),
        elements: [
          { type: "text", text: this.formatDate(this.options.updated) },
        ],
      },
    ];

    const feedAttributes: Record<string, string> = this.useNamespacePrefix
      ? { "xmlns:atom": "http://www.w3.org/2005/Atom" }
      : { xmlns: "http://www.w3.org/2005/Atom" };

    if (this.options.lang) {
      feedAttributes["xml:lang"] = this.options.lang;
    }

    if (this.options.base) {
      feedAttributes["xml:base"] = this.options.base;
    }

    if (this.options.authors) {
      this.options.authors.forEach((author) => {
        elements.push(this.createPersonElement(author, "author"));
      });
    }

    if (this.options.contributors) {
      this.options.contributors.forEach((contributor) => {
        elements.push(this.createPersonElement(contributor, "contributor"));
      });
    }

    if (this.options.categories) {
      this.options.categories.forEach((category) => {
        elements.push(this.createCategoryElement(category));
      });
    }

    if (this.options.generator) {
      const attributes: Record<string, string> = {};
      if (this.options.generator.version) {
        attributes.version = this.options.generator.version;
      }
      if (this.options.generator.uri) {
        attributes.uri = this.options.generator.uri;
      }
      elements.push({
        type: "element",
        name: this.getElementName("generator"),
        attributes,
        elements: [{ type: "text", text: this.options.generator.name }],
      });
    }

    if (this.options.icon) {
      elements.push({
        type: "element",
        name: this.getElementName("icon"),
        elements: [{ type: "text", text: this.options.icon }],
      });
    }

    if (this.options.links) {
      this.options.links.forEach((link) => {
        elements.push(this.createLinkElement(link));
      });
    }

    if (this.options.logo) {
      elements.push({
        type: "element",
        name: this.getElementName("logo"),
        elements: [{ type: "text", text: this.options.logo }],
      });
    }

    if (this.options.rights) {
      elements.push(
        this.createTextConstructElement(this.options.rights, "rights")
      );
    }

    if (this.options.subtitle) {
      elements.push(
        this.createTextConstructElement(this.options.subtitle, "subtitle")
      );
    }

    const entriesToAdd = this.sortEntries
      ? this.getSortedEntries()
      : this.entries;

    entriesToAdd.forEach((entry) => {
      elements.push(this.createEntryElement(entry));
    });

    const feed = {
      declaration: {
        attributes: {
          version: "1.0",
          encoding: "utf-8",
        },
      },
      elements: [
        ...(this.stylesheet
          ? [
              {
                type: "instruction",
                name: "xml-stylesheet",
                instruction: `type="${
                  this.stylesheet.type || "text/xsl"
                }" href="${encodeURI(this.stylesheet.href)}"`,
              },
            ]
          : []),
        {
          type: "element",
          name: this.getElementName("feed"),
          attributes: feedAttributes,
          elements,
        },
      ],
    };

    return js2xml(feed, { compact: false, spaces: 2 });
  }
}
