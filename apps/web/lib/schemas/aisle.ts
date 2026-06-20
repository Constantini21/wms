import { z } from 'zod'
import { coercedInt, requiredString } from './common'

export const aisleSchema = z.object({
  code: requiredString('Informe o código'),
  label: z.string().trim().optional(),
  levels: coercedInt(1, 'Informe os níveis'),
  positionsPerLevel: coercedInt(1, 'Informe os pontos')
})

export type AisleInput = z.infer<typeof aisleSchema>
