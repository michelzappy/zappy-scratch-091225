import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { getStatusColor } from '../utils/styleHelpers';

export interface PendingConsultation {
  id: string;
  patient: string;
  condition: string;
  submitted: string;
  provider: string;
  status: 'new' | 'reviewing' | 'completed';
}

interface PendingConsultationsProps {
  consultations: PendingConsultation[];
}

export default function PendingConsultations({ consultations }: PendingConsultationsProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pending Consultations</h2>
          <button 
            onClick={() => router.push('/portal/consultations')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View all →
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-600">{consultation.id}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(consultation.status)}`}>
                    {consultation.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{consultation.patient}</p>
                <p className="text-sm text-gray-600">{consultation.condition}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{consultation.submitted}</p>
                  <p className="text-xs text-gray-600">
                    {consultation.provider === 'Unassigned' ? (
                      <span className="text-red-600 font-medium">Needs assignment</span>
                    ) : (
                      consultation.provider
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/portal/consultation/${consultation.id}`)}
                className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
