// @ts-nocheck
/* eslint-disable */
import { 
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
  CardCurtain } from "@/components/ui/card-curtain-reveal"

import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export const CardCurtainRevealDemo = () => {
  return (
    <div className="min-h-screen place-content-center place-items-center">
      <CardCurtainReveal className="h-[560px] w-96 border border-zinc-100 bg-zinc-950 text-zinc-50 shadow">
        <CardCurtainRevealBody className="">
          <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight">
            Behind <br />
            the Curtain
          </CardCurtainRevealTitle>
          <CardCurtainRevealDescription className="my-4 ">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Accusantium voluptate, eum quia temporibus fugiat rerum nobis modi
              dolor, delectus laboriosam, quae adipisci reprehenderit officiis
              quidem iure ducimus incidunt officia. Magni, eligendi repellendus.
              Fugiat, natus aut?
            </p>
          </CardCurtainRevealDescription>
          <Button
            variant={"secondary"}
            size={"icon"}
            className="aspect-square rounded-full"
          >
            <ArrowUpRight />
          </Button>

          <CardCurtain className=" bg-zinc-50" />
        </CardCurtainRevealBody>

        <CardCurtainRevealFooter className="mt-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width="100%"
            height="100%"
            alt="Tokyo street"
            className=""
            src="https://cdn.21st.dev/assets/mirror/3e/3ea6deb405209841367127ed1dce82f2a65106e5d46f071d3e4e5cad9e97e107.jpg"
          />
        </CardCurtainRevealFooter>
      </CardCurtainReveal>
    </div>
  )
}

