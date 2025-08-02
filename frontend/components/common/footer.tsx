import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CampusShare</span>
            </div>
            <p className="text-gray-600 text-sm">Connecting students for rides and roommates.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/rides" className="hover:text-blue-600">
                  Ride Sharing
                </Link>
              </li>

              <li>
                <Link href="/roommates" className="hover:text-blue-600">
                  Roommate Finder
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2024 CampusShare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
