import type { CustomerSummary, UserProfile } from '../types';

export const currentUser: UserProfile = {
  id: 'user-demo-1',
  fullName: 'Camille Robert',
  phone: '07 59 71 46 29',
  email: 'camille@example.com',
  address: '28 Rue Diderot, 34500 Béziers',
  role: 'customer',
};

export const mockCustomers: CustomerSummary[] = [
  {
    id: 'cust-1',
    fullName: 'Camille Robert',
    phone: '07 59 71 46 29',
    email: 'camille@example.com',
    address: '28 Rue Diderot, 34500 Béziers',
    orderCount: 8,
    lastOrderDate: '2026-05-24T10:15:00.000Z',
  },
  {
    id: 'cust-2',
    fullName: 'Mounia Benali',
    phone: '06 44 11 99 20',
    email: 'mounia@example.com',
    address: '12 Rue du Soleil, 34500 Béziers',
    orderCount: 4,
    lastOrderDate: '2026-05-23T18:15:00.000Z',
  },
  {
    id: 'cust-3',
    fullName: 'Thomas Vidal',
    phone: '06 01 20 30 40',
    email: 'thomas@example.com',
    address: '5 Avenue Jean Moulin, 34500 Béziers',
    orderCount: 2,
    lastOrderDate: '2026-05-22T12:20:00.000Z',
  },
];
