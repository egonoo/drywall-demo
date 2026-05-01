import { useMemo, useState } from 'react';

const TAX_RATE = 0.105;

const initialInventory = [
  { id: 1, name: 'Drywall Pabco 5/8" 4x10 Firecode Type X', category: 'Drywall', quantity: 160, unitPrice: 16.75 },
  { id: 2, name: 'Drywall Pabco 5/8 4x8 Firecode', category: 'Drywall', quantity: 230, unitPrice: 13.95 },
  { id: 3, name: 'Insulation pink R30 unfaced 53.33 sf 16 center', category: 'Insulation', quantity: 72, unitPrice: 59.9 },
  { id: 4, name: 'Insulation CertainTeed R13 unfaced 15-1/4x93 center 128 sf', category: 'Insulation', quantity: 41, unitPrice: 57.9 },
  { id: 5, name: 'Westpac TNT All-Purpose Joint Compound', category: 'Compound', quantity: 90, unitPrice: 17.5 },
  { id: 6, name: 'Supplies and more', category: 'Supplies', quantity: 300, unitPrice: 8.95 }
];

const paymentMethods = ['Zelle', 'Cash', 'Card'];
const sampleActivities = [
  'Quote QUOT1627 prepared for Owner',
  'Inventory adjusted for Drywall Pabco 5/8 4x8 Firecode',
  'Low stock warning triggered for Insulation CertainTeed R13',
  'Admin updated category for Westpac TNT All-Purpose Joint Compound'
];

const money = (v) => `$${Number(v).toFixed(2)}`;
const stockStatus = (q) => (q <= 0 ? 'Out of Stock' : q < 50 ? 'Low Stock' : 'In Stock');

