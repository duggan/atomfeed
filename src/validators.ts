import { isValidLanguageTag } from "./bcp47";
import {
  TextConstruct,
  Person,
  Category,
  Link,
  Content,
  FeedOptions,
  Entry,
} from "./types";

/**
 * RFC 3987 IRI validation
 * This is a simplified version that handles most common cases
 * For production use, consider using a full IRI parsing library
 */
export function isValidIri(iri: string): boolean {
  try {
    // First try as a regular URL
    new URL(iri);
    return true;
  } catch {
    // If that fails, try a more permissive IRI regex
    const iriRegex = /^[a-zA-Z][a-z0-9+.-]*:[^\s]*$/i;
    return iriRegex.test(iri);
  }
}

/**
 * RFC 5322 Email validation (simplified)
 */
export function isValidEmail(email: string): boolean {
  // This is a simplified email validation
  // For production use, consider using a more robust email validation library
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * RFC 5646 (BCP 47) Language tag validation
 * @see https://datatracker.ietf.org/doc/html/rfc5646
 */
export { isValidLanguageTag } from "./bcp47";

/**
 * RFC 4648 Base64 validation
 */
export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * RFC 3339 date validation
 */
export function isValidRfc3339Date(date: Date): boolean {
  if (isNaN(date.getTime())) {
    return false;
  }
  const dateString = date.toISOString();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(dateString);
}

/**
 * Validate XHTML content structure
 */
export function isValidXhtmlContent(content: string): boolean {
  return (
    content
      .trim()
      .match(
        /^<div xmlns="http:\/\/www\.w3\.org\/1999\/xhtml".*>.*<\/div>$/s
      ) !== null
  );
}

/**
 * Validate a text construct according to RFC 4287 Section 3.1
 */
export function validateTextConstruct(
  text: TextConstruct,
  field: string
): void {
  if (!text.content) {
    throw new Error(`${field} content is required`);
  }

  if (text.type && !["text", "html", "xhtml"].includes(text.type)) {
    throw new Error(
      `Invalid ${field} type: must be 'text', 'html', or 'xhtml'`
    );
  }

  if (text.lang && !isValidLanguageTag(text.lang)) {
    throw new Error(`Invalid language tag in ${field}`);
  }

  if (text.type === "xhtml" && !isValidXhtmlContent(text.content)) {
    throw new Error(
      `${field} with type="xhtml" must contain a single div element`
    );
  }

  if (text.base && !isValidIri(text.base)) {
    throw new Error(`Invalid base IRI in ${field}`);
  }
}

/**
 * Validate a person construct according to RFC 4287 Section 3.2
 */
export function validatePerson(person: Person): void {
  if (!person.name) {
    throw new Error("Person name is required");
  }
  if (person.uri && !isValidIri(person.uri)) {
    throw new Error(`Invalid person URI: ${person.uri}`);
  }
  if (person.email && !isValidEmail(person.email)) {
    throw new Error(`Invalid person email: ${person.email}`);
  }
}

/**
 * Validate a category according to RFC 4287 Section 4.2.2
 */
export function validateCategory(category: Category): void {
  if (!category.term) {
    throw new Error("Category term is required");
  }
  if (category.scheme && !isValidIri(category.scheme)) {
    throw new Error(`Invalid category scheme: ${category.scheme}`);
  }
}

/**
 * Validate a link according to RFC 4287 Section 4.2.7
 */
export function validateLink(link: Link): void {
  if (!link.href) {
    throw new Error("Link href is required");
  }
  if (!isValidIri(link.href)) {
    throw new Error(`Invalid link href: ${link.href}`);
  }
  if (link.hreflang && !isValidLanguageTag(link.hreflang)) {
    throw new Error(`Invalid link hreflang: ${link.hreflang}`);
  }
}

/**
 * Validate content according to RFC 4287 Section 4.1.3
 */
export function validateContent(content: Content): void {
  if (!content.content && !content.src) {
    throw new Error("Content must have either content or src");
  }
  if (content.content && content.src) {
    throw new Error("Content cannot have both content and src");
  }
  if (content.src && !isValidIri(content.src)) {
    throw new Error(`Invalid content src: ${content.src}`);
  }
  if (content.type === "xhtml" && !isValidXhtmlContent(content.content)) {
    throw new Error("XHTML content must contain a single div element");
  }
  if (content.type === "base64" && !isValidBase64(content.content)) {
    throw new Error("Invalid base64 content");
  }
  if (content.lang && !isValidLanguageTag(content.lang)) {
    throw new Error("Invalid content language tag");
  }
  if (content.base && !isValidIri(content.base)) {
    throw new Error("Invalid content base IRI");
  }
}

/**
 * Validate feed options according to RFC 4287
 */
export function validateFeedOptions(options: FeedOptions): void {
  if (!options.id) throw new Error("Feed id is required");
  if (!options.title) throw new Error("Feed title is required");
  if (!options.updated) throw new Error("Feed updated date is required");
  if (!(options.updated instanceof Date)) {
    throw new Error("Feed updated must be a Date object");
  }
  if (!isValidRfc3339Date(options.updated)) {
    throw new Error("Invalid RFC 3339 date");
  }

  // Enhanced language validation
  if (options.lang && !isValidLanguageTag(options.lang)) {
    throw new Error("Invalid language tag");
  }

  validateTextConstruct(options.title, "Feed title");
  if (options.subtitle) {
    validateTextConstruct(options.subtitle, "Feed subtitle");
  }
  if (options.rights) {
    validateTextConstruct(options.rights, "Feed rights");
  }
  if (options.icon && !isValidIri(options.icon)) {
    throw new Error("Invalid icon IRI");
  }
  if (options.logo && !isValidIri(options.logo)) {
    throw new Error("Invalid logo IRI");
  }
  if (options.base && !isValidIri(options.base)) {
    throw new Error("Invalid xml:base IRI");
  }

  if (options.authors) {
    options.authors.forEach((author) => validatePerson(author));
  }
  if (options.contributors) {
    options.contributors.forEach((contributor) => validatePerson(contributor));
  }
  if (options.categories) {
    options.categories.forEach((category) => validateCategory(category));
  }
  if (options.links) {
    options.links.forEach((link) => validateLink(link));
  }
}

/**
 * Validate an entry according to RFC 4287
 */
export function validateEntry(entry: Entry): void {
  if (!entry.id) throw new Error("Entry id is required");
  if (!entry.title) throw new Error("Entry title is required");
  if (!entry.updated) throw new Error("Entry updated date is required");
  if (!(entry.updated instanceof Date)) {
    throw new Error("Entry updated must be a Date object");
  }
  if (!isValidRfc3339Date(entry.updated)) {
    throw new Error("Entry updated must be a valid RFC 3339 date");
  }

  validateTextConstruct(entry.title, "Entry title");

  if (entry.content) {
    validateContent(entry.content);
  }

  if (entry.summary) {
    validateTextConstruct(entry.summary, "Entry summary");
  }

  if (entry.rights) {
    validateTextConstruct(entry.rights, "Entry rights");
  }

  if (entry.authors) {
    entry.authors.forEach((author) => validatePerson(author));
  }

  if (entry.contributors) {
    entry.contributors.forEach((contributor) => validatePerson(contributor));
  }

  if (entry.categories) {
    entry.categories.forEach((category) => validateCategory(category));
  }

  if (entry.links) {
    entry.links.forEach((link) => validateLink(link));
  }

  if (entry.published) {
    if (!isValidRfc3339Date(entry.published)) {
      throw new Error("Entry published must be a valid RFC 3339 date");
    }
  }
}
