import { z } from 'zod'
import { requiredString } from './common'

export const userSchema = z.object({
  name: requiredString('Informe o nome'),
  email: z.string().trim().email('E-mail inválido'),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, {
      message: 'A senha deve ter ao menos 6 caracteres'
    }),
  roleId: requiredString('Selecione um perfil'),
  active: z.boolean()
})

export type UserInput = z.infer<typeof userSchema>

export const userDefaults: UserInput = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  active: true
}
