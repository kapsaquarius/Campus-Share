"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Star, MapPin, Clock, Shield, Users, MessageSquare, Calendar, CheckCircle, Mail } from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/rides")
    }
  }, [user, router])

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <section className="relative py-12 px-4 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Welcome to <span className="text-blue-600">CampusShare</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Your platform for ride-sharing. Connect with fellow
            students and make campus life easier.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white sm:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">Your Campus Connection Platform</h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            CampusShare makes it easy to connect with fellow students, share rides, and build your campus community.
          </p>
          
          <div className="text-center mb-12 sm:mb-16">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
              <Car className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-4">Ride Sharing</h3>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Find rides or offer your car to fellow students. Save money, reduce carbon footprint, and make friends.
            </p>
            
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-900">Smart Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    Find rides on your route automatically with our intelligent matching system
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-900">Flexible Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    Set time ranges that work for your schedule and find compatible riders
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-900">Verified Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    Connect with verified student accounts for safe and secure rides
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Safe & Secure</CardTitle>
                <CardDescription>
                  Your safety is our priority with verified student accounts and secure connections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Student verification
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Secure verification
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Safe meeting points
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Build Community</CardTitle>
                <CardDescription>
                  Connect with fellow students, make new friends, and expand your campus network.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Meet new people
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Share experiences
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Campus connections
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Easy Communication</CardTitle>
                <CardDescription>
                  Stay connected with real-time notifications and messaging features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    Instant notifications
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    Contact sharing
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    Trip updates
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4 bg-white sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-2">We're here to help. Get in touch with our team.</p>
          </div>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <a 
                href="mailto:campussharenotifications@gmail.com" 
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors block mb-2"
              >
                campussharenotifications@gmail.com
              </a>
              <p className="text-gray-600">We'll respond within 24 hours</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 bg-blue-600 text-white sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Get Started?</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 px-2">
            Join thousands of students already using CampusShare to make campus life easier.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base sm:text-lg px-6 py-3 sm:px-8 touch-target">
            <Link href="/auth/register">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
