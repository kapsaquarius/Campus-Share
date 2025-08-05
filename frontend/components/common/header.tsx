"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Bell, Car, User, LogOut, Plus, Heart, Search, Menu } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

export function Header() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getNavLinkClassName = (href: string) => {
    const isActive = pathname === href
    return `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "text-blue-600 bg-blue-50"
        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
    }`
  }

  const getMobileNavLinkClassName = (href: string) => {
    const isActive = pathname === href
    return `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors w-full ${
      isActive
        ? "text-blue-600 bg-blue-50"
        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
    }`
  }

  const handleLogout = () => {
    logout()
    router.push("/")
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">CampusShare</span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">CS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {user && (
              <>
                <Link href="/rides" className={getNavLinkClassName("/rides")}>
                  <Search className="w-4 h-4" />
                  <span>Find Rides</span>
                </Link>
                
                <Link href="/rides/create" className={getNavLinkClassName("/rides/create")}>
                  <Plus className="w-4 h-4" />
                  <span>Create Ride</span>
                </Link>
                
                <Link href="/rides/my-rides" className={getNavLinkClassName("/rides/my-rides")}>
                  <Car className="w-4 h-4" />
                  <span>My Rides</span>
                </Link>
                
                <Link href="/rides/my-interested" className={getNavLinkClassName("/rides/my-interested")}>
                  <Heart className="w-4 h-4" />
                  <span>My Interested Rides</span>
                </Link>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative">
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Desktop User Menu */}
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <div className="lg:hidden">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                        <SheetDescription>Navigate to different sections</SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        <Link 
                          href="/rides" 
                          className={getMobileNavLinkClassName("/rides")}
                          onClick={closeMobileMenu}
                        >
                          <Search className="w-5 h-5" />
                          <span>Find Rides</span>
                        </Link>
                        
                        <Link 
                          href="/rides/create" 
                          className={getMobileNavLinkClassName("/rides/create")}
                          onClick={closeMobileMenu}
                        >
                          <Plus className="w-5 h-5" />
                          <span>Create Ride</span>
                        </Link>
                        
                        <Link 
                          href="/rides/my-rides" 
                          className={getMobileNavLinkClassName("/rides/my-rides")}
                          onClick={closeMobileMenu}
                        >
                          <Car className="w-5 h-5" />
                          <span>My Rides</span>
                        </Link>
                        
                        <Link 
                          href="/rides/my-interested" 
                          className={getMobileNavLinkClassName("/rides/my-interested")}
                          onClick={closeMobileMenu}
                        >
                          <Heart className="w-5 h-5" />
                          <span>My Interested Rides</span>
                        </Link>

                        <div className="border-t pt-4 mt-4">
                          <Link 
                            href="/profile" 
                            className={getMobileNavLinkClassName("/profile")}
                            onClick={closeMobileMenu}
                          >
                            <User className="w-5 h-5" />
                            <span>Profile</span>
                          </Link>
                          
                          <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors w-full text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
