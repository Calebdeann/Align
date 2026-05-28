import fs from 'fs';

// Read PNG dimensions from the IHDR chunk (bytes 16-23 of the file).
// Big-endian width then height. Throws if the file is not a valid PNG.
export function readPngDimensions(filepath) {
  const fd = fs.openSync(filepath, 'r');
  try {
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    const sig = buf.toString('hex', 0, 8);
    if (sig !== '89504e470d0a1a0a') {
      throw new Error(`${filepath} is not a PNG`);
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  } finally {
    fs.closeSync(fd);
  }
}
