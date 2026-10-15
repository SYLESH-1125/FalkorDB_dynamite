export type Subsidiary =
  | "ECL" | "BCCL" | "CCL" | "NCL" | "WCL" | "SECL" | "MCL" | "NEC" | "CMPDI";

export type MineType = "Opencast" | "Underground" | "Mixed";

export const SUBSIDIARIES: Subsidiary[] = [
  "ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC", "CMPDI",
];

export const MINE_TYPES: MineType[] = ["Opencast", "Underground", "Mixed"];

export interface DateRange {
  from: string;
  to: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
