// @ts-nocheck
/* eslint-disable */
import MetallicBusinessCard from "@/components/ui/metallic-business-card";

const settings = {
  maxRotation: 40,
  lightFollow: 0.4,
  influenceRadius: 500,
  ease: 0.08,
  radius: 16,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    <div className="h-screen w-screen grid place-items-center">
      <MetallicBusinessCard
        maxRotation={s.maxRotation}
        lightFollow={s.lightFollow}
        influenceRadius={s.influenceRadius}
        ease={s.ease}
        radius={s.radius}
      />
    </div>
  );
}
