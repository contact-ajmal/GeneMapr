import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getVariants, exportVariantsCSV } from '../api/variants'
import type { Variant, VariantFilters } from '../types/variant'
import VariantTable from '../components/VariantTable'
import FilterPanel from '../components/FilterPanel'
import VariantDetailModal from '../components/VariantDetailModal'
import LoadingSpinner from '../components/LoadingSpinner'

const PAGE_SIZE = 50

export default function DashboardPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<VariantFilters>({})
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['variants', page, filters],
    queryFn: () => getVariants(page, PAGE_SIZE, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const blob = await exportVariantsCSV(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `variants-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export variants. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: VariantFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Variant Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {data?.total
              ? `Showing ${data.total.toLocaleString()} variant${
                  data.total !== 1 ? 's' : ''
                }`
              : 'Loading variants...'}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || !data?.variants.length}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed
            transition-colors font-medium"
        >
          {isExporting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table Section */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12">
              <LoadingSpinner size="lg" text="Loading variants..." />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg border border-red-200 p-8">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-red-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900">Error loading variants</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900
                      rounded-md text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <VariantTable
                variants={data?.variants || []}
                onRowClick={setSelectedVariant}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg border border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50
                          disabled:text-slate-400 disabled:cursor-not-allowed rounded-md
                          text-sm font-medium transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50
                          disabled:text-slate-400 disabled:cursor-not-allowed rounded-md
                          text-sm font-medium transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Variant Detail Modal */}
      <VariantDetailModal variant={selectedVariant} onClose={() => setSelectedVariant(null)} />
    </div>
  )
}
