import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized : true , 
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d3f32ffc98ac49418a360ec5172510f4.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;