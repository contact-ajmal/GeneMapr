import { useState } from 'react'
import type { VariantFilters } from '../types/variant'

interface FilterPanelProps {
  filters: VariantFilters
  onFiltersChange: (filters: VariantFilters) => void
  onClearFilters: () => void
}

const CLINICAL_SIGNIFICANCE_OPTIONS = [
  'Pathogenic',
  'Likely pathogenic',
  'Uncertain significance',
  'Likely benign',
  'Benign',
]

const CONSEQUENCE_OPTIONS = [
  'missense_variant',
  'synonymous_variant',
  'stop_gained',
  'frameshift_variant',
  'splice_donor_variant',
  'splice_acceptor_variant',
  'inframe_deletion',
  'inframe_insertion',
]

export default function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateFilter = (key: keyof VariantFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleConsequence = (consequence: string) => {
    const current = filters.consequence || []
    const updated = current.includes(consequence)
      ? current.filter((c) => c !== consequence)
      : [...current, consequence]
    updateFilter('consequence', updated)
  }

  const hasActiveFilters =
    filters.gene ||
    filters.clinical_significance ||
    filters.af_min !== undefined ||
    filters.af_max !== undefined ||
    (filters.consequence && filters.consequence.length > 0) ||
    filters.risk_score_min !== undefined ||
    filters.risk_score_max !== undefined

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-slate-600 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
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
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-700">
          {/* Gene Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Gene
            </label>
            <input
              type="text"
              value={filters.gene || ''}
              onChange={(e) => updateFilter('gene', e.target.value || undefined)}
              placeholder="e.g., BRCA1"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Clinical Significance */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Clinical Significance
            </label>
            <select
              value={filters.clinical_significance || ''}
              onChange={(e) =>
                updateFilter('clinical_significance', e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              {CLINICAL_SIGNIFICANCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Allele Frequency Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Allele Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.af_min ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'af_min',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Min"
                min="0"
                max="1"
                step="0.001"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                value={filters.af_max ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'af_max',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Max"
                min="0"
                max="1"
                step="0.001"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Risk Score Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Risk Score
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.risk_score_min ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'risk_score_min',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Min"
                min="0"
                max="100"
                step="1"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                value={filters.risk_score_max ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'risk_score_max',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Max"
                min="0"
                max="100"
                step="1"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Consequence Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Consequence Type
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {CONSEQUENCE_OPTIONS.map((consequence) => (
                <label
                  key={consequence}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={(filters.consequence || []).includes(consequence)}
                    onChange={() => toggleConsequence(consequence)}
                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded
                      focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {consequence.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200
                rounded-md text-sm font-medium transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
