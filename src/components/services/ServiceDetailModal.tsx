"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Maximize2, X, Clock, DollarSign } from "lucide-react"
import { formatDuration } from "@/utils/serviceUtils"

interface ServiceMedia {
    id: string
    fileUrl: string
    fileType: string
    displayOrder: number
}

interface Service {
    id: string
    name: string
    description: string | null
    price: number | null
    pricingType: string | null
    durationMinutes: number | null
    media: ServiceMedia[]
}

interface ServiceDetailModalProps {
    service: Service
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ServiceDetailModal({ service, open, onOpenChange }: ServiceDetailModalProps) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setTimeout(() => setCurrentMediaIndex(0), 300)
        }
        onOpenChange(val)
    }

    const currentMedia = service.media[currentMediaIndex]
    const hasMultipleMedia = service.media.length > 1
    const hasMedia = service.media.length > 0

    const handlePrevious = () => {
        setCurrentMediaIndex((prev) => (prev === 0 ? service.media.length - 1 : prev - 1))
    }

    const handleNext = () => {
        setCurrentMediaIndex((prev) => (prev === service.media.length - 1 ? 0 : prev + 1))
    }

    const handleThumbnailClick = (index: number) => {
        setCurrentMediaIndex(index)
    }

    const priceDisplay = service.price != null ? `$${service.price}` : "Quote"
    const pricingTypeDisplay = service.pricingType ? service.pricingType.replace("_", " ") : ""

    return (
        <>
            {/* Main Modal */}
            <Dialog open={open && !isFullscreen} onOpenChange={handleOpenChange}>
                <DialogContent className="w-[95vw] sm:max-w-4xl h-auto max-h-[90dvh] p-0 gap-0 bg-background border-none shadow-2xl overflow-hidden rounded-2xl sm:rounded-xl">
                    <div className="flex flex-col h-[90dvh]">
                        {/* Media Section */}
                        <div className="relative bg-black shrink-0 aspect-[4/3] sm:aspect-auto h-1/2">
                            {/* Main Media Viewer */}
                            <div className="relative w-full h-full bg-black group">
                                {hasMedia ? (
                                    currentMedia?.fileType === "image" ? (
                                        <img
                                            src={currentMedia.fileUrl || "/placeholder.svg"}
                                            alt={service.name}
                                            className="w-full h-full object-contain transition-opacity duration-300"
                                        />
                                    ) : currentMedia?.fileType === "video" ? (
                                        <video
                                            src={currentMedia.fileUrl}
                                            controls
                                            className="w-full h-full object-contain transition-opacity duration-300"
                                            preload="metadata"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : null
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white/60">No media available</div>
                                )}
                                {/* Fullscreen Button - Top Left */}
                                {hasMedia && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm h-9 w-9 z-20"
                                        onClick={() => setIsFullscreen(true)}
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                )}

                                {/* Close Button for Main Modal - Top Right */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md h-9 w-9 z-20 rounded-full border border-white/10"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>

                                {/* Navigation Arrows - Only for multiple media */}
                                {hasMultipleMedia && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10 z-10"
                                            onClick={handlePrevious}
                                        >
                                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10 z-10"
                                            onClick={handleNext}
                                        >
                                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </Button>

                                        {/* Media Counter */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm z-10">
                                            {currentMediaIndex + 1} / {service.media.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Carousel - Only for multiple media */}
                            {/* {hasMultipleMedia && (
                                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-black/90 backdrop-blur-sm overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-2 justify-start min-w-min">
                                        {service.media.map((media, index) => (
                                            <button
                                                key={media.id}
                                                onClick={() => handleThumbnailClick(index)}
                                                className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all ${index === currentMediaIndex
                                                    ? "border-white ring-2 ring-white/50 scale-105"
                                                    : "border-white/20 hover:border-white/50"
                                                    }`}
                                            >
                                                {media.fileType === "image" ? (
                                                    <img
                                                        src={media.fileUrl || "/placeholder.svg"}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-black/50 flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                                                            <div className="w-0 h-0 border-l-6 border-l-white border-y-3 border-y-transparent ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )} */}
                        </div>

                        {/* Content Section - Scrollable */}
                        <div className="flex-1 overflow-y-auto bg-background min-h-0">
                            <div className="px-4 sm:px-8 py-6 space-y-8 max-w-4xl mx-auto">

                                {/* Title */}
                                <div className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
                                        {service.name}
                                    </h2>
                                </div>

                                {/* Price & Duration Card */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl border bg-muted/40 p-5">

                                    {/* Price */}
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl">
                                            <DollarSign className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-primary leading-none">
                                                {priceDisplay}
                                            </p>
                                            {service.pricingType && (
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                                                    {pricingTypeDisplay}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    {service.durationMinutes && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-background rounded-xl border">
                                                <Clock className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                                                    Duration
                                                </p>
                                                <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
                                                    {formatDuration(service.durationMinutes)}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold">About this service</h3>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    <p className="text-base sm:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-w-prose">
                                        {service.description || "No description provided for this service."}
                                    </p>
                                </div>

                            </div>
                        </div>


                    </div>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm z-10 h-10 w-10"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* Navigation Arrows */}
                    {hasMultipleMedia && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm z-10 h-12 w-12"
                                onClick={handlePrevious}
                            >
                                <ChevronLeft className="w-7 h-7" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm z-10 h-12 w-12"
                                onClick={handleNext}
                            >
                                <ChevronRight className="w-7 h-7" />
                            </Button>
                        </>
                    )}

                    {/* Media Counter */}
                    {hasMultipleMedia && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-sm z-10">
                            {currentMediaIndex + 1} / {service.media.length}
                        </div>
                    )}

                    {/* Media Display */}
                    {currentMedia?.fileType === "image" ? (
                        <img
                            src={currentMedia.fileUrl || "/placeholder.svg"}
                            alt={service.name}
                            className="max-w-[95vw] max-h-[95vh] object-contain"
                        />
                    ) : currentMedia?.fileType === "video" ? (
                        <video
                            src={currentMedia.fileUrl}
                            controls
                            className="max-w-[95vw] max-h-[95vh] object-contain"
                            preload="metadata"
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : null}
                </div>
            )}
        </>
    )
}
