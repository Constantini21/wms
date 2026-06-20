import { z } from 'zod'
import { coercedInt, requiredString } from './common'

export const warehouseSchema = z.object({
  code: requiredString('Informe o código'),
  name: requiredString('Informe o nome'),
  floors: coercedInt(1, 'Informe o número de andares'),
  address: z.string().trim().optional()
})

export type WarehouseInput = z.infer<typeof warehouseSchema>

export const warehouseDefaults: WarehouseInput = {
  code: '',
  name: '',
  floors: 1,
  address: ''
}
