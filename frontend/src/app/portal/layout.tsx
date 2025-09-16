import UnifiedPortalLayout from '@/components/UnifiedPortalLayout';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnifiedPortalLayout>{children}</UnifiedPortalLayout>;
}
