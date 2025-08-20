// Custom AnimatedBackground component
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 opacity-30">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000"></div>
    </div>
  );
};