/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com', // allow unsplash
      'randomuser.me',       // if you use randomuser
    ],
  },
};

module.exports = nextConfig;
