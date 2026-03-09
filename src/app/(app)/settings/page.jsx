import { auth } from '../../../lib/auth'
import AccountPage from './AccountPage'

export default async function SettingsPage({ searchParams }) {
  const session = await auth()
  const user = session?.user || null
  const upgraded = (await searchParams)?.upgraded === '1'

  return <AccountPage user={user} upgraded={upgraded} />
}
