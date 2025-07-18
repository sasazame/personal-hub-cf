import type { ExportMetadata } from '@personal-hub/shared';

/**
 * Escapes CSV field values according to RFC 4180
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Converts an array of objects to CSV format
 */
export function objectsToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: (keyof T)[]
): string {
  if (data.length === 0) {
    return '';
  }
  
  // Use provided columns or extract from first object
  const headers = columns || Object.keys(data[0]) as (keyof T)[];
  
  // Build CSV header
  const csvHeader = headers.map(h => escapeCSVField(String(h))).join(',');
  
  // Build CSV rows
  const csvRows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle nested objects or arrays
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return escapeCSVField(value.join('; '));
        }
        return escapeCSVField(JSON.stringify(value));
      }
      
      // Handle dates - check if it's a Date-like object
      if (value && typeof value === 'object' && 'toISOString' in value) {
        return escapeCSVField((value as any).toISOString());
      }
      
      return escapeCSVField(value);
    }).join(',');
  });
  
  return [csvHeader, ...csvRows].join('\n');
}

/**
 * Creates export metadata
 */
export function createExportMetadata(
  recordCount: number,
  filters: Record<string, any>
): ExportMetadata {
  return {
    exportDate: new Date().toISOString(),
    recordCount,
    filters: Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ),
  };
}

/**
 * Sets appropriate headers for file download
 */
export function setDownloadHeaders(
  c: any,
  filename: string,
  format: 'csv' | 'json'
): void {
  const contentType = format === 'csv' ? 'text/csv' : 'application/json';
  c.header('Content-Type', contentType);
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Add cache control headers to prevent caching of export data
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
}