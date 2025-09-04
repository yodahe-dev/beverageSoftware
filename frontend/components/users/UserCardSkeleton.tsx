const UserCardSkeleton = () => {
  return (
    <div className="bg-[#14171A] rounded-2xl border border-[#222832] overflow-hidden h-80">
      <div className="animate-pulse">
        <div className="h-32 bg-[#1A1F24]"></div>
        <div className="p-6">
          <div className="rounded-full bg-[#1A1F24] h-20 w-20 mx-auto -mt-12"></div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-[#1A1F24] rounded w-3/4 mx-auto"></div>
            <div className="h-3 bg-[#1A1F24] rounded w-1/2 mx-auto"></div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="h-10 bg-[#1A1F24] rounded"></div>
            <div className="h-10 bg-[#1A1F24] rounded"></div>
            <div className="h-10 bg-[#1A1F24] rounded"></div>
          </div>
          <div className="mt-6 h-12 bg-[#1A1F24] rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default UserCardSkeleton;
