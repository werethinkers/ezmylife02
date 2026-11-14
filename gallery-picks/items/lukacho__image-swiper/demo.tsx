// @ts-nocheck
/* eslint-disable */
import { ImageSwiper } from "@/components/ui/image-swiper"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const images = [
  'https://cdn.21st.dev/assets/mirror/c8/c82a0d93c8d49418568e08924e7615431337c0a1aeeaf773ad4e09c3ba4ffbc9.webp',
  'https://cdn.21st.dev/assets/mirror/31/31a45a259b59134b4296afb0848d5f39ef580746eec83c160ea157059768d9c2.webp',
  'https://cdn.21st.dev/assets/mirror/90/906ab60ca26b478c0c52953d0cd21f54ddbb21d96bb6d2239ef64aa33e4a7e11.webp',
  'https://cdn.21st.dev/assets/mirror/ff/ff6cabcef01f8d32ed0cd44c143985536ec5176759cd29eced971e86289a863f.webp'
]

export function RealEstateCard() {
  return (
    <Card className="max-w-[400px]">
      <CardContent className="p-0">
        <ImageSwiper images={images} />
      </CardContent>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Batumi, Georgia</CardTitle>
        <p className="text-sm text-muted-foreground">5000 Kilometers away</p>
        <p className="mt-1">
          <span className="font-semibold">$200</span> night
        </p>
      </CardHeader>
    </Card>
  )
}