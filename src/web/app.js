/**
 * Legal Markdown Playground Application
 * Main application logic for the web playground interface
 */

class LegalMarkdownApp {
  constructor() {
    this.processedResult = null;
    this.metadataResult = null;
    this.theme = localStorage.getItem('theme') || 'light';
    this.customCSS = '';
    this.baseStylesEnabled = true; // Track base styles state
    this.initializeTheme();
    this.initializeElements();
    this.bindEvents();
    this.initializePreviewResizer();
    this.updateBaseStyles(); // Initialize base styles
    this.loadExample('demo-contract'); // Load the demo contract by default (matches examples/input)
    this.loadCSSExample('default'); // Load default CSS by default
  }

  initializeTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  initializeElements() {
    this.editor = document.querySelector('.editor');
    this.preview = document.querySelector('.preview-container');
    this.markdownPreview = document.querySelector('.markdown-preview .preview-content');
    this.htmlPreview = document.querySelector('.html-preview .preview-content');
    this.processBtn = document.querySelector('.process-btn');
    this.toggleStylesBtn = document.querySelector('.toggle-styles-btn');
    this.downloadBtn = document.querySelector('.download-btn');
    this.downloadPdfBtn = document.querySelector('.download-pdf-btn');
    this.printBtn = document.querySelector('.print-btn');
    this.themeToggle = document.querySelector('.theme-toggle');
    this.optionsToggle = document.querySelector('.options-toggle');
    this.optionsContent = document.querySelector('.options-content');
    this.fileInput = document.querySelector('.file-input');
    this.exampleSelect = document.querySelector('.example-select');
    this.messageArea = document.getElementById('messageArea');

    // CSS Editor elements
    this.cssReset = document.querySelector('.css-reset');
    this.cssContent = document.querySelector('.css-content');
    this.cssEditor = document.querySelector('.css-editor');
    this.cssFileInput = document.querySelector('.css-file-input');
    this.cssExampleSelect = document.querySelector('.css-example-select');

    // Column resizers
    this.resizer1 = document.getElementById('resizer1');
    this.resizer2 = document.getElementById('resizer2');
    this.previewResizer = document.querySelector('.preview-resize-handle');
  }

