import type { FavoritedVendor } from "./types";
import {
  getCustomerFavoritesMock,
  getIsFavoritedMock,
  toggleFavoriteMock,
} from "@/mocks/handlers/favorites";

export const getIsFavorited = getIsFavoritedMock;
export const toggleFavorite = toggleFavoriteMock;
export const getCustomerFavorites = getCustomerFavoritesMock;
