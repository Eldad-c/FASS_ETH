import { z } from 'zod'

export const logLevelSchema = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
