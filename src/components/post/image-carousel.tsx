
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

interface ImageCarouselProps{
    images:string[]
}
export function ImageCarousel({images}: ImageCarouselProps){
   // State để quản lý ảnh hiện tại
   const [currentIndex, setCurrentIndex] = useState(0)
    
   // State cho touch events (mobile swipe)
   const [touchStart, setTouchStart] = useState<number | null>(null)
   const [touchEnd, setTouchEnd] = useState<number | null>(null)
   
   const minSwipeDistance = 50 // Khoảng cách tối thiểu để swipe

   // Function: Chuyển về ảnh trước
   const goToPrevious = useCallback(() => {
       setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
   }, [images.length])

   // Function: Chuyển sang ảnh sau
   const goToNext = useCallback(() => {
       setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
   }, [images.length])

   // Function: Nhảy đến ảnh cụ thể (khi click dots)
   const goToSlide = (index: number) => {
       setCurrentIndex(index)
   }

   // Touch handlers cho mobile swipe
   const onTouchStart = (e: React.TouchEvent) => {
       setTouchEnd(null)
       setTouchStart(e.targetTouches[0].clientX)
   }

   const onTouchMove = (e: React.TouchEvent) => {
       setTouchEnd(e.targetTouches[0].clientX)
   }

   const onTouchEnd = () => {
       if (!touchStart || !touchEnd) return

       const distance = touchStart - touchEnd
       const isLeftSwipe = distance > minSwipeDistance
       const isRightSwipe = distance < -minSwipeDistance

       if (isLeftSwipe) {
           goToNext()
       }
       if (isRightSwipe) {
           goToPrevious()
       }
   }

   //Keyboard navigation 
   useEffect(()=>{
    const handleKeyDown = (e:KeyboardEvent) =>{
        if(e.key === "ArrowLeft"){
            goToPrevious()
        }else if (e.key === "ArrowRight"){
            goToNext()
        }
    }
    window.addEventListener("keydown",handleKeyDown)
    return () => window.removeEventListener("keydown",handleKeyDown)
   },[goToNext, goToPrevious])
   if(images.length === 0) return null
   return(
    <Card>
        <CardContent className="p-0">
            <div 
                className="relative w-full aspect-square md:aspect-video overflow-hidden rounded-lg bg-black"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Container chua tat ca cac anh */}
                <div
                    className="flex h-full transition-transform duration-300 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`
                    }}
                >
                    {images.map((url,index) =>(
                        <div
                            key={index}
                            className="min-w-full h-full relative"
                        >
                            <Image
                                src={url}
                                alt={`Post image ${index+1}`}
                                fill
                                className="object-contain"
                                priority={index === 0}
                                sizes="100vw"
                            />
                        </div>
                    ))}
                </div>

                {/* Nut prev/next */}
                {images.length > 1 && (
                    <>
                        <Button 
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                            onClick={goToPrevious}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6"/>
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                            onClick={goToNext}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6"/>
                        </Button>
                    </>
                )}

                {/* Dots Indicator - Chỉ hiện khi có > 1 ảnh */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentIndex
                                        ? "w-8 bg-white"
                                        : "w-2 bg-white/50 hover:bg-white/75"
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
                {/* Image Counter - Chi hien khi co > 1 anh */}
                {images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
   )
}
