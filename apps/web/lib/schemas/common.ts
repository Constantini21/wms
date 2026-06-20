import { z } from 'zod'

export const requiredString = (message = 'Campo obrigatório') =>
  z.string().trim().min(1, message)

const toNumberOrUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined
    ? undefined
    : Number(value)

export const optionalNumber = z.preprocess(
  toNumberOrUndefined,
  z
    .number({ invalid_type_error: 'Informe um número válido' })
    .nonnegative('Não pode ser negativo')
    .optional()
)

export const coercedInt = (min = 1, message = 'Valor inválido') =>
  z.preprocess(
    toNumberOrUndefined,
    z
      .number({ invalid_type_error: message })
      .int(message)
      .min(min, `Mínimo ${min}`)
  )
