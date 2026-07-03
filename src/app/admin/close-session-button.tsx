"use client";

// Confirmation wrapper around the closeSession server action so an admin can't
// close a session with an accidental click.
export function CloseSessionButton({
  action,
  count,
}: {
  action: () => Promise<void>;
  count: number;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Close this session?\n\n${count} booking(s) will be archived (kept in the system for analytics), and the bookings list + flag wall will start fresh for a new session.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="shrink-0 rounded-full bg-fiesta-red px-5 py-2 text-sm font-bold text-cream shadow hover:opacity-90">
        Close session &amp; start new
      </button>
    </form>
  );
}