  bindEvents() {
    this.processBtn.addEventListener('click', () => this.processContent());
    this.toggleStylesBtn.addEventListener('click', () => this.toggleBaseStyles());
    this.downloadBtn.addEventListener('click', () => this.downloadDocument());
    this.downloadPdfBtn.addEventListener('click', () => this.downloadPDF());
    this.printBtn.addEventListener('click', () => this.printDocument());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.optionsToggle.addEventListener('click', () => this.toggleOptions());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.exampleSelect.addEventListener('change', (e) => this.loadExample(e.target.value));

    // CSS Editor events
    this.cssReset.addEventListener('click', () => this.resetCSS());
    this.cssFileInput.addEventListener('change', (e) => this.handleCSSFileUpload(e));
    this.cssExampleSelect.addEventListener('change', (e) => this.loadCSSExample(e.target.value));

    // Auto-apply CSS on input (debounced)
    this.cssEditor.addEventListener('input',
      this.debounce(() => this.applyCSS(), 500)
    );

    // Column resizing
    this.initColumnResizing();

    // Help button
    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showHelp());
    }

    // Copy buttons
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.copyContent(e.target.dataset.target));
    });

    // Auto-process on input (debounced)
    this.editor.addEventListener('input',
      this.debounce(() => this.processContent(), 1000)
    );

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  async processContent() {
    const content = this.editor.value;
    if (!content.trim()) {
      this.showMessage('Please enter some content to process.', 'error');
      this.clearPreview();
      return;
    }

    // Validate content structure
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      this.showMessage(validation.message, 'warning');
      if (validation.severity === 'error') {
        this.clearPreview();
        return;
      }
    }

    try {
      this.showProcessing();

      const options = this.getProcessingOptions();

      // Log input and options to console
      console.group('🔄 Processing Legal Markdown');
      console.log('📝 Input:', content);
      console.log('⚙️  Options:', options);

      const result = await window.LegalMarkdown.processLegalMarkdownWithRemark(content, options);

      this.processedResult = result.content;
      this.metadataResult = result.metadata;

      // Log output to console
      console.log('✅ Output:', result.content);
      console.log('📊 Metadata:', result.metadata);
      console.log('📈 Stats:', result.stats);
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️  Warnings:', result.warnings);
      }
      console.groupEnd();

      this.displayResult(result);
      this.showProcessingStats(result);

    } catch (error) {
      console.error('Processing error:', error);
      this.handleProcessingError(error);
    } finally {
      this.hideProcessing();
    }
  }

  getProcessingOptions() {
    // Match CLI options exactly (see src/cli/service.ts line 180)
    return {
      basePath: '.', // Default base path for web playground
      enableFieldTracking: document.getElementById('enableFieldTracking').checked,
      debug: document.getElementById('debug').checked,
      yamlOnly: document.getElementById('yamlOnly').checked,
      noHeaders: document.getElementById('noHeaders').checked,
      noClauses: document.getElementById('noClauses').checked,
      noReferences: document.getElementById('noReferences').checked,
      noImports: document.getElementById('noImports').checked,
      noMixins: document.getElementById('noMixins').checked,
      noReset: document.getElementById('noReset').checked,
      noIndent: document.getElementById('noIndent').checked,
      throwOnYamlError: document.getElementById('throwOnYamlError').checked,
      exportMetadata: document.getElementById('exportYaml').checked || document.getElementById('exportJson').checked,
      exportFormat: document.getElementById('exportYaml').checked ? 'yaml' : 'json',
      exportPath: undefined // Not applicable in browser
    };
  }

  displayResult(result) {
    // Display raw markdown output
    this.markdownPreview.innerHTML = `
                <div class="legal-document">
                    <pre style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 13px; line-height: 1.4; margin: 0; padding: 0;">${result.content}</pre>
                </div>
            `;

    // Display HTML-formatted output
    this.htmlPreview.innerHTML = `
                <div class="legal-document">
                    ${this.formatMarkdownForDisplay(result.content)}
                </div>
            `;

    // Apply base styles if enabled
    this.updateBaseStyles();
    // Apply custom CSS if present
    this.updatePreviewWithCSS();

    if (result.fieldReport) {
      console.log('Field Report:', result.fieldReport);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  copyContent(target) {
    if (!this.processedResult) {
      this.showMessage('No content to copy. Please process a document first.', 'error');
      return;
    }

    let textToCopy = '';
    if (target === 'markdown') {
      textToCopy = this.processedResult;
    } else if (target === 'html') {
      textToCopy = this.formatMarkdownForDisplay(this.processedResult);
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showMessage(`${target.toUpperCase()} copied to clipboard!`, 'success');
      }).catch(err => {
        this.showMessage(`Failed to copy ${target}`, 'error');
        console.error('Copy failed:', err);
      });
    }
  }

  formatMarkdownForDisplay(content) {
    // Simple markdown to HTML conversion without external dependencies
    // This is a basic implementation focused on legal document structure
    try {
      let html = content
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        // Code blocks
        .replace(/```([^`]*)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]*)`/g, '<code>$1</code>');

      // Wrap paragraphs
      if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
      }

      return html;
    } catch (error) {
      console.error('Simple markdown parsing failed:', error);
      return `<pre>${this.escapeHtml(content)}</pre>`;
    }
  }



  downloadDocument() {
    if (!this.processedResult) {
      this.showMessage('Please process a document first.', 'error');
      return;
    }

    const title = document.getElementById('title').value || 'legal-document';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    this.downloadFile(this.processedResult, filename);
  }

  printDocument() {
    if (!this.processedResult) {
      this.showMessage('Please process a document first.', 'error');
      return;
    }

    const printContent = this.preview.innerHTML;
    const title = document.getElementById('title').value || 'Legal Document';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        ${this.getContractCSS()}
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    ${printContent}
                </body>
                </html>
            `);
    printWindow.document.close();
  }

  async downloadPDF() {
    if (!this.processedResult) {
      this.showMessage('Please process a document first.', 'error');
      return;
    }

    const title = document.getElementById('title').value || 'legal-document';
    const printContent = this.preview.innerHTML;

    try {
      // Show loading message
      this.showMessage('Generating PDF... Please wait.', 'info');

      // Create a hidden iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      iframe.contentDocument.open();
      iframe.contentDocument.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            ${this.getContractCSS()}
                            @media print {
                                body { margin: 0; }
                                @page { margin: 15mm; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                    </html>
                `);
      iframe.contentDocument.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Focus the iframe and trigger print
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(iframe);
        this.showMessage('PDF generation initiated. Use your browser\'s print dialog to save as PDF.', 'success');
      }, 1000);

    } catch (error) {
      console.error('PDF generation error:', error);
      this.showMessage('PDF generation failed. Please use the Print button instead.', 'error');
    }
  }

  getContractCSS() {
    const baseCSS = `
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.3;
                    color: #333;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20mm 15mm;
                    background-color: white;
                }

                h1 {
                    color: #353954;
                    font-size: 1.6em;
                    line-height: 1.5em;
                    margin: 8px 8px 32px;
                    text-align: center;
                    border-bottom: solid #02370a;
                    padding: 0 5% 0.3em;
                }

                h2 {
                    font-size: 14pt;
                    margin-top: 20px;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #41badf;
                }

                h3 {
                    font-size: 10pt;
                    font-weight: bold;
                    border-bottom: 1px solid #41badf;
                    margin-top: 30px;
                    margin-bottom: 8px;
                }

                p {
                    margin-bottom: 15px;
                    text-align: justify;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 20mm 10mm 10mm 10mm;
                    }

                    body {
                        font-size: 11pt;
                        color: black;
                    }
                }
            `;

    // Add custom CSS if present
    if (this.customCSS.trim()) {
      return baseCSS + '\n\n/* Custom CSS */\n' + this.customCSS;
    }

    return baseCSS;
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.initializeTheme();
  }

  toggleOptions() {
    this.optionsContent.classList.toggle('open');
    this.optionsToggle.textContent = this.optionsContent.classList.contains('open') ?
      '🔽 Processing Options' :
      '⚙️ Processing Options';
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', ''];
    const allowedExtensions = ['.md', '.txt', '.markdown'];

    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      this.showMessage('Please select a valid text file (.md, .txt, .markdown)', 'error');
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      this.showMessage('File too large. Maximum size is 1MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        this.editor.value = content;
        this.exampleSelect.value = ''; // Clear example selection
        this.processContent();
        this.showMessage(`📁 File "${file.name}" loaded successfully`, 'success');
      } catch (error) {
        this.showMessage('Error reading file: ' + error.message, 'error');
      }
    };

    reader.onerror = () => {
      this.showMessage('Error reading file. Please try again.', 'error');
    };

    reader.readAsText(file);
  }

  getExamples() {
    return window.LegalMarkdownExamples || {};
  }

  loadExample(exampleKey) {
    if (!exampleKey) return;

    const examples = this.getExamples();
    const example = examples[exampleKey];

    if (example) {
      this.editor.value = example.content;
      this.exampleSelect.value = exampleKey;
      this.processContent();
    } else {
      this.showMessage('Example not found.', 'error');
    }
  }

  validateContent(content) {
    const validation = {
      isValid: true,
      message: '',
      severity: 'info'
    };

    // Check for YAML front matter
    const hasYamlFrontMatter = content.trim().startsWith('---');
    if (!hasYamlFrontMatter) {
      validation.isValid = false;
      validation.message = 'No YAML front matter detected. Consider adding document metadata with ---';
      validation.severity = 'warning';
      return validation;
    }

    // Check for balanced YAML front matter
    const yamlMatches = content.match(/^---\s*\n([\s\S]*?)\n---\s*$/m);
    if (!yamlMatches) {
      validation.isValid = false;
      validation.message = 'YAML front matter is not properly formatted. Ensure it starts and ends with ---';
      validation.severity = 'error';
      return validation;
    }

    // Check for common YAML errors
    const yamlContent = yamlMatches[1];
    if (yamlContent.includes('\t')) {
      validation.isValid = false;
      validation.message = 'YAML contains tabs. Use spaces for indentation instead.';
      validation.severity = 'error';
      return validation;
    }

    // Check for template variables
    const templateVars = content.match(/\{\{([^}]+)\}\}/g);
    if (templateVars) {
      const uniqueVars = [...new Set(templateVars.map(v => v.replace(/[{}]/g, '').trim()))];
      if (uniqueVars.length > 10) {
        validation.isValid = false;
        validation.message = `Document contains ${uniqueVars.length} template variables. Consider breaking into sections.`;
        validation.severity = 'warning';
      }
    }

    // Check for unbalanced brackets
    const openBrackets = (content.match(/\{\{/g) || []).length;
    const closeBrackets = (content.match(/\}\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      validation.isValid = false;
      validation.message = `Unbalanced template brackets: ${openBrackets} opening, ${closeBrackets} closing`;
      validation.severity = 'error';
      return validation;
    }

    return validation;
  }

  handleProcessingError(error) {
    let userMessage = 'Error processing document: ';
    let suggestions = [];

    if (error.message.includes('YAML')) {
      userMessage += 'YAML parsing error. ';
      suggestions.push('Check your YAML syntax in the front matter');
      suggestions.push('Ensure proper indentation with spaces, not tabs');
      suggestions.push('Verify all YAML keys have values');
    } else if (error.message.includes('template')) {
      userMessage += 'Template processing error. ';
      suggestions.push('Check that all variables are defined in YAML front matter');
      suggestions.push('Verify template syntax: {{variable}}');
    } else if (error.message.includes('reference')) {
      userMessage += 'Reference processing error. ';
      suggestions.push('Check reference syntax and file paths');
    } else {
      userMessage += error.message;
    }

    if (suggestions.length > 0) {
      userMessage += '\n\nSuggestions:\n• ' + suggestions.join('\n• ');
    }

    this.showMessage(userMessage, 'error');
    this.clearPreview();
  }

  showProcessingStats(result) {
    let stats = [];

    if (result.metadata) {
      const yamlKeys = Object.keys(result.metadata).length;
      stats.push(`${yamlKeys} YAML variables`);
    }

    if (result.fieldReport && Array.isArray(result.fieldReport)) {
      stats.push(`${result.fieldReport.length} field substitutions`);
    }

    const wordCount = result.content.split(/\s+/).filter(word => word.length > 0).length;
    stats.push(`${wordCount} words`);

    if (stats.length > 0) {
      this.showMessage(`✅ Processing complete: ${stats.join(', ')}`, 'success');
    } else {
      this.showMessage('Document processed successfully!', 'success');
    }
  }

  clearPreview() {
    this.markdownPreview.innerHTML = `
                <div class="preview-placeholder">
                    <p>👈 Enter your Legal Markdown content and click Process to see the result</p>
                </div>
            `;
    this.htmlPreview.innerHTML = `
                <div class="preview-placeholder">
                    <p>👈 Enter your Legal Markdown content and click Process to see the result</p>
                </div>
            `;
  }

  showHelp() {
    const helpContent = `📖 Legal Markdown Help

🚀 Quick Start:
• Select an example from the dropdown to get started
• Or write your own content with YAML front matter
• Use {{variable}} syntax for template substitutions

📝 Document Structure:
---
title: Your Document Title
variable: value
---

# {{title}}

Your content with {{variable}} substitutions...

⌨️ Keyboard Shortcuts:
• Ctrl+Enter: Process document
• Ctrl+P: Print document
• Ctrl+S: Download Markdown
• Ctrl+D: Download PDF

🔧 Processing Options:
• Field Tracking: Highlight variable substitutions
• Debug Mode: Show detailed processing information
• Export Options: Save metadata as YAML or JSON

💡 Tips:
• Use proper YAML indentation (spaces, not tabs)
• Check template brackets are balanced {{}}
• Use legal numbering: l., ll., lll. for sections`;

    this.showMessage(helpContent, 'info');
  }

  handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          this.processContent();
          break;
        case 'p':
          event.preventDefault();
          this.printDocument();
          break;
        case 's':
          event.preventDefault();
          this.downloadDocument();
          break;
        case 'd':
          event.preventDefault();
          this.downloadPDF();
          break;
      }
    }
  }

  showProcessing() {
    this.processBtn.disabled = true;
    this.processBtn.textContent = '⏳ Processing...';
    this.preview.classList.add('loading');
  }

  hideProcessing() {
    this.processBtn.disabled = false;
    this.processBtn.textContent = '▶️ Process';
    this.preview.classList.remove('loading');
  }

  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    // Handle multi-line messages
    if (message.includes('\n')) {
      const lines = message.split('\n');
      const mainMessage = lines[0];
      const details = lines.slice(1).join('\n');

      messageDiv.innerHTML = `
                    <div class="message-main">${this.escapeHtml(mainMessage)}</div>
                    <div class="message-details">${this.escapeHtml(details)}</div>
                `;
    } else {
      messageDiv.textContent = message;
    }

    this.messageArea.innerHTML = '';
    this.messageArea.appendChild(messageDiv);

    // Auto-hide success messages, keep errors/warnings visible longer
    const hideDelay = type === 'success' ? 3000 : 8000;
    setTimeout(() => {
      if (this.messageArea.contains(messageDiv)) {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
          if (this.messageArea.contains(messageDiv)) {
            this.messageArea.removeChild(messageDiv);
          }
        }, 300);
      }
    }, hideDelay);
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  toggleCSSEditor() {
    const isVisible = this.cssContent.style.display !== 'none';

    if (isVisible) {
      // Hide CSS editor
      this.cssContent.style.display = 'none';
      this.cssReset.style.display = 'none';
      this.cssApply.style.display = 'none';
      this.cssToggle.textContent = '📝 Edit CSS';
    } else {
      // Show CSS editor
      this.cssContent.style.display = 'block';
      this.cssReset.style.display = 'inline-block';
      this.cssApply.style.display = 'inline-block';
      this.cssToggle.textContent = '🔽 Hide CSS';
    }
  }

  resetCSS() {
    this.cssEditor.value = '';
    this.customCSS = '';
    this.applyCSS();
    this.showMessage('CSS reset successfully', 'success');
  }

  applyCSS() {
    this.customCSS = this.cssEditor.value;
    this.updatePreviewWithCSS();
    // No mostrar mensaje en auto-apply para evitar spam
  }

  handleCSSFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.css')) {
      this.showMessage('Please select a valid CSS file (.css)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        this.cssEditor.value = content;
        this.cssExampleSelect.value = '';
        this.applyCSS();
        this.showMessage(`📁 CSS file "${file.name}" loaded successfully`, 'success');
      } catch (error) {
        this.showMessage('Error reading CSS file: ' + error.message, 'error');
      }
    };

    reader.onerror = () => {
      this.showMessage('Error reading CSS file. Please try again.', 'error');
    };

    reader.readAsText(file);
  }

  getCSSExamples() {
    return window.LegalMarkdownCSSExamples || {};
  }

  loadCSSExample(exampleKey) {
    if (!exampleKey) return;

    const examples = this.getCSSExamples();
    const example = examples[exampleKey];

    if (example) {
      this.cssEditor.value = example;
      this.cssExampleSelect.value = exampleKey;
      this.applyCSS();
      this.showMessage(`🎨 CSS example "${exampleKey}" loaded`, 'success');
    } else {
      this.showMessage('CSS example not found.', 'error');
    }
  }

  initColumnResizing() {
    const container = document.querySelector('.editor-container');
    let isResizing = false;
    let currentResizer = null;
    let startX = 0;
    let startWidths = [1, 1, 1]; // Start with equal widths

    const resizers = [this.resizer1, this.resizer2];

    resizers.forEach((resizer, index) => {
      if (!resizer) return;

      resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        currentResizer = resizer;
        startX = e.clientX;

        // Parse current fr values from the style
        const currentStyle = container.style.gridTemplateColumns;
        if (currentStyle && currentStyle.includes('fr')) {
          const matches = currentStyle.match(/(\d*\.?\d+)fr/g);
          if (matches && matches.length === 3) {
            startWidths = matches.map(match => parseFloat(match.replace('fr', '')));
          }
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
      });
    });

    const handleMouseMove = (e) => {
      if (!isResizing || !currentResizer) return;

      const deltaX = e.clientX - startX;
      const containerWidth = container.offsetWidth;
      // Convert pixels to fraction units (balanced sensitivity)
      const deltaFraction = (deltaX / containerWidth) * 4;

      let newWidths = [...startWidths];
      const minWidth = 0.3; // Minimum 30% width

      if (currentResizer === this.resizer1) {
        // Resizing between columns 1 and 2
        newWidths[0] = Math.max(minWidth, startWidths[0] + deltaFraction);
        newWidths[1] = Math.max(minWidth, startWidths[1] - deltaFraction);
      } else if (currentResizer === this.resizer2) {
        // Resizing between columns 2 and 3
        newWidths[1] = Math.max(minWidth, startWidths[1] + deltaFraction);
        newWidths[2] = Math.max(minWidth, startWidths[2] - deltaFraction);
      }

      // Apply the new column widths
      container.style.gridTemplateColumns = `${newWidths[0]}fr 4px ${newWidths[1]}fr 4px ${newWidths[2]}fr`;
    };

    const handleMouseUp = () => {
      isResizing = false;
      currentResizer = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  initializePreviewResizer() {
    if (!this.previewResizer) return;

    let isResizing = false;
    let startY = 0;
    let startHeights = [];

    this.previewResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;

      const markdownBlock = document.querySelector('.markdown-preview');
      const htmlBlock = document.querySelector('.html-preview');

      if (markdownBlock && htmlBlock) {
        const markdownHeight = markdownBlock.offsetHeight;
        const htmlHeight = htmlBlock.offsetHeight;
        const totalHeight = markdownHeight + htmlHeight;

        // Store as percentages
        startHeights = [
          (markdownHeight / totalHeight) * 100,
          (htmlHeight / totalHeight) * 100
        ];
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const container = document.querySelector('.preview-split');
      const containerHeight = container.offsetHeight;

      // Convert pixels to percentage (balanced sensitivity)
      const deltaPercent = (deltaY / containerHeight) * 100;

      let newHeights = [...startHeights];
      const minHeight = 20; // Minimum 20% height

      // Adjust heights
      newHeights[0] = Math.max(minHeight, Math.min(80, startHeights[0] + deltaPercent));
      newHeights[1] = Math.max(minHeight, Math.min(80, startHeights[1] - deltaPercent));

      // Apply new heights
      const markdownBlock = document.querySelector('.markdown-preview');
      const htmlBlock = document.querySelector('.html-preview');

      if (markdownBlock && htmlBlock) {
        markdownBlock.style.flex = `0 0 ${newHeights[0]}%`;
        htmlBlock.style.flex = `0 0 ${newHeights[1]}%`;
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  updatePreviewWithCSS() {
    // Remove existing custom style tag if it exists
    const existingStyle = document.getElementById('customCSS');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS if provided
    if (this.customCSS.trim()) {
      const styleTag = document.createElement('style');
      styleTag.id = 'customCSS';
      styleTag.textContent = `
                    .preview-container {
                        ${this.customCSS}
                    }
                `;
      document.head.appendChild(styleTag);
    }
  }

  toggleBaseStyles() {
    this.baseStylesEnabled = !this.baseStylesEnabled;
    this.updateBaseStyles();

    // Update button appearance
    this.toggleStylesBtn.style.opacity = this.baseStylesEnabled ? '1' : '0.5';
    this.toggleStylesBtn.title = this.baseStylesEnabled ?
      'Disable base styles' : 'Enable base styles';

    this.showMessage(
      this.baseStylesEnabled ? 'Base styles enabled' : 'Base styles disabled',
      'info'
    );
  }

  updateBaseStyles() {
    if (this.baseStylesEnabled) {
      this.preview.classList.add('styled-preview');
    } else {
      this.preview.classList.remove('styled-preview');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LegalMarkdownApp();
});
