import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface RecentActivityProps {
  userRole: UserRole;
}

export default function RecentActivity({ userRole }: RecentActivityProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {(userRole === 'provider' || userRole === 'provider-admin') && (
          <>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New consultation from Sarah Johnson</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Prescription approved for Michael Chen</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
          </>
        )}
        {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
          <>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">High priority support ticket from Emily Davis</p>
                <p className="text-xs text-gray-500">10 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">3 consultations need provider assignment</p>
                <p className="text-xs text-gray-500">30 minutes ago</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
