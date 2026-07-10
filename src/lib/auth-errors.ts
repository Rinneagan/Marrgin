export function getAuthErrorMessage(error: any): string {
  if (!error || !error.code) {
    return error?.message || "An unexpected error occurred. Please try again.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password must be at least 6 characters long.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again later.";
    case "auth/operation-not-allowed":
      return "Sign-in is not enabled. (Admin: Please enable Email/Password in the Firebase Console)";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "An error occurred: " + error.message;
  }
}