export default function App() {
  const [role, setRole] = useState('Admin');
  const [page, setPage] = useState('Dashboard');
  const [inventory, setInventory] = useState(initialInventory);
  const [activities, setActivities] = useState(sampleActivities);

  const [customerName, setCustomerName] = useState('Owner');
  const [invoiceNumber, setInvoiceNumber] = useState('QUOT1627');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [freight, setFreight] = useState(95);
  const [selectedPayment, setSelectedPayment] = useState('Zelle');

  const [draftLines, setDraftLines] = useState([{ productId: 1, quantity: 1 }]);

  const lowStock = useMemo(() => inventory.filter((p) => p.quantity < 50), [inventory]);

  const invoiceItems = draftLines.map((line) => {
    const product = inventory.find((p) => p.id === Number(line.productId));
    const qty = Number(line.quantity) || 0;
    const unit = product?.unitPrice || 0;
    const amount = qty * unit;
    return { ...line, product, qty, unit, amount };
  });

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.amount, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + Number(freight || 0);

  const addLine = () => setDraftLines((prev) => [...prev, { productId: inventory[0].id, quantity: 1 }]);

  const updateLine = (index, key, value) => {
    setDraftLines((prev) => prev.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  };

  const createInvoice = () => {
    setInventory((prev) =>
      prev.map((product) => {
        const used = invoiceItems
          .filter((item) => item.product?.id === product.id)
          .reduce((sum, item) => sum + item.qty, 0);
        return { ...product, quantity: Math.max(product.quantity - used, 0) };
      })
    );
    setActivities((prev) => [`Invoice ${invoiceNumber} created for ${customerName}`, ...prev.slice(0, 6)]);
    setInvoiceNumber(`QUOT${Number(invoiceNumber.replace(/\D/g, '')) + 1}`);
  };

  const navItems = ['Dashboard', 'Inventory', 'Create Invoice'];

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="mx-auto flex max-w-[1500px] gap-6 p-6">
        <aside className="w-72 rounded-2xl bg-brand-charcoal p-6 text-white shadow-2xl">
          <h1 className="text-2xl font-black text-brand-orange">Drywall Market Supply</h1>
          <p className="mt-1 text-sm text-slate-300">Sales & Inventory Demo</p>
          <div className="mt-5 rounded-xl bg-slate-800 p-3">
            <label className="text-xs uppercase text-slate-400">Role Simulation</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-700 p-2">
              <option>Admin</option>
              <option>User</option>
            </select>
            <p className="mt-2 text-xs text-slate-300">User role can create invoices and adjust quantities only.</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button key={item} onClick={() => setPage(item)} className={`w-full rounded-lg px-3 py-2 text-left ${page === item ? 'bg-brand-orange font-semibold text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          {page === 'Dashboard' && (
            <section>
              <h2 className="text-3xl font-bold text-brand-charcoal">Dashboard</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Card title="Total Products" value={String(inventory.length)} />
                <Card title="Low Stock" value={String(lowStock.length)} />
                <Card title="Tax Rate" value="10.5%" />
                <Card title="Primary Customer" value="Owner" />
              </div>
              <div className="mt-5 rounded-2xl bg-white p-5 shadow">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  {['New Invoice', 'Add Product', 'View Inventory', 'Low Stock'].map((action) => (
                    <button key={action} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium hover:border-brand-orange hover:text-brand-orange">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-white p-5 shadow">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {activities.map((activity) => (
                    <li key={activity} className="rounded-lg bg-slate-50 p-3">{activity}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {page === 'Inventory' && (
            <section>
              <h2 className="text-3xl font-bold text-brand-charcoal">Inventory</h2>
              <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Quantity</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">{item.category}</td>
                        <td className="p-3">
                          <input type="number" value={item.quantity} className="w-24 rounded border p-1.5" onChange={(e) => setInventory((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: Number(e.target.value) } : p)))} />
                        </td>
                        <td className="p-3">{money(item.unitPrice)}</td>
                        <td className="p-3"><Badge status={stockStatus(item.quantity)} /></td>
                        <td className="p-3">{role === 'Admin' ? <button className="rounded bg-brand-charcoal px-3 py-1 text-xs text-white">Edit</button> : <span className="text-xs text-slate-400">No admin access</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === 'Create Invoice' && (
            <section className="space-y-5">
              <h2 className="text-3xl font-bold text-brand-charcoal">Create Invoice</h2>
              <div className="rounded-2xl bg-white p-5 shadow">
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="FOR" value={customerName} onChange={setCustomerName} />
                  <Input label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} />
                  <Input label="Date" value={invoiceDate} type="date" onChange={setInvoiceDate} />
                  <Input label="Freight" type="number" value={freight} onChange={(v) => setFreight(Number(v))} />
                </div>
                <div className="mt-4 space-y-3">
                  {draftLines.map((line, idx) => (
                    <div key={idx} className="grid gap-3 md:grid-cols-5">
                      <select className="rounded border p-2" value={line.productId} onChange={(e) => updateLine(idx, 'productId', Number(e.target.value))}>
                        {inventory.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="rounded border p-2" type="number" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} />
                      <div className="rounded border bg-slate-50 p-2">Unit: {money(invoiceItems[idx]?.unit || 0)}</div>
                      <div className="rounded border bg-slate-50 p-2">Tax: 10.5%</div>
                      <div className="rounded border bg-slate-50 p-2">Amount: {money(invoiceItems[idx]?.amount || 0)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={addLine} className="rounded bg-slate-700 px-4 py-2 text-white">Add Product</button>
                  <button onClick={createInvoice} className="rounded bg-brand-orange px-4 py-2 font-semibold text-white">Create & Apply Invoice</button>
                </div>
              </div>

              <section className="invoice-shell rounded-2xl p-10 shadow-lg">
                <div className="invoice-paper mx-auto max-w-4xl bg-white p-10 text-slate-900 shadow-xl print:shadow-none">
                  <header className="flex justify-between border-b-2 border-slate-200 pb-5">
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight text-brand-orange">Drywall Market Supply</h3>
                      <p>113 E Gardena Blvd, Gardena, CA 90248</p>
                      <p>424-997-8055 / 310-863-2838</p>
                      <p>drywallmarket@gmail.com</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-2xl font-bold text-brand-charcoal">QUOTE / INVOICE</p>
                      <p><strong>FOR:</strong> {customerName}</p>
                      <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                      <p><strong>Date:</strong> {invoiceDate}</p>
                    </div>
                  </header>
                  <table className="mt-6 min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 text-left">Description</th><th className="p-2 text-center">Quantity</th><th className="p-2 text-center">Unit Price</th><th className="p-2 text-center">Tax</th><th className="p-2 text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2">{item.product?.name || 'N/A'}</td><td className="p-2 text-center">{item.qty}</td><td className="p-2 text-center">{money(item.unit)}</td><td className="p-2 text-center">10.5%</td><td className="p-2 text-center">{money(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-5 ml-auto w-80 space-y-1 text-sm">
                    <Row label="Subtotal" value={money(subtotal)} />
                    <Row label="Tax (10.5%)" value={money(tax)} />
                    <Row label="Freight" value={money(freight)} />
                    <Row label="Total" value={money(total)} strong />
                  </div>
                  <p className="mt-4 text-sm"><strong>Payment Methods:</strong> {paymentMethods.join(', ')}</p>
                  <p className="mt-3 text-sm"><strong>Terms and conditions:</strong> “The material is only left on the floor; it is not brought inside the work area. A 25% charge will be applied for restocking or returns of materials, and no returns are accepted for drywall.”</p>
                  <p className="mt-10 text-center text-lg font-semibold tracking-wide">THANK YOU FOR YOUR BUSINESS</p>
                </div>
                <div className="mt-4 flex items-center justify-center gap-3 print:hidden">
                  <select className="rounded border p-2" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>
                    {paymentMethods.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <button className="rounded bg-brand-charcoal px-5 py-2 text-white" onClick={() => window.print()}>Print Invoice</button>
                </div>
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return <div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold text-brand-charcoal">{value}</p></div>;
}

function Input({ label, value, onChange, type = 'text' }) {
  return <label><span className="mb-1 block text-sm text-slate-600">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border p-2" /></label>;
}

function Row({ label, value, strong }) {
  return <div className={`flex justify-between ${strong ? 'border-t pt-1 text-base font-bold' : ''}`}><span>{label}</span><span>{value}</span></div>;
}

function Badge({ status }) {
  const styles = {
    'In Stock': 'bg-emerald-100 text-emerald-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Out of Stock': 'bg-rose-100 text-rose-700'
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}
