/**
 * Test para reproducir el problema con comentarios en frontmatter
 */

import { processLegalMarkdown } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontmatter Comments Bug', () => {
  const testDir = path.join(__dirname, 'temp-comment-test');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should not process frontmatter comments as markdown headers', () => {
    // Contenido con comentarios en frontmatter como el que reporta el usuario
    const importContent = `---
# Definición y cálculo del Valor Total de la Transacción (VTT) y la comisión aplicable según la fórmula Modern Lehman.
# short_title: "UNIVERSO-VENDEDOR"
# version: "v.1.0"
# title: "Anexo 1 - VTT"

descuento:
  comercial_porcentaje:
    texto: "cincuenta"
    numero: 0.5
descuento:
  pagos_recurrentes_maximo:
    porcentaje: 0.50
---

Este es el contenido del archivo importado.
`;

    // Escribir el archivo de prueba
    fs.writeFileSync(path.join(testDir, 'anexo-vtt.md'), importContent);

    // Documento principal que importa el archivo con comentarios
    const mainContent = `---
title: "Documento Principal"
version: "1.0"
---

# {{title}}

@import anexo-vtt.md

Fin del documento.
`;

    const result = processLegalMarkdown(mainContent, {
      basePath: testDir,
      noImports: false
    });

    // Log para debugging
    console.log('=== CONTENIDO PROCESADO ===');
    console.log(result.content);

    console.log('=== METADATA RESULTANTE ===');
    console.log(JSON.stringify(result.metadata, null, 2));

    // Verificar si realmente hay comentarios que se procesen mal
    const hasCommentsAsHeaders = result.content.includes('# Definición y cálculo');
    console.log('¿Los comentarios aparecen como headers?', hasCommentsAsHeaders);
    
    // Escribir el resultado a un archivo para debugging
    fs.writeFileSync(path.join(testDir, 'debug-output.md'), result.content);
    fs.writeFileSync(path.join(testDir, 'debug-metadata.json'), JSON.stringify(result.metadata, null, 2));

    // Verificar que los comentarios no aparecen como H1 en el contenido
    expect(result.content).not.toContain('# Definición y cálculo');
    expect(result.content).not.toContain('# short_title:');
    expect(result.content).not.toContain('# version:');
    expect(result.content).not.toContain('# title:');

    // Verificar que el contenido del archivo importado sí está presente
    expect(result.content).toContain('Este es el contenido del archivo importado.');

    // Verificar que los metadatos malformados NO se fusionan (comportamiento correcto)
    // Solo los metadatos del documento principal deben estar presentes
    expect(result.metadata).toEqual({
      _cross_references: [],
      title: 'Documento Principal',
      version: '1.0'
    });
    
    // Los metadatos malformados no deben estar presentes
    expect(result.metadata).not.toHaveProperty('descuento');
  });
});