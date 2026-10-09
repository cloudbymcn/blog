export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-ink-3 md:flex-row md:px-8">
        <p>© {new Date().getFullYear()} Matheus Nascimento · Cloud by MCN</p>
        <p className="text-xs">beyond the cloud</p>
      </div>
    </footer>
  )
}
