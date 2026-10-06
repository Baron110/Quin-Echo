import VoiceStudio from '@/components/VoiceStudio';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              Quin-Echo
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-black transition-colors">
              How it works
            </a>
            <a href="#setup" className="hover:text-black transition-colors">
              Setup
            </a>
            <a href="#studio" className="hover:text-black transition-colors">
              Studio
            </a>
          </div>
          <a
            href="#studio"
            className="bg-black text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium"
          >
            Open Studio
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
            Browser-based · Zero installs
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Change your voice,{' '}
            <span className="italic text-gray-500">live</span>.
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-md">
            Transform your voice in real-time during WhatsApp calls, Discord, and Zoom. Works
            entirely in your browser — no software to install.
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: '8', sublabel: 'voice presets' },
              { label: '<20ms', sublabel: 'latency' },
              { label: '100%', sublabel: 'browser-native' },
            ].map((stat) => (
              <div key={stat.label} className="border border-gray-200 rounded-xl px-5 py-3">
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {['WhatsApp Desktop', 'Discord', 'Zoom', 'Google Meet', 'Telegram'].map((app) => (
              <span
                key={app}
                className="bg-black text-white text-xs px-3 py-1.5 rounded-full font-medium"
              >
                {app}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Live Studio panel */}
        <div
          id="studio"
          className="bg-[#f8f6f1] rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              Live Studio
            </h2>
            <span className="text-xs text-gray-400 uppercase tracking-widest">v1.0</span>
          </div>
          <VoiceStudio />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-[#f8f6f1] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
            The process
          </p>
          <h2
            className="text-4xl font-bold mb-12"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            How Quin-Echo works
          </h2>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Open Studio',
                desc: 'Open this page in Chrome or Firefox on your desktop.',
              },
              {
                step: '02',
                title: 'Allow Mic',
                desc: 'Grant microphone access. Your audio never leaves your device.',
              },
              {
                step: '03',
                title: 'Pick Preset',
                desc: 'Select a voice preset or fine-tune with the sliders.',
              },
              {
                step: '04',
                title: 'Route Audio',
                desc: 'Install VB-Cable (Windows) or BlackHole (Mac) — free virtual mic driver.',
              },
              {
                step: '05',
                title: 'Make Calls',
                desc: 'In WhatsApp / Discord, set "VB-Cable" or "BlackHole" as your mic.',
              },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <div
                  className="text-5xl font-bold text-gray-200"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compatibility ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
          Compatibility
        </p>
        <h2
          className="text-4xl font-bold mb-10"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Where it works
        </h2>

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Platform</th>
                <th className="text-center px-6 py-4 font-semibold">Status</th>
                <th className="text-left px-6 py-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { platform: 'WhatsApp Desktop', status: '✓', note: 'Select VB-Cable as mic', ok: true },
                { platform: 'Discord', status: '✓', note: 'Works natively', ok: true },
                { platform: 'Zoom', status: '✓', note: 'Set virtual mic in audio settings', ok: true },
                { platform: 'Google Meet', status: '✓', note: 'Chrome required', ok: true },
                { platform: 'Telegram Desktop', status: '✓', note: 'Works with VB-Cable', ok: true },
                { platform: 'WhatsApp Mobile', status: '✗', note: 'Mobile browsers block mic routing', ok: false },
                { platform: 'iPhone / iPad', status: '✗', note: 'iOS Safari restrictions', ok: false },
              ].map((row) => (
                <tr key={row.platform} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{row.platform}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-bold text-base ${row.ok ? 'text-black' : 'text-gray-300'}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── VB-Cable setup ── */}
      <section id="setup" className="bg-[#f8f6f1] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Required
          </p>
          <h2
            className="text-4xl font-bold mb-10"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Audio routing setup
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* VB-Cable */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-fraunces)' }}
                  >
                    VB-Cable
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">For Windows</p>
                </div>
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">Free</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Virtual audio cable that creates a fake microphone. Quin-Echo outputs to it, your
                call app hears it as a real mic.
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Download from vb-audio.com/Cable</li>
                <li>Install and restart your PC</li>
                <li>Open Quin-Echo in Chrome</li>
                <li>In WhatsApp/Discord, select "CABLE Input" as microphone</li>
              </ol>
              <a
                href="https://vb-audio.com/Cable/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium mt-2"
              >
                Download VB-Cable →
              </a>
            </div>

            {/* BlackHole */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-fraunces)' }}
                  >
                    BlackHole
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">For Mac</p>
                </div>
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">Free</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Open-source virtual audio driver for macOS. Same concept as VB-Cable — creates a
                virtual mic your apps can use.
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Install via Homebrew: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">brew install blackhole-2ch</code></li>
                <li>Create Aggregate Device in Audio MIDI Setup</li>
                <li>Open Quin-Echo in Chrome</li>
                <li>Select "BlackHole 2ch" as mic in your call app</li>
              </ol>
              <a
                href="https://existential.audio/blackhole/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium mt-2"
              >
                Get BlackHole →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <span style={{ fontFamily: 'var(--font-fraunces)' }} className="text-base font-semibold text-black">
            Quin-Echo
          </span>
          <p>Real-time voice processing · Browser-native · No data stored</p>
          <p>© {new Date().getFullYear()} Quin-Echo</p>
        </div>
      </footer>
    </div>
  );
}
