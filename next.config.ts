import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: "/experience",
        destination: "/experiments",
        permanent: true
      },
      {
        source: "/logs",
        destination: "/read",
        permanent: true
      },
      {
        source: "/posts",
        destination: "/read",
        permanent: true
      },
      {
        source: "/posts/:id",
        destination: "/read/:id",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
