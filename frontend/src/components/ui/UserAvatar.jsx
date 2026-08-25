import clsx from 'clsx'

const SIZE_MAP = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export default function UserAvatar({ name = '', size = 'md', className }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white',
        SIZE_MAP[size] || SIZE_MAP.md,
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
