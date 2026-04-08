const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')].filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css'));

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replace(/text-charcoal/g, 'text-text-main');
  content = content.replace(/bg-charcoal/g, 'bg-text-main');
  content = content.replace(/border-charcoal/g, 'border-text-main');
  content = content.replace(/text-ebony/g, 'text-text-muted');
  content = content.replace(/bg-ebony/g, 'bg-text-muted');
  content = content.replace(/border-ebony/g, 'border-text-muted');
  content = content.replace(/text-mahogany/g, 'text-accent');
  content = content.replace(/bg-mahogany/g, 'bg-accent');
  content = content.replace(/border-mahogany/g, 'border-accent');
  content = content.replace(/text-parchment/g, 'text-background');
  content = content.replace(/bg-parchment/g, 'bg-background');
  content = content.replace(/border-parchment/g, 'border-background');
  content = content.replace(/text-khaki/g, 'text-surface');
  content = content.replace(/bg-khaki/g, 'bg-surface');
  content = content.replace(/border-khaki/g, 'border-surface');

  if (orig !== content) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log("Updated", file);
  }
}
console.log(`Updated ${changedFiles} files with semantic colors.`);
