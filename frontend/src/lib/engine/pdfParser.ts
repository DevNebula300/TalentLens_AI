export async function extractTextFromPdf(
  data: ArrayBuffer | Uint8Array,
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use the package worker so text extraction works in Next.js client bundles.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .filter(Boolean);
    pages.push(strings.join(" "));
  }

  return pages.join("\n");
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return file.text();
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    return extractTextFromPdf(buffer);
  }
  throw new Error("Only PDF and TXT files are supported in the browser demo.");
}
