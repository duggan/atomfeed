# TypeScript Atom Feed Generator

A robust and type-safe library for generating Atom feeds in TypeScript/JavaScript. This library provides a clean, intuitive API for creating Atom feeds that comply with the [RFC 4287](https://tools.ietf.org/html/rfc4287) specification.

## Features

- 🎯 Fully typed with TypeScript
- ✅ RFC 4287 compliant
- 🔒 Input validation with helpful error messages
- 🎨 Optional XSLT stylesheet support
- 🏷️ Optional namespace prefixing
- 🔄 Entry sorting by date
- 🔗 Helper methods for common link types
- 🧪 Comprehensive test coverage

## Installation

```bash
npm install atomfeed
```

## Quick Start

```typescript
import { AtomFeed } from "atomfeed";

// Create a new feed
const feed = new AtomFeed({
  id: "https://example.com/feed",
  title: "My Blog",
  updated: new Date(),
});

// Add an entry
feed.addEntry({
  id: "https://example.com/posts/1",
  title: "Hello World",
  updated: new Date(),
  content: {
    content: "This is my first blog post!",
    type: "text",
  },
});

// Generate XML
const xml = feed.toXml();
```

## API Reference

### Creating a Feed

The `AtomFeed` constructor accepts three parameters:

```typescript
const feed = new AtomFeed(
  options: FeedOptions,
  useNamespacePrefix: boolean = false,
  sortEntries: boolean = false
);
```

#### FeedOptions

Required fields:

- `id`: Unique identifier for the feed
- `title`: Human-readable title
- `updated`: Last update timestamp

Optional fields:

- `authors`: Array of `Person` objects
- `contributors`: Array of `Person` objects
- `categories`: Array of `Category` objects
- `generator`: Information about the generating software
- `icon`: URI to feed icon
- `links`: Array of `Link` objects
- `logo`: URI to feed logo
- `rights`: Copyright information
- `subtitle`: Feed subtitle
- `lang`: XML language attribute
- `base`: XML base URI
- `stylesheet`: XSLT stylesheet configuration

### Adding Content

#### Authors and Contributors

```typescript
feed.addAuthor({
  name: "John Doe",
  email: "john@example.com", // optional
  uri: "https://example.com/john", // optional
});
```

#### Links

```typescript
// Add generic link
feed.addLink({
  href: "https://example.com",
  rel: "alternate",
  type: "text/html",
});

// Helper methods for common link types
feed.addSelfLink("https://example.com/feed.xml");
feed.addAlternateLink("https://example.com");
feed.addFirstLink("https://example.com/page1");
feed.addLastLink("https://example.com/page10");
feed.addNextLink("https://example.com/page2");
feed.addPreviousLink("https://example.com/page1");
```

#### Entries

```typescript
feed.addEntry({
  id: "unique-entry-id",
  title: "Entry Title",
  updated: new Date(),
  authors: [{ name: "John Doe" }], // optional
  content: {
    // optional
    content: "Entry content",
    type: "text", // or "html", "xhtml", etc.
  },
  summary: "Entry summary", // optional
  published: new Date(), // optional
  rights: "Copyright notice", // optional
  links: [], // optional
});
```

### Entry Management

```typescript
// Get all entries (returns frozen array)
const entries = feed.getEntries();

// Remove an entry
feed.removeEntry("entry-id");

// Clear all entries
feed.clear();
```

### Stylesheet Support

```typescript
feed.addStylesheet({
  href: "styles.xsl",
  type: "text/xsl", // optional, defaults to "text/xsl"
});
```

## Types

### Person

```typescript
interface Person {
  name: string;
  email?: string;
  uri?: string;
}
```

### Category

```typescript
interface Category {
  term: string;
  scheme?: string;
  label?: string;
}
```

### Link

```typescript
interface Link {
  href: string;
  rel?: string;
  type?: string;
  hreflang?: string;
  title?: string;
  length?: string;
}
```

### Content

```typescript
interface Content {
  content: string;
  type?: string;
  src?: string;
}
```

## Validation

The library performs validation on:

- Required fields for feeds and entries
- URI formats for links, icons, and logos
- Date object types
- XML special character escaping

## XML Output

- Produces well-formed XML with proper encoding
- Supports optional atom namespace prefixing
- Handles XML special characters
- Optional sorting of entries by date
- XSLT stylesheet processing instruction support

## Example with All Features

```typescript
const feed = new AtomFeed(
  {
    id: "https://example.com/feed",
    title: "My Blog",
    updated: new Date(),
    authors: [{ name: "John Doe", email: "john@example.com" }],
    generator: {
      name: "My Blog Software",
      version: "1.0",
      uri: "https://example.com/software",
    },
    lang: "en-US",
    stylesheet: {
      href: "atom.xsl",
      type: "text/xsl",
    },
  },
  true,
  true
); // Use namespace prefix and sort entries

feed.addLink({
  href: "https://example.com",
  rel: "alternate",
  type: "text/html",
});

feed.addEntry({
  id: "https://example.com/posts/1",
  title: "First Post",
  updated: new Date(),
  content: {
    content: "<h1>Hello World</h1>",
    type: "html",
  },
  summary: "My first blog post",
  published: new Date(),
  rights: "© 2024",
});

const xml = feed.toXml();
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
