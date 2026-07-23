import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's serverless bundler only includes node_modules files it can statically
  // detect. Our pdf-parse worker-path fix (lib/pdf/worker-setup.ts) resolves the
  // worker file dynamically at runtime via process.cwd(), which the bundler can't
  // trace — so without this, PDF text extraction would break in production even
  // though it works locally. This forces that file to be included in the bundle.
  outputFileTracingIncludes: {
    "/api/resume/upload": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
