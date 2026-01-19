// Fix Next.js 15 async params compatibility
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔧 Fixing Next.js 15 async params...\n');

// Find all route.ts files in api directory
const files = glob.sync('src/app/api/**/route.ts');

let fixedCount = 0;

files.forEach((file) => {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Pattern 0: Fix RouteParams interface - most important!
  // interface RouteParams { params: { id: string } } -> { params: Promise<{ id: string }> }
  const routeParamsInterfaceRegex = /(interface\s+RouteParams\s*\{\s*params:\s*)(\{[^}]+\})(\s*;?\s*\})/g;
  if (content.match(routeParamsInterfaceRegex)) {
    content = content.replace(routeParamsInterfaceRegex, '$1Promise<$2>$3');
    modified = true;
  }

  // Pattern 1: Fix inline params type in function signatures
  // { params: { id: string } } -> { params: Promise<{ id: string }> }
  const paramInterfaceRegex = /(\{\s*params\s*:\s*)(\{[^}]+\})(\s*\})/g;
  if (content.match(paramInterfaceRegex)) {
    content = content.replace(paramInterfaceRegex, '$1Promise<$2>$3');
    modified = true;
  }

  // Pattern 2: Add param destructuring after try block
  // Handle different param names: id, itemId, slug, groupId, provider
  const functionRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\{\s*params\s*\}[^)]*\)\s*\{[\s\n]*try\s*\{/g;
  
  if (content.match(functionRegex)) {
    content = content.replace(functionRegex, (match) => {
      // Extract param name from the function signature
      const paramMatch = match.match(/params\s*:\s*[^{]*\{\s*(\w+)\s*:/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        // Check if destructuring already exists
        if (!match.includes(`const { ${paramName} } = await params`)) {
          return match + `\n    const { ${paramName} } = await params;`;
        }
      }
      return match;
    });
    modified = true;
  }

  // Pattern 3: Replace params.xxx with xxx after destructuring
  // But only if we added destructuring
  if (modified) {
    content = content.replace(/params\.(id|itemId|slug|groupId|provider)(?!\w)/g, '$1');
  }

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n✨ Total files fixed: ${fixedCount}`);
