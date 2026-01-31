import type { NextConfig } from "next";

// Set timezone to America/Bogota for the entire Node.js process
// This must be set before any date operations occur
process.env.TZ = 'America/Bogota';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
