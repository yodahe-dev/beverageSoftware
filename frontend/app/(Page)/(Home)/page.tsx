import React from 'react'
import LeftSidebar from './components/Leftbar'
import MessageSidebar from '@/app/components/MessageSidebar'


export default function page() {
  return (
    <div className="justify-center flex items-center flex-col w-full h-screen">
      <MessageSidebar />
    </div>
  );
}
