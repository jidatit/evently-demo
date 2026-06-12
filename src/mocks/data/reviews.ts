/** Seed reviews for display on vendor profiles (not wired to a live reviews API in active routes). */
export interface MockReview {
  id: string;
  vendorId: string;
  rating: number;
  comment: string;
  customerName: string;
  date: string;
}

export const mockReviews: MockReview[] = [
  {
    id: 'rev-1',
    vendorId: 'vendor-1',
    rating: 5,
    comment: 'Absolutely stunning photos — captured every moment perfectly.',
    customerName: 'Morgan Lee',
    date: '2024-09-12',
  },
  {
    id: 'rev-2',
    vendorId: 'vendor-1',
    rating: 5,
    comment: 'Professional, punctual, and easy to work with.',
    customerName: 'Chris Taylor',
    date: '2024-07-03',
  },
  {
    id: 'rev-3',
    vendorId: 'vendor-2',
    rating: 5,
    comment: 'Kept the dance floor packed all night!',
    customerName: 'Jamie Wu',
    date: '2024-08-20',
  },
];
