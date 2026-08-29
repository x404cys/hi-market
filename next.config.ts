import type { NextConfig } from "next";

function getR2ImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.r2.cloudflarestorage.com",
      pathname: "/products/**",
    },
    {
      protocol: "https",
      hostname: "**.r2.cloudflarestorage.com",
      pathname: "/banners/**",
    },
  ];

  if (!publicUrl) return patterns;

  try {
    const url = new URL(publicUrl);

    if (url.hostname !== "**.r2.cloudflarestorage.com") {
      const basePath = url.pathname.replace(/\/$/, "");

      patterns.unshift(
        {
          protocol: "https",
          hostname: url.hostname,
          pathname: `${basePath}/products/**`,
        },
        {
          protocol: "https",
          hostname: url.hostname,
          pathname: `${basePath}/banners/**`,
        },
      );
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
