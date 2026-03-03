import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
    Monitor, Server, Database as DbIcon, Wifi,
    ArrowDown, Shield, Cpu, HardDrive
} from 'lucide-react'

const layers = [
    {
        id: 'frontend',
        icon: Monitor,
        title: 'Frontend Layer',
        subtitle: 'React 18 + TypeScript + Tailwind CSS',
        color: '#00d4ff',
        description: 'Modern SPA with component-based architecture, real-time state management, and responsive design across all device sizes.',
        modules: [
            { name: 'Upload Page', desc: 'VCF file upload with drag-and-drop, format validation, progress tracking' },
            { name: 'Variant Dashboard', desc: 'Sortable table with filters, summary cards, CSV export' },
            { name: 'Genome View', desc: 'Cytogenetic ideogram with overlay/histogram modes' },
            { name: 'Genome Analytics', desc: 'Interactive Recharts-based visualizations' },
            { name: 'Pharmacogenomics', desc: 'Metabolizer panels, drug interaction tables' },
            { name: 'Sample Comparison', desc: 'Multi-sample cohort comparison interface' },
            { name: 'Reports', desc: 'PDF generation and management UI' },
            { name: 'Settings', desc: 'User management, admin panel, LLM model config' },
        ],
    },
    {
        id: 'api',
        icon: Wifi,
        title: 'API Gateway',
        subtitle: 'HTTP / REST + JSON',
        color: '#94a3b8',
        description: 'RESTful API communication layer with JSON payloads, CORS handling, and standardized error responses.',
        modules: [
            { name: 'POST /variants/upload', desc: 'Upload and parse VCF files' },
            { name: 'GET /variants', desc: 'List variants with filtering & pagination' },
            { name: 'GET /variants/{id}', desc: 'Detailed single variant with annotations' },
            { name: 'GET /variants/export/csv', desc: 'Export filtered results as CSV' },
            { name: 'POST /reports/generate', desc: 'Generate PDF reports' },
            { name: 'GET /health/detailed', desc: 'System health and metrics' },
        ],
    },
    {
        id: 'backend',
        icon: Server,
        title: 'Backend Services',
        subtitle: 'FastAPI + Python 3.11',
        color: '#8b5cf6',
        description: 'High-performance async Python backend with service-oriented architecture. Each domain concern is isolated in its own service module.',
        modules: [
            { name: 'VCF Parser (pysam)', desc: 'Parses VCF/VCF.GZ files, extracts variants, validates formats' },
            { name: 'Annotation Service', desc: 'Orchestrates ClinVar, gnomAD, Ensembl lookups with caching' },
            { name: 'Scoring Engine', desc: 'Computes risk scores based on clinical + population data' },
            { name: 'AI Summary Service', desc: 'LLM integration for clinical interpretation generation' },
            { name: 'PGx Analyzer', desc: 'Pharmacogenomic metabolizer status computation' },
            { name: 'Report Generator', desc: 'PDF generation with template rendering' },
        ],
    },
    {
        id: 'external',
        icon: Shield,
        title: 'External APIs',
        subtitle: 'Rate-limited + Redis-cached (24hr TTL)',
        color: '#f59e0b',
        description: 'External genomic databases accessed through a unified caching layer to minimize latency and respect rate limits.',
        modules: [
            { name: 'ClinVar API', desc: 'Clinical significance classifications, review status, conditions' },
            { name: 'gnomAD API', desc: 'Population allele frequencies, coverage data' },
            { name: 'Ensembl REST API', desc: 'Gene annotations, transcript info, consequence predictions' },
        ],
    },
    {
        id: 'data',
        icon: HardDrive,
        title: 'Data Layer',
        subtitle: 'PostgreSQL + Redis',
        color: '#10b981',
        description: 'Dual-database architecture: relational storage for variant data and user accounts, key-value store for API response caching.',
        modules: [
            { name: 'PostgreSQL', desc: 'Variant records, samples, users, reports | SQLAlchemy ORM + Alembic migrations' },
            { name: 'Redis', desc: 'API response cache (24hr TTL) | Session data | Background task queue' },
        ],
    },
]

const dataFlowSteps = [
    { step: '1', label: 'User uploads VCF file', color: '#00d4ff' },
    { step: '2', label: 'Backend parses with pysam & extracts variants', color: '#8b5cf6' },
    { step: '3', label: 'Annotation service queries ClinVar, gnomAD, Ensembl (cached)', color: '#f59e0b' },
    { step: '4', label: 'Scoring engine calculates risk scores (0-100)', color: '#ff3366' },
    { step: '5', label: 'AI service generates clinical summaries', color: '#8b5cf6' },
    { step: '6', label: 'Results stored in PostgreSQL, displayed in UI', color: '#10b981' },
]

