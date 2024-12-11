# AtomFeed

A TypeScript library for generating Atom feeds, supporting pagination and XML stylesheets.

## Features

- Implements core Atom feed features
- Type-safe API with comprehensive TypeScript definitions
- High-level BlogFeed interface for common blogging use cases
- Low-level RawAtomFeed interface for complete control
- Built-in validation for dates, language tags, and required fields
- Support for XML stylesheets
- Pagination helpers
- Entry sorting options
- Flexible author/contributor management
- Support for both text and HTML content

## Installation

```bash
npm install atomfeed
# or
yarn add atomfeed
```

## Quick Start

```typescript
import { BlogFeed } from "atomfeed";

// Create a new feed
const feed = new BlogFeed({
  id: "https://example.com/blog",
  title: "My Blog",
  subtitle: "Thoughts and musings",
  author: {
    name: "John Doe",
    email: "john@example.com",
    website: "https://example.com",
  },
});

// Add a post
feed.addPost({
  id: "https://example.com/blog/first-post",
  title: "My First Post",
  content: "<p>Hello, world!</p>",
  contentType: "html",
  published: new Date(),
  categories: ["introduction", "first-post"],
});

// Generate the feed XML
const xml = feed.generate();
```

## BlogFeed API

### Constructor Options

```typescript
interface BlogFeedOptions {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  author?: Author;
  authors?: Author | Author[];
  contributors?: Author | Author[];
  links?: string | string[];
  pagination?: PaginationLinks;
  language?: string;
  updated?: Date;
  icon?: string;
  logo?: string;
  rights?: string;
  stylesheet?: string;
}

interface Author {
  name: string;
  email?: string;
  website?: string;
}
```

### Methods

- `addPost(post: BlogPost)`: Add a new post to the feed
- `removePost(postId: string)`: Remove a post by ID
- `getPosts()`: Get all posts in the feed
- `clear()`: Remove all posts
- `generate()`: Generate the feed XML
- `setPagination(pagination: PaginationLinks)`: Update pagination links
- `getPagination()`: Get current pagination links

### BlogPost Interface

```typescript
interface BlogPost {
  id: string;
  title: string;
  content: string;
  contentType?: "text" | "html" | "xhtml";
  summary?: string;
  author?: Author;
  authors?: Author | Author[];
  contributors?: Author | Author[];
  published?: Date;
  updated?: Date;
  links?: string | string[];
  categories?: string | string[];
  rights?: string;
}
```

## RawAtomFeed API

For cases requiring more control, the `RawAtomFeed` class provides direct access to building the Atom structures more directly.

```typescript
import { RawAtomFeed } from "atom-feed";

const feed = new RawAtomFeed(
  {
    id: "https://example.com/feed",
    title: {
      content: "My Feed",
      type: "text",
    },
    updated: new Date(),
  },
  false,
  true
);

feed.addEntry({
  id: "https://example.com/entry1",
  title: {
    content: "Entry Title",
    type: "text",
  },
  updated: new Date(),
  content: {
    content: "<p>Entry content</p>",
    type: "html",
  },
});

const xml = feed.toXml();
```

See the type definitions for complete `FeedOptions` and `Entry` interfaces.

## Validation

The library performs validation for:

- RFC 3339 dates
- Language tags (RFC 5646)
- Required fields according to the Atom specification
- Link relations and attributes
- XML content types

## Examples

### Feed with Pagination

```typescript
const feed = new BlogFeed({
  id: "https://example.com/blog",
  title: "My Blog",
  pagination: {
    first: "https://example.com/blog/page/1",
    last: "https://example.com/blog/page/5",
    next: "https://example.com/blog/page/2",
    current: "https://example.com/blog/page/1",
  },
});
```

### Multiple Authors

```typescript
const feed = new BlogFeed({
  id: "https://example.com/blog",
  title: "Team Blog",
  authors: [
    {
      name: "Alice Smith",
      email: "alice@example.com",
    },
    {
      name: "Bob Jones",
      email: "bob@example.com",
    },
  ],
});
```

### Custom Stylesheet

```typescript
const feed = new BlogFeed({
  id: "https://example.com/blog",
  title: "My Blog",
  stylesheet: "https://example.com/feed.xsl",
});
```

## License

MIT
