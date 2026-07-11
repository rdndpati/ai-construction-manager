type DashboardCardProps = {
  title: string;
  value: string;
  emoji: string;
};

export default function DashboardCard({
  title,
  value,
  emoji,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
      <div className="text-5xl">{emoji}</div>

      <h2 className="text-xl font-bold mt-4">
        {title}
      </h2>

      <p className="text-gray-600 mt-2">
        {value}
      </p>
    </div>
  );
}