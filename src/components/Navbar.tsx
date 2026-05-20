import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, User, Sprout, Image as ImageIcon, GitBranch } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar: React.FC<{ 
  sprouts?: number;
  isMobileBook?: boolean;
  isVertical?: boolean;
}> = ({ sprouts, isMobileBook, isVertical }) => {
  const isMobileVertical = isMobileBook && isVertical;

  const navItems = [
    { to: '/main', icon: LayoutGrid, label: 'Бестиарий' },
    { to: '/gallery/1', icon: ImageIcon, label: 'Галерея' },
    { to: '/shop', icon: Sprout, label: 'Рынок' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around transition-all duration-300 sm:top-0 sm:bottom-0 sm:left-0 sm:h-screen sm:w-24 sm:flex-col sm:px-0 sm:pb-0 sm:gap-4 sm:justify-center",
        isMobileVertical 
          ? "bg-[#f2ede0] ledger-grid border-t border-pen-blue" 
          : "bg-transparent h-[80px]"
      )}
      style={isMobileVertical ? { width: '100%', height: '45.9965px' } : undefined}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "group relative flex flex-col items-center justify-center transition-all duration-300 sm:w-full sm:-translate-x-[6px]",
              isMobileVertical ? "space-y-[1px]" : "space-y-1",
              isActive ? 'text-pen-blue active' : 'text-pen-blue/40 hover:text-pen-blue'
            )
          }
        >
          <div className="relative">
            <div 
              className={cn(
                "relative flex items-center justify-center transition-all group-[.active]:scribble-border",
                isMobileVertical ? "h-9 w-9" : "h-12 w-12"
              )}
              style={isMobileVertical ? { marginRight: '0px', marginLeft: '0px', marginTop: '0px' } : undefined}
            >
              <item.icon 
                className={cn("stroke-[1.5px]", isMobileVertical ? "h-5 w-5" : "h-6 w-6")} 
                style={isMobileVertical ? { marginLeft: '0px', marginTop: '-21px' } : undefined}
              />
            </div>
          </div>
          <span 
            className={cn(
              "underline-offset-2 sm:underline-offset-4 group-[.active]:underline",
              isMobileVertical 
                ? "text-[11px] font-bold block pb-0.5 leading-none" 
                : "text-xs font-black hidden sm:block"
            )}
            style={isMobileVertical ? { marginTop: '-19px' } : undefined}
          >
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};
