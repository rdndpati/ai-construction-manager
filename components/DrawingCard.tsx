type Props = {
  drawing: {
    id: string;
    number: string;
    name: string;
    revision: string;
    status: string;
  };
};

export default function DrawingCard({ drawing }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-center">

        <div>
          <h2 className="font-bold text-lg">
            {drawing.number}
          </h2>

          <p className="text-gray-600">
            {drawing.name}
          </p>
        </div>

        <div className="text-right">

          <p className="font-medium">
            {drawing.revision}
          </p>

          <span
            className={`px-3 py-1 rounded-full text-sm
            ${
              drawing.status === "IFC"
                ? "bg-green-100 text-green-700"
                : drawing.status === "Review"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {drawing.status}
          </span>

        </div>

      </div>
    </div>
  );
}