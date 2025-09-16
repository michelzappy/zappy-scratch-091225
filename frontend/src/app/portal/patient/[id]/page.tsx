'use client';

import { useParams } from 'next/navigation';
import PatientDetailsContent from './PatientDetailsContent';

export default function PatientDetailsPage() {
  const params = useParams();
  const patientId = params.id as string;

  return <PatientDetailsContent patientId={patientId} />;
}
