#!/usr/bin/env node

/**
 * CSS Modules Converter Script (Fixed Version)
 * Helps automate the conversion from regular CSS to CSS Modules
 * 
 * Usage: node css-modules-converter-fixed.js <component-name>
 * Example: node css-modules-converter-fixed.js InvoiceManagement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to convert kebab-case to camelCase
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Function to extract class names from CSS file
function extractClassNames(cssContent) {
  const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const classes = new Set();
  let match;
  
  while ((match = classRegex.exec(cssContent)) !== null) {
    // Skip pseudo-classes and element selectors
    if (!match[1].includes(':') && !match[1].match(/^[a-z]+$/)) {
      classes.add(match[1]);
    }
  }
  
  return Array.from(classes);
}

// Function to convert CSS class names to camelCase
function convertClassNamesToCamelCase(cssContent, classNames) {
  let convertedContent = cssContent;
  
  classNames.forEach(className => {
    const camelCaseClassName = kebabToCamelCase(className);
    if (className !== camelCaseClassName) {
      // Replace class definitions (more precise regex)
      const classDefRegex = new RegExp(`\\.${className.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?![a-zA-Z0-9_-])`, 'g');
      convertedContent = convertedContent.replace(classDefRegex, `.${camelCaseClassName}`);
    }
  });
  
  return convertedContent;
}

// Function to generate class name mapping
function generateClassNameMapping(classNames) {
  const mapping = {};
  classNames.forEach(className => {
    const camelCaseClassName = kebabToCamelCase(className);
    if (className !== camelCaseClassName) {
      mapping[className] = camelCaseClassName;
    }
  });
  return mapping;
}

// Function to update TSX file with CSS Modules syntax
function updateTsxFile(tsxPath, cssModulePath, classMapping) {
  if (!fs.existsSync(tsxPath)) {
    console.log(`TSX file not found: ${tsxPath}`);
    return;
  }
  
  let tsxContent = fs.readFileSync(tsxPath, 'utf8');
  const moduleName = path.basename(cssModulePath, '.module.css');
  
  // Update import statement - look for CSS imports
  const cssImportRegex = /import\s+['"]\.\/[^'"]*\.css['"];?\s*/g;
  if (cssImportRegex.test(tsxContent)) {
    tsxContent = tsxContent.replace(cssImportRegex, `import styles from './${moduleName}.module.css';\n`);
  } else {
    // Add import at the top if no CSS import found
    const importMatch = tsxContent.match(/^(import[^;]+;[\s\S]*?)(\n\n|$)/);
    if (importMatch) {
      tsxContent = tsxContent.replace(importMatch[0], `${importMatch[1]}\nimport styles from './${moduleName}.module.css';\n\n`);
    }
  }
  
  // Update className references - simple cases first
  Object.entries(classMapping).forEach(([kebabCase, camelCase]) => {
    // Simple className="class-name"
    const simpleRegex = new RegExp(`className=['"]${kebabCase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]`, 'g');
    tsxContent = tsxContent.replace(simpleRegex, `className={styles.${camelCase}}`);
    
    // className="class-name other-class"
    const multipleRegex = new RegExp(`className=['"]([^'"]*\\s+)?${kebabCase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s+[^'"]*)?['"]`, 'g');
    tsxContent = tsxContent.replace(multipleRegex, (match) => {
      // Extract all classes from the match
      const classesMatch = match.match(/className=['"]([^'"]+)['"]$/);
      if (classesMatch) {
        const allClasses = classesMatch[1].split(/\s+/).filter(c => c.length > 0);
        const styleRefs = allClasses.map(cls => {
          const camelCls = kebabToCamelCase(cls);
          return `styles.${camelCls}`;
        });
        
        if (styleRefs.length === 1) {
          return `className={${styleRefs[0]}}`;
        } else {
          return `className={\`${styleRefs.join(' ')}\`}`;
        }
      }
      return match;
    });
  });
  
  fs.writeFileSync(tsxPath, tsxContent);
  console.log(`✅ Updated TSX file: ${tsxPath}`);
}

// Main conversion function
function convertComponent(componentName) {
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  const cssPath = path.join(componentsDir, `${componentName}.css`);
  const tsxPath = path.join(componentsDir, `${componentName}.tsx`);
  const cssModulePath = path.join(componentsDir, `${componentName}.module.css`);
  
  console.log(`🔄 Converting ${componentName} to CSS Modules...`);
  
  // Check if CSS file exists
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ CSS file not found: ${cssPath}`);
    return;
  }
  
  // Read CSS content
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Extract class names
  const classNames = extractClassNames(cssContent);
  console.log(`📋 Found ${classNames.length} class names in ${componentName}.css`);
  
  if (classNames.length === 0) {
    console.log('⚠️  No class names found to convert');
    return;
  }
  
  // Convert CSS content
  const convertedCssContent = convertClassNamesToCamelCase(cssContent, classNames);
  
  // Generate class name mapping for TSX updates
  const classMapping = generateClassNameMapping(classNames);
  
  // Write CSS Module file
  fs.writeFileSync(cssModulePath, convertedCssContent);
  console.log(`✅ Created CSS Module: ${cssModulePath}`);
  
  // Update TSX file
  updateTsxFile(tsxPath, cssModulePath, classMapping);
  
  // Generate mapping report
  if (Object.keys(classMapping).length > 0) {
    console.log('\n📝 Class Name Mapping:');
    Object.entries(classMapping).forEach(([kebabCase, camelCase]) => {
      console.log(`   ${kebabCase} → ${camelCase}`);
    });
  }
  
  // Backup original CSS file
  const backupPath = `${cssPath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(cssPath, backupPath);
    console.log(`💾 Original CSS backed up to: ${backupPath}`);
  }
  
  console.log(`\n🎉 Conversion complete for ${componentName}!`);
  console.log('📝 Please review the changes and test your component.');
  console.log('⚠️  You may need to manually fix complex className expressions.');
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node css-modules-converter-fixed.js <component-name>');
    console.log('Example: node css-modules-converter-fixed.js InvoiceManagement');
    console.log('\nAvailable components to convert:');
    
    const componentsDir = path.join(process.cwd(), 'src', 'components');
    if (fs.existsSync(componentsDir)) {
      const cssFiles = fs.readdirSync(componentsDir)
        .filter(file => file.endsWith('.css') && !file.endsWith('.module.css'))
        .map(file => file.replace('.css', ''));
      
      cssFiles.forEach(component => console.log(`  - ${component}`));
    }
    return;
  }
  
  const componentName = args[0];
  convertComponent(componentName);
}

// Run the script
main();