// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.ekmcdn.com",
        port: "", // optional
        pathname: "**", // allows all image paths
      },
    ],
  },
};

module.exports = nextConfig;
