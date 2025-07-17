#!/usr/bin/env node

/**
 * Build script for creating different distribution packages
 * This script creates multiple ZIP packages for different use cases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Package information
const packageInfo = require('../package.json');
const version = packageInfo.version;

// Create packages directory
const packagesDir = path.join(__dirname, '../packages');
if (!fs.existsSync(packagesDir)) {
    fs.mkdirSync(packagesDir, { recursive: true });
}

console.log('🏗️  Building distribution packages...');

// 1. Build the main project first
console.log('📦 Building main project...');
try {
    execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// 2. Create Web-only package
console.log('🌐 Creating web-only package...');
const webPackageDir = path.join(packagesDir, 'web');
if (fs.existsSync(webPackageDir)) {
    fs.rmSync(webPackageDir, { recursive: true });
}
fs.mkdirSync(webPackageDir, { recursive: true });

// Copy web files
const webFiles = [
    'dist/web',
    'README-WEB.md',
    'LICENSE'
];

// Copy standalone HTML file
const standaloneSrc = path.join(__dirname, '../src/web/standalone.html');
const standaloneDest = path.join(webPackageDir, 'standalone.html');
if (fs.existsSync(standaloneSrc)) {
    fs.copyFileSync(standaloneSrc, standaloneDest);
}

webFiles.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(webPackageDir, path.basename(file));
    
    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
});

// Create web package README
const webReadme = `# Legal Markdown - Web Interface v${version}

Interfaz web independiente para procesar documentos Legal Markdown.

## 🚀 Uso súper rápido (SIN servidor)

1. Extrae este archivo ZIP
2. Abre \`standalone.html\` directamente en tu navegador  
3. ✅ **¡Usa la librería completa!** Todas las funcionalidades excepto PDF

## 🌐 Uso con servidor (funcionalidad completa + PDF)

1. Extrae este archivo ZIP
2. Abre una terminal en la carpeta extraída  
3. Ejecuta: \`python3 -m http.server 8080 --directory web\`
4. Visita: \`http://localhost:8080\`

## 📂 Contenido del paquete

- \`standalone.html\` - **Versión standalone completa** (usa librería real)
- \`web/\` - Interfaz web completa (requiere servidor)
- \`README-WEB.md\` - Documentación detallada
- \`LICENSE\` - Licencia del proyecto

## 🔧 Funcionalidades

### Standalone (standalone.html) - **RECOMENDADO**
✅ **Librería completa** de Legal Markdown  
✅ Procesamiento YAML frontmatter  
✅ Template loops y mixins  
✅ Formateo de headers  
✅ Procesamiento de cláusulas  
✅ Exportación a HTML  
✅ Descarga de resultados  
❌ Generación de PDF (limitación del navegador)  

### Con servidor (web/index.html)
✅ **Todas las funcionalidades**  
✅ Generación de PDF  
✅ Funciones avanzadas  
✅ Procesamiento completo  

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3 (solo para versión con servidor)
- Sin necesidad de Node.js

---
Más información: https://github.com/petalo/legal-markdown-js
`;

fs.writeFileSync(path.join(webPackageDir, 'README.md'), webReadme);

// 3. Create CLI-only package
console.log('⚡ Creating CLI-only package...');
const cliPackageDir = path.join(packagesDir, 'cli');
if (fs.existsSync(cliPackageDir)) {
    fs.rmSync(cliPackageDir, { recursive: true });
}
fs.mkdirSync(cliPackageDir, { recursive: true });

// Copy CLI files
const cliFiles = [
    'dist',
    'package.json',
    'README.md',
    'LICENSE'
];

cliFiles.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(cliPackageDir, file);
    
    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
});

// Remove web files from CLI package
const cliWebDir = path.join(cliPackageDir, 'dist/web');
if (fs.existsSync(cliWebDir)) {
    fs.rmSync(cliWebDir, { recursive: true });
}

// Create CLI package README
const cliReadme = `# Legal Markdown - CLI v${version}

Herramienta de línea de comandos para procesar documentos Legal Markdown.

## Instalación

1. Extrae este archivo ZIP
2. Instala las dependencias: \`npm install --production\`
3. Ejecuta: \`node dist/cli/index.js --help\`

## Uso

\`\`\`bash
# Procesar un archivo
node dist/cli/index.js input.md output.md

# Generar PDF
node dist/cli/index.js input.md --pdf --title "Mi Documento"

# Procesar desde stdin
cat input.md | node dist/cli/index.js --stdin --stdout
\`\`\`

## Requisitos

- Node.js 16+
- npm

---
Más información: https://github.com/petalo/legal-markdown-js
`;

fs.writeFileSync(path.join(cliPackageDir, 'README.md'), cliReadme);

// 4. Create complete package
console.log('📦 Creating complete package...');
const completePackageDir = path.join(packagesDir, 'complete');
if (fs.existsSync(completePackageDir)) {
    fs.rmSync(completePackageDir, { recursive: true });
}
fs.mkdirSync(completePackageDir, { recursive: true });

// Copy all files
const completeFiles = [
    'dist',
    'package.json',
    'README.md',
    'README-WEB.md',
    'LICENSE',
    'examples',
    'docs'
];

completeFiles.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(completePackageDir, file);
    
    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
});

// 5. Create ZIP files
console.log('🗜️  Creating ZIP files...');

const zipFiles = [
    {
        name: `legal-markdown-web-v${version}.zip`,
        dir: 'web',
        description: 'Interfaz web independiente'
    },
    {
        name: `legal-markdown-cli-v${version}.zip`,
        dir: 'cli',
        description: 'Herramienta de línea de comandos'
    },
    {
        name: `legal-markdown-complete-v${version}.zip`,
        dir: 'complete',
        description: 'Paquete completo (CLI + Web + Ejemplos)'
    }
];

zipFiles.forEach(({ name, dir, description }) => {
    const zipPath = path.join(packagesDir, name);
    const dirPath = path.join(packagesDir, dir);
    
    try {
        execSync(`cd "${packagesDir}" && zip -r "${name}" "${dir}/"`, { stdio: 'inherit' });
        const stats = fs.statSync(zipPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ ${name} - ${description} (${sizeMB}MB)`);
    } catch (error) {
        console.error(`❌ Error creating ${name}:`, error.message);
    }
});

// 6. Create release info
console.log('📝 Creating release information...');
const releaseInfo = {
    version: version,
    timestamp: new Date().toISOString(),
    packages: zipFiles.map(({ name, description }) => ({
        name,
        description,
        size: fs.existsSync(path.join(packagesDir, name)) ? 
            fs.statSync(path.join(packagesDir, name)).size : 0
    }))
};

fs.writeFileSync(
    path.join(packagesDir, 'release-info.json'),
    JSON.stringify(releaseInfo, null, 2)
);

// 7. Create release notes template
const releaseNotes = `# Legal Markdown v${version}

## Paquetes de distribución

### 🌐 Web Interface (\`legal-markdown-web-v${version}.zip\`)
**Ideal para usuarios sin conocimientos técnicos**
- Interfaz web completa y fácil de usar
- No requiere Node.js ni instalación
- Funciona directamente en el navegador
- Incluye todas las funcionalidades del CLI

**Uso:**
1. Descargar y extraer el ZIP
2. Abrir terminal en la carpeta extraída
3. Ejecutar: \`python3 -m http.server 8080 --directory web\`
4. Visitar: \`http://localhost:8080\`

### ⚡ CLI Tool (\`legal-markdown-cli-v${version}.zip\`)
**Para desarrolladores y uso en scripts**
- Herramienta de línea de comandos completa
- Ideal para automatización y scripts
- Requiere Node.js

**Uso:**
1. Descargar y extraer el ZIP
2. Ejecutar: \`npm install --production\`
3. Usar: \`node dist/cli/index.js --help\`

### 📦 Complete Package (\`legal-markdown-complete-v${version}.zip\`)
**Para desarrolladores que quieren todo**
- Incluye CLI + Web + Ejemplos + Documentación
- Código fuente compilado
- Ejemplos de uso
- Documentación completa

## Cambios en esta versión

[Agregar aquí los cambios específicos de la versión]

## Instrucciones de instalación

### Opción 1: Paquete Web (Recomendado para usuarios finales)
1. Descargar \`legal-markdown-web-v${version}.zip\`
2. Extraer el archivo
3. Seguir las instrucciones del README incluido

### Opción 2: Paquete CLI (Para desarrolladores)
1. Descargar \`legal-markdown-cli-v${version}.zip\`
2. Extraer el archivo
3. Instalar dependencias: \`npm install --production\`
4. Usar: \`node dist/cli/index.js\`

### Opción 3: Desarrollo desde código fuente
\`\`\`bash
git clone https://github.com/petalo/legal-markdown-js.git
cd legal-markdown-js
npm install
npm run build
npm run web
\`\`\`

## Soporte

- 📖 Documentación: [README.md](https://github.com/petalo/legal-markdown-js)
- 🐛 Reportar bugs: [Issues](https://github.com/petalo/legal-markdown-js/issues)
- 💬 Preguntas: [Discussions](https://github.com/petalo/legal-markdown-js/discussions)
`;

fs.writeFileSync(path.join(packagesDir, 'RELEASE-NOTES.md'), releaseNotes);

console.log('\n🎉 Package creation completed!');
console.log('📁 Check the packages/ directory for:');
console.log('   - ZIP files ready for GitHub release');
console.log('   - release-info.json with package information');
console.log('   - RELEASE-NOTES.md template for release description');

// Helper function to copy directories
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}