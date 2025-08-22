"use client";
import useAuth from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading profile...</div>;

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <p>Email: {user?.email}</p>
      <p>User ID: {user?.id}</p>
    </div>
  );
}
