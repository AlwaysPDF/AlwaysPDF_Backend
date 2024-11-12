// types.ts

export interface User {
  userId: string;
  email: string;
  fName: string;
  lName: string;
  isProfileComplete: boolean;
  tier: string;
}

export interface TokenUser {
  userId: string;
  email: string;
  fName: string;
  lName: string;
  isProfileComplete: boolean;
  tier: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  lName: string;
  fName: string;
  // Add any other properties that you expect in the payload
}
