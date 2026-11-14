// @ts-nocheck
/* eslint-disable */
"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function NavbarDemo() {
  return (
    <div className="relative w-full flex items-center justify-center">
      <Navbar className="top-2" />
      <p className="text-black dark:text-white">
        The Navbar will show on top of the page
      </p>
    </div>
  );
}

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Services">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="#">Web Development</HoveredLink>
            <HoveredLink href="#">Interface Design</HoveredLink>
            <HoveredLink href="#">Search Engine Optimization</HoveredLink>
            <HoveredLink href="#">Branding</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Products">
          <div className="  text-sm grid grid-cols-2 gap-10 p-4">
            <ProductItem
              title="Haircut & styling"
              href="#"
              src="https://cdn.21st.dev/assets/mirror/d0/d0c487e675bab40fae681d8d36eaeba370a5f7efe85c66facf2359fe247e6455.webp"
              description="Walk in or book a chair online."
            />
            <ProductItem
              title="Bridal packages"
              href="#"
              src="https://cdn.21st.dev/assets/mirror/24/2497be9c46f92ef983d7c7282c18e3fdb0ce0fa789ca1194b7af26dcafbb4bee.webp"
              description="Trial, makeup and hair for the big day"
            />
            <ProductItem
              title="Skin care"
              href="#"
              src="https://cdn.21st.dev/assets/mirror/25/25ff078f2367178702b2bd768e5afb8d77c74606085d95332da33753c1d08714.png"
              description="Facials and clean-ups by trained staff"
            />
            <ProductItem
              title="Gift cards"
              href="#"
              src="https://cdn.21st.dev/assets/mirror/9c/9cfee53aeee25428095f052a6f9abd90984c9a46278a3fc4b9a165f43b00eb8d.png"
              description="Give a treat to someone you love"
            />
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Pricing">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="#">Hobby</HoveredLink>
            <HoveredLink href="#">Individual</HoveredLink>
            <HoveredLink href="#">Team</HoveredLink>
            <HoveredLink href="#">Enterprise</HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
