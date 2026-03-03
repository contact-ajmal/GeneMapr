import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Copy, Check, Terminal, ExternalLink, CheckCircle2 } from 'lucide-react'

const steps = [
    { step: 1, title: 'Clone the repository', command: 'git clone https://github.com/contact-ajmal/GeneMapr.git\ncd GeneMapr' },
    { step: 2, title: 'Configure environment', command: 'cp .env.example .env\n# Edit .env and add your API keys' },
    { step: 3, title: 'Start with Docker', command: 'docker-compose up --build' },
    { step: 4, title: 'Open the app', command: '# Frontend:  http://localhost:5173\n# Backend:   http://localhost:8000/docs' },
]

const prereqs = [
    { name: 'Docker & Docker Compose', required: true },
    { name: 'Git', required: true },
    { name: 'Claude API Key (for AI summaries)', required: false },
    { name: '4GB+ RAM recommended', required: false },
]

function CodeBlock({ command, label }: { command: string; label: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => { navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div style={{ background: '#0d1117', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    <Terminal size={14} />{label}
                </div>
                <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '0.75rem', color: copied ? '#10b981' : '#64748b', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre style={{ padding: '16px 20px', fontSize: '0.85rem', lineHeight: 1.6, color: '#e2e8f0', overflow: 'auto', margin: 0 }}>
                {command.split('\n').map((line, i) => (
                    <div key={i}>{line.startsWith('#') ? <span style={{ color: '#4a5568' }}>{line}</span> : <><span style={{ color: '#00d4ff' }}>$ </span><span>{line}</span></>}</div>
                ))}
            </pre>
        </div>
    )
}

export function GetStartedPage() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    return (
        <div className="section" style={{ paddingTop: 60 }} ref={ref}>
            <div className="container">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <span className="section-label">▸ Get Started</span>
                    <h1 className="section-title" style={{ margin: '0 auto 20px' }}>Up and Running in <span className="gradient-text">Minutes</span></h1>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 700 }}>GeneMapr uses Docker for easy, reproducible setup. Clone, configure, and launch with just a few commands.</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, maxWidth: 1000, margin: '0 auto' }} className="gs-grid">
                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {steps.map((s, i) => (
                            <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #0099cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#0a0e1a', flexShrink: 0 }}>{s.step}</div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{s.title}</h3>
                                </div>
                                <div style={{ marginLeft: 48 }}><CodeBlock command={s.command} label={`Step ${s.step}`} /></div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Sidebar */}
                    <div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }} className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>📋 Prerequisites</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {prereqs.map(p => (
                                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                                        <CheckCircle2 size={16} color={p.required ? '#10b981' : '#64748b'} />
                                        <span style={{ color: p.required ? '#e2e8f0' : '#94a3b8' }}>{p.name}</span>
                                        {!p.required && <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>optional</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="glass-card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>🔗 Quick Links</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Full Documentation', href: 'https://github.com/contact-ajmal/GeneMapr#readme' },
                                    { label: 'API Reference', href: 'https://github.com/contact-ajmal/GeneMapr#api-documentation' },
                                    { label: 'Sample VCF Data', href: 'https://github.com/contact-ajmal/GeneMapr/tree/main/test_data' },
                                    { label: 'Report Issues', href: 'https://github.com/contact-ajmal/GeneMapr/issues' },
                                ].map(link => (
                                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '0.85rem', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        <ExternalLink size={13} />{link.label}
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.8 }} style={{ textAlign: 'center', marginTop: 64 }}>
                    <a href="https://github.com/contact-ajmal/GeneMapr" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '1rem', padding: '16px 32px' }}>
                        View Full Repository <ExternalLink size={16} />
                    </a>
                </motion.div>
            </div>

            <style>{`@media (max-width: 768px) { .gs-grid { grid-template-columns: 1fr !important; } }`}</style>
        </div>
    )
}
