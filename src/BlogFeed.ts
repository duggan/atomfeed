import {
  FeedOptions,
  Entry,
  TextConstruct,
  Person,
  Link,
  Category,
  Content,
} from "./types";
import { RawAtomFeed } from "./RawAtomFeed";

interface Author {
  name: string;
  email?: string;
  website?: string;
}

interface PaginationLinks {
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
  current?: string;
}

interface BlogFeedOptions {
  id: string;
  title: string;
  subtitle?: string;
  description?: string; // Alternative to subtitle
  author?: Author;
  authors?: Author | Author[];
  contributors?: Author | Author[];
  links?: string | string[]; // URLs that will be converted to Link objects
  pagination?: PaginationLinks;
  language?: string;
  updated?: Date;
  icon?: string;
  logo?: string;
  rights?: string;
  stylesheet?: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  contentType?: "text" | "html" | "xhtml";
  summary?: string;
  author?: Author; // Single author
  authors?: Author | Author[]; // Multiple authors
  contributors?: Author | Author[];
  published?: Date;
  updated?: Date;
  links?: string | string[];
  categories?: string | string[]; // Blog strings that will be converted to Category objects
  rights?: string;
}

export class BlogFeed {
  private feed: RawAtomFeed;

  constructor(options: BlogFeedOptions) {
    const feedOptions = this.convertFeedOptions(options);
    this.feed = new RawAtomFeed(
      feedOptions,
      false,
      true, // Sort entries by default
      options.stylesheet ? { href: options.stylesheet } : undefined
    );
  }

  private convertPerson(person: Author): Person {
    return {
      name: person.name,
      email: person.email,
      uri: person.website,
    };
  }

  private convertPersonArray(
    author?: Author,
    authors?: Author | Author[]
  ): Person[] | undefined {
    if (!author && !authors) return undefined;

    const people: Author[] = [];

    if (author) {
      people.push(author);
    }

    if (authors) {
      people.push(...(Array.isArray(authors) ? authors : [authors]));
    }

    return people.map(this.convertPerson);
  }

  private convertTextConstruct(text: string): TextConstruct {
    return {
      content: text,
      type: text.includes("<") ? "html" : "text",
    };
  }

  private convertLinks(
    standardLinks?: string | string[],
    pagination?: PaginationLinks
  ): Link[] {
    const links: Link[] = [];

    // Convert standard links
    if (standardLinks) {
      const linkArray = Array.isArray(standardLinks)
        ? standardLinks
        : [standardLinks];
      links.push(
        ...linkArray.map((href) => ({
          href,
          rel: "alternate",
        }))
      );
    }

    // Add pagination links if provided
    if (pagination) {
      if (pagination.first) {
        links.push({
          href: pagination.first,
          rel: "first",
        });
      }
      if (pagination.last) {
        links.push({
          href: pagination.last,
          rel: "last",
        });
      }
      if (pagination.next) {
        links.push({
          href: pagination.next,
          rel: "next",
        });
      }
      if (pagination.previous) {
        links.push({
          href: pagination.previous,
          rel: "previous",
        });
      }
      if (pagination.current) {
        links.push({
          href: pagination.current,
          rel: "self",
        });
      }
    }

    return links;
  }

  private convertCategories(
    categories?: string | string[]
  ): Category[] | undefined {
    if (!categories) return undefined;
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    return categoryArray.map((term) => ({
      term,
    }));
  }

  private convertFeedOptions(options: BlogFeedOptions): FeedOptions {
    return {
      id: options.id,
      title: this.convertTextConstruct(options.title),
      subtitle:
        options.subtitle || options.description
          ? this.convertTextConstruct(options.subtitle || options.description!)
          : undefined,
      authors: this.convertPersonArray(options.author, options.authors),
      contributors: this.convertPersonArray(undefined, options.contributors),
      links: this.convertLinks(options.links, options.pagination),
      lang: options.language,
      updated: options.updated || new Date(),
      icon: options.icon,
      logo: options.logo,
      rights: options.rights
        ? this.convertTextConstruct(options.rights)
        : undefined,
    };
  }

  private convertContent(
    content: string,
    contentType: BlogPost["contentType"] = "text"
  ): Content {
    return {
      content,
      type: contentType,
    };
  }

  private convertBlogPost(post: BlogPost): Entry {
    const updated = post.updated || post.published || new Date();

    return {
      id: post.id,
      title: this.convertTextConstruct(post.title),
      content: this.convertContent(post.content, post.contentType),
      summary: post.summary
        ? this.convertTextConstruct(post.summary)
        : undefined,
      authors: this.convertPersonArray(post.author, post.authors),
      contributors: this.convertPersonArray(undefined, post.contributors),
      published: post.published,
      updated,
      links: this.convertLinks(post.links),
      categories: this.convertCategories(post.categories),
      rights: post.rights ? this.convertTextConstruct(post.rights) : undefined,
    };
  }

  addPost(post: BlogPost): void {
    const entry = this.convertBlogPost(post);
    this.feed.addEntry(entry);
  }

  removePost(postId: string): boolean {
    return this.feed.removeEntry(postId);
  }

  getPosts(): readonly Entry[] {
    return this.feed.getEntries();
  }

  clear(): void {
    this.feed.clear();
  }

  generate(): string {
    return this.feed.toXml();
  }

  /**
   * Update pagination links for the feed
   */
  setPagination(pagination: PaginationLinks): void {
    const newLinks = this.convertLinks(undefined, pagination);

    // Remove existing pagination links
    const existingLinks = this.feed.getLinks() || [];
    const standardLinks = existingLinks.filter(
      (link) =>
        !["first", "last", "next", "previous", "self"].includes(link.rel || "")
    );

    // Add new pagination links
    this.feed.setLinks([...standardLinks, ...newLinks]);
  }

  /**
   * Get current pagination links
   */
  getPagination(): PaginationLinks {
    const links = this.feed.getLinks() || [];
    const pagination: PaginationLinks = {};

    links.forEach((link) => {
      if (link.rel === "first") pagination.first = link.href;
      if (link.rel === "last") pagination.last = link.href;
      if (link.rel === "next") pagination.next = link.href;
      if (link.rel === "previous") pagination.previous = link.href;
      if (link.rel === "self") pagination.current = link.href;
    });

    return pagination;
  }
}
