import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, Camera, Flame, ShieldAlert, Target, TrendingUp } from 'lucide-react'

const features = [
  { icon: TrendingUp, title: 'P&L in percent and money', text: 'Track performance the way traders think: account impact, not only abstract percentages.' },
  { icon: Target, title: 'Strategies and rules', text: 'Connect trades to setups, risk limits, sessions, symbols, and execution quality.' },
  { icon: BookOpen, title: 'Daily journal context', text: 'Review each trading day with pre-market plan, post-market lessons, and trades on that day.' },
  { icon: Camera, title: 'Chart screenshots', text: 'Attach TradingView screenshots and review entries visually in a dedicated trade detail view.' },
  { icon: ShieldAlert, title: 'Daily loss guardrail', text: 'Set a daily loss limit and see clear warnings before discipline breaks down.' },
  { icon: Flame, title: 'Heatmap analytics', text: 'Find your strongest and weakest weekday-hour windows from real trade outcomes.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F7F1E8] text-[#17211B]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-end justify-center gap-1 rounded-2xl bg-[#17211B] pb-2">
            <span className="h-3 w-1 rounded bg-[#F6C453]" />
            <span className="h-5 w-1 rounded bg-white" />
            <span className="h-4 w-1 rounded bg-[#EF6F4E]" />
          </div>
          <span className="font-mono text-lg font-black tracking-tight">tradestat</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-[#38453D] hover:bg-white/60">Login</Link>
          <Link to="/app" className="rounded-full bg-[#17211B] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#243127]">Open app</Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24">
          <div className="absolute right-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#F6C453]/35 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#EF6F4E]/20 blur-3xl" />

          <div className="relative">
            <div className="mb-6 inline-flex rounded-full border border-[#17211B]/10 bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#59665E]">
              Trading journal for disciplined traders
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              Stop guessing. Start reviewing every trade.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#526058]">
              tradestat is a personal trading journal for logging trades, reviewing daily behavior, tracking strategies, and turning screenshots into structured feedback.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="inline-flex items-center justify-center rounded-2xl bg-[#EF6F4E] px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-[#EF6F4E]/20 hover:bg-[#dd5f40]">
                Create account
              </Link>
              <Link to="/app" className="inline-flex items-center justify-center rounded-2xl border border-[#17211B]/15 bg-white/70 px-7 py-4 text-sm font-black uppercase tracking-wide text-[#17211B] hover:bg-white">
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-[#17211B]/10 bg-[#17211B] p-4 shadow-2xl shadow-[#17211B]/20">
              <div className="rounded-[1.5rem] bg-[#F8FAFC] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-black">Daily Review</div>
                    <div className="text-xs font-bold text-[#64748B]">London session · 4 trades</div>
                  </div>
                  <div className="rounded-xl bg-green-50 px-3 py-2 text-right">
                    <div className="font-mono text-lg font-black text-[#059669]">+2.40%</div>
                    <div className="font-mono text-xs font-bold text-[#059669]">+$240</div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className={`h-10 rounded-xl border ${i % 7 === 2 ? 'border-green-200 bg-green-100' : i % 9 === 0 ? 'border-red-200 bg-red-100' : 'border-slate-100 bg-white'}`} />
                  ))}
                </div>
                <div className="mt-5 grid gap-3">
                  {['GER40 · Breakout · +1.50%', 'NAS100 · Pullback · -0.80%', 'XAUUSD · Trend · +1.70%'].map((row, i) => (
                    <div key={row} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                          <BarChart3 size={16} />
                        </div>
                        <span className="text-sm font-bold text-[#0F172A]">{row}</span>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-green-500'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#17211B] px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">Built for the review loop.</h2>
              <p className="mt-4 text-base font-medium leading-7 text-white/65">Log the setup, connect the context, review behavior, then improve the next trade.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <Icon className="mb-5 text-[#F6C453]" size={24} />
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="rounded-[2rem] bg-[#EF6F4E] p-8 text-white sm:p-12">
            <h2 className="max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">Make every trading day reviewable.</h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/80">Start with a trade log. Build the habit with daily journaling, screenshots, strategies, and risk guardrails.</p>
            <Link to="/login" className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-sm font-black uppercase tracking-wide text-[#17211B] hover:bg-[#F7F1E8]">
              Start tracking
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
