import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, User, Sprout, Image as ImageIcon, GitBranch } from 'lucide-react';

export const Navbar: React.FC<{ sprouts?: number }> = ({ sprouts }) => {
  const navItems = [
    { to: '/main', icon: LayoutGrid, label: 'Бестиарий' },
    { to: '/gallery/1', icon: ImageIcon, label: 'Галерея' },
    { to: '/shop', icon: Sprout, label: 'Рынок' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-[80px] items-center justify-around bg-transparent sm:top-0 sm:bottom-0 sm:left-0 sm:h-screen sm:w-24 sm:flex-col sm:px-0 sm:pb-0 sm:gap-4 sm:justify-center">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 sm:w-full sm:-translate-x-[6px] ${
              isActive ? 'text-pen-blue active' : 'text-pen-blue/40 hover:text-pen-blue'
            }`
          }
        >
          <div className="relative">
            <div className={`relative h-12 w-12 flex items-center justify-center transition-all ${
              'group-[.active]:scribble-border'
            }`}>
              <item.icon className="h-6 w-6 stroke-[1.5px]" />
            </div>
          </div>
          <span className="text-xs font-black hidden sm:block group-[.active]:underline underline-offset-4">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
