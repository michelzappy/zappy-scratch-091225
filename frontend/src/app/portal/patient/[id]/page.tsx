'use client';

import { useParams } from 'next/navigation';
import UnifiedPortalLayout from '@/components/UnifiedPortalLayout';
import PatientDetailsContent from './PatientDetailsContent';

export default function PatientDetailsPage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <UnifiedPortalLayout>
      <PatientDetailsContent patientId={patientId} />
    </UnifiedPortalLayout>
  );
}
