type Props = {
  message: string | null
  variant?: 'success' | 'error'
}

export default function StatusBanner({ message, variant = 'success' }: Props) {
  if (!message) return null

  const styles =
    variant === 'error'
      ? 'border-danger/20 bg-danger/5 text-danger'
      : 'border-green-200 bg-green-50 text-green-800'

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{message}</div>
}
