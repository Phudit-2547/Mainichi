export type ZipTextFile = {
  path: string;
  content: string;
  modifiedAt?: Date;
};

const encoder = new TextEncoder();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    date: ((year - 1980) << 9) | (month << 5) | day,
    time: (hours << 11) | (minutes << 5) | seconds,
  };
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function view(size: number): { bytes: Uint8Array; data: DataView } {
  const bytes = new Uint8Array(size);
  return { bytes, data: new DataView(bytes.buffer) };
}

export function createStoredZip(files: ZipTextFile[]): Uint8Array {
  if (files.length > 0xffff) {
    throw new Error("ZIP export supports at most 65,535 files");
  }

  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.path);
    const body = encoder.encode(file.content);
    const checksum = crc32(body);
    const stamp = dosDateTime(file.modifiedAt ?? new Date());

    if (name.byteLength > 0xffff || body.byteLength > 0xffffffff) {
      throw new Error(`File is too large for ZIP32: ${file.path}`);
    }

    const local = view(30);
    local.data.setUint32(0, 0x04034b50, true);
    local.data.setUint16(4, 20, true);
    local.data.setUint16(6, 0x0800, true);
    local.data.setUint16(8, 0, true);
    local.data.setUint16(10, stamp.time, true);
    local.data.setUint16(12, stamp.date, true);
    local.data.setUint32(14, checksum, true);
    local.data.setUint32(18, body.byteLength, true);
    local.data.setUint32(22, body.byteLength, true);
    local.data.setUint16(26, name.byteLength, true);
    local.data.setUint16(28, 0, true);
    localChunks.push(local.bytes, name, body);

    const central = view(46);
    central.data.setUint32(0, 0x02014b50, true);
    central.data.setUint16(4, 20, true);
    central.data.setUint16(6, 20, true);
    central.data.setUint16(8, 0x0800, true);
    central.data.setUint16(10, 0, true);
    central.data.setUint16(12, stamp.time, true);
    central.data.setUint16(14, stamp.date, true);
    central.data.setUint32(16, checksum, true);
    central.data.setUint32(20, body.byteLength, true);
    central.data.setUint32(24, body.byteLength, true);
    central.data.setUint16(28, name.byteLength, true);
    central.data.setUint16(30, 0, true);
    central.data.setUint16(32, 0, true);
    central.data.setUint16(34, 0, true);
    central.data.setUint16(36, 0, true);
    central.data.setUint32(38, 0, true);
    central.data.setUint32(42, localOffset, true);
    centralChunks.push(central.bytes, name);

    localOffset += local.bytes.byteLength + name.byteLength + body.byteLength;
  }

  const localSection = concat(localChunks);
  const centralSection = concat(centralChunks);
  const end = view(22);
  end.data.setUint32(0, 0x06054b50, true);
  end.data.setUint16(4, 0, true);
  end.data.setUint16(6, 0, true);
  end.data.setUint16(8, files.length, true);
  end.data.setUint16(10, files.length, true);
  end.data.setUint32(12, centralSection.byteLength, true);
  end.data.setUint32(16, localSection.byteLength, true);
  end.data.setUint16(20, 0, true);

  return concat([localSection, centralSection, end.bytes]);
}
