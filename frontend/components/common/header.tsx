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
import { Bell, Car, User, LogOut, Plus, Heart, Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function Header() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  const getNavLinkClassName = (href: string) => {
    const isActive = pathname === href
    return `flex items-center space-x-1.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "text-blue-600 bg-blue-50"
        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
    }`
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CampusShare</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                <Link
                  href="/rides"
                  className={getNavLinkClassName("/rides")}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Find Rides</span>
                </Link>
                
                <Link
                  href="/rides/create"
                  className={getNavLinkClassName("/rides/create")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Create Ride</span>
                </Link>
                
                <Link
                  href="/rides/my-rides"
                  className={getNavLinkClassName("/rides/my-rides")}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">My Rides</span>
                </Link>
                
                <Link
                  href="/rides/my-interested"
                  className={getNavLinkClassName("/rides/my-interested")}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap hidden sm:inline">My Interested Rides</span>
                  <span className="whitespace-nowrap sm:hidden">Interested</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/notifications" className="relative">
                  <Button variant="ghost" size="sm" className="relative">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{user.name}</span>
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
