import PatientLayout from '@/components/PatientLayout';

export default function PatientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PatientLayout>{children}</PatientLayout>;
}
