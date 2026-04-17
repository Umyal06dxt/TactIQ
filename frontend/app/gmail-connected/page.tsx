export default function GmailConnectedPage() {
  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-white text-xl font-bold">Gmail connected</h1>
        <p className="text-white/40 text-sm mt-2">You can close this tab or go back to your briefing.</p>
        <a href="/" className="inline-block mt-6 text-emerald-400 hover:text-emerald-300 text-sm">← Back to dashboard</a>
      </div>
    </div>
  );
}
