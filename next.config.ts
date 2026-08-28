import type { NextConfig } from "next";

function getR2ImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.r2.cloudflarestorage.com",
      pathname: "/products/**",
    },
  ];

  if (!publicUrl) return patterns;

  try {
    const url = new URL(publicUrl);

    if (url.hostname !== "**.r2.cloudflarestorage.com") {
      patterns.unshift({
        protocol: "https",
        hostname: url.hostname,
        pathname: `${url.pathname.replace(/\/$/, "")}/products/**`,
      });
    }
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
