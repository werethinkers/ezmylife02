// @ts-nocheck
/* eslint-disable */
"use client"

import * as React from "react"
import { FlipCard } from "../components/ui/flip-card"

const cards = [
  {
    cardNumber: 1,
    backTitle: "Mount Everest",
    backContent: "Height: 8,849 m · Location: Nepal / Tibet",
    backImage:
      "https://cdn.21st.dev/assets/mirror/b5/b5414b8ba5c7b44d2eec475926e95dd4b77fba185a89afd45b101e431510bef6.jpg",
  },
  {
    cardNumber: 2,
    backTitle: "K2",
    backContent: "Height: 8,611 m · Location: Pakistan / China",
    backImage:
      "https://cdn.21st.dev/assets/mirror/e5/e5ef2d30267a4e7f81bc0a61283385f0e59c348d8e69a017f1a87b5323fd8abc.jpg",
  },
  {
    cardNumber: 3,
    backTitle: "Kangchenjunga",
    backContent: "Height: 8,586 m · Location: Nepal / India",
    backImage:
      "https://cdn.21st.dev/assets/mirror/2a/2a475f17b1b0de24aeb8945a46adbefb847727eda2fd56d88a42ddf29101d7cc.jpg",
  },
]

function TwentyFirstLogo() {
  return <svg viewBox="0 0 48 48" className="h-full w-full text-foreground" fill="currentColor" aria-hidden="true"><path d="M24 4 44 40H4Z"/></svg>
}

export default function FlipCardDemo() {
  const [flippedCards, setFlippedCards] = React.useState<
    Record<string, boolean>
  >({})

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6 text-foreground">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8">

        <div className="flex flex-wrap items-center justify-center gap-4">
          {cards.map((card) => (
            <FlipCard
              key={card.cardNumber}
              cardNumber={card.cardNumber}
              backTitle={card.backTitle}
              backContent={card.backContent}
              backImage={card.backImage}
              logo={
                <div className="h-10 w-10">
                  <TwentyFirstLogo />
                </div>
              }
              isFlipped={flippedCards[String(card.cardNumber)] ?? false}
              onFlipChange={(cardNumber, isFlipped) => {
                setFlippedCards((current) => ({
                  ...current,
                  [String(cardNumber)]: isFlipped,
                }))
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}