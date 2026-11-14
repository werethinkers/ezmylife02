/*
 * Newsletter Footer
 * Author: @meschacirung   Source: https://21st.dev/@meschacirung/components/footer-4   21st.dev id: 27511
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
import Link from "next/link";

const linkGroups = [
  {
    title: "Product",
    links: [
      { title: "Features", href: "#" },
      { title: "Solution", href: "#" },
      { title: "Partnerships", href: "#" },
      { title: "Mobile App", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Blog", href: "#" },
      { title: "Documentation", href: "#" },
      { title: "Support", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About", href: "#" },
      { title: "Licence", href: "#" },
      { title: "Privacy", href: "#" },
    ],
  },
];

const Logo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 22 20H2z" /></svg>
);

export default function Footer() {
  return (
    <footer role="contentinfo" className="bg-background pt-8 sm:pt-20">
      <div className="mx-auto max-w-5xl space-y-16 px-6">
        <div className="flex flex-wrap justify-between gap-6">
          <div className="max-w-xs space-y-6 md:col-span-2">
            <Link href="/" aria-label="go home" className="block size-fit">
              <Logo className="text-foreground h-5 w-full" />
            </Link>
            <p className="text-muted-foreground text-balance text-sm">
              Vijay Nagar, Indore, Madhya Pradesh
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X/Twitter"
                className="text-muted-foreground hover:text-primary block"
              >
                <svg
                  className="size-5"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
                  />
                </svg>
              </Link>
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted-foreground hover:text-primary block"
              >
                <svg
                  className="size-5"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="bg-size-[6px_1px] h-px bg-[linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] bg-repeat-x opacity-25"
        />

        <div className="grid gap-12 md:grid-cols-5">
          <div className="grid gap-6 sm:grid-cols-3 md:col-span-3">
            {linkGroups.map((group) => (
              <div key={group.title} className="space-y-4 text-sm">
                <span className="block font-medium">{group.title}</span>
                <div className="flex flex-wrap gap-4 sm:flex-col">
                  {group.links.map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="text-muted-foreground hover:text-primary block duration-150"
                    >
                      <span>{link.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2">
            <form className="ml-auto w-full space-y-4 md:max-w-xs">
              <label
                htmlFor="email"
                data-slot="label"
                className="select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 block text-sm font-medium"
              >
                Subscribe to our newsletter
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  data-slot="input"
                  id="email"
                  name="email"
                  required
                  placeholder="Your email"
                  className="dark:bg-foreground/5 file:text-foreground placeholder:text-muted-foreground/75 selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-foreground/35 focus-visible:ring-ring/25 dark:focus-visible:border-foreground/25 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background ring-foreground/10 h-8 border-transparent shadow ring-1"
                />
                <button
                  type="submit"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none active:scale-98 focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-md border-[0.5px] border-white/10 shadow-black/15 [&_svg]:drop-shadow-sm text-shadow-sm bg-primary ring-1 ring-(--ring-color) [--ring-color:color-mix(in_oklab,black_15%,var(--color-primary))] dark:border-transparent dark:[--ring-color:color-mix(in_oklab,white_15%,var(--color-primary))] text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3 text-xs"
                >
                  <span>Subscribe</span>
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                Get the latest product news and behind the scenes updates.
                Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t py-8">
          <span className="text-muted-foreground text-sm">
            © {2026} Our studio. All rights reserved{" "}
          </span>
          <div className="ring-foreground/5 bg-card flex items-center gap-2 rounded-full border border-transparent py-1 pl-2 pr-4 shadow ring-1">
            <div className="relative flex size-3">
              <span className="duration-1500 absolute inset-0 block size-full animate-pulse rounded-full bg-emerald-100" />
              <span className="relative m-auto block size-1 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm">All Systems Normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
