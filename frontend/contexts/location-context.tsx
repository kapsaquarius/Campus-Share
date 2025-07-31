"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Location {
  _id: string
  zipCode: string
  city: string
  state: string
  stateName: string
  displayName: string
}

interface LocationContextType {
  recentSearches: Location[]
  popularLocations: Location[]
  searchLocations: (query: string) => Promise<Location[]>
  addToRecent: (location: Location) => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [recentSearches, setRecentSearches] = useState<Location[]>([])
  const [popularLocations] = useState<Location[]>([
    {
      _id: "1",
      zipCode: "80301",
      city: "Boulder",
      state: "CO",
      stateName: "Colorado",
      displayName: "Boulder, Colorado 80301",
    },
    {
      _id: "2",
      zipCode: "80202",
      city: "Denver",
      state: "CO",
      stateName: "Colorado",
      displayName: "Denver, Colorado 80202",
    },
    {
      _id: "3",
      zipCode: "80206",
      city: "Denver",
      state: "CO",
      stateName: "Colorado",
      displayName: "Denver International Airport",
    },
  ])

  const searchLocations = async (query: string): Promise<Location[]> => {
    try {
      const response = await fetch(`http://localhost:5000/api/locations/search?q=${encodeURIComponent(query)}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to search locations')
      }
      
      const data = await response.json()
      return data.locations || []
    } catch (error) {
      console.error('Error searching locations:', error)
      return []
    }
  }

  const addToRecent = (location: Location) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((loc) => loc._id !== location._id)
      return [location, ...filtered].slice(0, 10)
    })
  }

  return (
    <LocationContext.Provider
      value={{
        recentSearches,
        popularLocations,
        searchLocations,
        addToRecent,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
