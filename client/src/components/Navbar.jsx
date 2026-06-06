import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/random', label: 'Random Question' },
  { to: '/contest', label: 'Contest' },
  { to: '/daily', label: 'Daily Contest' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-800/70 bg-stone-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link to="/" className="group inline-flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-stone-800 bg-linear-to-br from-brand-600/25 to-brand-900/30 text-sm font-semibold text-brand-100 shadow-sm">
            OA
          </span>
          <span className="text-lg font-semibold tracking-tight text-stone-100">
            OA<span className="text-brand-500">Practice</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                location.pathname === to
                  ? 'bg-stone-900/70 text-stone-100 ring-1 ring-stone-700/70'
                  : 'text-stone-300 hover:bg-stone-900/60 hover:text-stone-100'
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
