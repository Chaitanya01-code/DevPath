import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../../api/client'
import { getDomains, signup } from '../../api/auth'
import { signupSchema } from '../../lib/validations'
import type { SignupFormValues } from '../../lib/validations'
import type { Domain } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Select from '../ui/Select'

export default function SignupForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [domainsError, setDomainsError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) })

  useEffect(() => {
    getDomains()
      .then((availableDomains) => {
        setDomains(availableDomains)
        const undecided = availableDomains.find((domain) => domain.name === 'Not decided yet')
        if (undecided) {
          setValue('domain_id', undecided.id)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load learning domains.', error)
        setDomainsError(
          getApiErrorMessage(error, 'Unable to load learning domains. Please refresh and try again.'),
        )
      })
      .finally(() => setDomainsLoading(false))
  }, [setValue])

  const onSubmit = async (values: SignupFormValues) => {
    setServerError('')
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        domain_id: values.domain_id,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Your account is ready. Log in to get started.' },
      })
    } catch (error: unknown) {
      setServerError(
        getApiErrorMessage(error, 'Unable to create your account. Please try again.'),
      )
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-heading">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Start building a learning path that works for you.</p>
      </div>
      {(serverError || domainsError) && (
        <p role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">
          {serverError || domainsError}
        </p>
      )}
      <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Full name" autoComplete="name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Enter your password again" error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Select
          label="Domain you want to learn"
          options={domains.map((domain) => ({ value: domain.id, label: domain.name }))}
          helperText="You can change this later"
          disabled={domainsLoading || Boolean(domainsError)}
          aria-busy={domainsLoading}
          {...register('domain_id')}
        />
        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting || domainsLoading || Boolean(domainsError)}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-hover hover:text-violet">
          Log in
        </Link>
      </p>
    </Card>
  )
}
