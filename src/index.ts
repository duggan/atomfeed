import { js2xml } from "xml-js";

interface Person {
  name: string;
  email?: string;
  uri?: string;
}

interface Category {
  term: string;
  scheme?: string;
  label?: string;
}

interface Link {
  href: string;
  rel?: string;
  type?: string;
  hreflang?: string;
  title?: string;
  length?: string;
}

interface Content {
  content: string;
  type?: string;
  src?: string;
}

interface Stylesheet {
  href: string;
  type?: string;
}

interface Entry {
  id: string;
  title: string;
  updated: Date;
  authors?: Person[];
  contributors?: Person[];
  categories?: Category[];
  content?: Content;
  links?: Link[];
  published?: Date;
  rights?: string;
  source?: string;
  summary?: string;
}

interface FeedOptions {
  id: string;
  title: string;
  updated: Date;
  authors?: Person[];
  contributors?: Person[];
  categories?: Category[];
  generator?: {
    name: string;
    version?: string;
    uri?: string;
  };
  icon?: string;
  links?: Link[];
  logo?: string;
  rights?: string;
  subtitle?: string;
  lang?: string;
  base?: string;
  stylesheet?: Stylesheet;
}

class AtomFeed {
  private options: FeedOptions;
  private entries: Entry[] = [];
  private useNamespacePrefix: boolean;
  private sortEntries: boolean;

  constructor(
    options: FeedOptions,
    useNamespacePrefix: boolean = false,
    sortEntries: boolean = false
  ) {
    this.validateOptions(options);
    this.options = options;
    this.useNamespacePrefix = useNamespacePrefix;
    this.sortEntries = sortEntries;
  }

  private validateOptions(options: FeedOptions): void {
    if (!options.id) throw new Error("Feed id is required");
    if (!options.title) throw new Error("Feed title is required");
    if (!options.updated) throw new Error("Feed updated date is required");
    if (!(options.updated instanceof Date))
      throw new Error("Feed updated must be a Date object");

    if (options.icon && !this.isValidUri(options.icon))
      throw new Error("Invalid icon URI");
    if (options.logo && !this.isValidUri(options.logo))
      throw new Error("Invalid logo URI");
    if (options.base && !this.isValidUri(options.base))
      throw new Error("Invalid xml:base URI");
  }

  private isValidUri(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }

  private validateEntry(entry: Entry): void {
    if (!entry.id) throw new Error("Entry id is required");
    if (!entry.title) throw new Error("Entry title is required");
    if (!entry.updated) throw new Error("Entry updated date is required");
    if (!(entry.updated instanceof Date))
      throw new Error("Entry updated must be a Date object");

    if (entry.links) {
      entry.links.forEach((link) => {
        if (!this.isValidUri(link.href)) {
          throw new Error(`Invalid link href: ${link.href}`);
        }
      });
    }
  }

  addStylesheet(stylesheet: Stylesheet): void {
    this.options.stylesheet = stylesheet;
  }

  addAuthor(person: Person) {
    if (!this.options.authors) {
      this.options.authors = [];
    }
    if (person.uri) {
      if (!this.isValidUri(person.uri)) {
        throw Error("Invalid person URI");
      }
    }
    this.options.authors.push(person);
  }

  addLink(link: Link): void {
    if (!this.options.links) {
      this.options.links = [];
    }
    if (!this.isValidUri(link.href)) {
      throw Error("Invalid link href");
    }
    this.options.links?.push(link);
  }

  addSelfLink(href: string) {
    this.addLink({ rel: "self", href });
  }

  addAlternateLink(href: string): void {
    this.addLink({ type: "text/html", rel: "alternate", href });
  }

  addFirstLink(href: string): void {
    this.addLink({ rel: "first", href });
  }

  addLastLink(href: string): void {
    this.addLink({ rel: "last", href });
  }

  addNextLink(href: string): void {
    this.addLink({ rel: "next", href });
  }

  addPreviousLink(href: string): void {
    this.addLink({ rel: "previous", href });
  }

  addEntry(entry: Entry): void {
    this.validateEntry(entry);
    this.entries.push(entry);
  }

