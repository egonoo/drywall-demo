import { useMemo, useState } from 'react';

const DEFAULT_TAX_RATE = 10.5;
const TERMS_CHAR_LIMIT = 420;

const initialInventory = [
  { id: 1, name: 'Drywall Pabco 5/8" 4x10 Firecode Type X', category: 'Drywall', quantity: 160, minStock: 20, unitPrice: 16.75, taxable: true, noReturns: true, status: 'Active' },
  { id: 2, name: 'Drywall Pabco 5/8 4x8 Firecode', category: 'Drywall', quantity: 230, minStock: 20, unitPrice: 13.95, taxable: true, noReturns: true, status: 'Active' },
  { id: 3, name: 'Insulation pink R30 unfaced 53.33 sf 16 center', category: 'Insulation', quantity: 72, minStock: 15, unitPrice: 59.9, taxable: true, noReturns: false, status: 'Active' },
  { id: 4, name: 'Westpac TNT All-Purpose Joint Compound', category: 'Compound', quantity: 17, minStock: 20, unitPrice: 17.5, taxable: true, noReturns: false, status: 'Active' }
];

const initialUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'Admin', sales: 12940 },
  { id: 2, username: 'juan', password: 'demo123', role: 'User', sales: 8385 },
  { id: 3, username: 'maria', password: 'demo123', role: 'User', sales: 11420 }
];

const paymentMethods = ['Zelle', 'Cash', 'Card'];
const navItems = ['Dashboard', 'Inventory', 'Create Invoice', 'Invoices', 'Users', 'Settings'];
const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const emptyProduct = { name: '', category: '', quantity: 0, minStock: 20, unitPrice: 0, status: 'Active', taxable: true, noReturns: false };

