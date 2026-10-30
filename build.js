const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const css = read('web/styles.css');
let js = [
  'web/campus-data.js',
  'web/backend.js',
  'web/core.js',
  'web/screens.js',
  'web/screens-content.js',
  'web/admin.js',
  'web/campus.js',
  'web/actions.js'
].map(file => '/* ===== ' + file + ' ===== */\n' + read(file)).join('\n\n');

const production = process.argv.includes('--production') || process.env.MET_PRODUCTION_BUNDLE === 'true';
if(production){
  const rosterPattern = /const CSD_STUDENT_ROSTER = \[[\s\S]*?^\];/m;
  if(!rosterPattern.test(js)) throw new Error('build: student roster block not found for production removal');
  js = js.replace(rosterPattern, 'const CSD_STUDENT_ROSTER = [];');
  const portalPattern = /const CAMPUS_PORTALS = \[[\s\S]*?^\];/m;
  if(!portalPattern.test(js)) throw new Error('build: demo portal block not found for production removal');
  js = js.replace(portalPattern, 'const CAMPUS_PORTALS = [];');
  js = js.replace(/student@met\.edu/g, '');
  js = js.replace(/demo-student/g, 'account');
  js = js.replace(/CSD Student Demo/g, 'Campus account');
  js = js.replace(/metcampus/g, 'disabled-demo-credential');
  js = js.replace(/Use\s+with the password disabled-demo-credential for the student demo\./g,
    'Demo sign-in is disabled in this build.');

  const rosterSource = read('web/campus-data.js').match(rosterPattern);
  const rosterEntries = rosterSource
    ? [...rosterSource[0].matchAll(/\['\d+','([^']*)','([^']*)'\]/g)]
    : [];
  const rosterLeak = rosterEntries.some(([, prn, name]) =>
    (prn && js.includes(prn)) || (name && js.includes(name)));
  if(rosterLeak) throw new Error('build: production bundle contains supplied student roster data');
  if(/student@met\.edu|demo-student|CSD Student Demo|\bmetcampus\b/.test(js)) {
    throw new Error('build: production bundle contains a demo account identity or credential');
  }
}

let html = read('index.html');

const styleTag = '<link rel="stylesheet" href="./web/styles.css">';
if(html.indexOf(styleTag) < 0) throw new Error('build: stylesheet link not found in index.html');
html = html.replace(styleTag, '<style>\n' + css + '\n</style>');

html = html.replace(/[ \t]*<script src="\.\/web\/[^"]+"><\/script>\r?\n?/g, '');
if(html.indexOf('</body>') < 0) throw new Error('build: </body> not found in index.html');

const safeJs = js.replace(/<\/script/gi, '<\\/script');
html = html.replace('</body>', '<script>\n' + safeJs + '\n</script>\n</body>');

const out = '// Auto-generated from index.html + web/* (run: node build.js)\n' +
  'export default ' + JSON.stringify(html) + ';\n';
fs.writeFileSync(path.join(root, 'html.js'), out);
console.log('Built html.js (' + Math.round(out.length / 1024) + ' KB)' + (production ? ' without bundled roster or demo portals' : ''));
