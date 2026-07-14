"use client";

type Activity = {
  id: string;
  action: string;
  description: string;
  user_name: string;
  created_at: string;
};

type Props = {
  activities: Activity[];
};

export default function ActivityTimeline({
  activities,
}: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Activity Timeline
        </h2>

        <p className="text-gray-500">
          No activity yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-2xl font-bold mb-6">
        Activity Timeline
      </h2>

      <div className="space-y-5">

        {activities.map((activity) => (

          <div
            key={activity.id}
            className="border-l-4 border-blue-500 pl-4"
          >

            <div className="flex justify-between">

              <strong>
                {activity.action}
              </strong>

              <span className="text-gray-500 text-sm">
                {new Date(activity.created_at).toLocaleString()}
              </span>

            </div>

            <p className="mt-1">
              {activity.description}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              By {activity.user_name}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}