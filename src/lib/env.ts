function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  github: {
    id: requireEnv('GITHUB_ID'),
    secret: requireEnv('GITHUB_SECRET'),
  },
  nextAuth: {
    secret: requireEnv('NEXTAUTH_SECRET'),
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  openRouter: {
    apiKey: requireEnv('OPENROUTER_API_KEY'),
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
  },
} as const
