"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";

interface User {
  id: string;
  username: string;
}

interface Post {
  id: string;
  title: string;
  description: string | null;
  contentJson: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export default function UserPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndPosts() {
      try {
        const userRes = await axios.get(`http://localhost:8000/api/by-username/${username}`);
        const userData: User = userRes.data;
        setUser(userData);

        const postsRes = await axios.get(`http://localhost:8000/api/users/${userData.id}/posts`);
        setPosts(postsRes.data.data);
      } catch (err) {
        console.error("Error fetching user or posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndPosts();
  }, [username]);

  if (loading) return <p className="text-center mt-10 text-gray-400">Loading...</p>;
  if (!user) return <p className="text-center mt-10 text-gray-400">User not found</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">{user.username}</h1>
        <p className="text-gray-400 mt-2">User ID: {user.id}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col"
          >
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}

            <div className="p-4 flex flex-col flex-1">
              <h2 className="text-xl font-semibold mb-2 text-white">{post.title}</h2>

              {post.description && (
                <p className="text-gray-300 text-sm mb-2">
                  {post.description.length > 120
                    ? post.description.slice(0, 120) + "..."
                    : post.description}
                </p>
              )}

              {post.contentJson && (
                <p className="text-gray-400 text-sm mb-3">
                  {JSON.parse(post.contentJson).blocks
                    ?.map((b: any) => b.text)
                    .join(" ")}
                </p>
              )}

              <p className="text-gray-500 text-xs mt-auto">
                {moment(post.createdAt).format("MMMM Do YYYY, h:mm A")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
