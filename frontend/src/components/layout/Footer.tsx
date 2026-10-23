export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-footer">
      <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-muted sm:px-8">
        © {new Date().getFullYear()} Skillora. Learn with direction.
      </div>
    </footer>
  )
}
