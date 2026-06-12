import type {
  CreateServicePayload,
  Service,
  UpdateServicePayload,
} from "./types";
import {
  createServiceMock,
  deleteServiceMock,
  getServiceByIdMock,
  getServicesWithMediaMock,
  updateServiceMock,
} from "@/mocks/handlers/services";

export const getServicesWithMedia = getServicesWithMediaMock;
export const getServiceById = getServiceByIdMock;
export const createService = createServiceMock;
export const updateService = updateServiceMock;
export const deleteService = deleteServiceMock;
