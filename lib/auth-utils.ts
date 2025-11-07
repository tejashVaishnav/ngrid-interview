import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function getSession() {
  const session = await auth();
  return session;
}

export async function checkAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }
  
  return session;
}

export async function checkNoAuth() {
  const session = await getSession();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return null;
}
