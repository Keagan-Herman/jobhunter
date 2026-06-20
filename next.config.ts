import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf uses a dynamic import of its bundled pdfjs that webpack can't tree-shake correctly.
  // better-sqlite3 is a native module. Both must stay as Node requires, not get bundled.
  serverExternalPackages: ['unpdf', 'pdfjs-dist', 'better-sqlite3'],
};

export default nextConfig;
