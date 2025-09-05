"use client";

export default function Page() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-white"
      style={{ background: "var(--plusme-gradient)" }}
    >
      <div className="p-8 backdrop-blur-sm bg-black/30 rounded-3xl shadow-lg max-w-md w-full text-center">
        {/* Brand Heading */}
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            background: "var(--plusme-brand-gradient)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Welcome to +Me
        </h1>

        {/* Description */}
        <p className="text-gray-300 mb-6">
          Sign in to your account and enjoy the PlusMe experience.
        </p>

        {/* Example Buttons */}
        <div className="flex flex-col gap-4">
          <button
            className="py-2 px-4 rounded-xl text-white font-semibold"
            style={{
              background: "var(--plusme-brand-gradient)",
            }}
          >
            Login
          </button>
          <button className="py-2 px-4 rounded-xl border border-gray-600 text-gray-300 hover:border-white">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
