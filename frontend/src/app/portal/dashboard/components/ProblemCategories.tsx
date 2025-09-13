import Card from '@/components/Card';

interface ProblemCategory {
  category: string;
  count: number;
  percentage: number;
}

interface ProblemCategoriesProps {
  categories: ProblemCategory[];
}

export default function ProblemCategories({ categories }: ProblemCategoriesProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Problem Areas</h2>
      <div className="space-y-3">
        {categories.map((category, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">{category.category}</span>
              <span className="font-medium text-gray-900">{category.count} issues</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