export default function App() {
  const [role, setRole] = useState('Admin');
  const [page, setPage] = useState('Dashboard');
  const [inventory, setInventory] = useState(initialInventory);
  const [users, setUsers] = useState(initialUsers);
  const [alerts, setAlerts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [terms, setTerms] = useState('The material is delivered curbside unless otherwise stated. All approved returns may include a restocking fee.');

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const [customerName, setCustomerName] = useState('Owner');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [freight, setFreight] = useState(95);
  const [selectedPayment, setSelectedPayment] = useState('Zelle');
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [draftLines, setDraftLines] = useState([{ productId: 1, quantity: 1 }]);

  const lowStock = useMemo(() => inventory.filter((p) => p.quantity < p.minStock), [inventory]);
  const totalSales = invoices.reduce((sum, i) => sum + i.total, 0);
  const todaysInvoices = invoices.filter((i) => i.date === new Date().toISOString().slice(0, 10)).length;

  const invoiceItems = draftLines.map((line) => {
    const product = inventory.find((p) => p.id === Number(line.productId));
    const qty = Number(line.quantity) || 0;
    const unit = product?.unitPrice || 0;
    const lineSubtotal = qty * unit;
    const lineTax = product?.taxable ? lineSubtotal * (Number(taxRate || 0) / 100) : 0;
    return { ...line, product, qty, unit, lineSubtotal, lineTax, amount: lineSubtotal + lineTax };
  });

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.lineSubtotal, 0);
  const tax = invoiceItems.reduce((sum, i) => sum + i.lineTax, 0);
  const total = subtotal + tax + Number(freight || 0);

  const topProductivityUser = useMemo(() => [...users].sort((a, b) => b.sales - a.sales)[0], [users]);
  const bestSellingProduct = useMemo(() => inventory.reduce((best, p) => (p.quantity < best.quantity ? p : best), inventory[0] || {}), [inventory]);

  const addAlert = (text) => setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 8));

  const addLine = () => setDraftLines((prev) => [...prev, { productId: inventory[0]?.id || 1, quantity: 1 }]);
  const removeLine = (idx) => setDraftLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (index, key, value) => setDraftLines((prev) => prev.map((line, i) => (i === index ? { ...line, [key]: value } : line)));

  const resetProductForm = () => {
    setProductForm(emptyProduct);
    setEditingId(null);
  };

  const saveProduct = () => {
    if (role !== 'Admin' || !productForm.name) return;
    if (editingId) {
      setInventory((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...productForm, quantity: Number(productForm.quantity), minStock: Number(productForm.minStock), unitPrice: Number(productForm.unitPrice) } : p)));
    } else {
      setInventory((prev) => [...prev, { ...productForm, id: Math.max(...prev.map((p) => p.id)) + 1, quantity: Number(productForm.quantity), minStock: Number(productForm.minStock), unitPrice: Number(productForm.unitPrice) }]);
    }
    resetProductForm();
  };

  const createInvoice = () => {
    setInventory((prev) =>
      prev.map((product) => {
        const used = invoiceItems.filter((item) => item.product?.id === product.id).reduce((sum, item) => sum + item.qty, 0);
        const nextQty = Math.max(product.quantity - used, 0);
        if (used > 0 && nextQty < product.minStock) {
          // Mock email alert only. Real email would require backend/API integration later.
          addAlert(`Low stock email sent to admin for ${product.name}`);
          addAlert('Email sent to admin');
        }
        return { ...product, quantity: nextQty };
      })
    );

    const invoice = { id: Date.now(), number: invoiceNumber, customerName, date: invoiceDate, total, payment: selectedPayment };
    setInvoices((prev) => [invoice, ...prev]);

    setUsers((prev) => prev.map((u) => (u.username === 'admin' ? u : { ...u, sales: u.sales + total / (u.role === 'User' ? 2 : 0) || u.sales })));

    setInvoiceNumber(`INV-${Number(invoiceNumber.replace(/\D/g, '')) + 1}`);
    addAlert(`Invoice ${invoice.number} created for ${customerName}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1500px] gap-6 p-6">
        <aside className="w-72 rounded-2xl bg-brand-charcoal p-6 text-white shadow-2xl">
          <LogoBlock />
          <div className="mt-5 rounded-xl bg-slate-800 p-3">
            <label className="text-xs uppercase text-slate-400">Role Simulation</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-700 p-2">
              <option>Admin</option><option>User</option>
            </select>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => <button key={item} onClick={() => setPage(item)} className={`w-full rounded-lg px-3 py-2 text-left ${page === item ? 'bg-brand-orange font-semibold text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>{item}</button>)}
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          {page === 'Dashboard' && <section><h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-4"><Card title="Total Products" value={String(inventory.length)} /><Card title="Low Stock" value={String(lowStock.length)} /><Card title="Total Sales" value={money(totalSales)} /><Card title="Today's Invoices" value={String(todaysInvoices)} /></div>
            <div className="mt-4 rounded-2xl bg-white p-5 shadow"><h3 className="font-semibold">Quick Actions</h3><div className="mt-3 grid gap-3 md:grid-cols-3">{['Create Invoice', 'Add Product', 'View Inventory'].map((a) => <button key={a} onClick={() => setPage(a === 'Create Invoice' ? 'Create Invoice' : 'Inventory')} className="rounded-xl border bg-slate-50 px-4 py-3 text-left hover:border-brand-orange">{a}</button>)}</div></div>
            <div className="mt-4 grid gap-4 md:grid-cols-3"> <MiniChart title="Best selling product" data={[{ label: bestSellingProduct?.name || 'N/A', value: 82 }]} /><MiniChart title="Sales by user" data={users.map((u) => ({ label: u.username, value: Math.round(u.sales / 300) }))} /><MiniChart title="Low stock products" data={lowStock.map((p) => ({ label: p.name.slice(0, 12), value: p.quantity }))} /></div>
            <div className="mt-4 rounded-2xl bg-white p-5 shadow text-sm">Top productivity user: <strong>{topProductivityUser?.username}</strong> with {money(topProductivityUser?.sales)} sales.</div>
            <AlertFeed alerts={alerts} />
          </section>}

          {page === 'Inventory' && <InventorySection {...{ inventory, role, setInventory, setProductForm, setEditingId, saveProduct, productForm, editingId, resetProductForm }} />}

          {page === 'Create Invoice' && <section className="space-y-4"><h2 className="text-3xl font-bold">Create Invoice</h2>
            <div className="rounded-2xl bg-white p-5 shadow"><div className="grid gap-4 md:grid-cols-5"><Input label="FOR" value={customerName} onChange={setCustomerName} /><Input label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} /><Input label="Date" type="date" value={invoiceDate} onChange={setInvoiceDate} /><Input label="Freight" type="number" value={freight} onChange={(v) => setFreight(Number(v))} /><Input label="Tax Rate %" type="number" value={taxRate} onChange={(v) => setTaxRate(Number(v))} /></div>
              <div className="mt-4 space-y-3">{draftLines.map((line, idx) => <div key={idx} className="grid gap-3 md:grid-cols-6"><select className="rounded border p-2" value={line.productId} onChange={(e) => updateLine(idx, 'productId', Number(e.target.value))}>{inventory.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input className="rounded border p-2" type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} /><div className="rounded border bg-slate-50 p-2">{money(invoiceItems[idx]?.unit)}</div><div className="rounded border bg-slate-50 p-2">Tax {taxRate}%</div><div className="rounded border bg-slate-50 p-2">{money(invoiceItems[idx]?.amount)}</div><button onClick={() => removeLine(idx)} className="rounded bg-rose-600 px-3 py-2 text-white">Remove</button></div>)}</div>
              <div className="mt-4 flex gap-2"><button onClick={addLine} className="rounded bg-slate-700 px-4 py-2 text-white">Add Product</button><button onClick={createInvoice} className="rounded bg-brand-orange px-4 py-2 text-white">Create & Apply Invoice</button></div></div>
            <InvoicePreview {...{ customerName, invoiceNumber, invoiceDate, invoiceItems, subtotal, tax, freight, total, selectedPayment, setSelectedPayment, terms, taxRate }} />
          </section>}

          {page === 'Invoices' && <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-2xl font-bold">Invoices</h2>{invoices.length === 0 ? <p className="mt-2 text-sm text-slate-500">No invoices yet.</p> : invoices.map((i) => <div key={i.id} className="mt-2 rounded border p-2 text-sm">{i.number} • {i.customerName} • {money(i.total)} • {i.payment}</div>)}</section>}
          {page === 'Users' && <UsersSection role={role} users={users} setUsers={setUsers} />}
          {page === 'Settings' && <SettingsSection role={role} terms={terms} setTerms={setTerms} />}
        </main>
      </div>
    </div>
  );
}

function LogoBlock() { return <div><div className="flex h-14 items-center gap-3 rounded-lg border border-orange-300/30 bg-white/10 px-3"><div className="h-8 w-8 rounded bg-brand-orange" /><div><p className="text-sm font-bold text-white">Drywall Market Supply</p><p className="text-[10px] text-slate-300">Logo placeholder - hi-res logo ready</p></div></div></div>; }
function Card({ title, value }) { return <div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold text-brand-charcoal">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text' }) { return <label><span className="mb-1 block text-sm text-slate-600">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border p-2" /></label>; }
function Row({ label, value, strong }) { return <div className={`flex justify-between ${strong ? 'border-t pt-1 text-base font-bold' : ''}`}><span>{label}</span><span>{value}</span></div>; }

function MiniChart({ title, data }) { return <div className="rounded-2xl bg-white p-4 shadow"><h4 className="text-sm font-semibold">{title}</h4><div className="mt-2 space-y-2">{data.length === 0 ? <p className="text-xs text-slate-400">No data</p> : data.map((d) => <div key={d.label}><div className="flex justify-between text-xs"><span>{d.label}</span><span>{d.value}</span></div><div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-brand-orange" style={{ width: `${Math.min(100, d.value)}%` }} /></div></div>)}</div></div>; }

function AlertFeed({ alerts }) { return <div className="mt-4 rounded-2xl bg-white p-4 shadow"><h4 className="font-semibold">Alerts / Notifications</h4>{alerts.length === 0 ? <p className="text-sm text-slate-500">No alerts yet.</p> : alerts.map((a) => <p key={a.id} className="mt-2 rounded bg-amber-50 p-2 text-sm">{a.text}</p>)}</div>; }

function InventorySection({ inventory, role, setInventory, setProductForm, setEditingId, saveProduct, productForm, editingId, resetProductForm }) { return <section><h2 className="text-3xl font-bold">Inventory</h2><div className="mt-3 grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-5"><Input label="Product" value={productForm.name} onChange={(v) => setProductForm((p) => ({ ...p, name: v }))} /><Input label="Category" value={productForm.category} onChange={(v) => setProductForm((p) => ({ ...p, category: v }))} /><Input label="Quantity" type="number" value={productForm.quantity} onChange={(v) => setProductForm((p) => ({ ...p, quantity: v }))} /><Input label="Min Stock" type="number" value={productForm.minStock} onChange={(v) => setProductForm((p) => ({ ...p, minStock: v }))} /><Input label="Price" type="number" value={productForm.unitPrice} onChange={(v) => setProductForm((p) => ({ ...p, unitPrice: v }))} /><label className="text-sm">Taxable<select className="w-full rounded border p-2" value={String(productForm.taxable)} onChange={(e) => setProductForm((p) => ({ ...p, taxable: e.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></label><label className="text-sm">NO RETURNS / NO REFUNDS<select className="w-full rounded border p-2" value={String(productForm.noReturns)} onChange={(e) => setProductForm((p) => ({ ...p, noReturns: e.target.value === 'true' }))}><option value="false">No</option><option value="true">Yes</option></select></label><label className="text-sm">Status<select className="w-full rounded border p-2" value={productForm.status} onChange={(e) => setProductForm((p) => ({ ...p, status: e.target.value }))}><option>Active</option><option>Inactive</option></select></label><div className="col-span-2 flex items-end gap-2">{role === 'Admin' ? <><button onClick={saveProduct} className="rounded bg-brand-orange px-4 py-2 text-white">{editingId ? 'Save Product' : 'Add Product'}</button><button onClick={resetProductForm} className="rounded border px-4 py-2">Cancel</button></> : <p className="text-sm text-slate-500">User role cannot add/delete products.</p>}</div></div>
  <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Product</th><th>Qty</th><th>Min</th><th>Price</th><th>Status</th><th>Taxable</th><th>No returns</th><th>Actions</th></tr></thead><tbody>{inventory.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.name}</td><td>{item.quantity}</td><td>{item.minStock}</td><td>{money(item.unitPrice)}</td><td>{item.status}</td><td>{item.taxable ? 'Yes' : 'No'}</td><td>{item.noReturns ? 'Yes' : 'No'}</td><td>{role === 'Admin' ? <div className="flex gap-1"><button onClick={() => { setEditingId(item.id); setProductForm(item); }} className="rounded bg-slate-700 px-2 py-1 text-white">Edit</button><button onClick={() => setInventory((prev) => prev.filter((p) => p.id !== item.id))} className="rounded bg-rose-600 px-2 py-1 text-white">Delete</button></div> : 'No access'}</td></tr>)}</tbody></table></div></section>; }

function UsersSection({ role, users, setUsers }) { const [u, setU] = useState({ username: '', password: '', role: 'User', sales: 0 }); return <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-2xl font-bold">Users</h2>{role !== 'Admin' ? <p className="mt-2 text-sm text-slate-500">Only admin can manage users.</p> : <><div className="mt-3 grid gap-2 md:grid-cols-4"><input className="rounded border p-2" placeholder="Username" value={u.username} onChange={(e) => setU((p) => ({ ...p, username: e.target.value }))} /><input className="rounded border p-2" placeholder="Password" value={u.password} onChange={(e) => setU((p) => ({ ...p, password: e.target.value }))} /><select className="rounded border p-2" value={u.role} onChange={(e) => setU((p) => ({ ...p, role: e.target.value }))}><option>User</option><option>Admin</option></select><button onClick={() => { if (!u.username || !u.password) return; setUsers((prev) => [...prev, { ...u, id: Date.now() }]); setU({ username: '', password: '', role: 'User', sales: 0 }); }} className="rounded bg-brand-orange px-3 py-2 text-white">Add User</button></div><table className="mt-4 min-w-full text-sm"><thead><tr className="border-b"><th className="text-left">Username</th><th>Role</th><th>Password</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b"><td>{user.username}</td><td>{user.role}</td><td>{user.password}</td><td><button onClick={() => setUsers((prev) => prev.filter((u2) => u2.id !== user.id))} className="rounded bg-rose-600 px-2 py-1 text-white">Remove</button></td></tr>)}</tbody></table></>}</section>; }

function SettingsSection({ role, terms, setTerms }) { return <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-2xl font-bold">Settings / Admin</h2>{role !== 'Admin' ? <p className="text-sm text-slate-500">Only admin can edit terms and conditions.</p> : <><textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="mt-3 h-32 w-full rounded border p-3" /><p className={`mt-2 text-sm ${terms.length > TERMS_CHAR_LIMIT ? 'text-rose-600' : 'text-slate-500'}`}>Characters: {terms.length}/{TERMS_CHAR_LIMIT} {terms.length > TERMS_CHAR_LIMIT ? 'Warning: May break print layout.' : ''}</p></>}</section>; }

function InvoicePreview({ customerName, invoiceNumber, invoiceDate, invoiceItems, subtotal, tax, freight, total, selectedPayment, setSelectedPayment, terms, taxRate }) { return <section className="invoice-shell rounded-2xl p-8 shadow-lg"><div className="invoice-paper mx-auto bg-white p-10 text-slate-900 shadow-xl print:shadow-none"><header className="flex justify-between border-b-2 border-slate-200 pb-4"><div className="flex gap-3"><div className="h-12 w-12 rounded bg-brand-orange" /><div><h3 className="text-2xl font-extrabold text-brand-charcoal">Drywall Market Supply</h3><p className="text-sm">113 E Gardena Blvd, Gardena, CA 90248</p><p className="text-sm">424-997-8055</p><p className="text-sm">drywallmarket@gmail.com</p></div></div><div className="text-right text-sm"><p><strong>FOR:</strong> {customerName}</p><p><strong>Invoice #:</strong> {invoiceNumber}</p><p><strong>Date:</strong> {invoiceDate}</p></div></header><table className="mt-4 min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Description</th><th className="p-2">Quantity</th><th className="p-2">Unit Price</th><th className="p-2">Tax</th><th className="p-2">Amount</th></tr></thead><tbody>{invoiceItems.map((item, idx) => <><tr key={`row-${idx}`} className="border-b"><td className="p-2">{item.product?.name}</td><td className="p-2 text-center">{item.qty}</td><td className="p-2 text-center">{money(item.unit)}</td><td className="p-2 text-center">{item.product?.taxable ? `${taxRate}%` : '0%'}</td><td className="p-2 text-center">{money(item.amount)}</td></tr>{item.product?.noReturns && <tr key={`msg-${idx}`}><td className="px-2 pb-2 text-xs text-rose-700" colSpan="5">NO RETURNS / NO REFUNDS</td></tr>}</>)}</tbody></table><div className="mt-4 ml-auto w-80 text-sm"><Row label="Subtotal" value={money(subtotal)} /><Row label="Tax" value={money(tax)} /><Row label="Freight" value={money(freight)} /><Row label="Total" value={money(total)} strong /></div><p className="mt-3 text-sm"><strong>Payment Method:</strong> {selectedPayment}</p><p className="mt-2 text-sm"><strong>Terms and conditions:</strong> {terms}</p><p className="mt-6 text-center font-semibold">THANK YOU FOR YOUR BUSINESS</p></div><div className="mt-3 flex justify-center gap-2 print:hidden"><select className="rounded border p-2" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>{paymentMethods.map((p) => <option key={p}>{p}</option>)}</select><button className="rounded bg-brand-charcoal px-4 py-2 text-white" onClick={() => window.print()}>Print Invoice</button></div></section>; }
