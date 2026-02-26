import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { uploadVCF } from '../api/variants'
import LoadingSpinner from '../components/LoadingSpinner'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const uploadMutation = useMutation({
    mutationFn: uploadVCF,
    onSuccess: () => {
      // Show success message briefly then redirect
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    },
  })

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      // Validate file extension
      const validExtensions = ['.vcf', '.vcf.gz']
      const fileName = selectedFile.name.toLowerCase()
      const isValid = validExtensions.some((ext) => fileName.endsWith(ext))

      if (isValid) {
        setFile(selectedFile)
        uploadMutation.reset()
      } else {
        uploadMutation.reset()
        uploadMutation.mutate(selectedFile) // This will trigger an error
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Upload VCF File</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Upload your genomic variant file for comprehensive annotation and interpretation
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive
              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-850 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcf.gz"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                Drop your VCF file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Supports .vcf and .vcf.gz files
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Display */}
        {file && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="w-full mt-6 bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600
            disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition-colors
            flex items-center justify-center space-x-2"
        >
          {uploadMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Processing VCF...</span>
            </>
          ) : (
            <span>Upload and Parse</span>
          )}
        </button>

        {/* Success Message */}
        {uploadMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg transition-colors duration-200">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Upload successful!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Parsed {uploadMutation.data?.variants_parsed} variants. Redirecting to
                  dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-200">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
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
                <p className="font-medium text-red-900 dark:text-red-100">Upload failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {uploadMutation.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Comprehensive Annotation</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enriched with Ensembl, ClinVar, and gnomAD data
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Risk Scoring</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Intelligent pathogenicity assessment for clinical significance
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">AI Insights</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Natural language summaries powered by advanced AI
          </p>
        </div>
      </div>
    </div>
  )
}
