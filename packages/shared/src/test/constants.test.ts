import { describe, it, expect } from 'vitest';
import { MAX_FILE_SIZE_MB, SUPPORTED_IMAGE_TYPES } from '../constants';

describe('Constants', () => {
  it('should have correct MAX_FILE_SIZE_MB', () => {
    expect(MAX_FILE_SIZE_MB).toBe(10);
  });

  it('should have correct SUPPORTED_IMAGE_TYPES', () => {
    expect(SUPPORTED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  });
});