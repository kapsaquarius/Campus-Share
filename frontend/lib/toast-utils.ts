import { toast } from "@/hooks/use-toast"

/**
 * Toast utility functions for consistent messaging across the app
 */

/**
 * Show a success toast with consistent styling and duration
 */
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 4000,
  })
}

/**
 * Show an error toast with consistent styling and duration
 */
export const showErrorToast = (title: string, description?: string, duration: number = 5000) => {
  toast({
    title,
    description: description || "Please try again or contact support if the problem persists.",
    variant: "destructive",
    duration,
  })
}

/**
 * Show an info toast with customizable duration
 */
export const showInfoToast = (title: string, description?: string, duration: number = 3000) => {
  toast({
    title,
    description,
    duration,
  })
}

/**
 * Show authentication required toast
 */
export const showAuthRequiredToast = (action: string = "perform this action") => {
  showErrorToast(
    "Authentication required", 
    `Please log in to ${action}.`,
    5000
  )
}

/**
 * Show validation error toast
 */
export const showValidationErrorToast = (message: string) => {
  showErrorToast(
    "Validation error",
    message,
    5000
  )
}

/**
 * Common success toast messages
 */
export const toastMessages = {
  // Account/Auth related
  accountCreated: () => showSuccessToast(
    "Account created successfully", 
    "Welcome to CampusShare! You can now start connecting with other students."
  ),
  loggedIn: () => showSuccessToast(
    "Logged in successfully", 
    "Welcome back! You have been successfully logged in."
  ),
  profileUpdated: () => showSuccessToast(
    "Profile updated successfully", 
    "Your changes have been saved."
  ),
  accountDeleted: () => showSuccessToast(
    "Account deleted successfully", 
    "Your account and all associated data have been permanently deleted."
  ),
  
  // Password/Verification related
  verificationCodeSent: () => showSuccessToast(
    "Verification code sent successfully", 
    "A verification code has been sent to your email address."
  ),
  codeVerified: () => showSuccessToast(
    "Code verified successfully", 
    "Code verified! Please set your new password."
  ),
  passwordUpdated: () => showSuccessToast(
    "Password updated successfully", 
    "Your password has been successfully updated. You can now log in with your new password."
  ),
  
  // Rides related
  rideCreated: () => showSuccessToast(
    "Ride created successfully", 
    "Your ride has been created and is now visible to other students."
  ),
  rideUpdated: () => showSuccessToast(
    "Ride updated successfully", 
    "Your changes have been saved."
  ),
  rideDeleted: () => showSuccessToast(
    "Ride deleted successfully", 
    "Your ride has been removed."
  ),
  interestSent: () => showSuccessToast(
    "Interest sent successfully", 
    "The driver has been notified! Check 'My Interested Rides' in your profile."
  ),
  interestRemoved: () => showSuccessToast(
    "Interest removed successfully", 
    "You are no longer interested in this ride."
  ),
  
  // Roommate related
  listingCreated: () => showSuccessToast(
    "Listing created successfully", 
    "Your roommate listing is now visible to other students."
  ),
  listingUpdated: () => showSuccessToast(
    "Listing updated successfully", 
    "Your changes have been saved."
  ),
  listingDeleted: () => showSuccessToast(
    "Listing deleted successfully", 
    "Your listing has been removed."
  ),
  roommateInterestSent: () => showSuccessToast(
    "Interest sent successfully", 
    "The poster has been notified."
  ),
  roommateInterestRemoved: () => showSuccessToast(
    "Interest removed successfully", 
    "You are no longer interested in this listing."
  ),
  
  // General actions
  copied: (label: string) => showInfoToast(
    "Copied successfully", 
    `${label} copied to clipboard.`
  ),
  searchCompleted: (count: number, type: string = "results") => showInfoToast(
    "Search completed", 
    `Found ${count} ${type}.`
  ),
}

/**
 * Common error toast messages
 */
export const errorMessages = {
  // Account/Auth related
  failedToCreateAccount: (error?: string) => showErrorToast(
    "Failed to create account", 
    error
  ),
  failedToLogin: (error?: string) => showErrorToast(
    "Failed to log in", 
    error
  ),
  failedToUpdateProfile: () => showErrorToast(
    "Failed to update profile"
  ),
  failedToDeleteAccount: () => showErrorToast(
    "Failed to delete account"
  ),
  
  // Password/Verification related
  emailNotFound: (error?: string) => showErrorToast(
    "Email not found", 
    error
  ),
  invalidVerificationCode: () => showErrorToast(
    "Invalid verification code", 
    "The verification code is invalid or has expired. Please try again."
  ),
  invalidPassword: (error?: string) => showErrorToast(
    "Invalid password", 
    error
  ),
  failedToSendVerificationCode: () => showErrorToast(
    "Failed to send verification code"
  ),
  failedToVerifyCode: () => showErrorToast(
    "Failed to verify code"
  ),
  failedToResetPassword: () => showErrorToast(
    "Failed to reset password"
  ),
  failedToResendCode: () => showErrorToast(
    "Failed to resend verification code"
  ),
  
  // Rides related
  failedToLoadRides: () => showErrorToast(
    "Failed to load rides"
  ),
  failedToCreateRide: (error?: string) => showErrorToast(
    "Failed to create ride", 
    error
  ),
  failedToUpdateRide: () => showErrorToast(
    "Failed to update ride"
  ),
  failedToDeleteRide: () => showErrorToast(
    "Failed to delete ride"
  ),
  failedToExpressInterest: (error?: string) => showErrorToast(
    "Failed to express interest", 
    error
  ),
  failedToRemoveInterest: (error?: string) => showErrorToast(
    "Failed to remove interest", 
    error
  ),
  failedToSearchRides: () => showErrorToast(
    "Failed to search for rides"
  ),
  failedToLoadInterestedRides: () => showErrorToast(
    "Failed to load interested rides"
  ),
  
  // Roommate related
  failedToLoadListings: () => showErrorToast(
    "Failed to load listings", 
    "Could not load your listings. Please try again."
  ),
  failedToCreateListing: () => showErrorToast(
    "Failed to create listing"
  ),
  failedToUpdateListing: () => showErrorToast(
    "Failed to update listing"
  ),
  failedToDeleteListing: () => showErrorToast(
    "Failed to delete listing"
  ),
  failedToLoadMatches: () => showErrorToast(
    "Failed to load matches", 
    "Could not load your matches. Please try again."
  ),
  failedToSearchRoommates: () => showErrorToast(
    "Failed to search for roommates"
  ),
  failedToSendRoommateInterest: () => showErrorToast(
    "Failed to send interest"
  ),
  
  // General/Validation errors
  invalidLocation: (field: string = "location") => showErrorToast(
    `Invalid ${field}`, 
    `Location cleared. Please select a valid ${field} from the dropdown suggestions.`
  ),
  failedToLoadInterestedUsers: (error?: string) => showErrorToast(
    "Failed to load interested users", 
    error
  ),
  
  // Auth required (common actions)
  authRequired: {
    createRide: () => showAuthRequiredToast("create a ride"),
    expressInterest: () => showAuthRequiredToast("express interest"),
    searchRides: () => showAuthRequiredToast("search for rides"),
    searchRoommates: () => showAuthRequiredToast("search for roommates"),
    createListing: () => showAuthRequiredToast("create a listing"),
    deleteAccount: () => showAuthRequiredToast("delete your account"),
  }
}
