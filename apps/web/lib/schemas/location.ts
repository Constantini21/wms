import { z } from 'zod'
import { optionalNumber, requiredString } from './common'

export const locationSchema = z.object({
  areaId: requiredString('Selecione uma área'),
  aisleId: z.string().trim().optional(),
  code: requiredString('Informe o código'),
  name: z.string().trim().optional(),
  aisle: z.string().trim().optional(),
  floor: z.string().trim().optional(),
  position: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  accessibility: z.number().int().min(0).max(10),
  capacity: optionalNumber
})

export type LocationInput = z.infer<typeof locationSchema>

export const locationDefaults: LocationInput = {
  areaId: '',
  aisleId: '',
  code: '',
  name: '',
  aisle: '',
  floor: '',
  position: '',
  barcode: '',
  accessibility: 5,
  capacity: undefined
}