function LayerCard({ layer, index }: { layer: typeof layers[0]; index: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })
    const Icon = layer.icon

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            style={{ position: 'relative' }}
        >
            {/* Connecting arrow (not on last item) */}
            {index < layers.length - 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: -28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(15, 22, 41, 0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ArrowDown size={16} color="#64748b" />
                    </div>
                </div>
            )}

            <div
                className="glass-card"
                style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderColor: `${layer.color}20`,
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    background: `linear-gradient(135deg, ${layer.color}08, ${layer.color}04)`,
                    borderBottom: `1px solid ${layer.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${layer.color}15`,
                        border: `1px solid ${layer.color}28`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Icon size={22} color={layer.color} />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#e2e8f0',
                            marginBottom: 2,
                        }}>
                            {layer.title}
                        </h3>
                        <div style={{
                            fontSize: '0.78rem',
                            fontFamily: "'JetBrains Mono', monospace",
                            color: layer.color,
                            opacity: 0.8,
                        }}>
                            {layer.subtitle}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 32px' }}>
                    <p style={{
                        fontSize: '0.92rem',
                        color: '#94a3b8',
                        lineHeight: 1.7,
                        marginBottom: 20,
                    }}>
                        {layer.description}
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: 10,
                    }}>
                        {layer.modules.map(mod => (
                            <div
                                key={mod.name}
                                style={{
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                            >
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#e2e8f0',
                                    marginBottom: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}>
                                    <span style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: layer.color,
                                        opacity: 0.6,
                                        flexShrink: 0,
                                    }} />
                                    {mod.name}
                                </div>
                                <div style={{
                                    fontSize: '0.78rem',
                                    color: '#64748b',
                                    lineHeight: 1.5,
                                }}>
                                    {mod.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export function ArchitecturePage() {
    const headerRef = useRef(null)
    const headerInView = useInView(headerRef, { once: true, margin: '-50px' })
    const flowRef = useRef(null)
    const flowInView = useInView(flowRef, { once: true, margin: '-60px' })

    return (
        <div className="section" style={{ paddingTop: 60 }}>
            <div className="container">
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: 64 }}
                >
                    <span className="section-label">⬡ Architecture</span>
                    <h1 className="section-title" style={{ margin: '0 auto 20px' }}>
                        Production-Ready <span className="gradient-text">System Architecture</span>
                    </h1>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 700 }}>
                        A clean layered architecture with service separation, intelligent caching,
                        multi-source data integration, and async processing pipelines.
                    </p>
                </motion.div>

                {/* Architecture layers */}
                <div style={{
                    maxWidth: 900,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 48,
                }}>
                    {layers.map((layer, i) => (
                        <LayerCard key={layer.id} layer={layer} index={i} />
                    ))}
                </div>

                {/* Data Flow section */}
                <motion.div
                    ref={flowRef}
                    initial={{ opacity: 0, y: 30 }}
                    animate={flowInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ maxWidth: 900, margin: '80px auto 0' }}
                >
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#e2e8f0',
                        textAlign: 'center',
                        marginBottom: 40,
                    }}>
                        <span className="gradient-text">Data Flow</span> — From Upload to Insight
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: 16,
                    }}>
                        {dataFlowSteps.map((flow, i) => (
                            <motion.div
                                key={flow.step}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={flowInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="glass-card"
                                style={{
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 14,
                                }}
                            >
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: `${flow.color}20`,
                                    border: `1px solid ${flow.color}35`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: flow.color,
                                    flexShrink: 0,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}>
                                    {flow.step}
                                </div>
                                <p style={{
                                    fontSize: '0.88rem',
                                    color: '#94a3b8',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}>
                                    {flow.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech highlights */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={flowInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                        maxWidth: 900,
                        margin: '48px auto 0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16,
                    }}
                >
                    {[
                        { icon: Cpu, label: 'Async Processing', desc: 'Non-blocking I/O with FastAPI', color: '#8b5cf6' },
                        { icon: Shield, label: 'Intelligent Caching', desc: 'Redis 24hr TTL for external APIs', color: '#f59e0b' },
                        { icon: DbIcon, label: 'Relational Storage', desc: 'PostgreSQL with Alembic migrations', color: '#10b981' },
                    ].map(item => (
                        <div
                            key={item.label}
                            className="glass-card"
                            style={{ padding: '20px 24px', textAlign: 'center' }}
                        >
                            <item.icon size={24} color={item.color} style={{ marginBottom: 12 }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                                {item.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                {item.desc}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
