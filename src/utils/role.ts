import type { Role } from './types'
export function mapRole(roleLike: string): Role {
  if (roleLike === 'human') return 'user'
  if (roleLike === 'ai') return 'assistant'
  if (roleLike === 'user' || roleLike === 'assistant' || roleLike === 'system') return roleLike
  return 'assistant'
}
