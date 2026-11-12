import sanitizeHtml from "sanitize-html";

export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi, "$& ");
  return sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
