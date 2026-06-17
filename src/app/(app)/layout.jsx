import { auth } from '../../lib/auth'
import Navbar from '../../components/shared/Navbar'

export default async function AppLayout({ children }) {
  const session = await auth()
  const user = session?.user || null

  return (
    <div className="app-layout">
      <Navbar user={user} />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
