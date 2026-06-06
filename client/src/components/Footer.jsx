export default function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-stone-400 sm:flex-row sm:px-6">
        <p>&copy; {new Date().getFullYear()} OA Practice</p>
        <p>Warm, local-first OA practice with contests.</p>
      </div>
    </footer>
  );
}
