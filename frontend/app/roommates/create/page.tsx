"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Users, Home, DollarSign, User, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RoommateRequestForm {
  roomPreference: string
  bathroomPreference: string
  dietaryPreference: string
  culturalPreference: string
  petFriendly: boolean
  rentBudget: {
    min: number
    max: number
  }
  aboutMe: string
  lifestyleQuestionnaire: {
    cleanlinessLevel: number
    sleepSchedule: string
    guestFrequency: string
    studyEnvironment: string
  }
}

export default function CreateRoommateRequestPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RoommateRequestForm>({
    roomPreference: "",
    bathroomPreference: "",
    dietaryPreference: "",
    culturalPreference: "",
    petFriendly: false,
    rentBudget: { min: 600, max: 1200 },
    aboutMe: "",
    lifestyleQuestionnaire: {
      cleanlinessLevel: 3,
      sleepSchedule: "",
      guestFrequency: "",
      studyEnvironment: "",
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const totalSteps = 4

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.roomPreference) newErrors.roomPreference = "Room preference is required"
        if (!formData.bathroomPreference) newErrors.bathroomPreference = "Bathroom preference is required"
        if (!formData.dietaryPreference) newErrors.dietaryPreference = "Dietary preference is required"
        break
      case 2:
        if (formData.rentBudget.min >= formData.rentBudget.max) {
          newErrors.rentBudget = "Maximum budget must be higher than minimum"
        }
        break
      case 3:
        if (!formData.aboutMe || formData.aboutMe.length < 10) {
          newErrors.aboutMe = "About me must be at least 10 characters"
        }
        break
      case 4:
        if (!formData.lifestyleQuestionnaire.sleepSchedule) {
          newErrors.sleepSchedule = "Sleep schedule is required"
        }
        if (!formData.lifestyleQuestionnaire.guestFrequency) {
          newErrors.guestFrequency = "Guest frequency is required"
        }
        if (!formData.lifestyleQuestionnaire.studyEnvironment) {
          newErrors.studyEnvironment = "Study environment is required"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Roommate request created successfully!",
      description: "You can now search for compatible roommates.",
    })

    router.push("/roommates")
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Basic Preferences
              </CardTitle>
              <CardDescription>Tell us about your living preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Room Preference</Label>
                <Select
                  value={formData.roomPreference}
                  onValueChange={(value) => handleInputChange("roomPreference", value)}
                >
                  <SelectTrigger className={errors.roomPreference ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select room preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single room</SelectItem>
                    <SelectItem value="shared">Shared room</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.roomPreference && <p className="text-sm text-red-500">{errors.roomPreference}</p>}
              </div>

              <div className="space-y-2">
                <Label>Bathroom Preference</Label>
                <Select
                  value={formData.bathroomPreference}
                  onValueChange={(value) => handleInputChange("bathroomPreference", value)}
                >
                  <SelectTrigger className={errors.bathroomPreference ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select bathroom preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own bathroom</SelectItem>
                    <SelectItem value="shared">Shared bathroom</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bathroomPreference && <p className="text-sm text-red-500">{errors.bathroomPreference}</p>}
              </div>

              <div className="space-y-2">
                <Label>Dietary Preference</Label>
                <Select
                  value={formData.dietaryPreference}
                  onValueChange={(value) => handleInputChange("dietaryPreference", value)}
                >
                  <SelectTrigger className={errors.dietaryPreference ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select dietary preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="eggetarian">Eggetarian</SelectItem>
                    <SelectItem value="non-vegetarian">Non-vegetarian</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.dietaryPreference && <p className="text-sm text-red-500">{errors.dietaryPreference}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="culturalPreference">Cultural Preference (Optional)</Label>
                <Input
                  id="culturalPreference"
                  placeholder="e.g., open to all cultures, prefer similar background"
                  value={formData.culturalPreference}
                  onChange={(e) => handleInputChange("culturalPreference", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="petFriendly"
                  checked={formData.petFriendly}
                  onCheckedChange={(checked) => handleInputChange("petFriendly", checked)}
                />
                <Label htmlFor="petFriendly">I'm okay with pets</Label>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Range
              </CardTitle>
              <CardDescription>What's your monthly rent budget?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Budget Range</Label>
                  <span className="text-sm text-gray-600">
                    ${formData.rentBudget.min} - ${formData.rentBudget.max} per month
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Minimum: ${formData.rentBudget.min}</Label>
                    <Slider
                      value={[formData.rentBudget.min]}
                      onValueChange={([value]) =>
                        handleInputChange("rentBudget", { ...formData.rentBudget, min: value })
                      }
                      max={2000}
                      min={300}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Maximum: ${formData.rentBudget.max}</Label>
                    <Slider
                      value={[formData.rentBudget.max]}
                      onValueChange={([value]) =>
                        handleInputChange("rentBudget", { ...formData.rentBudget, max: value })
                      }
                      max={3000}
                      min={500}
                      step={50}
                      className="w-full"
                    />
                  </div>
                </div>

                {errors.rentBudget && <p className="text-sm text-red-500">{errors.rentBudget}</p>}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                About You
              </CardTitle>
              <CardDescription>Tell potential roommates about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="aboutMe">About Me</Label>
                <Textarea
                  id="aboutMe"
                  placeholder="Describe yourself, your interests, study habits, and what you're looking for in a roommate..."
                  value={formData.aboutMe}
                  onChange={(e) => handleInputChange("aboutMe", e.target.value)}
                  className={`min-h-[120px] ${errors.aboutMe ? "border-red-500" : ""}`}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{errors.aboutMe || "Share your personality, habits, and expectations"}</span>
                  <span>{formData.aboutMe.length}/1000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lifestyle Questionnaire
              </CardTitle>
              <CardDescription>Help us find your perfect match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cleanliness Level: {formData.lifestyleQuestionnaire.cleanlinessLevel}/5</Label>
                <Slider
                  value={[formData.lifestyleQuestionnaire.cleanlinessLevel]}
                  onValueChange={([value]) => handleInputChange("lifestyleQuestionnaire.cleanlinessLevel", value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Very messy</span>
                  <span>Very clean</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sleep Schedule</Label>
                <Select
                  value={formData.lifestyleQuestionnaire.sleepSchedule}
                  onValueChange={(value) => handleInputChange("lifestyleQuestionnaire.sleepSchedule", value)}
                >
                  <SelectTrigger className={errors.sleepSchedule ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your sleep schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_bird">Early bird (sleep before 11 PM)</SelectItem>
                    <SelectItem value="night_owl">Night owl (sleep after 1 AM)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sleepSchedule && <p className="text-sm text-red-500">{errors.sleepSchedule}</p>}
              </div>

              <div className="space-y-2">
                <Label>Guest Frequency</Label>
                <Select
                  value={formData.lifestyleQuestionnaire.guestFrequency}
                  onValueChange={(value) => handleInputChange("lifestyleQuestionnaire.guestFrequency", value)}
                >
                  <SelectTrigger className={errors.guestFrequency ? "border-red-500" : ""}>
                    <SelectValue placeholder="How often do you have guests?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rarely">Rarely (few times a month)</SelectItem>
                    <SelectItem value="sometimes">Sometimes (weekly)</SelectItem>
                    <SelectItem value="often">Often (multiple times a week)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.guestFrequency && <p className="text-sm text-red-500">{errors.guestFrequency}</p>}
              </div>

              <div className="space-y-2">
                <Label>Study Environment</Label>
                <Select
                  value={formData.lifestyleQuestionnaire.studyEnvironment}
                  onValueChange={(value) => handleInputChange("lifestyleQuestionnaire.studyEnvironment", value)}
                >
                  <SelectTrigger className={errors.studyEnvironment ? "border-red-500" : ""}>
                    <SelectValue placeholder="What study environment do you prefer?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiet">Quiet (library-like)</SelectItem>
                    <SelectItem value="moderate">Moderate (some background noise)</SelectItem>
                    <SelectItem value="noisy">Noisy (music, conversations okay)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.studyEnvironment && <p className="text-sm text-red-500">{errors.studyEnvironment}</p>}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Roommate Request</h1>
          <p className="text-gray-600 mt-2">Find your perfect living partner</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} className="flex-1">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Request...
                </>
              ) : (
                "Create Request"
              )}
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
