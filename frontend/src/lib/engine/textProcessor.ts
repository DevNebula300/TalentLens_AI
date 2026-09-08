/**
 * Cleans and normalizes extracted text from documents.
 * Removes excessive whitespace, standardizes line endings, and prepares text for NLP processing.
 */
export function cleanText(text: string): string {
  // normalize line endings to standard Unix format (\n)
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // excessive spaces remover: collapse multiple spaces/tabs into a single space
  text = text.replace(/[ \t]+/g, " ");

  // excessive blank lines remover: reduce 3+ consecutive newlines to exactly 2 newlines (paragraph break)
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
