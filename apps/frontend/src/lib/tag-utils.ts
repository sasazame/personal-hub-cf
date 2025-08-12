/**
 * Utility functions for handling tags across the application
 */

/**
 * Maximum length for serialized tags string in the database
 */
export const MAX_TAGS_LENGTH = 1000

/**
 * Serialize an array of tags into a comma-separated string
 * Normalizes tags by trimming whitespace and filtering empty values
 */
export function serializeTags(tags: string[]): string {
  return tags.map(t => t.trim()).filter(Boolean).join(',')
}

/**
 * Deserialize a comma-separated string into an array of tags
 */
export function deserializeTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

/**
 * Validate that the serialized length of tags doesn't exceed the limit
 */
export function validateTagsLength(tags: string[]): boolean {
  const serialized = serializeTags(tags)
  return serialized.length <= MAX_TAGS_LENGTH
}

/**
 * Get the current length of serialized tags
 */
export function getSerializedTagsLength(tags: string[]): number {
  return serializeTags(tags).length
}