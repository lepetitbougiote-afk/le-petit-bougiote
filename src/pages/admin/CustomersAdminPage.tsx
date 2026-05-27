import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import type { CustomerSummary } from '../../types';
import { formatDate } from '../../lib/utils';

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    userService.getCustomers().then(setCustomers);
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Clients</h1>
      <div className="mt-6 grid gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-950">{customer.fullName}</p>
                <p className="mt-2 text-sm text-slate-600">{customer.phone} • {customer.email}</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>{customer.orderCount} commandes</p>
                <p>Dernière: {formatDate(customer.lastOrderDate)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
