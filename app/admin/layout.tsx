// Force all admin pages to be dynamically rendered
// They depend on next-auth session which isn't available during build
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
