type Props = {
  title: string;
  value: string;
  color?: string;
};

export default function DashboardCard({
  title,
  value,
  color = "bg-white",
}: Props) {
  return (
    <div
      className={`${color} rounded-xl shadow p-6 hover:shadow-lg transition`}
    >
      <h3 className="text-gray-500 text-sm uppercase">
        {title}
      </h3>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}