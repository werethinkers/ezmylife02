// @ts-nocheck
/* eslint-disable */
import Component from '../components/ui/festivity-hero'

export default function Default() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Component />
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-4xl font-bold text-white hide-text" style={{ opacity: 0 }}>
          Interactive 3D Demo
        </h1>
        <p className="text-lg text-gray-300 mt-2 hide-text" style={{ opacity: 0 }}>
          Move your mouse to interact with the spheres
        </p>
      </div>
      <div className="main-txt absolute inset-0 flex items-center justify-center z-10">
        <p className="text-2xl text-white">Loading...</p>
      </div>
    </div>
  )
}