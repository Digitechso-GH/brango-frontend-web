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
      <div className="p-4 bg-gray-50 dark:bg-[#1A1A24] flex items-center justify-between rounded-b-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
          Mostrando {data.length} de {pagination.totalCount} resultados
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
            className="px-3 py-1.5 text-xs font-bold rounded-md border border-gray-300 dark:border-[#2D2D3D] bg-white dark:bg-[#13131A] hover:bg-gray-50 dark:hover:bg-[#1E1E2D] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">
            Página {pagination.page} de {Math.max(1, pagination.totalPages)}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages || pagination.totalPages === 0}
            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            className="px-3 py-1.5 text-xs font-bold rounded-md border border-gray-300 dark:border-[#2D2D3D] bg-white dark:bg-[#13131A] hover:bg-gray-50 dark:hover:bg-[#1E1E2D] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
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
      <div className={`w-full bg-white dark:bg-[#13131A] rounded-lg border border-gray-200 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex-col ${mobileConfig ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-gray-100 dark:bg-[#1A1A24]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as any;
                    const alignClass = meta?.align === 'left' ? 'text-left' : meta?.align === 'right' ? 'text-right' : 'text-center';
                    const customClass = meta?.className || '';
                    return (
                      <th
                        key={header.id}
                        className={`border-b border-gray-200 dark:border-[#2D2D3D] py-2 px-3 font-bold text-gray-700 dark:text-gray-400 whitespace-nowrap ${alignClass} ${customClass}`}
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
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {table.getVisibleFlatColumns().map((col, cIdx) => (
                      <td key={cIdx} className="border-b border-gray-200 dark:border-[#2D2D3D] py-2 px-3">
                        <div className="h-4 bg-gray-200 dark:bg-[#2D2D3D] rounded w-full max-w-[120px] mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-[#1E1E2D] transition-colors">
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as any;
                      const alignClass = meta?.align === 'left' ? 'text-left' : meta?.align === 'right' ? 'text-right' : 'text-center';
                      const customClass = meta?.className || '';
                      return (
                        <td
                          key={cell.id}
                          className={`border-b border-gray-200 dark:border-[#2D2D3D] py-2 px-3 text-gray-800 dark:text-gray-200 ${alignClass} ${customClass}`}
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
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay datos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="border-t border-gray-200 dark:border-[#2D2D3D]">
            {renderPagination()}
          </div>
        )}
        {footer && (
          <div className="border-t border-gray-200 dark:border-[#2D2D3D]">
            {footer}
          </div>
        )}
      </div>

      {/* --- MOBILE VIEW --- */}
      {mobileConfig && (
        <div className="flex md:hidden flex-col w-full gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`mob-skeleton-${idx}`} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            <MobileTable rows={table.getRowModel().rows} mobileConfig={mobileConfig} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
              No hay datos para mostrar
            </div>
          )}

          {pagination && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {renderPagination()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
