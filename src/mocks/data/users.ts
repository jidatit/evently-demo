import type { MockProfile, MockUserRecord } from '../types';

export const DEMO_PASSWORD = 'Demo1234!';

export const mockUsers: MockUserRecord[] = [
  {
    id: 'user-customer-1',
    email: 'customer@evently.demo',
    password: DEMO_PASSWORD,
    name: 'Alex Planner',
    role: 'customer',
    emailVerified: true,
  },
  {
    id: 'user-vendor-1',
    email: 'vendor@evently.demo',
    password: DEMO_PASSWORD,
    name: 'Jordan Rivera',
    role: 'vendor',
    emailVerified: true,
  },
  {
    id: 'user-admin-1',
    email: 'admin@evently.demo',
    password: DEMO_PASSWORD,
    name: 'Sam Admin',
    role: 'admin',
    emailVerified: true,
  },
];

export const mockProfiles: MockProfile[] = mockUsers.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
}));
