import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface QuickActionsProps {
  userRole: UserRole;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {(userRole === 'provider' || userRole === 'provider-admin') && (
          <>
            <button 
              onClick={() => router.push('/portal/consultations')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
            >
              <span className="text-xl mb-2 block">📋</span>
              <p className="text-sm font-medium text-gray-900">Consultations</p>
            </button>
            <button 
              onClick={() => router.push('/portal/messages')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
            >
              <span className="text-xl mb-2 block">💬</span>
              <p className="text-sm font-medium text-gray-900">Messages</p>
            </button>
          </>
        )}
        {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
          <>
            <button 
              onClick={() => alert('Emergency response activated')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
            >
              <span className="text-xl mb-2 block">🚨</span>
              <p className="text-sm font-medium text-gray-900">Emergency</p>
            </button>
            <button 
              onClick={() => router.push('/portal/analytics')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left"
            >
              <span className="text-xl mb-2 block">📊</span>
              <p className="text-sm font-medium text-gray-900">Analytics</p>
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
