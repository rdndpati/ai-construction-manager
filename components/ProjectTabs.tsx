import Link from "next/link";

type Props = {
  projectId: string;
};

export default function ProjectTabs({ projectId }: Props) {
  return (
    <div className="flex flex-wrap gap-3 border-b pb-4 mt-8">
      <Link
        href={`/app/projects/${projectId}`}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white"
      >
        Overview
      </Link>

      <Link
        href={`/app/projects/${projectId}/drawings`}
        className="px-4 py-2 rounded-lg bg-gray-200"
      >
        Drawings
      </Link>

      <Link
        href={`/app/projects/${projectId}/rfis`}
        className="px-4 py-2 rounded-lg bg-gray-200"
      >
        RFIs
      </Link>

      <Link
        href={`/app/projects/${projectId}/tbps`}
        className="px-4 py-2 rounded-lg bg-gray-200"
      >
        TBPs
      </Link>

      <Link
  href={`/app/submittals?project=${projectId}`}
  className="px-4 py-2 rounded-lg bg-gray-200"
>
  Submittals
</Link>
<Link
  href={`/app/projects/${projectId}/reports`}
  className="px-4 py-2 rounded-lg bg-gray-200"
>
  Reports
</Link>

      <Link
        href={`/projects/${projectId}/ai`}
        className="px-4 py-2 rounded-lg bg-gray-200"
      >
        AI Assistant
      </Link>
    </div>
  );
}