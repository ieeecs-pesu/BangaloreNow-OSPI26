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
import { Map, User, Settings, LogOut, UserCircle } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useMapState } from './mapStateContext';

const Navbar = ({ isMapMoving = false }) => {
  const [currentText, setCurrentText] = useState('Bangalore');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { userLocation, handleMarkerClick } = useMapState();
  
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

          {/* Right side - Account */}
          <div className="flex items-center flex-shrink-0">
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
