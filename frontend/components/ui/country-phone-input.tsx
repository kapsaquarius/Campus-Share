"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check } from 'lucide-react'

interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  minLength: number  // Minimum digits in national number
  maxLength: number  // Maximum digits in national number
  format?: string    // Example format for display
}

const countries: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', minLength: 10, maxLength: 10, format: '(555) 123-4567' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', minLength: 10, maxLength: 10, format: '(555) 123-4567' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', minLength: 10, maxLength: 11, format: '07123 456789' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', minLength: 9, maxLength: 9, format: '412 345 678' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', minLength: 10, maxLength: 12, format: '1512 3456789' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', minLength: 9, maxLength: 9, format: '6 12 34 56 78' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', minLength: 10, maxLength: 11, format: '90 1234 5678' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', minLength: 11, maxLength: 11, format: '138 0013 8000' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', minLength: 10, maxLength: 10, format: '98765 43210' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', minLength: 10, maxLength: 11, format: '11 91234-5678' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', minLength: 10, maxLength: 10, format: '55 1234 5678' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', minLength: 10, maxLength: 10, format: '912 345-67-89' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', minLength: 9, maxLength: 10, format: '10-1234-5678' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', minLength: 9, maxLength: 11, format: '312 345 6789' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', minLength: 9, maxLength: 9, format: '612 34 56 78' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', minLength: 9, maxLength: 9, format: '6 12345678' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', minLength: 9, maxLength: 9, format: '70 123 45 67' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', minLength: 8, maxLength: 8, format: '412 34 567' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', minLength: 8, maxLength: 8, format: '12 34 56 78' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', minLength: 9, maxLength: 10, format: '40 123 4567' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', minLength: 9, maxLength: 9, format: '78 123 45 67' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', minLength: 10, maxLength: 11, format: '664 123456789' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', minLength: 9, maxLength: 9, format: '470 12 34 56' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', minLength: 9, maxLength: 9, format: '512 345 678' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', minLength: 9, maxLength: 9, format: '601 123 456' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', minLength: 9, maxLength: 9, format: '20 123 4567' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', minLength: 10, maxLength: 10, format: '694 123 4567' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', minLength: 9, maxLength: 9, format: '912 345 678' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', minLength: 9, maxLength: 9, format: '85 123 4567' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', minLength: 8, maxLength: 9, format: '21 123 456' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', minLength: 8, maxLength: 8, format: '8123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', minLength: 9, maxLength: 10, format: '12-345 6789' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', minLength: 9, maxLength: 9, format: '81 234 5678' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', minLength: 9, maxLength: 10, format: '912 345 678' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', minLength: 10, maxLength: 10, format: '917 123 4567' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', minLength: 9, maxLength: 12, format: '812 3456 789' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', minLength: 9, maxLength: 9, format: '82 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', minLength: 10, maxLength: 10, format: '802 123 4567' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', minLength: 10, maxLength: 11, format: '100 123 4567' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', minLength: 9, maxLength: 9, format: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', minLength: 9, maxLength: 9, format: '50 123 4567' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', minLength: 9, maxLength: 9, format: '50 123 4567' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', minLength: 10, maxLength: 10, format: '532 123 45 67' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', minLength: 10, maxLength: 11, format: '11 1234-5678' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', minLength: 9, maxLength: 9, format: '9 1234 5678' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', minLength: 10, maxLength: 10, format: '300 123 4567' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', minLength: 9, maxLength: 9, format: '987 654 321' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', minLength: 10, maxLength: 10, format: '412 123 4567' },
]

// Validation function for phone numbers
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string; country?: Country } {
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    return { isValid: false, error: 'Phone number must include country code (e.g., +1 555-123-4567)' }
  }

  // Find matching country by dial code
  const matchingCountry = countries.find(country => phoneNumber.startsWith(country.dialCode))
  
  if (!matchingCountry) {
    return { isValid: false, error: 'Invalid country code' }
  }

  // Extract the national number (remove country code and clean up)
  const nationalNumber = phoneNumber.substring(matchingCountry.dialCode.length).replace(/[^\d]/g, '')
  
  if (nationalNumber.length < matchingCountry.minLength) {
    return { 
      isValid: false, 
      error: `${matchingCountry.name} phone numbers must have at least ${matchingCountry.minLength} digits (currently ${nationalNumber.length})`,
      country: matchingCountry
    }
  }
  
  if (nationalNumber.length > matchingCountry.maxLength) {
    return { 
      isValid: false, 
      error: `${matchingCountry.name} phone numbers must have at most ${matchingCountry.maxLength} digits (currently ${nationalNumber.length})`,
      country: matchingCountry
    }
  }

  return { isValid: true, country: matchingCountry }
}

interface CountryPhoneInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  helpText?: string
  onValidationChange?: (isValid: boolean, error?: string) => void
}

export function CountryPhoneInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter phone number",
  error,
  required = false,
  helpText,
  onValidationChange
}: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]) // Default to US
  const [phoneNumber, setPhoneNumber] = useState('')
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string; country?: Country }>({ isValid: false })

  // Parse existing value if provided
  React.useEffect(() => {
    if (value && value.startsWith('+')) {
      // Find the country by dial code
      const foundCountry = countries.find(country => value.startsWith(country.dialCode))
      if (foundCountry) {
        setSelectedCountry(foundCountry)
        setPhoneNumber(value.substring(foundCountry.dialCode.length).trim())
      }
    }
  }, [value])

  // Validate phone number whenever value changes
  React.useEffect(() => {
    if (value) {
      const result = validatePhoneNumber(value)
      setValidationResult(result)
      if (onValidationChange) {
        onValidationChange(result.isValid, result.error)
      }
    } else {
      setValidationResult({ isValid: false })
      if (onValidationChange) {
        onValidationChange(false, required ? 'Phone number is required' : undefined)
      }
    }
  }, [value, onValidationChange, required])

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (country) {
      setSelectedCountry(country)
      const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : country.dialCode
      onChange(fullNumber)
    }
  }

  const handlePhoneNumberChange = (num: string) => {
    // Remove any non-digit characters except spaces and hyphens
    const cleanNumber = num.replace(/[^\d\s\-\(\)]/g, '')
    setPhoneNumber(cleanNumber)
    
    const fullNumber = cleanNumber ? `${selectedCountry.dialCode} ${cleanNumber}` : selectedCountry.dialCode
    onChange(fullNumber)
  }

  const isValid = validationResult.isValid && !error
  const displayError = error || validationResult.error

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-32">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm">{country.dialCode}</span>
                  <span className="text-sm text-gray-600">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Input
            id={id}
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            placeholder={selectedCountry.format || placeholder}
            className={`${displayError ? "border-red-500" : isValid ? "border-green-500" : ""}`}
          />
          {isValid && <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
        </div>
      </div>
      
      {/* Display validation error */}
      {displayError && <p className="text-sm text-red-500">{displayError}</p>}
      
      {/* Show format hint when no error */}
      {!displayError && selectedCountry.format && (
        <p className="text-xs text-gray-500">
          Format example: {selectedCountry.format}
        </p>
      )}
      
      {/* Help text */}
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
      
      {/* Show full formatted number and validation status */}
      {value && value.length > selectedCountry.dialCode.length && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            Full number: <span className="font-mono">{value}</span>
          </p>
          {isValid && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Valid {selectedCountry.name} phone number
            </p>
          )}
        </div>
      )}
    </div>
  )
}