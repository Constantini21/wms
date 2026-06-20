import { z } from 'zod'
import { requiredString } from './common'

export const roleSchema = z.object({
  name: requiredString('Informe o nome'),
  description: z.string().trim().optional(),
  permissionKeys: z.array(z.string())
})

export type RoleInput = z.infer<typeof roleSchema>

export const roleDefaults: RoleInput = {
  name: '',
  description: '',
  permissionKeys: []
}
