import React from 'react';
import { Row, flexRender } from '@tanstack/react-table';
import { MobileConfig } from './CleanTable';

interface MobileTableProps<TData> {
  rows: Row<TData>[];
  mobileConfig: MobileConfig;
}

export function MobileTable<TData>({ rows, mobileConfig }: MobileTableProps<TData>) {
  // Helper function to render a cell from mobileConfig
  const renderCellFromConfig = (row: Row<TData>, accessorKey: string | null, index: number | string) => {
    if (!accessorKey) return <div className="flex-1" key={`placeholder-${index}`} />; // Empty placeholder for `null`

    const cell = row.getVisibleCells().find(c => c.column.id === accessorKey || (c.column.columnDef as any).accessorKey === accessorKey) || 
                 row.getAllCells().find(c => c.column.id === accessorKey || (c.column.columnDef as any).accessorKey === accessorKey);
                 
    if (!cell) return null;

    const label = cell.column.columnDef.header;
    return (
      <div className="flex-1 flex flex-col gap-0.5 min-w-0 overflow-hidden" key={accessorKey || index}>
        {typeof label === 'function' ? (
           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 flex flex-col justify-center w-full *:truncate">
             {flexRender(label, cell.getContext() as any)}
           </div>
        ) : typeof label === 'string' ? (
           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 truncate w-full">{label}</div>
        ) : null}
        <div className="text-sm font-medium flex flex-col justify-center w-full *:truncate">
           {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div key={row.id} className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm p-4 flex flex-col gap-4 relative">
          {/* Header */}
          {mobileConfig.header && mobileConfig.header.length > 0 && (
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              {mobileConfig.header.map((key, index) => renderCellFromConfig(row, key, `header-${index}`))}
            </div>
          )}

          {/* Body */}
          {mobileConfig.body && mobileConfig.body.length > 0 && (
            <div className="flex flex-col gap-3">
              {mobileConfig.body.map((rowKeys, idx) => {
                 const renderedRow = rowKeys.map((key, index) => renderCellFromConfig(row, key, `body-${idx}-${index}`));
                 // Check if row has any non-null content
                 if (renderedRow.filter(r => r !== null && r.props?.className !== 'flex-1').length === 0) return null;
                 return (
                   <div key={idx} className="flex gap-2">
                      {renderedRow}
                   </div>
                 )
              })}
            </div>
          )}

          {/* Footer */}
          {mobileConfig.footer && mobileConfig.footer.length > 0 && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-[#2D2D3D]">
              {mobileConfig.footer.map((key, index) => renderCellFromConfig(row, key, `footer-${index}`))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
