import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, User, Settings, LogOut, UserCircle, Filter } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useMapState } from './mapStateContext';

const Navbar = ({ isMapMoving = false }) => {
  const [currentText, setCurrentText] = useState('Bangalore');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const {
    userLocation,
    handleMarkerClick,
    showFilterPanel,
    setShowFilterPanel,
    activeFilters,
    filteredEvents,
    clearFilters
  } = useMapState();

  const appliedFilterCount = activeFilters
    ? Object.entries(activeFilters).reduce((total, [key, value]) => {
        if (['user_lat', 'user_lng', 'limit', 'offset'].includes(key)) {
          return total;
        }

        if (key === 'sort_by') {
          return value && value !== 'distance' ? total + 1 : total;
        }

        return value !== undefined && value !== null && value !== ''
          ? total + 1
          : total;
      }, 0)
    : 0;

  const filterMatches = activeFilters ? filteredEvents.length : null;

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500); // Small delay for load animation

    return () => clearTimeout(timer);
  }, []);
  
  // Toggle between Bangalore and Bengaluru every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentText(prev => prev === 'Bangalore' ? 'Bengaluru' : 'Bangalore');
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (section) => {
    // Add your navigation logic here
  };

  const handleEventSelect = (eventId) => {
    handleMarkerClick(eventId);
  };

  const handleFilterToggle = () => {
    setShowFilterPanel(!showFilterPanel);
  };

  const handleResetFilters = () => {
    clearFilters();
  };

  return (
    <nav className="fixed top-2 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-5xl px-4">
      <div className={`bg-card border border-border shadow-2xl rounded-2xl transform origin-center ${
        !isLoaded 
          ? 'scale-x-0 opacity-0' 
          : isMapMoving 
            ? 'navbar-collapse'
            : 'navbar-expand'
      }`}>
        <div className={`flex items-center justify-between gap-4 h-16 px-4 transition-opacity duration-300 ${
          isMapMoving ? 'opacity-0' : 'opacity-100'
        }`}>
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold flex items-center">
              <div className="relative inline-block overflow-hidden">
                <span 
                  className={`text-foreground inline-block transition-all duration-300 ease-in-out ${
                    isAnimating 
                      ? 'transform -translate-y-full opacity-0' 
                      : 'transform translate-y-0 opacity-100'
                  }`}
                >
                  {currentText}
                </span>
              </div>
              <span className="text-accent">Now</span>
            </h1>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl">
            <SearchBar 
              onEventSelect={handleEventSelect}
              userLocation={userLocation}
            />
          </div>

          {/* Right side - Filters + Account */}
          <div className="flex items-center flex-shrink-0 gap-3">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleFilterToggle}
                aria-pressed={showFilterPanel}
                className={`group relative flex min-w-[320px] items-center gap-4 rounded-none border-none bg-transparent px-0 py-0 text-left text-sm text-card-foreground ${
                  showFilterPanel ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 text-white shadow-inner">
                  <Filter className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    Filters
                  </span>
                  <span className="block text-sm font-semibold">
                    {appliedFilterCount > 0 ? `${appliedFilterCount} applied` : 'Refine results'}
                  </span>
                  {typeof filterMatches === 'number' && (
                  <span className="text-xs text-muted-foreground">
                    {filterMatches} match{filterMatches === 1 ? '' : 'es'}
                  </span>
                )}
                </div>
                {appliedFilterCount > 0 && (
                  <Badge className="ml-auto rounded-xl bg-slate-900 text-white">
                    {appliedFilterCount}
                  </Badge>
                )}
              </Button>
              {appliedFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold uppercase tracking-wide text-accent hover:text-accent/80"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Desktop Account */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/avatars/user.png" alt="User" />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-48 bg-card border-border " 
                  align="end" 
                  sideOffset={8}
                  alignOffset={-8}
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal text-card-foreground">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        john.doe@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    onClick={() => handleNavigation('profile')}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    onClick={() => handleNavigation('settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                    onClick={() => handleNavigation('logout')}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Navigation - Icons only */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={handleFilterToggle}
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl px-1 transition-all duration-200 ${
                  showFilterPanel
                    ? 'text-foreground'
                    : 'text-gray-300 hover:text-foreground'
                }`}
                title="Filters"
              >
                <Filter className="w-5 h-5" />
                {appliedFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                    {appliedFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNavigation('map')}
                className="p-2 rounded-xl text-gray-300 hover:text-accent hover:bg-secondary/60 transition-all duration-200"
                title="Map"
              >
                <Map className="w-4 h-4" />
              </button>
              {/* Avatar for mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/avatars/user.png" alt="User" />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-48 bg-card border-border rounded-xl" 
                  align="end" 
                  sideOffset={8}
                  alignOffset={-8}
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal text-card-foreground">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        john.doe@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    onClick={() => handleNavigation('profile')}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    onClick={() => handleNavigation('settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                    onClick={() => handleNavigation('logout')}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
