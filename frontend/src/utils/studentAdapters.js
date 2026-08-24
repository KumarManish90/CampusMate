export function adaptApiStudent(user) {
  if (!user) return user;

  return {
    id: user._id,
    name: user.name,
    age: user.age ?? null,
    branch: user.branch || "",
    year: user.year || "",
    college: user.collegeName || user.college || "Unknown",
    bio: user.bio || "",
    interests: user.interests || [],
    lookingFor: user.lookingFor || "Networking",
    photoUrl: user.profilePhoto?.url,
    verificationStatus: user.verificationStatus,
    matchesBack: Boolean(user.matchesBack),
  };
}
