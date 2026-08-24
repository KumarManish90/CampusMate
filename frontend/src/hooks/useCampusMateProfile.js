import { useCallback, useState } from "react";

const DEFAULT_PROFILE = {
  name: "You",
  college: "",
  branch: "",
  year: "",
  bio: "",
  interests: [],
  lookingFor: "",
};

export function useCampusMateProfile(initialProfile = {}) {
  const [profile, setProfile] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...initialProfile,
    interests: Array.isArray(initialProfile.interests) ? initialProfile.interests : DEFAULT_PROFILE.interests,
  }));

  const updateProfile = useCallback((key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  }, []);

  const mergeProfile = useCallback((nextProfile) => {
    setProfile((current) => ({ ...current, ...nextProfile }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE, interests: [] });
  }, []);

  return { profile, setProfile, updateProfile, mergeProfile, resetProfile };
}

export { DEFAULT_PROFILE };
