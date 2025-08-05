"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { apiService } from '../lib/api'

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
      const response = await apiService.getLocations(query, 20)
      const locations = response.data?.locations || []
      
      // Process and simplify suggestions - only city-level results
      return processSimplifiedLocationSuggestions(locations, query)
    } catch (error) {
      console.error('Error searching locations:', error)
      return []
    }
  }

  const processSimplifiedLocationSuggestions = (locations: Location[], query: string): Location[] => {
    // Group locations by city + state to create city-level suggestions only
    const cityGroups = new Map<string, Location>()
    
    locations.forEach(location => {
      const cityKey = `${location.city.toLowerCase()}-${location.stateName.toLowerCase()}`
      if (!cityGroups.has(cityKey)) {
        // Create a city-level location object
        const cityLocation: Location = {
          _id: `city-${cityKey}`,
          zipCode: '', // No specific zip code
          city: location.city,
          state: location.state,
          stateName: location.stateName,
          displayName: `${location.city}, ${location.stateName}` // Clean city, state format
        }
        cityGroups.set(cityKey, cityLocation)
      }
    })
    
    const suggestions = Array.from(cityGroups.values())
    const queryLower = query.toLowerCase().trim()
    
    // Rank suggestions: exact city matches first, then partial matches
    const rankedSuggestions = suggestions.sort((a, b) => {
      const aCityMatch = a.city.toLowerCase().startsWith(queryLower)
      const bCityMatch = b.city.toLowerCase().startsWith(queryLower)
      const aStateMatch = a.stateName.toLowerCase().includes(queryLower)
      const bStateMatch = b.stateName.toLowerCase().includes(queryLower)
      
      // Exact city name matches first
      if (aCityMatch && !bCityMatch) return -1
      if (!aCityMatch && bCityMatch) return 1
      
      // Then state matches
      if (aStateMatch && !bStateMatch) return -1
      if (!aStateMatch && bStateMatch) return 1
      
      // Alphabetical order within same priority
      return a.displayName.localeCompare(b.displayName)
    })
    
    // Limit final results
    return rankedSuggestions.slice(0, 8)
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
