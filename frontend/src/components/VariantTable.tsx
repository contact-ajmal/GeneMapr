import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { Variant } from '../types/variant'

interface VariantTableProps {
  variants: Variant[]
  onRowClick: (variant: Variant) => void
}

export default function VariantTable({ variants, onRowClick }: VariantTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'text-slate-500 dark:text-slate-400'
    if (score >= 75) return 'text-red-600 dark:text-red-400 font-semibold'
    if (score >= 50) return 'text-orange-600 dark:text-orange-400 font-semibold'
    if (score >= 25) return 'text-yellow-700 dark:text-yellow-500'
    return 'text-green-600 dark:text-green-400'
  }

  const columns: ColumnDef<Variant>[] = [
    {
      accessorKey: 'chrom',
      header: 'Chr',
      cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'pos',
      header: 'Position',
      cell: (info) => (info.getValue() as number).toLocaleString(),
    },
    {
      accessorKey: 'ref',
      header: 'Ref',
      cell: (info) => (
        <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'alt',
      header: 'Alt',
      cell: (info) => (
        <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'gene',
      header: 'Gene',
      cell: (info) => {
        const gene = info.getValue() as string | null
        return gene ? (
          <span className="font-semibold text-blue-700 dark:text-blue-400">{gene}</span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )
      },
    },
    {
      accessorKey: 'consequence',
      header: 'Consequence',
      cell: (info) => {
        const consequence = info.getValue() as string | null
        return consequence ? (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {consequence.replace(/_/g, ' ')}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )
      },
    },
    {
      accessorKey: 'clinical_significance',
      header: 'Clinical Significance',
      cell: (info) => {
        const sig = info.getValue() as string | null
        if (!sig) return <span className="text-slate-400 dark:text-slate-500">—</span>

        const isPathogenic = sig.toLowerCase().includes('pathogenic')
        const isBenign = sig.toLowerCase().includes('benign')

        return (
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              isPathogenic
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                : isBenign
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            }`}
          >
            {sig}
          </span>
        )
      },
    },
    {
      accessorKey: 'allele_frequency',
      header: 'AF',
      cell: (info) => {
        const af = info.getValue() as number | null
        return af !== null ? (
          <span className="font-mono text-xs">{af.toExponential(2)}</span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )
      },
    },
    {
      accessorKey: 'risk_score',
      header: 'Risk Score',
      cell: (info) => {
        const score = info.getValue() as number | null
        return score !== null ? (
          <span className={getRiskColor(score)}>{score}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )
      },
    },
  ]

  const table = useReactTable({
    data: variants,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (variants.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center transition-colors duration-200">
        <svg
          className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No variants found</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Try adjusting your filters or upload a VCF file
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center space-x-1 hover:text-slate-900 dark:hover:text-slate-100'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="text-slate-400">
                            {{
                              asc: (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ),
                              desc: (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              ),
                            }[header.column.getIsSorted() as string] ?? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className="hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
