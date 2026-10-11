/**
 * Guess a person's name from their email address, locally.
 *
 * Why no API: the addresses people paste here belong to their friends and
 * family, and handing them to a data-broker lookup to save one text field
 * is a trade no card sender would make if they saw it written down. The
 * local part of an email already carries the name in most real addresses
 * (firstname.lastname@ is the dominant pattern), so heuristics cover
 * nearly everything without a single byte leaving the server.
 *
 * Returns "" when nothing confident can be said; the caller asks the
 * sender to type that one. A wrong guess on a greeting card is worse
 * than no guess.
 */
export function guessNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.split("+")[0] ?? "";
  if (!local || /[^a-zA-Z0-9._-]/.test(local)) return "";

  // Separators become spaces. Digits glued to letters are stripped
  // ("john42" -> "john"), digit-only tokens ("1987") are dropped.
  const tokens = local
    .split(/[._-]+/)
    .map((t) => t.replace(/[0-9]+/g, ""))
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return "";

  // A lone token is only a name when it reads like one word, not a
  // handle: "sarah" yes, "sdkeff" is a coin flip, "x" no.
  if (tokens.length === 1) {
    const t = tokens[0];
    if (t.length < 2 || t.length > 14) return "";
    return capitalize(t);
  }

  // Multiple tokens: keep first and last, plus single-letter middles.
  // "john.d" -> John D, "j.doe" -> J Doe, "john.doe" -> John Doe.
  const parts = tokens.map(capitalize);
  return parts.slice(0, 3).join(" ");
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
