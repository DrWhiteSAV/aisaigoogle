import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Sword, ShoppingBag, GitBranch, Book, Coins } from 'lucide-react';

export const Navbar: React.FC<{ rubles?: number }> = ({ rubles }) => {
  const navItems = [
    { to: '/main', icon: Home, label: 'Главная' },
    { to: '/setup', icon: Sparkles, label: 'Создать' },
    { to: '/battle', icon: Sword, label: 'Битва' },
    { to: '/evolve', icon: GitBranch, label: 'Развитие' },
    { to: '/market', icon: ShoppingBag, label: 'Рынок' },
    { to: '/bestiary', icon: Book, label: 'Атлас' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[80px] items-center justify-around bg-paper border-t-2 border-pen-blue/20 px-4 pb-safe sm:relative sm:h-screen sm:w-24 sm:flex-col sm:border-r-2 sm:border-t-0 sm:px-0 sm:pb-0 sm:gap-4 sm:justify-center">
      <div className="hidden sm:mb-8 sm:flex flex-col items-center">
        <img src="https://i.ibb.co/k2PN7Q8y/aisailogo.png" alt="Logo" className="h-14 w-14 object-contain mb-4 transform -rotate-3" />
        {rubles !== undefined && (
          <div className="flex flex-col items-center gap-1 opacity-80 border-2 border-pen-blue/20 rounded-lg p-1 bg-sticker-yellow rotate-3">
            <Coins className="h-4 w-4 text-pen-blue" />
            <span className="text-[10px] font-bold text-pen-blue">{rubles} ₽</span>
          </div>
        )}
      </div>
      
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 sm:w-full ${
              isActive ? 'text-pen-blue active' : 'text-pen-blue/40 hover:text-pen-blue'
            }`
          }
        >
          <div className="relative">
            <div className={`relative h-12 w-12 flex items-center justify-center transition-all ${
              'group-[.active]:scribble-border bg-white shadow-sm'
            }`}>
              <item.icon className="h-6 w-6 stroke-[1.5px]" />
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight block group-[.active]:underline">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
