import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Full name is required').max(120, 'Name is too long'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
