/** @type {import('next').NextConfig} */
const nextConfig={
  // Next 16 writes AGENTS.md/CLAUDE.md boilerplate on "next dev"; this repo keeps its own docs.
  agentRules:false,
};
export default nextConfig;
