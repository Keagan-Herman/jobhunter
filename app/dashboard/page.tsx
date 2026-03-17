'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Job = {
    id: string
    title: string
    company: string
    location: string
    description: string
    salary_min: number | null
    salary_max: number | null
    url: string
    stack: string[]
    score: number
    score_reason: string
    status: 'pending' | 'applied' | 'skipped' | 'interviewing'
    fetched_at: string
    cover_letter?: string
    cover_letter_id?: string
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 85 ? '#00ff87' : score >= 70 ? '#ffd60a' : '#ff6b6b'
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: `${color}18`, border: `1px solid ${color}40`,
            borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
            fontWeight: '700', color, fontFamily: "'DM Mono', monospace"
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            {score}%
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string, label: string }> = {
        pending: { color: '#ffd60a', label: 'PENDING' },
        applied: { color: '#00ff87', label: 'APPLIED' },
        skipped: { color: '#444', label: 'SKIPPED' },
        interviewing: { color: '#00d4ff', label: 'INTERVIEW' },
    }
    const { color, label } = map[status] || map.pending
    return (
        <span style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
            color, fontFamily: "'DM Mono', monospace"
        }}>{label}</span>
    )
}

export default function DashboardPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'skipped'>('pending')
    const [scanResult, setScanResult] = useState<string>('')
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [user, setUser] = useState<any>(null)

    const supabase = createClient()
    const router = useRouter()

    const fetchJobs = useCallback(async () => {
        const { data } = await supabase
            .from('jobs_with_cover')
            .select('*')
            .order('score', { ascending: false })
        if (data) setJobs(data as Job[])
        setLoading(false)
    }, [])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/login')
            else setUser(user)
        })
        fetchJobs()
    }, [])

    const handleScan = async () => {
        setScanning(true)
        setScanResult('')
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            if (data.success) {
                setScanResult(`✓ Found ${data.found} jobs, saved ${data.saved} new`)
                await fetchJobs()
            } else {
                setScanResult(`✗ ${data.error}`)
            }
        } catch {
            setScanResult('✗ Scan failed')
        }
        setScanning(false)
    }

    const handleGenerateCoverLetter = async () => {
        if (!selected) return
        setGenerating(true)
        setCoverLetter('')
        try {
            const res = await fetch('/api/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: selected.id })
            })
            const data = await res.json()
            if (data.success) {
                setCoverLetter(data.coverLetter.content)
                setJobs(prev => prev.map(j =>
                    j.id === selected.id
                        ? { ...j, cover_letter: data.coverLetter.content }
                        : j
                ))
            }
        } catch {
            setCoverLetter('Failed to generate cover letter.')
        }
        setGenerating(false)
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status']) => {
        setUpdatingStatus(true)
        await supabase
            .from('jobs')
            .update({
                status,
                ...(status === 'applied' ? { applied_at: new Date().toISOString() } : {})
            })
            .eq('id', jobId)

        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected(prev => prev ? { ...prev, status } : null)
        setUpdatingStatus(false)
    }

    const handleSelectJob = (job: Job) => {
        setSelected(job)
        setCoverLetter(job.cover_letter || '')
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const filteredJobs = jobs.filter(j => j.status === activeTab)
    const stats = {
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#080812',
            fontFamily: "'DM Sans', sans-serif", color: '#e0e0f0'
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 4px; }
        .job-row:hover { background: #111128 !important; cursor: pointer; }
        .btn-primary { transition: all 0.2s ease !important; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-ghost:hover { background: #1a1a3a !important; }
        .tab-btn:hover { color: #888 !important; }
        .stat-card:hover { border-color: #2a2a4a !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .spinning { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .detail-panel { display: none !important; }
          .detail-panel.mobile-show { display: flex !important; position: fixed !important; inset: 0 !important; z-index: 100 !important; margin: 0 !important; border-radius: 0 !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .header-row { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
        }
      `}</style>

            {/* Background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(#00ff870a 1px, transparent 1px), linear-gradient(90deg, #00ff870a 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)'
            }} />
            <div style={{
                position: 'fixed', top: '-300px', right: '-300px', width: '700px', height: '700px',
                borderRadius: '50%', background: 'radial-gradient(circle, #00ff8710 0%, transparent 70%)',
                zIndex: 0, pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

                {/* Header */}
                <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 4vw, 32px)',
                            fontWeight: '800', color: '#fff', letterSpacing: '-0.5px'
                        }}>
                            Job<span style={{ color: '#00ff87' }}>Hunter</span>
                        </h1>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#0d0d20', border: '1px solid #1e1e38',
                            borderRadius: '20px', padding: '4px 12px'
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff87', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '11px', color: '#00ff87', fontFamily: "'DM Mono', monospace" }}>LIVE</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="btn-primary"
                            style={{
                                background: scanning ? '#0d0d20' : '#00ff87',
                                border: scanning ? '1px solid #2a2a4a' : 'none',
                                color: scanning ? '#00ff87' : '#0a0a1a',
                                padding: '9px 18px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '700', letterSpacing: '1px',
                                cursor: scanning ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {scanning ? (
                                <>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #00ff87', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinning" />
                                    Scanning...
                                </>
                            ) : '▶ Scan Jobs'}
                        </button>
                        <button
                            onClick={() => router.push('/profile')}
                            className="btn-ghost"
                            style={{
                                background: 'transparent', border: '1px solid #1e1e38',
                                color: '#444', padding: '9px 14px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Profile
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="btn-ghost"
                            style={{
                                background: 'transparent', border: '1px solid #1e1e38',
                                color: '#444', padding: '9px 14px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Scan result toast */}
                {scanResult && (
                    <div style={{
                        background: scanResult.startsWith('✓') ? '#00ff8715' : '#ff6b6b15',
                        border: `1px solid ${scanResult.startsWith('✓') ? '#00ff8730' : '#ff6b6b30'}`,
                        borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
                        fontSize: '13px', color: scanResult.startsWith('✓') ? '#00ff87' : '#ff6b6b',
                        fontFamily: "'DM Mono', monospace"
                    }}>
                        {scanResult}
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {[
                        { label: 'Total Jobs', value: stats.total, color: '#e0e0f0' },
                        { label: 'Pending', value: stats.pending, color: '#ffd60a' },
                        { label: 'Applied', value: stats.applied, color: '#00ff87' },
                        { label: 'Interviews', value: stats.interviewing, color: '#00d4ff' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{
                            background: '#0d0d20', border: '1px solid #1a1a32',
                            borderRadius: '10px', padding: '14px 16px',
                            transition: 'border-color 0.2s'
                        }}>
                            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '6px' }}>{s.label}</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid #1a1a32' }}>
                    {(['pending', 'applied', 'skipped'] as const).map(tab => (
                        <button
                            key={tab}
                            className="tab-btn"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none', border: 'none',
                                color: activeTab === tab ? '#00ff87' : '#444',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '600', letterSpacing: '1px', padding: '10px 16px',
                                cursor: 'pointer', textTransform: 'uppercase',
                                borderBottom: activeTab === tab ? '2px solid #00ff87' : '2px solid transparent',
                                marginBottom: '-1px', transition: 'color 0.2s'
                            }}
                        >
                            {tab} ({jobs.filter(j => j.status === tab).length})
                        </button>
                    ))}
                </div>

                {/* Main grid */}
                <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '14px' }}>

                    {/* Job list */}
                    <div style={{ background: '#0d0d20', border: '1px solid #1a1a32', borderRadius: '12px', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                                Loading jobs...
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                                    {activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '📨' : '🗑️'}
                                </div>
                                <div style={{ color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>
                                    {activeTab === 'pending' ? 'No pending jobs — run a scan!' : `No ${activeTab} jobs yet`}
                                </div>
                            </div>
                        ) : (
                            filteredJobs.map((job, i) => (
                                <div
                                    key={job.id}
                                    className="job-row fade-in"
                                    onClick={() => handleSelectJob(job)}
                                    style={{
                                        padding: '14px 16px',
                                        borderBottom: i < filteredJobs.length - 1 ? '1px solid #0f0f22' : 'none',
                                        background: selected?.id === job.id ? '#111128' : 'transparent',
                                        borderLeft: selected?.id === job.id ? '3px solid #00ff87' : '3px solid transparent',
                                        transition: 'all 0.15s ease',
                                        animationDelay: `${i * 0.05}s`, opacity: 0,
                                        animationFillMode: 'forwards'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <div style={{ flex: 1, marginRight: '10px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#e0e0f0', marginBottom: '2px' }}>{job.title}</div>
                                            <div style={{ fontSize: '12px', color: '#555' }}>{job.company} · {job.location}</div>
                                        </div>
                                        <ScoreBadge score={job.score} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {(job.stack || []).slice(0, 3).map(s => (
                                                <span key={s} style={{
                                                    fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                                                    background: '#1a1a3a', color: '#7b61ff',
                                                    fontFamily: "'DM Mono', monospace"
                                                }}>{s}</span>
                                            ))}
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    {job.score_reason && (
                                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#444', fontStyle: 'italic' }}>
                                            {job.score_reason}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detail panel */}
                    {selected && (
                        <div
                            className={`detail-panel fade-in ${selected ? 'mobile-show' : ''}`}
                            style={{
                                background: '#0d0d20', border: '1px solid #1a1a32',
                                borderRadius: '12px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', maxHeight: '80vh'
                            }}
                        >
                            {/* Job header */}
                            <div style={{ padding: '16px', borderBottom: '1px solid #1a1a32', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '3px' }}>{selected.title}</h3>
                                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                                            {selected.company} · {selected.location}
                                        </div>
                                        {(selected.salary_min || selected.salary_max) && (
                                            <div style={{ fontSize: '12px', color: '#00ff87', fontFamily: "'DM Mono', monospace" }}>
                                                R{selected.salary_min?.toLocaleString()} – R{selected.salary_max?.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setSelected(null); setCoverLetter('') }}
                                        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 0 0 8px' }}
                                    >×</button>
                                </div>

                                {/* Stack */}
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {(selected.stack || []).map(s => (
                                        <span key={s} style={{
                                            fontSize: '11px', padding: '3px 8px', borderRadius: '5px',
                                            background: '#1a1a3a', color: '#7b61ff',
                                            fontFamily: "'DM Mono', monospace"
                                        }}>{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a32', flexShrink: 0 }}>
                                <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>
                                    {selected.description?.slice(0, 300)}...
                                </p>
                                {selected.url && (
                                    <a
                                        href={selected.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '11px', color: '#00ff87', fontFamily: "'DM Mono', monospace", textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}
                                    >
                                        View full listing →
                                    </a>
                                )}
                            </div>

                            {/* Cover letter */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
                                {!coverLetter && !generating && (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#2a2a4a' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>✍️</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333' }}>
                                            Generate a tailored cover letter
                                        </div>
                                    </div>
                                )}
                                {generating && (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #00ff87', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinning" />
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#444', marginTop: '8px' }}>Generating...</div>
                                    </div>
                                )}
                                {coverLetter && !generating && (
                                    <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#bbb', whiteSpace: 'pre-wrap' }}>
                                        {coverLetter}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '14px 16px', borderTop: '1px solid #1a1a32', display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                                {!coverLetter && (
                                    <button
                                        onClick={handleGenerateCoverLetter}
                                        disabled={generating}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, background: '#00ff87', border: 'none',
                                            color: '#0a0a1a', padding: '10px', borderRadius: '8px',
                                            fontWeight: '700', fontFamily: "'DM Mono', monospace",
                                            fontSize: '11px', letterSpacing: '1px',
                                            cursor: generating ? 'not-allowed' : 'pointer',
                                            opacity: generating ? 0.6 : 1, textTransform: 'uppercase'
                                        }}
                                    >
                                        ⚡ Generate Cover Letter
                                    </button>
                                )}
                                {coverLetter && (
                                    <button
                                        onClick={handleGenerateCoverLetter}
                                        disabled={generating}
                                        className="btn-ghost"
                                        style={{
                                            background: '#12122a', border: '1px solid #2a2a4a',
                                            color: '#666', padding: '10px 14px', borderRadius: '8px',
                                            fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        ↺ Regenerate
                                    </button>
                                )}
                                {selected.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(selected.id, 'applied')}
                                            disabled={updatingStatus}
                                            className="btn-primary"
                                            style={{
                                                flex: 1, background: '#00ff87', border: 'none',
                                                color: '#0a0a1a', padding: '10px', borderRadius: '8px',
                                                fontWeight: '700', fontFamily: "'DM Mono', monospace",
                                                fontSize: '11px', letterSpacing: '1px',
                                                cursor: 'pointer', textTransform: 'uppercase'
                                            }}
                                        >
                                            ✓ Mark Applied
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selected.id, 'skipped')}
                                            disabled={updatingStatus}
                                            className="btn-ghost"
                                            style={{
                                                background: '#12122a', border: '1px solid #2a2a4a',
                                                color: '#555', padding: '10px 14px', borderRadius: '8px',
                                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            Skip
                                        </button>
                                    </>
                                )}
                                {selected.status === 'applied' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selected.id, 'interviewing')}
                                        disabled={updatingStatus}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, background: '#00d4ff', border: 'none',
                                            color: '#0a0a1a', padding: '10px', borderRadius: '8px',
                                            fontWeight: '700', fontFamily: "'DM Mono', monospace",
                                            fontSize: '11px', letterSpacing: '1px',
                                            cursor: 'pointer', textTransform: 'uppercase'
                                        }}
                                    >
                                        🎯 Got Interview!
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}