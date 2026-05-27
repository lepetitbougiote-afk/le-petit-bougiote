import { Outlet } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';
import { PublicFooter } from '../public/PublicFooter';
import { PublicNavbar } from '../public/PublicNavbar';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-brand-cream text-slate-900">
      <ScrollToTop />
      <PublicNavbar />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
