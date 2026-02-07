/**
 * magictodo domain server component example.
 * RSC - no browser APIs, render-only.
 */
import "server-only";

export async function MagictodoServerCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Can fetch data here (server-side)
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
