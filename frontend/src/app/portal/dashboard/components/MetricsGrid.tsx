import Card from '@/components/Card';

interface Metric {
  label: string;
  value: string;
  urgent?: number;
  description?: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
}

interface MetricsGridProps {
  title: string;
  metrics: Metric[];
}

export default function MetricsGrid({ title, metrics }: MetricsGridProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                {metric.urgent && metric.urgent > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.urgent} {metric.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                {metric.urgent && metric.urgent > 0 && (
                  <span className="mb-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {metric.urgent} urgent
                  </span>
                )}
                <div className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-green-600' :
                  metric.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.change}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
