// Output formatters - Extensions for output formatting beyond core functionality

/**
 * Formats legal document output with enhanced styling
 * This is an extension not present in the original legal-markdown
 */
export function formatLegalDocument(content: string, options: {
  lineSpacing?: 'single' | 'double';
  pageBreaks?: boolean;
  headerStyle?: 'bold' | 'underline' | 'both';
} = {}): string {
  let formatted = content;
  
  if (options.lineSpacing === 'double') {
    formatted = formatted.replace(/\n/g, '\n\n');
  }
  
  if (options.pageBreaks) {
    // Add page breaks before major sections
    formatted = formatted.replace(/^Article \d+\./gm, '\n---PAGE BREAK---\n$&');
  }
  
  return formatted;
}

/**
 * Converts legal document to HTML with legal-specific styling
 */
export function toLegalHTML(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Legal Document</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; }
        .article { margin: 20px 0; }
        .section { margin-left: 20px; }
        .subsection { margin-left: 40px; }
    </style>
</head>
<body>
    <div class="legal-document">
        ${content.replace(/\n/g, '<br>')}
    </div>
</body>
</html>`;
}