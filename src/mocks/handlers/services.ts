import type {
  CreateServicePayload,
  Service,
  UpdateServicePayload,
} from '@/features/services/types';
import { getDb, newId, updateDb } from '../db';
import { mockDelay } from '../delay';

function transformService(
  service: ReturnType<typeof getDb>['services'][0],
  db: ReturnType<typeof getDb>,
): Service {
  const media = db.vendor_media
    .filter((m) => m.service_id === service.id && m.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    id: service.id,
    vendorId: service.vendor_id,
    name: service.name,
    description: service.description || '',
    price: service.price,
    pricingType: service.pricing_type,
    durationMinutes: service.duration_minutes,
    isActive: service.is_active,
    displayOrder: service.display_order,
    createdAt: service.created_at,
    updatedAt: service.updated_at,
    media: media.map((m) => ({
      id: m.id,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileType: m.file_type,
      displayOrder: m.display_order,
    })),
  };
}

export async function getServicesWithMediaMock(vendorId: string): Promise<Service[]> {
  await mockDelay();
  const db = getDb();
  return db.services
    .filter((s) => s.vendor_id === vendorId && s.is_active)
    .sort((a, b) => b.display_order - a.display_order)
    .map((s) => transformService(s, db));
}

export async function getServiceByIdMock(serviceId: string): Promise<Service> {
  await mockDelay();
  const db = getDb();
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) throw new Error('Service not found');
  return transformService(service, db);
}

export async function createServiceMock(payload: CreateServicePayload): Promise<Service> {
  await mockDelay();
  const now = new Date().toISOString();
  const db = getDb();
  const maxOrder = Math.max(
    0,
    ...db.services.filter((s) => s.vendor_id === payload.vendorId).map((s) => s.display_order),
  );
  const serviceId = newId('svc');
  updateDb((d) => {
    d.services.push({
      id: serviceId,
      vendor_id: payload.vendorId,
      name: payload.name,
      description: payload.description || null,
      price: payload.price,
      pricing_type: payload.pricingType,
      duration_minutes: payload.durationMinutes,
      is_active: true,
      display_order: maxOrder + 1,
      created_at: now,
      updated_at: now,
    });
    payload.mediaFiles?.forEach((file, i) => {
      d.vendor_media.push({
        id: newId('media'),
        vendor_id: payload.vendorId,
        service_id: serviceId,
        file_name: file.name,
        file_url: '/placeholder.svg',
        file_type: file.type.startsWith('video/') ? 'video' : 'image',
        file_size: file.size,
        mime_type: file.type,
        display_order: i,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    });
  });
  return getServiceByIdMock(serviceId);
}

export async function updateServiceMock(payload: UpdateServicePayload): Promise<Service> {
  await mockDelay();
  const now = new Date().toISOString();
  updateDb((db) => {
    const service = db.services.find((s) => s.id === payload.serviceId);
    if (!service) throw new Error('Service not found');
    service.name = payload.name;
    service.description = payload.description || null;
    service.price = payload.price;
    service.pricing_type = payload.pricingType;
    service.duration_minutes = payload.durationMinutes;
    service.updated_at = now;

    if (payload.deleteMediaIds?.length) {
      db.vendor_media.forEach((m) => {
        if (payload.deleteMediaIds!.includes(m.id)) m.is_active = false;
      });
    }

    payload.newMediaFiles?.forEach((file, i) => {
      db.vendor_media.push({
        id: newId('media'),
        vendor_id: payload.vendorId,
        service_id: payload.serviceId,
        file_name: file.name,
        file_url: '/placeholder.svg',
        file_type: file.type.startsWith('video/') ? 'video' : 'image',
        file_size: file.size,
        mime_type: file.type,
        display_order: i,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    });
  });
  return getServiceByIdMock(payload.serviceId);
}

export async function deleteServiceMock(serviceId: string): Promise<void> {
  await mockDelay();
  updateDb((db) => {
    db.services = db.services.filter((s) => s.id !== serviceId);
    db.vendor_media = db.vendor_media.filter((m) => m.service_id !== serviceId);
  });
}
