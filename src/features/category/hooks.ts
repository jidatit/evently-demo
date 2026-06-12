import { useQuery } from "@tanstack/react-query";
import { fetchCategoriesMock } from "@/mocks/handlers/categories";

export interface Category {
  id: string;
  name: string;
  slug: string | null;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesMock,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
};
