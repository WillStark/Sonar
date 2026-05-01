declare module 'node:fs/promises' {
  const fs: any;
  export default fs;
}

type Buffer = any;
declare const Buffer: any;
declare const process: { env: Record<string, string | undefined> };
