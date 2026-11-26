const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const root = join(__dirname, '..');
const iconSvg = readFileSync(join(root, 'build', 'icon.svg'), 'utf8');
const previewSvg = readFileSync(join(root, 'docs', 'images', 'workspace-preview.svg'), 'utf8');

function render(svg, width) {
  const options = width ? { fitTo: { mode: 'width', value: width } } : {};
  return Buffer.from(new Resvg(svg, options).render().asPng());
}

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map(size => render(iconSvg, size));
const directorySize = 6 + sizes.length * 16;
const header = Buffer.alloc(directorySize);
header.writeUInt16LE(1, 2); // ICO
header.writeUInt16LE(sizes.length, 4);
let offset = directorySize;
for (let i = 0; i < sizes.length; i++) {
  const entry = 6 + i * 16;
  header.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], entry);
  header.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
}

writeFileSync(join(root, 'build', 'icon.ico'), Buffer.concat([header, ...images]));
writeFileSync(join(root, 'build', 'icon.png'), render(iconSvg, 1024));
writeFileSync(join(root, 'docs', 'images', 'workspace-preview.png'), render(previewSvg));
