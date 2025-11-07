import DashboardPage from '@/components/layout/dashboard';
import { checkAuth } from '@/lib/auth-utils';
import { getUser } from "@/requests/user";

export default async function ProtectedPage() {

  const session = await checkAuth()

  const user = await getUser({ email: session.user?.email as string })
  console.log(user)


  return (
    <div className="">
      <DashboardPage />
    </div>
  );
}