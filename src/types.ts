/**
 * Types for RFC 4287 Compliant Atom Feed Generator
 * @see https://tools.ietf.org/html/rfc4287
 */

/**
 * RFC 4287 Section 3.1 - Text Constructs
 */
export type TextType = "text" | "html" | "xhtml";

/**
 * Content types as defined in RFC 4287 Section 4.1.3
 */
export type ContentType = TextType | "base64" | string;

/**
 * RFC 4287 Section 3.1 - Text Construct
 */
export interface TextConstruct {
  content: string;
  type?: TextType;
  lang?: string;
  base?: string;
}

/**
 * RFC 4287 Section 3.2 - Person Construct
 */
export interface Person {
  name: string;
  email?: string;
  uri?: string;
}

/**
 * RFC 4287 Section 4.2.2 - Category Construct
 */
export interface Category {
  term: string;
  scheme?: string;
  label?: string;
}

/**
 * RFC 4287 Section 4.2.7 - Link Construct
 */
export interface Link {
  href: string;
  rel?: string;
  type?: string;
  hreflang?: string;
  title?: string;
  length?: string;
}

/**
 * RFC 4287 Section 4.1.3 - Content Construct
 */
export interface Content {
  content: string;
  type?: ContentType;
  src?: string;
  lang?: string;
  base?: string;
}

/**
 * XML Stylesheet configuration
 */
export interface Stylesheet {
  href: string;
  type?: string;
}

/**
 * Sort field
 */
export type SortField = "published" | "updated";

/**
 * RFC 4287 Section 4.1.2 - Generator Configuration
 */
export interface Generator {
  name: string;
  version?: string;
  uri?: string;
}

/**
 * RFC 4287 Section 4.1.1 - Feed Entry
 */
export interface Entry {
  id: string;
  title: TextConstruct;
  updated: Date;
  authors?: Person[];
  contributors?: Person[];
  categories?: Category[];
  content?: Content;
  links?: Link[];
  published?: Date;
  rights?: TextConstruct;
  source?: string;
  summary?: TextConstruct;
}

/**
 * RFC 4287 Section 4.1.1 - Feed Options
 */
export interface FeedOptions {
  id: string;
  title: TextConstruct;
  updated: Date;
  authors?: Person[];
  contributors?: Person[];
  categories?: Category[];
  generator?: Generator;
  icon?: string;
  links?: Link[];
  logo?: string;
  rights?: TextConstruct;
  subtitle?: TextConstruct;
  lang?: string;
  base?: string;
}
