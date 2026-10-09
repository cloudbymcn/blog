import { LanyardStage } from '../components/Lanyard/LanyardStage'

export function Home() {
  return (
    <section className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="p-8 font-display text-4xl">Matheus Nascimento</div>
      <LanyardStage />
    </section>
  )
}
