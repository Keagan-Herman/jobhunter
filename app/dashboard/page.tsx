'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { JobCard } from '@/components/dashboard/JobCard'
import { SkeletonRow } from '@/components/dashboard/Skeleton'
import { List } from 'react-window'
import { DetailPanel } from '@/components/dashboard/DetailPanel'
import { SkipModal } from '@/components/dashboard/SkipModal'

import { Job, Profile } from '@/types'

export default function DashboardPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [rescoring, setRescoring] = useState(false)
    const [activeProcess, setActiveProcess] = useState<'scanning' | 'rescoring' | 'generating' | null>(null)
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'interviewing' | 'skipped'>('pending')
    const [scanResult, setScanResult] = useState('')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [error, setError] = useState('')
    const [firstTime, setFirstTime] = useState(false)

    const [showSkipModal, setShowSkipModal] = useState(false)
    const [skipJobId, setSkipJobId] = useState<string | null>(null)
    const [rescoreResult, setRescoreResult] = useState('')

    const [listHeight, setListHeight] = useState(600)

    const router = useRouter()

    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch('/api/jobs/all')
            const data = await res.json()
            if (data.jobs) setJobs(data.jobs as Job[])
        } catch {
            setError('Failed to load jobs. Please refresh.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/profile')
            const data = await res.json()
            if (data.profile) setProfile(data.profile as Profile)
        } catch {
            console.error('Failed to load profile')
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.search.includes('firstTime=true')) {
                setFirstTime(true)
            }
            const handleResize = () => {
                const offset = window.innerWidth >= 1024 ? 420 : 500
                setListHeight(Math.max(300, window.innerHeight - offset))
            }
            handleResize()
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
        fetchJobs()
    }, [fetchProfile, fetchJobs])

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

    const handleScan = async () => {
        setScanning(true)
        setActiveProcess('scanning')
        setScanResult('')
        setError('')
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            if (res.ok && data.success) {
                setScanResult("Found " + data.found + " jobs, saved " + data.saved + " new")
                await fetchJobs()
            } else {
                setError(data.error || 'Scan failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Scan failed')
        } finally {
            setScanning(false)
            setActiveProcess(null)
        }
    }

    const handleRescore = async () => {
        setRescoring(true)
        setActiveProcess('rescoring')
        setRescoreResult('')
        setError('')
        try {
            const res = await fetch('/api/rescore', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setRescoreResult("Rescored " + data.rescored + " jobs")
                await fetchJobs()
            } else {
                setError(data.message || data.error || 'Rescore failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rescore failed')
        } finally {
            setRescoring(false)
            setActiveProcess(null)
        }
    }

    const handleGenerateCoverLetter = async (content: string) => {
        if (!selected) return

        try {
            if (!content) {
                setGenerating(true)
                setActiveProcess('generating')
                return
            }

            const updatedJob: Job = {
                ...selected,
                cover_letter: content
            }
            setJobs(prev => prev.map(j => j.id === selected.id ? updatedJob : j))
            setSelected(updatedJob)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update cover letter.')
        } finally {
            if (content) {
                setGenerating(false)
                setActiveProcess(null)
            }
        }
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status'], reason?: string) => {
        setJobs((prev: Job[]) => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected((prev: Job | null) => prev ? { ...prev, status } : null)

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: status === 'skipped' ? 'skipped' : 'applied', reason })
            })
            if (!res.ok) throw new Error('Failed to update status')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status')
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

        try {
            const res = await fetch('/api/jobs/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selected.id,
                    notes: trackingData.notes ?? null,
                    interview_date: trackingData.interview_date ?? null,
                    contact_name: trackingData.contact_name ?? null,
                    contact_email: trackingData.contact_email ?? null,
                    offer_amount: trackingData.offer_amount ?? null,
                    follow_up_date: trackingData.follow_up_date ?? null,
                })
            })

            if (!res.ok) throw new Error('Failed to update job')

            setJobs(prev => prev.map(j => j.id === selected.id ? { ...j, ...trackingData } : j))
            setSelected(prev => prev ? { ...prev, ...trackingData } : null)
        } catch (err) {
            throw err
        }
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

    const filteredJobs: Job[] = jobs.filter(j => j.status === activeTab)

    const stats: { pending: number; applied: number; interviewing: number; total: number } = {
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }

    return (
        <div className="min-h-screen bg-[#080812] text-[#e0e0f0] font-sans selection:bg-[#00ff8720] selection:text-[#00ff87]">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]"
                 style={{ backgroundImage: 'linear-gradient(#00ff8710 1px, transparent 1px), linear-gradient(90deg, #00ff8710 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="fixed -top-[20rem] -right-[20rem] w-[60rem] h-[60rem] rounded-full bg-radial-gradient from-[#00ff8708] to-transparent z-0 pointer-events-none blur-[100px]" />
            <div className="fixed -bottom-[30rem] -left-[20rem] w-[70rem] h-[70rem] rounded-full bg-radial-gradient from-[#7b61ff05] to-transparent z-0 pointer-events-none blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-8 space-y-12">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                        <h1 className="font-syne text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-1">
                            Job<span className="text-[#00ff87] text-glow-green">Hunter</span>
                        </h1>
                        <div className="flex items-center gap-2 bg-[#0d0d20] border border-[#1e1e38] rounded-full px-3 py-1">
                            <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-widest uppercase">Local</span>
                        </div>

                        {activeProcess && (
                            <div className="flex items-center gap-2 bg-[#00ff87]/5 border border-[#00ff87]/20 rounded-full px-4 py-1.5 animate-in fade-in zoom-in duration-300 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-50 duration-1000"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
                                </span>
                                <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                                    Live Command: <span className="text-white brightness-125">{activeProcess === 'scanning' ? 'Scanning Jobs' : activeProcess === 'rescoring' ? 'Rescoring' : 'Generating'}</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                        <button onClick={handleScan} disabled={scanning}
                                className={"group relative flex items-center gap-2 px-6 py-3 rounded-2xl font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all duration-300 shadow-[0_0_30px_-5px_#00ff8730] overflow-hidden " + (scanning ? 'bg-white/[0.03] border border-white/5 text-[#00ff87] cursor-not-allowed' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110 active:scale-95')}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            {scanning ? (
                                <><span className="w-3 h-3 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Scanning...</>
                            ) : 'Scan Jobs'}
                        </button>

                        <button onClick={handleRescore} disabled={rescoring}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[#666] font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-50 hover:border-white/10 active:scale-95">
                            {rescoring ? (
                                <><span className="w-3 h-3 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Rescoring...</>
                            ) : 'Rescore'}
                        </button>

                        <div className="h-8 w-[1px] bg-white/5 mx-2" />

                        <button onClick={() => router.push('/profile')} className="px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[#555] font-mono text-[11px] font-bold tracking-[1px] hover:bg-white/[0.05] hover:text-white transition-all active:scale-95">Profile</button>
                    </div>
                </header>

                <div className="space-y-4">
                    {error && (
                        <div className="bg-[#ff6b6b10] border border-[#ff6b6b30] rounded-xl p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                            <span className="text-[#ff6b6b] text-sm font-mono">{error}</span>
                            <button onClick={() => { setError(''); fetchJobs() }} className="text-[#ff6b6b] text-sm font-mono hover:underline">Retry</button>
                        </div>
                    )}
                    {scanResult && (
                        <div className={"rounded-xl p-4 text-sm font-mono animate-in slide-in-from-top-2 " + (!scanResult.includes('failed') ? 'bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87]' : 'bg-[#ff6b6b10] border border-[#ff6b6b30] text-[#ff6b6b]')}>
                            {scanResult}
                        </div>
                    )}
                    {rescoreResult && (
                        <div className={"rounded-xl p-4 text-sm font-mono animate-in slide-in-from-top-2 " + (!rescoreResult.includes('failed') ? 'bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87]' : 'bg-[#ff6b6b10] border border-[#ff6b6b30] text-[#ff6b6b]')}>
                            {rescoreResult}
                        </div>
                    )}
                </div>

                {firstTime && (
                    <div className="bg-[#00ff8710] border border-[#00ff8730] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_-10px_#00ff8720]">
                        <div>
                            <div className="font-syne font-bold text-lg text-[#00ff87] mb-1">You&apos;re all set!</div>
                            <div className="text-sm text-[#888]">Run your first scan to find jobs matching your profile</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                                className="bg-[#00ff87] text-[#0a0a1a] px-6 py-3 rounded-xl font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg shadow-[#00ff8730]">Run First Scan</button>
                    </div>
                )}

                <StatsGrid stats={stats} />

                <div className="space-y-8">
                    <div className="flex flex-wrap gap-1 md:gap-2 border-b border-white/5 pb-px overflow-x-auto scrollbar-hide">
                        {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                            <button key={tab}
                                    onClick={() => { setActiveTab(tab) }}
                                    className={"px-4 md:px-8 py-4 md:py-5 font-mono text-[9px] md:text-[10px] font-bold tracking-[2px] md:tracking-[3px] uppercase transition-all relative shrink-0 " + (activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#777]')}>
                                {tab} <span className={"ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-md text-[8px] md:text-[9px] " + (activeTab === tab ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-white/5 text-[#555]')}>{jobs.filter(j => j.status === tab).length}</span>
                                {activeTab === tab && <div className="absolute bottom-0 left-2 md:left-4 right-2 md:right-4 h-[2px] bg-[#00ff87] shadow-[0_0_15px_#00ff87]" />}
                            </button>
                        ))}
                    </div>

                    <div className="bg-glass border-premium rounded-[2.5rem] overflow-hidden h-[calc(100vh-380px)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative">
                        {loading ? (
                            <div className="overflow-hidden flex-1">
                                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="py-24 text-center flex-1 flex flex-col items-center justify-center px-12 animate-in fade-in duration-700">
                                <div className="relative mb-10 group/empty">
                                    <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-4xl grayscale opacity-20 group-hover/empty:grayscale-0 group-hover/empty:opacity-100 transition-all duration-700 group-hover/empty:scale-110 group-hover/empty:rotate-6 group-hover/empty:border-[#00ff8740] shadow-2xl">
                                        {activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '✉️' : activeTab === 'interviewing' ? '🤝' : '⏭️'}
                                    </div>
                                    <div className="absolute -inset-8 bg-[#00ff87]/5 rounded-full blur-3xl opacity-0 group-hover/empty:opacity-100 transition-opacity duration-700" />
                                </div>
                                <h3 className="font-syne font-extrabold text-2xl text-white/90 mb-3 tracking-tight">No {activeTab} opportunities</h3>
                                <p className="text-[10px] text-[#555] font-mono uppercase tracking-[4px] mb-12 max-w-xs leading-relaxed font-bold">
                                    {activeTab === 'pending'
                                        ? 'Initiate a fresh scan to discover high-match roles tailored to your profile.'
                                        : "You haven't moved any jobs to " + activeTab + " yet."}
                                </p>
                                {activeTab === 'pending' && (
                                    <button onClick={handleScan} className="group relative bg-[#00ff8710] border border-[#00ff8720] text-[#00ff87] px-10 py-4 rounded-2xl font-mono text-[11px] font-black uppercase tracking-[3px] hover:bg-[#00ff87] hover:text-[#0a0a1a] transition-all duration-500 overflow-hidden shadow-lg shadow-[#00ff8710] hover:shadow-[#00ff8730]">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        Discover Jobs
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1">
                                <List
                                    key={`${activeTab}-${filteredJobs.length}`}
                                    rowCount={filteredJobs.length}
                                    rowHeight={220}
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

                    {selected && (
                        <DetailPanel
                            job={selected}
                            country={profile?.country ?? undefined}
                            userSkills={profile?.skills ?? []}
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
                    )}
                </div>
            </div>

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
