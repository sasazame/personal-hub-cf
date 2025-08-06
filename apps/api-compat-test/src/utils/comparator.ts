import { APIResponse, APIError, isAPIResponse } from './api-client';

export interface ComparisonResult {
  match: boolean;
  differences: Difference[];
  oldResponse: APIResponse | APIError;
  newResponse: APIResponse | APIError;
}

export interface Difference {
  path: string;
  type: 'missing' | 'type' | 'value' | 'status' | 'header';
  oldValue: unknown;
  newValue: unknown;
  message: string;
}

export function compareResponses(
  oldResponse: APIResponse | APIError,
  newResponse: APIResponse | APIError
): ComparisonResult {
  const differences: Difference[] = [];

  // Compare status codes
  if (isAPIResponse(oldResponse) && isAPIResponse(newResponse)) {
    if (oldResponse.status !== newResponse.status) {
      differences.push({
        path: 'status',
        type: 'status',
        oldValue: oldResponse.status,
        newValue: newResponse.status,
        message: `Status code mismatch: ${oldResponse.status} !== ${newResponse.status}`,
      });
    }

    // Compare response data
    compareObjects(oldResponse.data, newResponse.data, 'data', differences);
    
    // Compare important headers
    compareHeaders(oldResponse.headers, newResponse.headers, differences);
  } else {
    // One or both requests failed
    differences.push({
      path: 'request',
      type: 'status',
      oldValue: oldResponse,
      newValue: newResponse,
      message: 'Request execution mismatch',
    });
  }

  return {
    match: differences.length === 0,
    differences,
    oldResponse,
    newResponse,
  };
}

function compareObjects(
  oldObj: unknown,
  newObj: unknown,
  path: string,
  differences: Difference[]
): void {
  // Handle null/undefined
  if (oldObj === null || oldObj === undefined) {
    if (newObj !== null && newObj !== undefined) {
      differences.push({
        path,
        type: 'missing',
        oldValue: oldObj,
        newValue: newObj,
        message: `Field missing in old response: ${path}`,
      });
    }
    return;
  }

  if (newObj === null || newObj === undefined) {
    differences.push({
      path,
      type: 'missing',
      oldValue: oldObj,
      newValue: newObj,
      message: `Field missing in new response: ${path}`,
    });
    return;
  }

  // Compare types
  const oldType = Array.isArray(oldObj) ? 'array' : typeof oldObj;
  const newType = Array.isArray(newObj) ? 'array' : typeof newObj;

  if (oldType !== newType) {
    differences.push({
      path,
      type: 'type',
      oldValue: oldObj,
      newValue: newObj,
      message: `Type mismatch at ${path}: ${oldType} !== ${newType}`,
    });
    return;
  }

  // Compare arrays
  if (Array.isArray(oldObj)) {
    // TypeScript knows oldObj is an array, but we need to assert newObj is too
    const newArr = newObj as unknown[];
    if (oldObj.length !== newArr.length) {
      differences.push({
        path: `${path}.length`,
        type: 'value',
        oldValue: oldObj.length,
        newValue: newArr.length,
        message: `Array length mismatch at ${path}: ${oldObj.length} !== ${newArr.length}`,
      });
    }

    const minLength = Math.min(oldObj.length, newArr.length);
    for (let i = 0; i < minLength; i++) {
      compareObjects(oldObj[i], newArr[i], `${path}[${i}]`, differences);
    }
    return;
  }

  // Compare objects
  if (typeof oldObj === 'object') {
    // Cast to Record for proper object operations
    const oldRecord = oldObj as Record<string, unknown>;
    const newRecord = newObj as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);
    
    for (const key of allKeys) {
      if (!(key in oldRecord)) {
        differences.push({
          path: `${path}.${key}`,
          type: 'missing',
          oldValue: undefined,
          newValue: newRecord[key],
          message: `Field missing in old response: ${path}.${key}`,
        });
      } else if (!(key in newRecord)) {
        differences.push({
          path: `${path}.${key}`,
          type: 'missing',
          oldValue: oldRecord[key],
          newValue: undefined,
          message: `Field missing in new response: ${path}.${key}`,
        });
      } else {
        compareObjects(oldRecord[key], newRecord[key], `${path}.${key}`, differences);
      }
    }
    return;
  }

  // Compare primitive values
  if (oldObj !== newObj) {
    // Special handling for timestamps and IDs
    if (shouldIgnoreDifference(path, oldObj, newObj)) {
      return;
    }

    differences.push({
      path,
      type: 'value',
      oldValue: oldObj,
      newValue: newObj,
      message: `Value mismatch at ${path}: ${JSON.stringify(oldObj)} !== ${JSON.stringify(newObj)}`,
    });
  }
}

function compareHeaders(
  oldHeaders: Record<string, string>,
  newHeaders: Record<string, string>,
  differences: Difference[]
): void {
  // Only compare important headers
  const importantHeaders = ['content-type', 'x-rate-limit-remaining', 'x-rate-limit-limit'];
  
  for (const header of importantHeaders) {
    const oldValue = oldHeaders[header]?.toLowerCase();
    const newValue = newHeaders[header]?.toLowerCase();
    
    if (oldValue && newValue && oldValue !== newValue) {
      // Special handling for content-type charset differences
      if (header === 'content-type' && 
          oldValue.includes('application/json') && 
          newValue.includes('application/json')) {
        continue;
      }
      
      differences.push({
        path: `headers.${header}`,
        type: 'header',
        oldValue,
        newValue,
        message: `Header mismatch: ${header}`,
      });
    }
  }
}

function shouldIgnoreDifference(path: string, oldValue: unknown, newValue: unknown): boolean {
  // Ignore timestamp differences
  if (path.includes('timestamp') || path.includes('createdAt') || path.includes('updatedAt')) {
    return true;
  }

  // Ignore ID differences for newly created resources
  if (path.includes('.id') && typeof oldValue === 'string' && typeof newValue === 'string') {
    return true;
  }

  // Ignore JWT token differences
  if (path.includes('token') || path.includes('Token')) {
    return true;
  }

  return false;
}