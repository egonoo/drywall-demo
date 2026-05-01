import { useMemo, useState } from 'react';

const initialInventory = [
  { id: 1, name: 'Drywall Pabco 5/8" 4x10 Firecode Type X', quantity: 160, unitPrice: 22.5 },
  { id: 2, name: 'Drywall Pabco 5/8 4x8 Firecode', quantity: 230, unitPrice: 19.75 },
  { id: 3, name: 'Insulation pink R30 unfaced', quantity: 100, unitPrice: 36.0 },
  { id: 4, name: 'Insulation CertainTeed R13 unfaced', quantity: 145, unitPrice: 31.25 },
  { id: 5, name: 'Westpac TNT All-Purpose Joint Compound', quantity: 90, unitPrice: 18.4 },
  { id: 6, name: 'Supplies', quantity: 300, unitPrice: 6.5 }
];

const sampleActivities = [
  'Invoice QUOT1624 created for Owner',
  'Stock updated for Drywall Pabco 5/8 4x8 Firecode',
  'Invoice QUOT1625 printed',
  'Supplies quantity adjusted by admin'
];

const paymentMethods = ['Zelle', 'Cash', 'Card'];

function money(v) {
  return `$${v.toFixed(2)}`;
}

export default function App() {
  const [role, setRole] = useState('Admin');
  const [page, setPage] = useState('Dashboard');
  const [inventory, setInventory] = useState(initialInventory);
  const [activities, setActivities] = useState(sampleActivities);

  const [customerName, setCustomerName] = useState('Owner');
  const [invoiceNumber, setInvoiceNumber] = useState('QUOT1627');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [freight, setFreight] = useState(80);
  const [selectedPayment, setSelectedPayment] = useState('Zelle');

  const [draftLines, setDraftLines] = useState([{ productId: 1, quantity: 1 }]);
  const [savedInvoices, setSavedInvoices] = useState([]);

  const lowStock = useMemo(() => inventory.filter((p) => p.quantity < 100), [inventory]);

  const invoiceItems = draftLines.map((line) => {
    const product = inventory.find((p) => p.id === Number(line.productId));
    const qty = Number(line.quantity) || 0;
    const unit = product?.unitPrice || 0;
    const amount = qty * unit;
    return { ...line, product, qty, unit, amount };
  });

  const subtotal = invoiceItems.reduce((sum, l) => sum + l.amount, 0);
  const tax = subtotal * 0.105;
  const total = subtotal + tax + Number(freight || 0);

  const addLine = () => {
    setDraftLines((prev) => [...prev, { productId: inventory[0].id, quantity: 1 }]);
  };

  const updateLine = (idx, key, val) => {
    setDraftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: val } : l)));
  };

  const createInvoice = () => {
    // Future backend connection: POST invoice payload and persist inventory transaction in database.
    const updatedInventory = inventory.map((product) => {
      const used = invoiceItems
        .filter((i) => i.product?.id === product.id)
        .reduce((sum, i) => sum + i.qty, 0);
      return { ...product, quantity: Math.max(product.quantity - used, 0) };
    });

    setInventory(updatedInventory);
    setSavedInvoices((prev) => [
      {
        number: invoiceNumber,
        customer: customerName,
        date: invoiceDate,
        items: invoiceItems,
        subtotal,
        tax,
        freight: Number(freight || 0),
        total,
        payment: selectedPayment
      },
      ...prev
    ]);

    setActivities((prev) => [`Invoice ${invoiceNumber} created for ${customerName}`, ...prev.slice(0, 5)]);
    setInvoiceNumber(`QUOT${Number(invoiceNumber.replace(/\D/g, '')) + 1}`);
  };

  const printInvoice = () => {
    // Future backend connection: fetch invoice PDF URL from server.
    window.print();
  };

  const navItems = ['Dashboard', 'Inventory', 'Create Invoice', 'Invoices'];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-brand-charcoal text-white p-5">
          <h1 className="text-2xl font-bold text-brand-orange">Drywall Market Supply</h1>
          <p className="mt-1 text-sm text-slate-300">Construction Inventory Demo</p>
          <div className="mt-6">
            <label className="text-xs uppercase text-slate-400">Role Simulation</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded bg-slate-700 p-2">
              <option>Admin</option>
              <option>User</option>
            </select>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={`w-full rounded p-2 text-left ${page === item ? 'bg-brand-orange font-semibold' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {page === 'Dashboard' && (
            <section>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card title="Total Products" value={String(inventory.length)} />
                <Card title="Low Stock Alert" value={String(lowStock.length)} />
                <Card title="Saved Invoices" value={String(savedInvoices.length)} />
              </div>
              <div className="mt-8 rounded-xl bg-white p-6 shadow">
                <h3 className="text-xl font-semibold">Recent Activity</h3>
                <ul className="mt-4 list-disc pl-5 text-slate-700">
                  {activities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {page === 'Inventory' && (
            <section>
              <h2 className="text-3xl font-bold">Inventory</h2>
              <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-200 text-left text-slate-700">
                    <tr>
                      <th className="p-3">Product Name</th><th className="p-3">Quantity</th><th className="p-3">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">
                          {role === 'Admin' ? (
                            <input
                              type="number"
                              className="w-24 rounded border p-1"
                              value={item.quantity}
                              onChange={(e) => {
                                const q = Number(e.target.value);
                                setInventory((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: q } : p)));
                              }}
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td className="p-3">{money(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === 'Create Invoice' && (
            <section>
              <h2 className="text-3xl font-bold">Create Invoice</h2>
              <div className="mt-6 rounded-xl bg-white p-6 shadow space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="Customer" value={customerName} onChange={setCustomerName} />
                  <Input label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} />
                  <Input label="Date" type="date" value={invoiceDate} onChange={setInvoiceDate} />
                  <Input label="Freight" type="number" value={freight} onChange={(v) => setFreight(Number(v))} />
                </div>
                {draftLines.map((line, idx) => (
                  <div key={idx} className="grid gap-3 md:grid-cols-4">
                    <select className="rounded border p-2" value={line.productId} onChange={(e) => updateLine(idx, 'productId', Number(e.target.value))}>
                      {inventory.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input type="number" className="rounded border p-2" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} />
                    <div className="rounded border p-2 bg-slate-50">Tax 10.5%</div>
                    <div className="rounded border p-2 bg-slate-50">Amount: {money(invoiceItems[idx]?.amount || 0)}</div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={addLine} className="rounded bg-slate-700 px-4 py-2 text-white">Add Product</button>
                  <button onClick={createInvoice} className="rounded bg-brand-orange px-4 py-2 font-semibold text-white">Create & Apply Invoice</button>
                </div>
              </div>
            </section>
          )}

          {(page === 'Invoices' || page === 'Create Invoice') && (
            <section className="mt-8 rounded-xl bg-white p-8 shadow">
              <h2 className="mb-6 text-3xl font-bold">Invoice Preview</h2>
              <div className="border border-slate-300 p-6">
                <div className="flex justify-between border-b pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-brand-orange">Drywall Market Supply</h3>
                    <p>113 E Gardena Blvd, Gardena, CA 90248</p>
                    <p>424-997-8055 / 310-863-2838</p>
                    <p>drywallmarket@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <p><b>Customer:</b> {customerName}</p>
                    <p><b>Invoice #:</b> {invoiceNumber}</p>
                    <p><b>Date:</b> {invoiceDate}</p>
                  </div>
                </div>
                <table className="mt-4 min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">Description</th><th className="p-2">Quantity</th><th className="p-2">Unit price</th><th className="p-2">Tax</th><th className="p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{item.product?.name || 'N/A'}</td>
                        <td className="p-2 text-center">{item.qty}</td>
                        <td className="p-2 text-center">{money(item.unit)}</td>
                        <td className="p-2 text-center">10.5%</td>
                        <td className="p-2 text-center">{money(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 ml-auto w-72 space-y-1 text-sm">
                  <Row label="Subtotal" value={money(subtotal)} />
                  <Row label="Tax (10.5%)" value={money(tax)} />
                  <Row label="Freight" value={money(Number(freight || 0))} />
                  <Row label="Total" value={money(total)} strong />
                </div>
                <div className="mt-4 text-sm"><b>Payment Methods:</b> {paymentMethods.join(' / ')}</div>
                <div className="mt-3 text-sm">
                  <b>Terms and Conditions:</b> The material is only left on the floor; it is not brought inside the work area. A 25% charge will be applied for restocking or returns of materials, and no returns are accepted for drywall.
                </div>
                <p className="mt-8 text-center text-lg font-semibold text-brand-charcoal">Thank you for your business</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <select className="rounded border p-2" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>
                  {paymentMethods.map((p) => <option key={p}>{p}</option>)}
                </select>
                <button onClick={printInvoice} className="rounded bg-brand-charcoal px-4 py-2 text-white">Print Invoice</button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-brand-charcoal">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border p-2" />
    </label>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t pt-1 font-bold text-base' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
