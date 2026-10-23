import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { signup } from '../../api/auth'
import { signupSchema } from '../../lib/validations'
import type { SignupFormValues } from '../../lib/validations'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

export default function SignupForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (values: SignupFormValues) => {
    setServerError('')
    try {
      await signup({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Your account is ready. Log in to get started.' },
      })
    } catch (error: unknown) {
      const detail = axios.isAxiosError<{ detail?: string }>(error)
        ? error.response?.data.detail
        : undefined
      setServerError(detail ?? 'Unable to create your account. Please try again.')
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-heading">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Start building a learning path that works for you.</p>
      </div>
      {serverError && (
        <p role="alert" className="mb-5 rounded-xl border border-coral/30 bg-coral-tint px-4 py-3 text-sm font-medium text-rose-800">
          {serverError}
        </p>
      )}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Full name" autoComplete="name" placeholder="Your name" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Enter your password again" error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </Card>
  )
}
