const isGitHubActions = process.env.GITHUB_ACTIONS === "true"
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""
const isUserSite = repositoryName.endsWith(".github.io")
const basePath = isGitHubActions && repositoryName && !isUserSite ? `/${repositoryName}` : ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
