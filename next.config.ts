import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads standard fonts from node_modules at runtime via __dirname
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
