import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Every page becomes folder/index.html, which any static host serves without rewrite rules.
  trailingSlash: true,
  // Set NEXT_PUBLIC_BASE_PATH to publish under a sub-path (GitHub Pages project sites).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
