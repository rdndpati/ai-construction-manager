type Props = {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
};

export default function DashboardCard({
  title,
  value,
  icon,
  color = "bg-white",
}: Props) {
  return (
  <div
    className={`${color} rounded-xl shadow p-6 hover:shadow-lg transition`}
  >
    <div className="flex justify-between items-center">

      <div>
        <h3 className="text-gray-500 text-sm uppercase">
          {title}
        </h3>

        <p className="text-3xl font-bold mt-2">
          {value}
        </p>
      </div>

      {icon && (
        <div className="text-4xl">
          {icon}
        </div>
      )}

    </div>
  </div>
);
}