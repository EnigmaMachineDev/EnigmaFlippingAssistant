import type { ExportData } from "./types";

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Migrate an import payload to the current schema version.
 * Returns the migrated data and a log of steps applied.
 * Never mutates the input — always returns a new object.
 */
export function migrateExportData(data: ExportData): {
  data: ExportData;
  migrationsApplied: string[];
} {
  let current = { ...data };
  const migrationsApplied: string[] = [];

  // v0 → v1: first released version, nothing to migrate
  // (scaffold: add future migrations below this line)
  // if (current.schemaVersion < 2) {
  //   current = migrateV1toV2(current);
  //   migrationsApplied.push("v1→v2");
  // }

  return {
    data: { ...current, schemaVersion: CURRENT_SCHEMA_VERSION },
    migrationsApplied,
  };
}

export function needsMigration(schemaVersion: number): boolean {
  return schemaVersion < CURRENT_SCHEMA_VERSION;
}
