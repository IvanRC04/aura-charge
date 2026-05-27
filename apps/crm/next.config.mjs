/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aura/ui", "@aura/db", "@aura/kv", "@aura/simulation"],
};

export default nextConfig;