  removeEntry(entryId: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.id !== entryId);
    return this.entries.length !== initialLength;
  }

  getEntries(): readonly Entry[] {
    return Object.freeze([...this.entries]);
  }

  clear(): void {
    this.entries = [];
  }

  private getElementName(name: string): string {
    return this.useNamespacePrefix ? `atom:${name}` : name;
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }

  private createPersonElement(person: Person): any {
    const element: any = {
      elements: [
        {
          type: "element",
          name: this.getElementName("name"),
          elements: [{ type: "text", text: person.name }],
        },
      ],
    };

    if (person.email) {
      element.elements.push({
        type: "element",
        name: this.getElementName("email"),
        elements: [{ type: "text", text: person.email }],
      });
    }

    if (person.uri) {
      if (!this.isValidUri(person.uri)) {
        throw new Error(`Invalid person URI: ${person.uri}`);
      }
      element.elements.push({
        type: "element",
        name: this.getElementName("uri"),
        elements: [{ type: "text", text: person.uri }],
      });
    }

    return element;
  }

  private createCategoryElement(category: Category): any {
    const attributes: any = { term: category.term };
    if (category.scheme) attributes.scheme = category.scheme;
    if (category.label) attributes.label = category.label;

    return {
      type: "element",
      name: this.getElementName("category"),
      attributes,
    };
  }

  private createLinkElement(link: Link): any {
    const attributes: any = { href: link.href };
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

    if (content.type) {
      element.attributes = { type: content.type };
    }

    if (content.src) {
      element.attributes = { ...element.attributes, src: content.src };
    } else {
      element.elements = [{ type: "text", text: content.content }];
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
      {
        type: "element",
        name: this.getElementName("title"),
        elements: [{ type: "text", text: entry.title }],
      },
      {
        type: "element",
        name: this.getElementName("updated"),
        elements: [{ type: "text", text: this.formatDate(entry.updated) }],
      },
    ];

    if (entry.authors) {
      entry.authors.forEach((author) => {
        elements.push({
          type: "element",
          name: this.getElementName("author"),
          ...this.createPersonElement(author),
        });
      });
    }

    if (entry.contributors) {
      entry.contributors.forEach((contributor) => {
        elements.push({
          type: "element",
          name: this.getElementName("contributor"),
          ...this.createPersonElement(contributor),
        });
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
      elements.push({
        type: "element",
        name: this.getElementName("rights"),
        elements: [{ type: "text", text: entry.rights }],
      });
    }

    if (entry.source) {
      elements.push({
        type: "element",
        name: this.getElementName("source"),
        elements: [{ type: "text", text: entry.source }],
      });
    }

    if (entry.summary) {
      elements.push({
        type: "element",
        name: this.getElementName("summary"),
        elements: [{ type: "text", text: entry.summary }],
      });
    }

    return {
      type: "element",
      name: this.getElementName("entry"),
      elements,
    };
  }

  toXml(): string {
    const elements: any[] = [
      {
        type: "element",
        name: this.getElementName("id"),
        elements: [{ type: "text", text: this.options.id }],
      },
      {
        type: "element",
        name: this.getElementName("title"),
        elements: [{ type: "text", text: this.options.title }],
      },
      {
        type: "element",
        name: this.getElementName("updated"),
        elements: [
          { type: "text", text: this.formatDate(this.options.updated) },
        ],
      },
    ];

    const feedAttributes: any = this.useNamespacePrefix
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
        elements.push({
          type: "element",
          name: this.getElementName("author"),
          ...this.createPersonElement(author),
        });
      });
    }

    if (this.options.contributors) {
      this.options.contributors.forEach((contributor) => {
        elements.push({
          type: "element",
          name: this.getElementName("contributor"),
          ...this.createPersonElement(contributor),
        });
      });
    }

    if (this.options.categories) {
      this.options.categories.forEach((category) => {
        elements.push(this.createCategoryElement(category));
      });
    }

    if (this.options.generator) {
      const attributes: any = {};
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
      elements.push({
        type: "element",
        name: this.getElementName("rights"),
        elements: [{ type: "text", text: this.options.rights }],
      });
    }

    if (this.options.subtitle) {
      elements.push({
        type: "element",
        name: this.getElementName("subtitle"),
        elements: [{ type: "text", text: this.options.subtitle }],
      });
    }

    // Sort entries if enabled
    const entriesToAdd = this.sortEntries
      ? [...this.entries].sort(
          (a, b) => b.updated.getTime() - a.updated.getTime()
        )
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
        ...(this.options.stylesheet
          ? [
              {
                type: "instruction",
                name: "xml-stylesheet",
                instruction: `type="${
                  this.options.stylesheet.type || "text/xsl"
                }" href="${encodeURI(this.options.stylesheet.href)}"`,
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

export {
  AtomFeed,
  type Person,
  type Category,
  type Link,
  type Content,
  type Entry,
  type FeedOptions,
};
