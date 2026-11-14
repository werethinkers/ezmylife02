// @ts-nocheck
/* eslint-disable */
import SmoothScrollHero  from "@/components/ui/smooth-scroll-hero";

const DemoOne = () => {
  return (
    <div className="relative min-h-screen">
				<SmoothScrollHero
					scrollHeight={1500}
					desktopImage="https://cdn.21st.dev/assets/mirror/50/50b4b749aaf073843fc6cd19e1af2e06364caf610ae881ff9d309c3f84049cec.jpg"
					mobileImage="https://cdn.21st.dev/assets/mirror/1c/1c0b50c23cbd64dee0b682b601f50e5876ef5d3edca6056a3da18149021d4a79.jpg"
					initialClipPercentage={25}
					finalClipPercentage={75}
				/>
			</div>
  );
};

export { DemoOne };
