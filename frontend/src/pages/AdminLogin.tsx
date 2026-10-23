import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { useAdminAuth } from '../context/AdminAuthContext'
import { adminLoginSchema } from '../lib/validations'
import type { AdminLoginFormValues } from '../lib/validations'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({ resolver: zodResolver(adminLoginSchema) })

  const onSubmit = async (values: AdminLoginFormValues) => {
    setServerError('')
    try {
      await login(values)
      navigate('/admin/dashboard', { replace: true })
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, 'Unable to log in. Please try again.'))
    }
  }

  return (
    <div className="auth-wash mx-auto flex w-full flex-1 items-center justify-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet">Skillora administration</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">Admin sign in</h1>
            <p className="mt-2 text-sm text-muted">Sign in to manage the Skillora workspace.</p>
          </div>
          {serverError && (
            <p role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">
              {serverError}
            </p>
          )}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input label="Username" autoComplete="username" placeholder="Admin username" error={errors.username?.message} {...register('username')} />
            <Input label="Password" type="password" autoComplete="current-password" placeholder="Admin password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
