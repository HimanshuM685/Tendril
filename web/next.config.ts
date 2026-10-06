import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tendril/shared"],
  async redirects() {
    return [
      { source: "/docs", destination: "https://docs.tendrilhq.com", permanent: true },
      { source: "/docs/", destination: "https://docs.tendrilhq.com", permanent: true },
      { source: "/docs/:path*", destination: "https://docs.tendrilhq.com/docs/:path*", permanent: true },
      { source: "/api", destination: "https://docs.tendrilhq.com/docs/api", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/x402/:path*",
        destination: "https://tendrilregister.007575.xyz/x402/:path*",
      },
    ];
  },
  webpack(config) {
    // Shared source uses NodeNext .js specifiers; resolve their TypeScript
    // sources when Next transpiles the workspace package directly.
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, ".js": [".ts", ".tsx", ".js"] };
    // use-wallet treats these connectors as optional peers. Webpack needs
    // explicit empty aliases when only Lute, Pera, and Defly are enabled here.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@agoralabs-sh/avm-web-provider": false,
      "@walletconnect/modal": false,
      "@walletconnect/sign-client": false,
      "@web3auth/base": false,
      "@web3auth/base-provider": false,
      "@web3auth/modal": false,
      "@web3auth/single-factor-auth": false,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: ["process"],
      }),
    );
    return config;
  },
};

export default nextConfig;
