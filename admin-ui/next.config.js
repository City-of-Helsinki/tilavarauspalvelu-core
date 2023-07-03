/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
};

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["common"],
  sassOptions: {
    includePaths: [path.join(__dirname, "src")],
  },
  async rewrites() {
    return [
      // Do not rewrite API routes
      {
        source: "/api/:any*",
        destination: "/api/:any*",
      },
      // Rewrite everything else to use `pages/index`
      {
        source: "/:any*",
        destination: "/",
      },
    ];
  },
};
