// Read dimensions without decoding pixels so browser and server share the input budget.
const maxPicturePixels = 24_000_000;
function withinPictureBudget(uri) {
  try {
    const [header, encoded] = uri.split(",");
    const bytes = Uint8Array.from(atob(encoded), (value) =>
      value.charCodeAt(0),
    );
    const view = new DataView(bytes.buffer);
    const text = (offset, length) =>
      String.fromCharCode(...bytes.slice(offset, offset + length));
    const allowed = (width, height) =>
      width > 0 && height > 0 && width * height <= maxPicturePixels;
    if (
      header.includes("png") &&
      text(1, 3) === "PNG" &&
      text(12, 4) === "IHDR"
    )
      return allowed(view.getUint32(16), view.getUint32(20));
    if (
      header.includes("webp") &&
      text(0, 4) === "RIFF" &&
      text(8, 4) === "WEBP"
    ) {
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const kind = text(offset, 4),
          size = view.getUint32(offset + 4, true),
          data = offset + 8;
        if (data + size > bytes.length) return false;
        const uint24 = (at) =>
          bytes[at] + bytes[at + 1] * 256 + bytes[at + 2] * 65536;
        if (kind === "VP8X" && size >= 10)
          return allowed(1 + uint24(data + 4), 1 + uint24(data + 7));
        if (kind === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
          const bits = view.getUint32(data + 1, true);
          return allowed(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
        }
        if (
          kind === "VP8 " &&
          size >= 10 &&
          text(data + 3, 3) === "\x9d\x01\x2a"
        )
          return allowed(
            view.getUint16(data + 6, true) & 0x3fff,
            view.getUint16(data + 8, true) & 0x3fff,
          );
        offset = data + size + (size % 2);
      }
    }
    if (header.includes("jpeg") && bytes[0] === 255 && bytes[1] === 216) {
      for (let offset = 2; offset + 3 < bytes.length;) {
        if (bytes[offset++] !== 255) return false;
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda || marker === 0xd9) return false;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        const size = view.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) return false;
        if (
          [
            0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
            0xce, 0xcf,
          ].includes(marker) &&
          size >= 7
        )
          return allowed(
            view.getUint16(offset + 5),
            view.getUint16(offset + 3),
          );
        offset += size;
      }
    }
  } catch {
    return false;
  }
  return false;
}
module.exports = { maxPicturePixels, withinPictureBudget };
