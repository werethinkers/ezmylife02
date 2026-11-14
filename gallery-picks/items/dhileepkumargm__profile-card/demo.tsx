// @ts-nocheck
/* eslint-disable */
import React from 'react'
import ProfileCard from '@/components/ui/profile-card'


const PROFILE_DATA = {
  username: "@kp_judge",
  bio: "Building the future of developer tools. Always curious.",
  status: ["JUDGE", "CREATOR", "DEVELOPER", "INNOVATOR"],
  tier: 3,
  imageUrl: "https://cdn.21st.dev/assets/mirror/43/43e61218d8f1e83c81bc0d4aaf0be9f51ad1a9e54d2cf9491a21ab85a445f9b3.jpg",
}

function App() {
  return (
    <main
      className="
        w-full 
        min-h-screen 
        flex 
        items-center 
        justify-center 
        font-sans 
        p-4 
        bg-[hsl(var(--background))]
      "
      style={{ perspective: '1000px' }}
    >
      <ProfileCard data={PROFILE_DATA} />
    </main>
  )
}

export default App;
