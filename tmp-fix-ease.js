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
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const targetDir = "d:\\Kuliah\\Bahan Kuliah\\Matkul\\Vscode\\financial-app\\frontend\\src\\app\\(app)";
const files = walk(targetDir);
let changedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('ease: [0.16, 1, 0.3, 1]')) {
    const newContent = content.replace(/ease:\s*\[0\.16,\s*1,\s*0\.3,\s*1\]/g, "ease: 'easeOut'");
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating ${changedFiles} files.`);
