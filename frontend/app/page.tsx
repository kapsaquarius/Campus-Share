"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Home, Users, Star, MapPin, Clock } from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to rides page
  useEffect(() => {
    if (user) {
      router.push("/rides")
    }
  }, [user, router])

  // Don't render content if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">CampusShare</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your all-in-one platform for ride-sharing, roommate finding, and sublease management. Connect with fellow
            students and make campus life easier.
          </p>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything You Need for Campus Life</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Ride Sharing</CardTitle>
                <CardDescription>
                  Find rides or offer your car to fellow students. Save money and make friends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Smart location matching
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Flexible time ranges
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4" />
                    Driver ratings & reviews
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Home className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Subleases</CardTitle>
                <CardDescription>
                  Find short-term housing or sublet your room during breaks and internships.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Detailed property listings</li>
                  <li>Photo galleries</li>
                  <li>Proximity to campus info</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Roommate Finder</CardTitle>
                <CardDescription>
                  Connect with compatible roommates based on lifestyle preferences and habits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Compatibility matching</li>
                  <li>Lifestyle questionnaires</li>
                  <li>Budget preferences</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already using CampusShare to make campus life easier.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
            <Link href="/auth/register">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
