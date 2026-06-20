import { z } from 'zod'
import { coercedInt, optionalNumber, requiredString } from './common'

export const productSchema = z.object({
  sku: requiredString('Informe o SKU'),
  name: requiredString('Informe o nome'),
  description: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  weight: optionalNumber,
  turnoverScore: z.number().int().min(0).max(10),
  quantity: coercedInt(0, 'Informe a quantidade')
})

export type ProductInput = z.infer<typeof productSchema>

export const productDefaults: ProductInput = {
  sku: '',
  name: '',
  description: '',
  barcode: '',
  weight: undefined,
  turnoverScore: 5,
  quantity: 0
}
