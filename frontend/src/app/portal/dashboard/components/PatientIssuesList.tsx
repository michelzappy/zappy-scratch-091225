import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { getPriorityColor, getStatusColor } from '../utils/styleHelpers';

export interface PatientIssue {
  id: string;
  patient: string;
  issue: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved';
}

interface PatientIssuesListProps {
  issues: PatientIssue[];
}

export default function PatientIssuesList({ issues }: PatientIssuesListProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Patient Support Queue</h2>
          <button 
            onClick={() => router.push('/portal/messages')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View all →
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {issues.map((issue) => (
          <div key={issue.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-600">{issue.id}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{issue.patient}</p>
                <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                <p className="text-xs text-gray-500 mt-1">{issue.time}</p>
              </div>
              <button 
                onClick={() => router.push(`/portal/patient/${issue.id}`)}
                className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Handle
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
