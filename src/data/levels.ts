import type { Lens, LensId, Level, LevelId } from '@/types/analysis'

const ideology: Lens = {
  id: 'ideology',
  label: 'Ideologia',
  description:
    'Posição editorial do veículo no espectro político brasileiro, do campo mais à esquerda ao mais à direita.',
  opposition: { left: ['left', 'center-left'], right: ['center-right', 'right'] },
  levels: [
    { id: 'left', label: 'Esquerda', shortLabel: 'E', color: '#e53935', order: 0 },
    { id: 'center-left', label: 'Centro-esquerda', shortLabel: 'CE', color: '#b34d61', order: 1 },
    { id: 'center', label: 'Centro', shortLabel: 'C', color: '#82618d', order: 2 },
    { id: 'center-right', label: 'Centro-direita', shortLabel: 'CD', color: '#5074b9', order: 3 },
    { id: 'right', label: 'Direita', shortLabel: 'D', color: '#1e88e5', order: 4 },
  ],
}

const vehicleType: Lens = {
  id: 'vehicleType',
  label: 'Tipo de veículo',
  description:
    'Natureza editorial do veículo: portal generalista, jornal impresso, TV e streaming, rádio, portal de nicho ou imprensa alternativa.',
  levels: [
    { id: 'portal', label: 'Portal generalista', shortLabel: 'PG', color: '#4c6fe7', order: 0 },
    { id: 'print', label: 'Jornal impresso', shortLabel: 'JI', color: '#7c5cd6', order: 1 },
    { id: 'broadcast', label: 'TV e streaming', shortLabel: 'TV', color: '#0e9f9f', order: 2 },
    { id: 'radio', label: 'Rádio e podcast', shortLabel: 'RÁ', color: '#e4a03c', order: 3 },
    { id: 'niche', label: 'Portal de nicho', shortLabel: 'NI', color: '#db6b2c', order: 4 },
    { id: 'alternative', label: 'Imprensa alternativa', shortLabel: 'IA', color: '#c2417e', order: 5 },
  ],
}

const region: Lens = {
  id: 'region',
  label: 'Região',
  description: 'Região de origem da sede do veículo que publicou a reportagem.',
  levels: [
    { id: 'sudeste', label: 'Sudeste', shortLabel: 'SE', color: '#4c6fe7', order: 0 },
    { id: 'sul', label: 'Sul', shortLabel: 'S', color: '#0e9f9f', order: 1 },
    { id: 'nordeste', label: 'Nordeste', shortLabel: 'NE', color: '#e4a03c', order: 2 },
    { id: 'norte', label: 'Norte', shortLabel: 'N', color: '#7c5cd6', order: 3 },
    { id: 'centro-oeste', label: 'Centro-Oeste', shortLabel: 'CO', color: '#c2417e', order: 4 },
  ],
}

export const LENSES: Record<LensId, Lens> = { ideology, vehicleType, region }

export const LENS_ORDER: LensId[] = ['ideology', 'vehicleType', 'region']

export function getLens(id: LensId): Lens {
  return LENSES[id]
}

export function getLevel(lens: LensId, levelId: LevelId): Level | undefined {
  return LENSES[lens].levels.find((l) => l.id === levelId)
}
