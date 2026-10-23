import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAdminAuth } from '../../context/AdminAuthContext'
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
  const { loginWithToken: loginAdmin, clearSession: clearAdminSession } = useAdminAuth()
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
      const session = await login(values)
      if (session.role === 'admin') {
        await loginAdmin(session.accessToken)
        navigate('/admin/dashboard', { replace: true })
      } else {
        clearAdminSession()
        const requestedPath = state?.from?.pathname
        navigate(
          requestedPath && !requestedPath.startsWith('/admin')
            ? requestedPath
            : '/dashboard',
          { replace: true },
        )
      }
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, 'Unable to log in. Please try again.'))
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-5">
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
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Email or username" autoComplete="username" placeholder="you@example.com or username" error={errors.identifier?.message} {...register('identifier')} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Don’t have an account?{' '}
        <Link to="/signup" className="font-semibold text-teal-hover hover:text-violet">
          Sign up
        </Link>
      </p>
    </Card>
  )
}
