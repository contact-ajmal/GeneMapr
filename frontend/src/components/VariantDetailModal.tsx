import type { Variant } from '../types/variant'

interface VariantDetailModalProps {
  variant: Variant | null
  onClose: () => void
}

export default function VariantDetailModal({
  variant,
  onClose,
}: VariantDetailModalProps) {
  if (!variant) return null

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
    if (score >= 75) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    if (score >= 50) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
    if (score >= 25) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
  }

  const getRiskLabel = (score: number | null) => {
    if (score === null) return 'Unknown'
    if (score >= 75) return 'High Risk'
    if (score >= 50) return 'Moderate Risk'
    if (score >= 25) return 'Low-Moderate Risk'
    return 'Low Risk'
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 transition-colors duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Variant Details</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {variant.chrom}:{variant.pos} {variant.ref} → {variant.alt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Score */}
          {variant.risk_score !== null && (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-lg p-5 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Risk Assessment</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(
                    variant.risk_score
                  )}`}
                >
                  {getRiskLabel(variant.risk_score)}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        variant.risk_score >= 75
                          ? 'bg-red-500 dark:bg-red-400'
                          : variant.risk_score >= 50
                          ? 'bg-orange-500 dark:bg-orange-400'
                          : variant.risk_score >= 25
                          ? 'bg-yellow-500 dark:bg-yellow-400'
                          : 'bg-green-500 dark:bg-green-400'
                      }`}
                      style={{ width: `${variant.risk_score}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {variant.risk_score}
                </span>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {variant.ai_summary && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-5 border border-purple-200 dark:border-purple-800 transition-colors duration-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    AI-Generated Summary
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{variant.ai_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Basic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem label="Chromosome" value={variant.chrom} />
              <InfoItem label="Position" value={variant.pos.toLocaleString()} />
              <InfoItem label="Reference" value={variant.ref} />
              <InfoItem label="Alternate" value={variant.alt} />
              <InfoItem label="Gene" value={variant.gene_symbol || 'N/A'} />
              <InfoItem
                label="Consequence"
                value={variant.consequence?.replace(/_/g, ' ') || 'N/A'}
              />
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Clinical Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem
                label="Clinical Significance"
                value={variant.clinvar_significance || 'N/A'}
                highlight={
                  variant.clinvar_significance?.toLowerCase().includes('pathogenic')
                }
              />
              <InfoItem
                label="Allele Frequency"
                value={
                  variant.allele_freq !== null
                    ? variant.allele_freq.toExponential(3)
                    : 'N/A'
                }
              />
            </div>
          </div>

          {/* Additional Information */}
          {(variant.rs_id || variant.transcript_id || variant.protein_change) && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Additional Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {variant.rs_id && <InfoItem label="dbSNP ID" value={variant.rs_id} />}
                {variant.transcript_id && <InfoItem label="Transcript" value={variant.transcript_id} />}
                {variant.protein_change && <InfoItem label="Protein Change" value={variant.protein_change} />}
                {variant.gnomad_af !== null && (
                  <InfoItem label="gnomAD AF" value={variant.gnomad_af.toExponential(3)} />
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Created: {new Date(variant.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID: {variant.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InfoItemProps {
  label: string
  value: string | number
  highlight?: boolean
}

function InfoItem({ label, value, highlight }: InfoItemProps) {
  return (
    <div className="bg-white dark:bg-slate-850 rounded-lg p-3 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p
        className={`font-medium ${
          highlight ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
