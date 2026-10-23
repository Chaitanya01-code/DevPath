import LoginForm from '../components/auth/LoginForm'

export default function Login() {
  return (
    <div className="auth-wash mx-auto flex min-h-full w-full max-w-none flex-1 items-center justify-center px-5 py-8 sm:py-10">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
