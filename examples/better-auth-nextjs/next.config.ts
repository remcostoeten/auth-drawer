import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@remcostoeten/auth-drawer"],
};

export default nextConfig;
