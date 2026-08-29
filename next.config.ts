import type { NextConfig } from "next";

function getR2ImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  if (!publicUrl) return patterns;

  try {
    const url = new URL(publicUrl);
    const basePath = url.pathname.replace(/\/+$/, "");

    patterns.push({
      protocol: "https",
      hostname: url.hostname,
      pathname: `${basePath || ""}/**`,
    });
  } catch {
    return patterns;
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getR2ImageRemotePatterns(),
  },
};

export default nextConfig;
