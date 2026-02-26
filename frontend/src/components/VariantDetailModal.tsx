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
    if (score === null) return 'bg-slate-100 text-slate-700'
    if (score >= 75) return 'bg-red-100 text-red-800'
    if (score >= 50) return 'bg-orange-100 text-orange-800'
    if (score >= 25) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Variant Details</h2>
            <p className="text-sm text-slate-600 mt-1">
              {variant.chrom}:{variant.pos} {variant.ref} → {variant.alt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-500"
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
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900">Risk Assessment</h3>
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
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        variant.risk_score >= 75
                          ? 'bg-red-500'
                          : variant.risk_score >= 50
                          ? 'bg-orange-500'
                          : variant.risk_score >= 25
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${variant.risk_score}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {variant.risk_score}
                </span>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {variant.ai_summary && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    AI-Generated Summary
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{variant.ai_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Basic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem label="Chromosome" value={variant.chrom} />
              <InfoItem label="Position" value={variant.pos.toLocaleString()} />
              <InfoItem label="Reference" value={variant.ref} />
              <InfoItem label="Alternate" value={variant.alt} />
              <InfoItem label="Gene" value={variant.gene || 'N/A'} />
              <InfoItem
                label="Consequence"
                value={variant.consequence?.replace(/_/g, ' ') || 'N/A'}
              />
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Clinical Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem
                label="Clinical Significance"
                value={variant.clinical_significance || 'N/A'}
                highlight={
                  variant.clinical_significance?.toLowerCase().includes('pathogenic')
                }
              />
              <InfoItem
                label="Allele Frequency"
                value={
                  variant.allele_frequency !== null
                    ? variant.allele_frequency.toExponential(3)
                    : 'N/A'
                }
              />
            </div>
          </div>

          {/* Raw Annotations */}
          {variant.raw_annotations &&
            Object.keys(variant.raw_annotations).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Raw Annotations
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-64 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(variant.raw_annotations, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          {/* Metadata */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">
              Created: {new Date(variant.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">ID: {variant.id}</p>
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
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`font-medium ${
          highlight ? 'text-red-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
