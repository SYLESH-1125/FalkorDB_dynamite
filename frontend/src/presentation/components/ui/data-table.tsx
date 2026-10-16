"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "./cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
}

export function DataTable<T extends { id: string }>({
  columns, rows, onRowClick, emptyMessage = "No records found", caption,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  caption?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return direction === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sortKey, direction]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  }

  if (rows.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-ink-300">{emptyMessage}</p>;
  }

  return (
    <div className="scrollbar-thin max-h-[32rem] overflow-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 z-10">
          <tr className="bg-sand-200/90 backdrop-blur">
            {columns.map((column) => {
              const active = sortKey === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
                  className={cn(
                    "border-b border-sand-300 px-3 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase first:pl-4 last:pr-4",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.align !== "right" && column.align !== "center" && "text-left",
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-ink-800",
                        column.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {column.header}
                      {active ? (
                        direction === "asc"
                          ? <ArrowUp className="size-3" aria-hidden />
                          : <ArrowDown className="size-3" aria-hidden />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter") onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                "border-b border-sand-200 last:border-0",
                onRowClick && "cursor-pointer hover:bg-clay-50/40",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-2.5 align-middle text-ink-600 first:pl-4 last:pr-4",
                    column.align === "right" && "text-right tabular-nums",
                    column.align === "center" && "text-center",
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
