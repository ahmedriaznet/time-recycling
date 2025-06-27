import { useAuth } from "../contexts/AuthContextFirebase";

// Simplified unified auth that only uses Firebase
export const useUnifiedAuth = () => {
  return useAuth();
};
