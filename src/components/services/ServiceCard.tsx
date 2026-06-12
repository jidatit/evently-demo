"use client"
import { Edit, Trash2, Clock, DollarSign, ImageIcon, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ServiceCardProps = {
    service: any
    onEdit?: (service: any) => void
    onDelete?: (id: string) => void
}

export default function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
    if (!service) return null

    const hasImage = service.media && service.media.length > 0

    return (
        <Card className="group overflow-hidden shadow-party border-primary/10  bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col h-full">
            {/* Image Section - Fixed Aspect Ratio */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {hasImage ? (
                    <img
                        src={service.media[0].fileUrl || "/placeholder.svg"}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                )}

                <div className="absolute bottom-3 left-3">
                    {service.price !== undefined && service.price !== null ? (
                        <div className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                            ${service.price}
                        </div>
                    ) : (
                        <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-sm font-bold">Quote</div>
                    )}
                </div>
            </div>

            {/* Content Section - Flex-1 to push footer down */}
            <div className="flex flex-col flex-1 p-5">
                <div className="mb-3">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {service.name || "Unnamed Service"}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {service.pricingType}
                        </span>
                        {service.durationMinutes && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.durationMinutes}m
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {service.description || "No description provided."}
                </p>
            </div>

            {/* Footer Section */}
            <div className="px-5 pb-5 mt-auto flex items-center justify-end border-t border-border/10 pt-4">
                {/* <button
                    onClick={() => onEdit?.(service)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group/link"
                >
                    Manage Service
                    <ChevronRight className="w-3 h-3 translate-x-0 group-hover/link:translate-x-1 transition-transform" />
                </button> */}

                <div className="flex items-center gap-1.5">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(service)
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete?.(service.id)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </Card>
    )
}
