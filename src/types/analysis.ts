export type LensId = 'ideology' | 'vehicleType' | 'region'

export const IDEOLOGY_LEVELS = ['left', 'center-left', 'center', 'center-right', 'right'] as const
export type IdeologyLevel = (typeof IDEOLOGY_LEVELS)[number]

export const VEHICLE_TYPE_LEVELS = [
  'portal',
  'print',
  'broadcast',
  'radio',
  'niche',
  'alternative',
] as const
export type VehicleTypeLevel = (typeof VEHICLE_TYPE_LEVELS)[number]

export const REGION_LEVELS = ['sudeste', 'sul', 'nordeste', 'norte', 'centro-oeste'] as const
export type RegionLevel = (typeof REGION_LEVELS)[number]

export type LevelId = IdeologyLevel | VehicleTypeLevel | RegionLevel

export interface Level {
  id: LevelId
  label: string
  shortLabel: string
  color: string
  order: number
}

export interface Lens {
  id: LensId
  label: string
  description: string
  levels: Level[]
  /** Grupos opostos — só a lente ideologia tem. Ausente = lente de concentração. */
  opposition?: { left: LevelId[]; right: LevelId[] }
}

export type Reliability = 'high' | 'medium' | 'low'

export type Ownership =
  | 'conglomerate'
  | 'public'
  | 'independent'
  | 'corporate'
  | 'niche'
  | 'grassroots'

export type Stance = 'support' | 'critical' | 'neutral' | 'mixed'

export type Reach = 'national' | 'regional'

export interface Source {
  id: string
  name: string
  domain: string
  monogram: string
  brandColor: string
  ratings: { ideology: IdeologyLevel; vehicleType: VehicleTypeLevel; region: RegionLevel }
  reliability: Reliability
  ownership: Ownership
  reach: Reach
  state: string
}

export interface Article {
  id: string
  sourceId: string
  title: string
  excerpt: string
  url: string
  publishedAt: string
  stance: Stance
}

export interface Story {
  id: string
  slug: string
  title: string
  summary: string[]
  debate: string
  theme: string
  region: RegionLevel
  state: string
  articles: Article[]
}
