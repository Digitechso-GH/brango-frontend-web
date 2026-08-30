"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { MobileTable } from "./MobileTable";

export interface MobileConfig {
  header?: string[];
  body?: (string | null)[][];
  footer?: string[];
}

export interface TablePaginationConfig {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

interface CleanTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: TablePaginationConfig;
  isLoading?: boolean;
  mobileConfig?: MobileConfig;
  // Selección de filas (opcional)
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  enableRowSelection?: boolean | ((row: any) => boolean);
  // Footer personalizado (opcional)
  footer?: React.ReactNode;
}

export function CleanTable<TData, TValue>({
  columns,
  data,
  pagination,
  isLoading = false,
  mobileConfig,
  rowSelection,
  onRowSelectionChange,
  enableRowSelection,
  footer,
}: CleanTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(rowSelection !== undefined ? {
      state: { rowSelection },
      onRowSelectionChange: onRowSelectionChange as any,
      enableRowSelection: enableRowSelection ?? true,
    } : {}),
  });

  const renderPagination = () => {
    if (!pagination) return null;
    return (
      <div className="py-2.5 px-4 bg-slate-50/50 dark:bg-[#1A1A24] flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
          Mostrando {data.length} de {pagination.totalCount} resultados
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13131A] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Anterior
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
            Página {pagination.page} de {Math.max(1, pagination.totalPages)}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages || pagination.totalPages === 0}
            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13131A] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* --- DESKTOP VIEW --- */}
      <div className={`w-full bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex-col ${mobileConfig ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/30">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as any;
                    const alignClass = meta?.align === 'left' ? 'text-left' : meta?.align === 'right' ? 'text-right' : 'text-center';
                    const customClass = meta?.className || '';
                    return (
                      <th
                        key={header.id}
                        className={`py-3 px-4 whitespace-nowrap ${alignClass} ${customClass}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {table.getVisibleFlatColumns().map((col, cIdx) => (
                      <td key={cIdx} className="py-3 px-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-[120px] mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as any;
                      const alignClass = meta?.align === 'left' ? 'text-left' : meta?.align === 'right' ? 'text-right' : 'text-center';
                      const customClass = meta?.className || '';
                      return (
                        <td
                          key={cell.id}
                          className={`py-3 px-4 text-slate-800 dark:text-slate-200 ${alignClass} ${customClass}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-xs text-slate-400 dark:text-slate-500"
                  >
                    No hay datos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            {renderPagination()}
          </div>
        )}
        {footer && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>

      {/* --- MOBILE VIEW --- */}
      {mobileConfig && (
        <div className="flex md:hidden flex-col w-full gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`mob-skeleton-${idx}`} className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3 animate-pulse">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
              </div>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            <MobileTable rows={table.getRowModel().rows} mobileConfig={mobileConfig} />
          ) : (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
              No hay datos para mostrar
            </div>
          )}

          {pagination && (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {renderPagination()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
