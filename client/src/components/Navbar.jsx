import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/random', label: 'Random' },
  { to: '/contest', label: 'Contest' },
  { to: '/daily', label: 'Daily' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link to="/" className="group inline-flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-brand-500/25 bg-brand-500/10 text-sm font-semibold text-brand-100 shadow-sm">
            OA
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            OA<span className="text-brand-500">Practice</span>
          </span>
        </Link>
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:gap-2">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                location.pathname === to
                  ? 'bg-zinc-800 text-zinc-50 ring-1 ring-zinc-700'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
