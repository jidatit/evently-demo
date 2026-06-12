import { Instagram, Music, Facebook, Globe } from "lucide-react";

export const SOCIAL_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    color: "text-pink-600 hover:text-pink-500",
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: Music,
    color:
      "text-black dark:text-white hover:text-gray-800 dark:hover:text-gray-300",
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    color: "text-blue-600 hover:text-blue-500",
  },
  {
    key: "website",
    label: "Website",
    Icon: Globe,
    color: "text-blue-700 hover:text-blue-600",
  },
] as const;
