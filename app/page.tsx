import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const code = params['code'];
  if (code) {
    redirect(`/auth/reset-password?code=${encodeURIComponent(code)}`);
  }
  redirect('/dashboard');
}
