import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const techCategories = [
    {
        category: 'Frontend', color: '#00d4ff',
        description: 'Modern, responsive single-page application',
        items: [
            { name: 'React 18', icon: '⚛️', desc: 'Component-based UI with hooks' },
            { name: 'TypeScript', icon: '📘', desc: 'Full type safety across codebase' },
            { name: 'Tailwind CSS', icon: '🎨', desc: 'Utility-first CSS with custom tokens' },
            { name: 'Recharts', icon: '📊', desc: 'Composable charting for analytics' },
            { name: 'Framer Motion', icon: '✨', desc: 'Production-ready animations' },
            { name: 'React Router', icon: '🔗', desc: 'Client-side routing' },
        ],
    },
    {
        category: 'Backend', color: '#10b981',
        description: 'High-performance async Python API',
        items: [
            { name: 'Python 3.11', icon: '🐍', desc: 'Latest Python with perf improvements' },
            { name: 'FastAPI', icon: '⚡', desc: 'Modern async web framework' },
            { name: 'pysam', icon: '🧬', desc: 'C-extension for VCF/BAM parsing' },
            { name: 'SQLAlchemy 2.0', icon: '📦', desc: 'Python ORM toolkit' },
            { name: 'Alembic', icon: '🔨', desc: 'Database migration tool' },
            { name: 'Pydantic', icon: '✅', desc: 'Data validation via type hints' },
        ],
    },
    {
        category: 'Infrastructure', color: '#f59e0b',
        description: 'Containerized deployment stack',
        items: [
            { name: 'Docker', icon: '🐳', desc: 'Multi-stage containerization' },
            { name: 'Docker Compose', icon: '📋', desc: 'Multi-container orchestration' },
            { name: 'PostgreSQL', icon: '🐘', desc: 'Enterprise relational database' },
            { name: 'Redis', icon: '🔴', desc: 'In-memory cache & sessions' },
        ],
    },
    {
        category: 'External APIs', color: '#8b5cf6',
        description: 'Genomic databases & AI',
        items: [
            { name: 'ClinVar', icon: '🏥', desc: 'Clinical variant interpretations' },
            { name: 'gnomAD', icon: '🧪', desc: 'Population allele frequencies' },
            { name: 'Ensembl', icon: '🧬', desc: 'Gene annotations & predictions' },
            { name: 'LLM APIs', icon: '🤖', desc: 'AI clinical summaries' },
        ],
    },
    {
        category: 'Testing & QA', color: '#ec4899',
        description: 'Comprehensive test coverage',
        items: [
            { name: 'pytest', icon: '🧪', desc: 'Backend unit/integration tests' },
            { name: 'Vitest', icon: '⚡', desc: 'Fast frontend unit tests' },
            { name: 'httpx', icon: '📡', desc: 'Async API integration testing' },
        ],
    },
]

export function TechStackPage() {
    const headerRef = useRef(null)
    const headerInView = useInView(headerRef, { once: true, margin: '-50px' })

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
                    <span className="section-label">◉ Tech Stack</span>
                    <h1 className="section-title" style={{ margin: '0 auto 20px' }}>
                        Built with <span className="gradient-text">Modern Technologies</span>
                    </h1>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 700 }}>
                        Enterprise-grade technologies powering every layer — from type-safe React to
                        async Python services and containerized infrastructure.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1000, margin: '0 auto' }}>
                    {techCategories.map((cat, catIdx) => (
                        <TechCategory key={cat.category} cat={cat} catIdx={catIdx} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function TechCategory({ cat, catIdx }: { cat: typeof techCategories[0]; catIdx: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: catIdx * 0.08 }}
            className="glass-card"
            style={{ padding: 0, overflow: 'hidden', borderColor: `${cat.color}15` }}
        >
            <div style={{
                padding: '20px 32px',
                background: `linear-gradient(135deg, ${cat.color}08, transparent)`,
                borderBottom: `1px solid ${cat.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, boxShadow: `0 0 12px ${cat.color}50` }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", color: cat.color, margin: 0 }}>
                        {cat.category}
                    </h3>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>{cat.description}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.03)' }}>
                {cat.items.map((item, idx) => (
                    <motion.div
                        key={item.name}
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3, delay: catIdx * 0.08 + idx * 0.04 }}
                        style={{ padding: '18px 24px', background: 'var(--bg-body)', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'background 0.2s', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${cat.color}06`}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-body)'}
                    >
                        <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                        <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
