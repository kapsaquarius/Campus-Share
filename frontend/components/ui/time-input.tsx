"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
  required?: boolean
}

export function TimeInput({ value, onChange, placeholder, className, error, required }: TimeInputProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`pl-10 ${value && value.trim() !== "" ? "pr-10" : ""} ${error ? "border-red-500" : ""} ${className || ""}`}
        />
        {value && value.trim() !== "" && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 z-10"
            title="Clear time"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}