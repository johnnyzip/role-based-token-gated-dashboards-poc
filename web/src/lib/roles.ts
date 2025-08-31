export const Roles = {
  investor: 1,
  donor: 2,
  ops: 3,
} as const;

export type RoleKey = keyof typeof Roles;

export function roleToId(role: RoleKey): number {
  return Roles[role];
}

// Simple composite token id: tokenId = projectId * 100 + roleId
export function tokenIdFor(projectId: number, role: RoleKey | number): bigint {
  const roleId = typeof role === "number" ? role : Roles[role];
  return BigInt(projectId * 100 + roleId);
}

export function parseRole(input: string): RoleKey {
  const key = input.toLowerCase() as RoleKey;
  if (!(key in Roles)) throw new Error("Unknown role: " + input);
  return key;
}
