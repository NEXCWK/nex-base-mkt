/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "nodemailer", "node-cron"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // Arquivos locais em /public são servidos diretamente — sem necessidade de remotePattern
  },
};

export default nextConfig;
