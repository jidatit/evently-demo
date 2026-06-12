// src/components/ServiceCardPublic.tsx
"use client";

import { useState } from "react";
import { Clock, DollarSign, ImageIcon, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { formatDuration } from "@/utils/serviceUtils";

interface ServiceMedia {
    id: string;
    fileUrl: string;
    fileType: string;
    displayOrder: number;
}

interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    pricingType: string | null;
    durationMinutes: number | null;
    media: ServiceMedia[];
}

interface Props {
    service: Service;
}

export const ServiceCardPublic: React.FC<Props> = ({ service }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const firstMedia = service.media?.[0];
    const hasMedia = !!firstMedia;
    const mediaCount = service.media?.length || 0;

    const priceDisplay =
        service.price != null ? `$${service.price}` : "Quote";

    return (
        <>
            <Card className="group overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col h-full cursor-pointer"
                onClick={() => setIsModalOpen(true)}>
                {/* Media / Image Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {hasMedia ? (
                        firstMedia.fileType === "image" ? (
                            <img
                                src={firstMedia.fileUrl}
                                alt={service.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <video
                                src={firstMedia.fileUrl}
                                className="h-full w-full object-cover"
                                muted
                                loop
                                playsInline
                            />
                        )
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute bottom-3 right-3 bg-white/80 hover:bg-white backdrop-blur-sm shadow-md opacity-90 hover:opacity-100 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>


                    {/* Media Count Badge */}
                    {mediaCount > 1 && (
                        <Badge
                            variant="secondary"
                            className="absolute top-3 left-3 bg-black/70 text-white hover:bg-black/70 text-xs"
                        >
                            {mediaCount} media
                        </Badge>
                    )}

                    {/* Price badge overlay */}
                    <div className="absolute bottom-3 left-3">
                        <div className="px-3 py-1.5 rounded-lg bg-primary/90 backdrop-blur-sm text-primary-foreground text-sm font-semibold shadow-md">
                            {priceDisplay}
                            {service.pricingType === "per_hour" && "/hr"}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <CardContent className="flex flex-col flex-1 p-5">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {service.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        {service.pricingType && (
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span className="uppercase">{service.pricingType}</span>
                            </div>
                        )}
                        {service.durationMinutes && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatDuration(service.durationMinutes)}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {service.description || "No description available."}
                    </p>
                </CardContent>
            </Card>

            {/* Service Detail Modal */}
            <ServiceDetailModal
                service={service}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
};