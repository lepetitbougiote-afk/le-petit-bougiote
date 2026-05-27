import type { CustomerSummary, UserProfile } from '../types';

export const currentUser: UserProfile = {
  id: 'user-demo-1',
  fullName: 'Camille Robert',
  phone: '07 59 71 46 29',
  email: 'camille@example.com',
  role: 'customer',
};

export const mockCustomers: CustomerSummary[] = [
  {
    id: 'cust-1',
    fullName: 'Camille Robert',
    phone: '07 59 71 46 29',
    email: 'camille@example.com',
    orderCount: 8,
    lastOrderDate: '2026-05-24T10:15:00.000Z',
  },
  {
    id: 'cust-2',
    fullName: 'Mounia Benali',
    phone: '06 44 11 99 20',
    email: 'mounia@example.com',
    orderCount: 4,
    lastOrderDate: '2026-05-23T18:15:00.000Z',
  },
  {
    id: 'cust-3',
    fullName: 'Thomas Vidal',
    phone: '06 01 20 30 40',
    email: 'thomas@example.com',
    orderCount: 2,
    lastOrderDate: '2026-05-22T12:20:00.000Z',
  },
];
