// UUID implementation for Spring Boot compatibility
export function nanoid(): string {
  return crypto.randomUUID();
}