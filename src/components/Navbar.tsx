import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, User, Coins } from 'lucide-react';

export const Navbar: React.FC<{ rubles?: number }> = ({ rubles }) => {
  const navItems = [
    { to: '/main', icon: LayoutGrid, label: 'Бестиарий' },
    { to: '/shop', icon: ShoppingBag, label: 'Магазин' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-[80px] items-center justify-around bg-transparent sm:relative sm:h-screen sm:w-24 sm:flex-col sm:px-0 sm:pb-0 sm:gap-4 sm:justify-center">
      <div className="hidden sm:mb-8 sm:flex flex-col items-center sm:-translate-x-[6px]">
        <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="Logo" className="h-14 w-14 object-contain mb-4 transform -rotate-3 mix-blend-multiply" />
        {rubles !== undefined && (
          <div className="flex flex-col items-center gap-1 opacity-80 border-2 border-pen-blue/10 rounded-lg p-1 bg-transparent rotate-3">
             <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm">
                <Coins className="h-3 w-3 text-pen-blue" strokeWidth={3} />
                <span className="text-[10px] font-black italic text-pen-blue leading-none">{rubles}</span>
             </div>
          </div>
        )}
      </div>
      
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
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block group-[.active]:underline underline-offset-4">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
