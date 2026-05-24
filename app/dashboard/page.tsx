'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { JobCard } from '@/components/dashboard/JobCard'
import { SkeletonRow } from '@/components/dashboard/Skeleton'
import { List } from 'react-window'
import { DetailPanel } from '@/components/dashboard/DetailPanel'
import { SkipModal } from '@/components/dashboard/SkipModal'

import { Job, Profile } from '@/types'

export default function DashboardPage() {
    // ── State ────────────────────────────────────────────────────────
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'interviewing' | 'skipped'>('pending')
    const [scanResult, setScanResult] = useState('')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [error, setError] = useState('')
    const [firstTime, setFirstTime] = useState(false)

    // Skip modal
    const [showSkipModal, setShowSkipModal] = useState(false)
    const [skipJobId, setSkipJobId] = useState<string | null>(null)

    // Rescore
    const [rescoring, setRescoring] = useState(false)
    const [rescoreResult, setRescoreResult] = useState('')

    const [listHeight, setListHeight] = useState(600)

    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    // ── Data fetching ─────────────────────────────────────────────────
    const fetchJobs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('jobs_with_cover')
                .select('*')
                .order('score', { ascending: false })

            if (error) throw error
            if (data) setJobs(data as Job[])
        } catch {
            setError('Failed to load jobs. Please refresh.')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.search.includes('firstTime=true')) {
                setFirstTime(true)
            }
            const handleResize = () => setListHeight(window.innerHeight - 380)
            handleResize()
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/login')
            else {
                supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
                    if (data) setProfile(data as Profile)
                })
            }
        })
        fetchJobs()
    }, [supabase, router, fetchJobs])

    // Auto-dismiss results
    useEffect(() => {
        if (scanResult) {
            const timer = setTimeout(() => setScanResult(''), 5000)
            return () => clearTimeout(timer)
        }
    }, [scanResult])

    useEffect(() => {
        if (rescoreResult) {
            const timer = setTimeout(() => setRescoreResult(''), 5000)
            return () => clearTimeout(timer)
        }
    }, [rescoreResult])

    // ── Handlers ──────────────────────────────────────────────────────
    const handleScan = async () => {
        setScanning(true)
        setScanResult('')
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            if (res.ok && data.success) {
                setScanResult(`✓ Found ${data.found} jobs, saved ${data.saved} new`)
                await fetchJobs()
            } else {
                setScanResult(`✗ ${data.error || 'Scan failed'}`)
            }
        } catch {
            setScanResult('✗ Scan failed')
        }
        setScanning(false)
    }

    const handleRescore = async () => {
        setRescoring(true)
        setRescoreResult('')
        try {
            const res = await fetch('/api/rescore', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setRescoreResult(`✓ Rescored ${data.rescored} jobs`)
                await fetchJobs()
            } else {
                setRescoreResult(data.message || `✗ ${data.error || 'Rescore failed'}`)
            }
        } catch {
            setRescoreResult('✗ Rescore failed')
        }
        setRescoring(false)
    }

    const handleGenerateCoverLetter = async (content: string) => {
        if (!selected) return

        // If content is empty, it means streaming started
        if (!content) {
            setGenerating(true)
            return
        }

        // If content is provided, streaming finished
        try {
            const updatedJob: Job = {
                ...selected,
                cover_letter: content
            }
            setJobs(prev => prev.map(j => j.id === selected.id ? updatedJob : j))
            setSelected(updatedJob)
        } catch {
            setError('Failed to update cover letter.')
        }
        setGenerating(false)
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status'], reason?: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected(prev => prev ? { ...prev, status } : null)

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: status === 'skipped' ? 'skipped' : 'applied', reason })
            })
        } catch {
            await fetchJobs()
        }
    }

    const handleSaveTracking = async (trackingData: {
        notes: string;
        interview_date: string;
        contact_name: string;
        contact_email: string;
        offer_amount: number;
        follow_up_date: string;
    }) => {
        if (!selected) return
        const { error } = await supabase
            .from('jobs')
            .update({
                notes: trackingData.notes ?? null,
                interview_date: trackingData.interview_date ?? null,
                contact_name: trackingData.contact_name ?? null,
                contact_email: trackingData.contact_email ?? null,
                offer_amount: trackingData.offer_amount ?? null,
                follow_up_date: trackingData.follow_up_date ?? null,
            })
            .eq('id', selected.id)

        if (error) throw error

        setJobs(prev => prev.map(j => j.id === selected.id ? { ...j, ...trackingData } : j))
        setSelected(prev => prev ? { ...prev, ...trackingData } : null)
    }

    const handleCoverLetterOutcome = async (outcome: string) => {
        if (!selected?.cover_letter_id) return
        await fetch('/api/cover-letter/outcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coverLetterId: selected.cover_letter_id,
                jobId: selected.id,
                outcome
            })
        })
    }

    const handleInterviewOutcome = async (outcome: string) => {
        if (!selected) return
        await fetch('/api/interview-outcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: selected.id, outcome, interviewRound: 1 })
        })
        setJobs(prev => prev.map(j =>
            j.id === selected.id
                ? { ...j, status: outcome === 'offer' ? 'interviewing' : 'skipped' } as Job
                : j
        ))
        setSelected(null)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // ── Derived state ─────────────────────────────────────────────────
    const filteredJobs = useMemo(() => jobs.filter(j => j.status === activeTab), [jobs, activeTab])

    const stats = useMemo(() => ({
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }), [jobs])

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#080812] text-[#e0e0f0] font-sans selection:bg-[#00ff8720] selection:text-[#00ff87]">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]"
                 style={{ backgroundImage: 'linear-gradient(#00ff8710 1px, transparent 1px), linear-gradient(90deg, #00ff8710 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="fixed -top-[20rem] -right-[20rem] w-[60rem] h-[60rem] rounded-full bg-radial-gradient from-[#00ff8708] to-transparent z-0 pointer-events-none blur-[100px]" />
            <div className="fixed -bottom-[30rem] -left-[20rem] w-[70rem] h-[70rem] rounded-full bg-radial-gradient from-[#7b61ff05] to-transparent z-0 pointer-events-none blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-8 space-y-12">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <h1 className="font-syne text-4xl font-extrabold tracking-tight text-white flex items-center gap-1">
                            Job<span className="text-[#00ff87] text-glow-green">Hunter</span>
                        </h1>
                        <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 rounded-full px-4 py-1.5 shadow-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse shadow-[0_0_8px_#00ff87]" />
                            <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-[2px] uppercase">System Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <button onClick={handleScan} disabled={scanning}
                                className={`group relative flex items-center gap-2 px-6 py-3 rounded-2xl font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all duration-300 shadow-[0_0_30px_-5px_#00ff8730] overflow-hidden
                                ${scanning ? 'bg-white/[0.03] border border-white/5 text-[#00ff87] cursor-not-allowed' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110 active:scale-95'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            {scanning ? (
                                <><span className="w-3.5 h-3.5 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Scanning...</>
                            ) : '▶ Scan Jobs'}
                        </button>

                        <button onClick={handleRescore} disabled={rescoring}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[#666] font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-50 hover:border-white/10 active:scale-95">
                            {rescoring ? (
                                <><span className="w-3.5 h-3.5 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Rescoring...</>
                            ) : '↻ Rescore'}
                        </button>

                        <div className="h-8 w-[1px] bg-white/5 mx-2" />

                        <button onClick={() => router.push('/profile')} className="px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[#555] font-mono text-[11px] font-bold tracking-[1px] hover:bg-white/[0.05] hover:text-white transition-all active:scale-95">Profile</button>
                        <button onClick={handleSignOut} className="px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[#555] font-mono text-[11px] font-bold tracking-[1px] hover:bg-white/[0.05] hover:text-white transition-all active:scale-95">Sign Out</button>
                    </div>
                </header>

                {/* Toasts & Alerts */}
                <div className="space-y-4">
                    {error && (
                        <div className="bg-[#ff6b6b]/5 border border-[#ff6b6b]/20 rounded-2xl p-5 flex justify-between items-center animate-in slide-in-from-top-4 duration-500 shadow-xl">
                            <span className="text-[#ff6b6b] text-sm font-mono font-medium tracking-tight flex items-center gap-3">
                                <span className="text-xl">⚠️</span> {error}
                            </span>
                            <button onClick={() => { setError(''); fetchJobs() }} className="bg-[#ff6b6b]/10 text-[#ff6b6b] text-[10px] font-mono font-bold tracking-widest uppercase px-4 py-2 rounded-xl hover:bg-[#ff6b6b]/20 transition-all">Retry &rarr;</button>
                        </div>
                    )}
                    {scanResult && (
                        <div className={`rounded-2xl p-5 text-sm font-mono font-medium animate-in slide-in-from-top-4 duration-500 shadow-xl border ${scanResult.startsWith('✓') ? 'bg-[#00ff87]/5 border-[#00ff87]/20 text-[#00ff87]' : 'bg-[#ff6b6b]/5 border-[#ff6b6b]/20 text-[#ff6b6b]'}`}>
                             <div className="flex items-center gap-3">
                                <span className="text-xl">{scanResult.startsWith('✓') ? '✨' : '❌'}</span>
                                {scanResult}
                             </div>
                        </div>
                    )}
                    {rescoreResult && (
                        <div className={`rounded-2xl p-5 text-sm font-mono font-medium animate-in slide-in-from-top-4 duration-500 shadow-xl border ${rescoreResult.startsWith('✓') ? 'bg-[#00ff87]/5 border-[#00ff87]/20 text-[#00ff87]' : 'bg-[#ff6b6b]/5 border-[#ff6b6b]/20 text-[#ff6b6b]'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔄</span>
                                {rescoreResult}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── First time banner ── */}
                {firstTime && (
                    <div className="bg-glass border-premium rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff87]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="font-syne font-extrabold text-2xl text-white mb-2 tracking-tight">🎉 Welcome to the future of search</div>
                            <div className="text-[14px] text-[#888] font-medium max-w-[500px] leading-relaxed">Your profile is calibrated. Run your first intelligent scan to find high-impact roles matching your career trajectory.</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                                className="relative z-10 bg-[#00ff87] text-[#0a0a1a] px-8 py-4 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:brightness-110 transition-all shadow-[0_15px_30px_rgba(0,255,135,0.2)] active:scale-95">▶ Start Intelligent Scan</button>
                    </div>
                )}

                <StatsGrid stats={stats} />

                {/* ── Tabs & Content ── */}
                <div className="space-y-8">
                    <div className="flex gap-2 border-b border-white/5 pb-px">
                        {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                            <button key={tab}
                                    onClick={() => { setActiveTab(tab) }}
                                    className={`px-8 py-5 font-mono text-[10px] font-bold tracking-[3px] uppercase transition-all relative
                                    ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#777]'}`}>
                                {tab} <span className={`ml-2 px-2 py-0.5 rounded-md text-[9px] ${activeTab === tab ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-white/5 text-[#555]'}`}>{jobs.filter(j => j.status === tab).length}</span>
                                {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#00ff87] shadow-[0_0_15px_#00ff87]" />}
                            </button>
                        ))}
                    </div>

                    <div className={`grid gap-10 ${selected ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

                        {/* Job list container */}
                        <div className="bg-glass border-premium rounded-[2.5rem] overflow-hidden h-[calc(100vh-380px)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative">
                            {loading ? (
                                <div className="overflow-hidden flex-1">
                                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="py-24 text-center flex-1 flex flex-col items-center justify-center space-y-6">
                                    <div className="text-6xl mb-2 filter grayscale opacity-20 transform hover:scale-110 transition-transform duration-500">{activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '📨' : activeTab === 'interviewing' ? '🎯' : '🗑️'}</div>
                                    <div className="space-y-2">
                                        <div className="text-[11px] text-[#444] font-mono uppercase tracking-[4px] font-bold">
                                            {activeTab === 'pending' ? 'No pending jobs found' : `No ${activeTab} records`}
                                        </div>
                                        <p className="text-[13px] text-[#333] font-medium italic">Run a scan to find new opportunities</p>
                                    </div>
                                    {activeTab === 'pending' && (
                                        <button onClick={handleScan} className="bg-white/5 border border-white/5 text-[#555] px-6 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-white/10 transition-all">Scan Now</button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <List
                                        rowCount={filteredJobs.length}
                                        rowHeight={195}
                                        className="scrollbar-hide"
                                        style={{ height: listHeight, width: '100%' }}
                                        rowProps={{}}
                                        rowComponent={({ index, style }) => (
                                            <div style={style}>
                                                <JobCard
                                                    job={filteredJobs[index]}
                                                    isSelected={selected?.id === filteredJobs[index].id}
                                                    index={index}
                                                    onClick={() => setSelected(filteredJobs[index])}
                                                />
                                            </div>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Detail Panel */}
                        {selected && (
                            <div className="relative">
                                <DetailPanel
                                    job={selected}
                                    country={profile?.country ?? undefined}
                                    generating={generating}
                                    onClose={() => setSelected(null)}
                                    onGenerateCoverLetter={handleGenerateCoverLetter}
                                    onStatusUpdate={(id, status) => {
                                        if (status === 'skipped') {
                                            setSkipJobId(id)
                                            setShowSkipModal(true)
                                        } else {
                                            handleStatusUpdate(id, status)
                                        }
                                    }}
                                    onInterviewOutcome={handleInterviewOutcome}
                                    onSaveTracking={handleSaveTracking}
                                    onCoverLetterOutcome={handleCoverLetterOutcome}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Skip Modal */}
            {showSkipModal && (
                <SkipModal
                    onClose={() => { setShowSkipModal(false); setSkipJobId(null) }}
                    onSkip={(reason) => {
                        if (skipJobId) handleStatusUpdate(skipJobId, 'skipped', reason)
                        setShowSkipModal(false)
                        setSkipJobId(null)
                    }}
                />
            )}
        </div>
    )
}
