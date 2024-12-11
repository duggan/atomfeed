import { describe, test, expect, beforeEach } from "vitest";
import { BlogFeed } from "./BlogFeed";
import { xml2js, ElementCompact } from "xml-js";

describe("BlogFeed", () => {
  let feed: BlogFeed;

  beforeEach(() => {
    feed = new BlogFeed({
      id: "https://myblog.com",
      title: "Test Blog",
    });
  });

  // Helper function to safely get link href
  const getLinkHref = (element: any): string | undefined => {
    if (!element.link) return undefined;
    const link = Array.isArray(element.link) ? element.link[0] : element.link;
    return link?._attributes?.href;
  };

  describe("constructor", () => {
    test("creates feed with minimal options", () => {
      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      expect(result.feed.id._text).toBe("https://myblog.com");
      expect(result.feed.title._text).toBe("Test Blog");
      expect(result.feed.updated._text).toBeDefined();
    });

    test("handles single author", () => {
      const feedWithAuthor = new BlogFeed({
        id: "https://myblog.com",
        title: "Test Blog",
        author: {
          name: "John Doe",
          email: "john@example.com",
          website: "https://johndoe.com",
        },
      });

      const xml = feedWithAuthor.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      expect(result.feed.author.name._text).toBe("John Doe");
      expect(result.feed.author.email._text).toBe("john@example.com");
      expect(result.feed.author.uri._text).toBe("https://johndoe.com");
    });

    test("handles multiple authors", () => {
      const feedWithAuthors = new BlogFeed({
        id: "https://myblog.com",
        title: "Test Blog",
        authors: [
          {
            name: "John Doe",
            email: "john@example.com",
          },
          {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        ],
      });

      const xml = feedWithAuthors.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      const authors = Array.isArray(result.feed.author)
        ? result.feed.author
        : [result.feed.author];

      expect(authors).toHaveLength(2);
      expect(authors[0].name._text).toBe("John Doe");
      expect(authors[1].name._text).toBe("Jane Smith");
    });

    test("combines author and authors", () => {
      const feedWithBoth = new BlogFeed({
        id: "https://myblog.com",
        title: "Test Blog",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
        authors: {
          name: "Jane Smith",
          email: "jane@example.com",
        },
      });

      const xml = feedWithBoth.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      const authors = Array.isArray(result.feed.author)
        ? result.feed.author
        : [result.feed.author];

      expect(authors).toHaveLength(2);
    });

    test("handles all feed options", () => {
      const fullFeed = new BlogFeed({
        id: "https://myblog.com",
        title: "Test Blog",
        subtitle: "A blog about testing",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
        links: "https://myblog.com",
        language: "en-US",
        updated: new Date("2024-01-01"),
        icon: "https://myblog.com/icon.png",
        logo: "https://myblog.com/logo.png",
        rights: "Copyright 2024",
      });

      const xml = fullFeed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      expect(result.feed.subtitle._text).toBe("A blog about testing");
      expect(getLinkHref(result.feed)).toBe("https://myblog.com");
      expect(result.feed._attributes?.["xml:lang"]).toBe("en-US");
      expect(result.feed.updated._text).toMatch(/2024-01-01/);
      expect(result.feed.icon._text).toBe("https://myblog.com/icon.png");
      expect(result.feed.logo._text).toBe("https://myblog.com/logo.png");
      expect(result.feed.rights._text).toBe("Copyright 2024");
    });
  });

  describe("addPost", () => {
    test("adds minimal blog post", () => {
      feed.addPost({
        id: "post-1",
        title: "Test Post",
        content: "Hello, world!",
      });

      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;
      const entry = result.feed.entry;

      expect(entry.id._text).toBe("post-1");
      expect(entry.title._text).toBe("Test Post");
      expect(entry.content._text).toBe("Hello, world!");
    });

    test("handles HTML content", () => {
      feed.addPost({
        id: "post-1",
        title: "Test Post",
        content: "<p>Hello, world!</p>",
        contentType: "html",
      });

      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;
      const entry = result.feed.entry;

      // Type might be in different places depending on how xml-js structures it
      const contentType =
        entry.content.attributes?.type || entry.content._attributes?.type;
      expect(contentType).toBe("html");
      expect(entry.content._text).toBe("<p>Hello, world!</p>");
    });

    test("handles post with all fields", () => {
      const publishDate = new Date("2024-01-01");
      const updateDate = new Date("2024-01-02");

      feed.addPost({
        id: "post-1",
        title: "Test Post",
        content: "Hello, world!",
        summary: "A test post",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
        published: publishDate,
        updated: updateDate,
        links: ["https://myblog.com/post-1"],
        categories: ["test", "example"],
        rights: "Copyright 2024",
      });

      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;
      const entry = result.feed.entry;

      expect(entry.summary._text).toBe("A test post");
      expect(entry.author.name._text).toBe("John Doe");
      expect(entry.published._text).toMatch(/2024-01-01/);
      expect(entry.updated._text).toMatch(/2024-01-02/);
      expect(getLinkHref(entry)).toBe("https://myblog.com/post-1");

      // Handle both single category and array of categories
      const categories = Array.isArray(entry.category)
        ? entry.category
        : [entry.category];
      expect(categories).toHaveLength(2);

      expect(entry.rights._text).toBe("Copyright 2024");
    });
  });

  describe("removePost", () => {
    test("removes existing post", () => {
      feed.addPost({
        id: "post-1",
        title: "Test Post",
        content: "Hello, world!",
      });

      const removed = feed.removePost("post-1");
      expect(removed).toBe(true);

      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;

      expect(result.feed.entry).toBeUndefined();
    });

    test("returns false for non-existent post", () => {
      const removed = feed.removePost("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("getPosts", () => {
    test("returns all posts", () => {
      feed.addPost({
        id: "post-1",
        title: "First Post",
        content: "Hello",
      });

      feed.addPost({
        id: "post-2",
        title: "Second Post",
        content: "World",
      });

      const posts = feed.getPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe("post-1");
      expect(posts[1].id).toBe("post-2");
    });

    test("returns immutable array", () => {
      feed.addPost({
        id: "post-1",
        title: "Test Post",
        content: "Hello",
      });

      const posts = feed.getPosts();
      expect(() => (posts as any[]).push({} as any)).toThrow();
    });
  });

  describe("clear", () => {
    test("removes all posts", () => {
      feed.addPost({
        id: "post-1",
        title: "First Post",
        content: "Hello",
      });

      feed.addPost({
        id: "post-2",
        title: "Second Post",
        content: "World",
      });

      feed.clear();
      expect(feed.getPosts()).toHaveLength(0);

      const xml = feed.generate();
      const result = xml2js(xml, { compact: true }) as ElementCompact;
      expect(result.feed.entry).toBeUndefined();
    });
  });
});
