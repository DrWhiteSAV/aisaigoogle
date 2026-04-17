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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around glass border-t border-white/12 px-4 pb-safe sm:relative sm:h-screen sm:w-20 sm:flex-col sm:border-r sm:border-t-0 sm:px-0 sm:pb-0 sm:gap-6 sm:justify-center">
      <div className="hidden sm:mb-4 sm:flex flex-col items-center">
        <img src="https://i.ibb.co/vCDztLGH/aisaimain.png" alt="Logo" className="h-10 w-10 object-contain rounded-lg mb-4" />
        {rubles !== undefined && (
          <div className="flex flex-col items-center gap-1 opacity-80">
            <Coins className="h-4 w-4 text-rarity-legendary" />
            <span className="text-[9px] font-black text-white">{rubles} ₽</span>
          </div>
        )}
      </div>
      
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 sm:w-full ${
              isActive ? 'text-neon-blue active' : 'text-[#94a3b8] hover:text-white opacity-70'
            }`
          }
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-white/10 blur-[8px] opacity-0 group-[.active]:opacity-100 transition-opacity" />
            <div className="relative h-11 w-11 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-[.active]:bg-neon-blue group-[.active]:border-neon-blue group-[.active]:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all">
              <item.icon className={`h-5 w-5`} />
            </div>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wider block opacity-60 group-[.active]:opacity-100">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
