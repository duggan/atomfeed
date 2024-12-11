// BCP 47 RFC 5646 Grammar (simplified):
// language      = 2*3ALPHA [ "-" extlang ] / 4ALPHA / 5*8ALPHA
// extlang       = 3ALPHA *3("-" 3ALPHA)
// script        = 4ALPHA
// region        = 2ALPHA / 3DIGIT
// variant       = 5*8alphanum / (DIGIT 3alphanum)
// extension     = singleton 1*(2*8alphanum)
// singleton     = DIGIT / [A-WY-Za-wy-z] (any letter/digit except 'x' or 'X')
// privateuse    = "x" 1*(1*8alphanum)
// alphanum      = ALPHA / DIGIT

function matchLanguage(subtags: string[]): { valid: boolean; pos: number } {
  if (subtags.length === 0) return { valid: false, pos: 0 };

  const primary = subtags[0];

  if (/^[a-z]{2,3}$/i.test(primary)) {
    // Could have extlangs
    let pos = 1;
    let extlangCount = 0;
    while (pos < subtags.length && /^[a-z]{3}$/i.test(subtags[pos])) {
      extlangCount++;
      if (extlangCount > 3) return { valid: false, pos: pos };
      pos++;
    }
    return { valid: true, pos };
  } else if (/^[a-z]{4}$/i.test(primary)) {
    // 4-letter language tag
    return { valid: true, pos: 1 };
  } else if (/^[a-z]{5,8}$/i.test(primary)) {
    // 5-8 letter language tag
    return { valid: true, pos: 1 };
  } else {
    return { valid: false, pos: 0 };
  }
}

function matchScript(subtag: string): boolean {
  return /^[a-z]{4}$/i.test(subtag);
}

function matchRegion(subtag: string): boolean {
  return /^[a-z]{2}$/i.test(subtag) || /^[0-9]{3}$/.test(subtag);
}

function matchVariant(subtag: string): boolean {
  return (
    /^[0-9][0-9a-z]{3}$/i.test(subtag) || // digit+3alnum (4 chars total)
    /^[0-9a-z]{5,8}$/i.test(subtag)       // 5-8 alnum
  );
}

function matchSingleton(subtag: string): boolean {
  // single char: digit or letter except 'x'
  return subtag.length === 1 && /^[0-9a-wy-z]$/i.test(subtag);
}

function matchExtensionSubtag(subtag: string): boolean {
  // 2-8 alphanumeric
  return /^[0-9a-z]{2,8}$/i.test(subtag);
}

function matchPrivateUseSubtag(subtag: string): boolean {
  // 1-8 alphanumeric
  return /^[0-9a-z]{1,8}$/i.test(subtag);
}

export function isValidLanguageTag(tag: string): boolean {
  if (typeof tag !== "string" || !tag) return false;

  const subtags = tag.toLowerCase().split("-");
  if (subtags.length === 0) return false;

  // Private use only tag
  if (subtags[0] === 'x') {
    if (subtags.length < 2) return false;
    return subtags.slice(1).every(matchPrivateUseSubtag);
  }

  // Parse language (with optional extlangs)
  const langResult = matchLanguage(subtags);
  if (!langResult.valid) return false;
  let pos = langResult.pos;

  // Optional script
  if (pos < subtags.length && matchScript(subtags[pos])) {
    pos++;
  }

  // Optional region
  if (pos < subtags.length && matchRegion(subtags[pos])) {
    pos++;
  }

  // Variants
  while (pos < subtags.length && matchVariant(subtags[pos])) {
    pos++;
  }

  // Extensions
  while (pos < subtags.length && matchSingleton(subtags[pos])) {
    pos++;
    // must have at least one extension subtag
    if (pos >= subtags.length || !matchExtensionSubtag(subtags[pos])) {
      return false;
    }
    pos++;
    // possibly more extension subtags
    while (pos < subtags.length && matchExtensionSubtag(subtags[pos])) {
      pos++;
    }
  }

  // Optional private use
  if (pos < subtags.length && subtags[pos] === 'x') {
    pos++;
    if (pos >= subtags.length) return false;
    while (pos < subtags.length && matchPrivateUseSubtag(subtags[pos])) {
      pos++;
    }
  }

  return pos === subtags.length;
}
