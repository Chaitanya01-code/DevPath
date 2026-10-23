import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { useAuth } from '../../context/AuthContext'
import { loginSchema } from '../../lib/validations'
import type { LoginFormValues } from '../../lib/validations'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface LoginLocationState {
  message?: string
  from?: { pathname?: string }
}

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const state = location.state as LoginLocationState | null
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('')
    try {
      await login(values)
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true })
    } catch (error: unknown) {
      const detail = axios.isAxiosError<{ detail?: string }>(error)
        ? error.response?.data.detail
        : undefined
      setServerError(detail ?? 'Unable to log in. Please try again.')
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-heading">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Log in to continue your learning journey.</p>
      </div>
      {state?.message && (
        <p className="mb-5 rounded-xl border border-teal/20 bg-teal-tint px-4 py-3 text-sm text-teal-hover">
          {state.message}
        </p>
      )}
      {serverError && (
        <p role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">
          {serverError}
        </p>
      )}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </Card>
  )
}
