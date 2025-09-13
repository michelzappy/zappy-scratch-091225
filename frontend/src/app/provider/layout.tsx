import ProviderLayout from '@/components/ProviderLayout';

export default function ProviderRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProviderLayout>{children}</ProviderLayout>;
}
