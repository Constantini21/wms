import { z } from 'zod'
import { requiredString } from './common'

export const loginSchema = z.object({
  email: requiredString('Informe o usuário'),
  password: requiredString('Informe a senha')
})

export type LoginInput = z.infer<typeof loginSchema>
