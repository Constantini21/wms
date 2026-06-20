import { z } from 'zod'
import { coercedInt, requiredString } from './common'

export const areaSchema = z.object({
  warehouseId: requiredString('Selecione um galpão'),
  code: requiredString('Informe o código'),
  name: requiredString('Informe o nome'),
  floor: coercedInt(1, 'Selecione o andar'),
  aisles: coercedInt(1, 'Selecione a quantidade de estantes'),
  levels: coercedInt(1, 'Selecione a quantidade de níveis'),
  positionsPerLevel: coercedInt(1, 'Selecione os pontos por nível'),
  barcode: z.string().trim().optional()
})

export type AreaInput = z.infer<typeof areaSchema>

export const areaDefaults: AreaInput = {
  warehouseId: '',
  code: '',
  name: '',
  floor: 1,
  aisles: 1,
  levels: 3,
  positionsPerLevel: 6,
  barcode: ''
}
