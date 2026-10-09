/** Ajustes do crachá editáveis no painel <LanyardControls> (mesmos do "Customize" do React Bits). */
export type Finish = 'matte' | 'glossy' | 'holographic' | 'metallic'
export type Metal = 'silver' | 'graphite' | 'gold'

export interface LanyardSettings {
  finish: Finish
  metal: Metal
  cardColor: string
  strapColor: string
  /** faixa lisa (só strapColor), sem a textura strap.png */
  plainBand: boolean
  cornerRadius: number
  size: number
  strapLength: number
  strapWidth: number
  gravity: number
  damping: number
  elasticity: number
  breeze: number
  interactive: boolean
  intro: boolean
}

/** Padrão do SPEC §0-bis: cartão branco fosco, metal prata, faixa preta. */
export const LANYARD_DEFAULTS: LanyardSettings = {
  finish: 'matte',
  metal: 'silver',
  cardColor: '#ffffff',
  strapColor: '#111111',
  plainBand: false,
  cornerRadius: 0.3,
  size: 0.6,
  strapLength: 0.45,
  strapWidth: 0.65,
  gravity: 1,
  damping: 0.5,
  elasticity: 0.5,
  breeze: 0.5,
  interactive: true,
  intro: true,
}
