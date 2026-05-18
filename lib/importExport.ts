import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ExportDataSchema } from "./schema";
import { nowISO } from "./format";
import type { Item, Evaluation, Settings, ExportData } from "./types";

// ─── Pure functions (no native deps — testable) ──────────────────────────────

export function buildExportData(
  items: Item[],
  evaluations: Evaluation[],
  settings: Settings
): ExportData {
  return {
    schemaVersion: 1,
    exportedAt: nowISO(),
    items,
    evaluations,
    settings,
  };
}

export function serializeExport(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImportJSON(text: string): ImportPreview {
  try {
    const parsed = JSON.parse(text);
    const validated = ExportDataSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        items: 0,
        evaluations: 0,
        valid: false,
        error: "Invalid file format: " + validated.error.issues[0]?.message,
      };
    }
    return {
      items: validated.data.items.length,
      evaluations: validated.data.evaluations.length,
      valid: true,
      data: validated.data,
    };
  } catch (e: unknown) {
    return {
      items: 0,
      evaluations: 0,
      valid: false,
      error: e instanceof Error ? e.message : "Failed to parse file",
    };
  }
}

// ─── Native wrappers ─────────────────────────────────────────────────────────

export async function exportJSON(
  items: Item[],
  evaluations: Evaluation[],
  settings: Settings
): Promise<void> {
  const json = serializeExport(buildExportData(items, evaluations, settings));
  const filename = `fliplog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, { mimeType: "application/json" });
}

export async function exportCSV(
  items: Item[],
  evaluations: Evaluation[]
): Promise<void> {
  const itemHeader =
    "id,kind,title,category,status,purchasePrice,totalCosts,soldPrice,soldPlatform,profit,acquiredAt,soldAt,tags";
  const itemRows = items.map((i) => {
    const totalCosts = i.costs.reduce((s, c) => s + c.amount, 0);
    const profit =
      i.soldPrice != null
        ? (i.soldPrice - (i.purchasePrice ?? 0) - totalCosts).toFixed(2)
        : "";
    return [
      i.id,
      i.kind,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category ?? "",
      i.status,
      i.purchasePrice ?? "",
      totalCosts.toFixed(2),
      i.soldPrice ?? "",
      i.soldPlatform ?? "",
      profit,
      i.acquiredAt ?? "",
      i.soldAt ?? "",
      `"${i.tags.join(", ")}"`,
    ].join(",");
  });

  const evalHeader =
    "id,title,category,askingPrice,estimatedSalePrice,estimatedRefurbCost,estimatedLaborHours,intendedSellPlatform,outcome,createdAt";
  const evalRows = evaluations.map((e) =>
    [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category ?? "",
      e.askingPrice,
      e.estimatedSalePrice,
      e.estimatedRefurbCost,
      e.estimatedLaborHours,
      e.intendedSellPlatform,
      e.outcome,
      e.createdAt,
    ].join(",")
  );

  const csv =
    "ITEMS\n" +
    [itemHeader, ...itemRows].join("\n") +
    "\n\nEVALUATIONS\n" +
    [evalHeader, ...evalRows].join("\n");

  const filename = `fliplog-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, { mimeType: "text/csv" });
}

export interface ImportPreview {
  items: number;
  evaluations: number;
  valid: boolean;
  error?: string;
  data?: ExportData;
}

export async function readImportFile(): Promise<ImportPreview> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { items: 0, evaluations: 0, valid: false, error: "Cancelled" };
  }

  try {
    const text = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return parseImportJSON(text);
  } catch (e: unknown) {
    return {
      items: 0,
      evaluations: 0,
      valid: false,
      error: e instanceof Error ? e.message : "Failed to read file",
    };
  }
}
