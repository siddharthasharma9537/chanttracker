'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { getProjectByShareCode } from '@/lib/api/projects'

export default function CertificatePage() {
  const { code } = useParams<{ code: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['view', code],
    queryFn: () => getProjectByShareCode(code),
  })

  if (isLoading) return <p className="p-8 text-center text-white/50">Loading…</p>
  if (error || !data?.length)
    return (
      <p className="p-8 text-center text-white/60">
        This link is invalid or the project is no longer shared.
      </p>
    )

  const first = data[0]
  const target = data.reduce((s, r) => s + r.target_count, 0)
  const done = data.reduce((s, r) => s + r.completed_count, 0)
  const complete = first.status === 'completed'
  const issuedDate = new Date(complete && first.completed_at ? first.completed_at : Date.now())
    .toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const startDate = new Date(first.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl print:hidden">
        <button
          onClick={() => window.print()}
          className="mb-6 flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Certificate card — the printable surface */}
      <div className="mx-auto max-w-2xl rounded-2xl border-4 border-double border-amber-500/40 bg-[#fdfaf3] p-8 text-slate-800 shadow-2xl print:max-w-none print:rounded-none print:border-2 print:border-amber-700 print:shadow-none sm:p-12">
        <div className="text-center">
          <p className="text-3xl">🕉</p>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-wide text-amber-900 sm:text-3xl">
            {complete ? 'Certificate of Completion' : 'Statement of Progress'}
          </h1>
          <p className="mt-1 text-sm uppercase tracking-widest text-slate-500">
            Navagraha Japa
          </p>
        </div>

        <p className="mt-8 text-center text-slate-600">This is to certify that</p>
        <p className="my-2 text-center font-serif text-3xl font-bold text-slate-900">
          {first.beneficiary_name}
        </p>
        {(first.beneficiary_gotra || first.beneficiary_nakshatra) && (
          <p className="text-center text-sm text-slate-500">
            {[
              first.beneficiary_gotra && `${first.beneficiary_gotra} Gotra`,
              first.beneficiary_nakshatra && `${first.beneficiary_nakshatra} Nakshatra`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-slate-700">
          {complete
            ? `has had ${done.toLocaleString()} japas of the Navagraha Suktam performed on their behalf, completing the full sankalpa of ${target.toLocaleString()} japas`
            : `has had ${done.toLocaleString()} of ${target.toLocaleString()} japas of the Navagraha Suktam performed on their behalf so far`}
          {first.intention && <> for the intention of <em>{first.intention}</em></>}.
        </p>

        <div className="my-8 border-t border-amber-800/20" />

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 font-medium">Graha</th>
              <th className="pb-2 text-right font-medium">Japas completed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.graha_name} className="border-t border-amber-800/10">
                <td className="py-1.5 text-slate-800">{r.graha_name}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-700">
                  {r.completed_count.toLocaleString()} / {r.target_count.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-amber-800/30 font-semibold">
              <td className="py-2 text-slate-900">Total</td>
              <td className="py-2 text-right tabular-nums text-slate-900">
                {done.toLocaleString()} / {target.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-10 flex items-end justify-between text-xs text-slate-500">
          <div>
            <p>Sankalpa taken</p>
            <p className="font-medium text-slate-700">{startDate}</p>
          </div>
          <div className="text-right">
            <p>{complete ? 'Completed' : 'Statement issued'}</p>
            <p className="font-medium text-slate-700">{issuedDate}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-slate-400">
          Recorded via ChantTracker · verifiable at this project&apos;s share link
        </p>
      </div>
    </div>
  )
}
