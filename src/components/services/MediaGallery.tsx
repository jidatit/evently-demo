"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, ChevronLeft, ChevronRight, ImageIcon, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface MediaItem {
    id: string
    fileUrl: string
    fileType: "image" | "video"
    displayOrder?: number
}

interface MediaGalleryProps {
    media: MediaItem[]
}

export function MediaGallery({ media }: MediaGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    const openLightbox = (index: number) => setSelectedIndex(index)
    const closeLightbox = () => setSelectedIndex(null)
    const nextMedia = () => setSelectedIndex((prev) => (prev !== null ? (prev + 1) % media.length : null))
    const prevMedia = () => setSelectedIndex((prev) => (prev !== null ? (prev - 1 + media.length) % media.length : null))

    const visibleMedia = isExpanded ? media : media.slice(0, 6)

    return (
        <Card className="shadow-party">
            <CardHeader>
                <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {visibleMedia.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative aspect-[16/9] group overflow-hidden rounded-xl ..."
                            onClick={() => openLightbox(index)}
                        >
                            {item.fileType === "image" ? (
                                <img
                                    src={item.fileUrl || "/placeholder.svg"}
                                    alt={`Gallery image ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="relative w-full h-full">
                                    <video src={item.fileUrl} className="w-full h-full object-cover" muted playsInline />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                            <Play className="w-5 h-5 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Overlay for hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-3">
                                <span className="text-white text-xs font-medium flex items-center gap-1">
                                    {item.fileType === "image" ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                    View {item.fileType}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {media.length > 6 && !isExpanded && (
                    <Button
                        variant="outline"
                        className="mt-6 w-full h-12 rounded-xl border-dashed hover:border-solid hover:bg-accent/50 transition-all font-medium text-muted-foreground hover:text-foreground bg-transparent"
                        onClick={() => setIsExpanded(true)}
                    >
                        View All {media.length} Items
                    </Button>
                )}
            </CardContent>
            {/* Lightbox Experience */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-md"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-6 right-6 z-50 text-foreground hover:bg-transparent"
                            onClick={closeLightbox}
                        >
                            <X className="w-8 h-8" />
                        </Button>

                        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 md:left-8 z-50 text-foreground hidden md:flex"
                                onClick={prevMedia}
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </Button>

                            <motion.div
                                key={selectedIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="relative max-w-6xl w-full h-full flex items-center justify-center"
                            >
                                {media[selectedIndex].fileType === "image" ? (
                                    <img
                                        src={media[selectedIndex].fileUrl || "/placeholder.svg"}
                                        alt="Expanded view"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <video
                                        src={media[selectedIndex].fileUrl}
                                        className="max-w-full max-h-full"
                                        controls
                                        autoPlay
                                        playsInline
                                    />
                                )}

                                <div className="absolute bottom-0 left-0 right-0 py-8 text-center hidden md:block">
                                    <p className="font-serif italic text-lg opacity-60">
                                        {selectedIndex + 1} of {media.length}
                                    </p>
                                </div>
                            </motion.div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 md:right-8 z-50 text-foreground hidden md:flex"
                                onClick={nextMedia}
                            >
                                <ChevronRight className="w-10 h-10" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
