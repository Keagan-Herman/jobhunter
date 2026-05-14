import { SupabaseClient } from '@supabase/supabase-js'
import { Profile } from '@/types'

export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<{ profileText: string, profileData: Profile | null }> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!data) return {
    profileText: 'Software developer with full stack experience',
    profileData: null
  }

  const profile = data as Profile

  const profileText = `
Name: ${profile.full_name || ''}
Current Role: ${profile.job_title || ''}
Company: ${profile.company || ''}
Education: ${profile.education || ''}
Skills: ${(profile.skills || []).join(', ')}
Experience: ${profile.experience || ''}
Projects: ${profile.projects || ''}
  `.trim()

  return { profileText, profileData: profile }
}

export async function getUserFeedbackContext(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: feedback } = await supabase
    .from('job_feedback')
    .select(`action, reason, jobs (title, company, stack)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!feedback?.length) return ''

  const skipped = feedback
    .filter((f: any) => f.action === 'skipped' && f.jobs)
    .map((f: any) => `- Skipped "${f.jobs.title}" at ${f.jobs.company}${f.reason ? ` because: ${f.reason}` : ''}`)
    .join('\n')

  const applied = feedback
    .filter((f: any) => f.action === 'applied' && f.jobs)
    .map((f: any) => `- Applied to "${f.jobs.title}" at ${f.jobs.company}${f.reason ? ` — liked: ${f.reason}` : ''}`)
    .join('\n')

  return `
PAST BEHAVIOUR (use this to calibrate your score):
Jobs they applied to:
${applied || 'None yet'}

Jobs they skipped:
${skipped || 'None yet'}
`.trim()
}

export async function getLearnedSignals(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: signals } = await supabase
    .from('learned_signals')
    .select('signal_type, signal_value, weight, outcome')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(20)

  if (!signals?.length) return ''

  const positive = signals
    .filter((s: any) => s.outcome === 'positive')
    .map((s: any) => `- ${s.signal_type}: "${s.signal_value}" (strength: ${s.weight.toFixed(1)})`)
    .join('\n')

  const negative = signals
    .filter((s: any) => s.outcome === 'negative')
    .map((s: any) => `- ${s.signal_type}: "${s.signal_value}" (strength: ${s.weight.toFixed(1)})`)
    .join('\n')

  return `
LEARNED SIGNALS FROM PAST INTERVIEWS:
Signals that led to positive outcomes (weight them higher):
${positive || 'None yet'}

Signals that led to negative outcomes (weight them lower):
${negative || 'None yet'}
  `.trim()
}

export function detectSeniority(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('junior') || t.includes('graduate') || t.includes('entry')) return 'junior'
  if (t.includes('senior') || t.includes('lead') || t.includes('principal')) return 'senior'
  if (t.includes('head') || t.includes('director') || t.includes('vp')) return 'executive'
  return 'mid'
}

export function detectWorkStyle(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('fully remote') || d.includes('100% remote') || d.includes('work from anywhere')) return 'fully remote'
  if (d.includes('hybrid')) return 'hybrid'
  if (d.includes('on-site') || d.includes('onsite') || d.includes('in office') || d.includes('in-office')) return 'on-site'
  return 'unspecified'
}

export function calculateStackOverlap(jobStack: string[], userSkills: string[]): number {
  if (!jobStack.length || !userSkills.length) return 0
  const userSkillsLower = userSkills.map(s => s.toLowerCase())
  const matches = jobStack.filter(s => userSkillsLower.includes(s.toLowerCase()))
  return Math.round((matches.length / jobStack.length) * 100)
}

export function extractStack(description: string): string[] {
  const keywords = [
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Vue', 'Angular',
    'C#', 'MVC', '.NET', 'Flutter', 'Kotlin', 'Swift', 'Dart',
    'Python', 'Java', 'Go', 'Rust', 'Node.js', 'Express',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase',
    'Blazor', 'HTML', 'CSS', 'Tailwind', 'Docker', 'AWS', 'Azure',
    'IoT', 'Power BI', 'GraphQL', 'REST', 'API'
  ]
  return keywords.filter(k => description?.toLowerCase().includes(k.toLowerCase()))
}

export function getCountryName(code: string): string {
  const map: Record<string, string> = {
    za: 'South Africa', gb: 'United Kingdom', us: 'United States',
    au: 'Australia', ca: 'Canada', de: 'Germany',
    nl: 'Netherlands', sg: 'Singapore'
  }
  return map[code] || 'South Africa'
}
