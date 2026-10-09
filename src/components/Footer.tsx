export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-ink-3 md:flex-row md:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/img/logo-wordmark.svg"
            alt="cloudbymcn"
            width={74}
            height={14}
            className="h-3.5 w-auto"
          />
          <p>© {new Date().getFullYear()} matheus nascimento</p>
        </div>
        <p className="text-xs">beyond the cloud</p>
      </div>
    </footer>
  )
}
