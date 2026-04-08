const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public/leaves-extract.svg');
const outPath = path.join(__dirname, 'public/leaves-extract-wabi.svg');

try {
  let content = fs.readFileSync(svgPath, 'utf8');
  console.log("Read SVG.");

  // Replace fill colors with Charcoal Blue
  content = content.replace(/fill="#[A-Fa-f0-9]+"/gi, 'fill="#3a3f4b"');
  console.log("Replaced colors.");

  // Insert SVG filter
  const filterDef = `
<filter id="wabi-sabi-displacement" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
</filter>
<g filter="url(#wabi-sabi-displacement)">
`;

  const pathStart = content.indexOf('<path');
  if (pathStart !== -1) {
    content = content.slice(0, pathStart) + filterDef + content.slice(pathStart);
    
    const svgClose = content.lastIndexOf('</svg>');
    if (svgClose !== -1) {
      content = content.slice(0, svgClose) + '</g>\n' + content.slice(svgClose);
    }
  }
  
  console.log("Added filters.");
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Successfully processed SVG!');
} catch(err) {
  console.error(err);
}
