import { vi } from 'vitest';
import type { SQLiteSelectBuilder, SQLiteInsertBuilder, SQLiteUpdateBuilder, SQLiteDeleteBase, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { SelectedFields } from 'drizzle-orm';
import type { D1Result } from '@cloudflare/workers-types';

// Helper type to add mock functionality to Drizzle query builders
export type MockedDrizzleSelect = {
  (): SQLiteSelectBuilder<undefined, "async", D1Result<unknown>, "db">;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <TSelection extends SelectedFields<any, any>>(fields: TSelection): SQLiteSelectBuilder<TSelection, "async", D1Result<unknown>, "db">;
  mockImplementation: ReturnType<typeof vi.fn>['mockImplementation'];
  mockReturnThis: ReturnType<typeof vi.fn>['mockReturnThis'];
  mockReturnValue: ReturnType<typeof vi.fn>['mockReturnValue'];
  mockResolvedValue: ReturnType<typeof vi.fn>['mockResolvedValue'];
};

export type MockedDrizzleInsert = {
  <TTable extends SQLiteTable>(into: TTable): SQLiteInsertBuilder<TTable, "async", D1Result<unknown>>;
  mockImplementation: ReturnType<typeof vi.fn>['mockImplementation'];
  mockReturnThis: ReturnType<typeof vi.fn>['mockReturnThis'];
  mockReturnValue: ReturnType<typeof vi.fn>['mockReturnValue'];
  mockResolvedValue: ReturnType<typeof vi.fn>['mockResolvedValue'];
};

export type MockedDrizzleUpdate = {
  <TTable extends SQLiteTable>(table: TTable): SQLiteUpdateBuilder<TTable, "async", D1Result<unknown>>;
  mockImplementation: ReturnType<typeof vi.fn>['mockImplementation'];
  mockReturnThis: ReturnType<typeof vi.fn>['mockReturnThis'];
  mockReturnValue: ReturnType<typeof vi.fn>['mockReturnValue'];
  mockResolvedValue: ReturnType<typeof vi.fn>['mockResolvedValue'];
};

export type MockedDrizzleDelete = {
  <TTable extends SQLiteTable>(from: TTable): SQLiteDeleteBase<TTable, "async", D1Result<unknown>, undefined, false, never>;
  mockImplementation: ReturnType<typeof vi.fn>['mockImplementation'];
  mockReturnThis: ReturnType<typeof vi.fn>['mockReturnThis'];
  mockReturnValue: ReturnType<typeof vi.fn>['mockReturnValue'];
  mockResolvedValue: ReturnType<typeof vi.fn>['mockResolvedValue'];
};

// Helper to cast database methods to their mocked versions
export function asMockedDb<T extends { select: unknown; insert: unknown; update: unknown; delete: unknown }>(db: T) {
  return {
    ...db,
    select: db.select as MockedDrizzleSelect,
    insert: db.insert as MockedDrizzleInsert,
    update: db.update as MockedDrizzleUpdate,
    delete: db.delete as MockedDrizzleDelete,
  };
}