import { useMemo, useState } from 'react';

const DEFAULT_TAX_RATE = 10.5;
const TERMS_CHAR_LIMIT = 420;
const paymentMethods = ['Zelle', 'Cash', 'Card'];
const invoiceStatuses = ['Open', 'Paid', 'Void'];
const navItems = ['Dashboard', 'Inventory', 'Create Invoice', 'Invoices', 'Users', 'Settings'];
const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const simulatedAccounts = [
  { id: 1, username: 'admin', label: 'Admin', role: 'Admin' },
  { id: 2, username: 'juan', label: 'User 1', role: 'User' },
  { id: 3, username: 'maria', label: 'User 2', role: 'User' }
];

const initialInventory = [
  { id: 1, name: 'Drywall Pabco 5/8" 4x10 Firecode Type X', category: 'Drywall', quantity: 160, minStock: 20, unitPrice: 16.75, taxable: true, noReturns: true, status: 'Active' },
  { id: 2, name: 'Drywall Pabco 5/8 4x8 Firecode', category: 'Drywall', quantity: 230, minStock: 20, unitPrice: 13.95, taxable: true, noReturns: true, status: 'Active' },
  { id: 3, name: 'Insulation pink R30 unfaced 53.33 sf 16 center', category: 'Insulation', quantity: 72, minStock: 15, unitPrice: 59.9, taxable: true, noReturns: false, status: 'Active' },
  { id: 4, name: 'Westpac TNT All-Purpose Joint Compound', category: 'Compound', quantity: 17, minStock: 20, unitPrice: 17.5, taxable: true, noReturns: false, status: 'Active' }
];

const initialUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'Admin' },
  { id: 2, username: 'juan', password: 'demo123', role: 'User' },
  { id: 3, username: 'maria', password: 'demo123', role: 'User' }
];

const initialInvoices = [
  { id: 2001, number: 'INV-1001', customerName: 'Ace Build Co.', dateTime: '2026-04-29T16:30:00Z', total: 482.5, paymentMethod: 'Card', status: 'Paid', createdById: 2, createdByName: 'juan', createdAt: '2026-04-29T16:30:00Z' },
  { id: 2002, number: 'INV-1002', customerName: 'Skyline Homes', dateTime: '2026-04-30T10:05:00Z', total: 930.2, paymentMethod: 'Cash', status: 'Open', createdById: 3, createdByName: 'maria', createdAt: '2026-04-30T10:05:00Z' },
  { id: 2003, number: 'INV-1003', customerName: 'Pro Remodel', dateTime: '2026-04-30T14:45:00Z', total: 311.75, paymentMethod: 'Zelle', status: 'Void', createdById: 2, createdByName: 'juan', createdAt: '2026-04-30T14:45:00Z' }
];

const emptyProduct = { name: '', category: '', quantity: 0, minStock: 20, unitPrice: 0, status: 'Active', taxable: true, noReturns: false };

export default function App() {
  const [activeAccountId, setActiveAccountId] = useState(1);
  const [page, setPage] = useState('Dashboard');
  const [inventory, setInventory] = useState(initialInventory);
  const [users, setUsers] = useState(initialUsers);
  const [alerts, setAlerts] = useState([]);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [terms, setTerms] = useState('The material is delivered curbside unless otherwise stated. All approved returns may include a restocking fee.');

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [invoiceFilterUserId, setInvoiceFilterUserId] = useState('all');

  const [customerName, setCustomerName] = useState('Owner');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1004');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 16));
  const [freight, setFreight] = useState(95);
  const [selectedPayment, setSelectedPayment] = useState('Zelle');
  const [cashReceived, setCashReceived] = useState(0);
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [draftLines, setDraftLines] = useState([{ productId: 1, quantity: 1 }]);

  const activeAccount = simulatedAccounts.find((a) => a.id === activeAccountId) || simulatedAccounts[0];
  const role = activeAccount.role;
  const isAdmin = role === 'Admin';

  const visibleInvoices = useMemo(() => {
    if (isAdmin) return invoices;
    return invoices.filter((i) => i.createdById === activeAccount.id);
  }, [isAdmin, invoices, activeAccount.id]);

  const dashboardInvoices = visibleInvoices;
  const totalSales = dashboardInvoices.reduce((sum, i) => sum + i.total, 0);
  const todaysInvoices = dashboardInvoices.filter((i) => new Date(i.createdAt).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  const lowStock = useMemo(() => inventory.filter((p) => p.quantity < p.minStock), [inventory]);
  const usersWithSales = useMemo(() => users.map((u) => ({ ...u, sales: invoices.filter((i) => i.createdById === u.id && i.status !== 'Void').reduce((s, i) => s + i.total, 0) })), [users, invoices]);
  const topProductivityUser = useMemo(() => [...usersWithSales.filter((u) => u.role === 'User')].sort((a, b) => b.sales - a.sales)[0], [usersWithSales]);
  const bestSellingProduct = useMemo(() => inventory.reduce((best, p) => (p.quantity < best.quantity ? p : best), inventory[0] || {}), [inventory]);

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

  const addAlert = (text) => setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 10));
  const addLine = () => setDraftLines((prev) => [...prev, { productId: inventory[0]?.id || 1, quantity: 1 }]);
  const removeLine = (idx) => setDraftLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (index, key, value) => setDraftLines((prev) => prev.map((line, i) => (i === index ? { ...line, [key]: value } : line)));

  const resetProductForm = () => { setProductForm(emptyProduct); setEditingId(null); };

  const saveProduct = () => {
    if (!isAdmin || !productForm.name) return;
    if (editingId) {
      setInventory((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...productForm, quantity: Number(productForm.quantity), minStock: Number(productForm.minStock), unitPrice: Number(productForm.unitPrice) } : p)));
    } else {
      setInventory((prev) => [...prev, { ...productForm, id: Math.max(...prev.map((p) => p.id)) + 1, quantity: Number(productForm.quantity), minStock: Number(productForm.minStock), unitPrice: Number(productForm.unitPrice) }]);
    }
    resetProductForm();
  };

  const createInvoice = () => {
    const nowIso = new Date().toISOString();
    setInventory((prev) => prev.map((product) => {
      const used = invoiceItems.filter((item) => item.product?.id === product.id).reduce((sum, item) => sum + item.qty, 0);
      const nextQty = Math.max(product.quantity - used, 0);
      if (used > 0 && nextQty < product.minStock) addAlert(`Low stock alert: ${product.name}`);
      return { ...product, quantity: nextQty };
    }));

    const invoice = {
      id: Date.now(), number: invoiceNumber, customerName, dateTime: nowIso, total, paymentMethod: selectedPayment,
      status: 'Open', createdById: activeAccount.id, createdByName: activeAccount.username, createdAt: nowIso
    };
    setInvoices((prev) => [invoice, ...prev]);
    addAlert(`Invoice ${invoice.number} created by ${invoice.createdByName}`);
    setInvoiceNumber(`INV-${Number(invoiceNumber.replace(/\D/g, '')) + 1}`);
  };

  const voidInvoice = (id) => {
    if (!isAdmin) return;
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Void' } : i)));
  };
  const deleteInvoice = (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredInvoicesForAdmin = isAdmin && invoiceFilterUserId !== 'all' ? visibleInvoices.filter((i) => i.createdById === Number(invoiceFilterUserId)) : visibleInvoices;
  const visibleNavItems = isAdmin ? navItems : navItems.filter((item) => item !== 'Inventory');
  const changeDue = Number(cashReceived || 0) - total;
  const isCashInsufficient = selectedPayment === 'Cash' && Number(cashReceived || 0) < total;

  return <div className="min-h-screen bg-slate-100 text-slate-900"><div className="mx-auto flex max-w-[1500px] gap-6 p-6">
    <aside className="w-72 rounded-2xl bg-brand-charcoal p-6 text-white shadow-2xl"><LogoBlock />
      <div className="mt-5 rounded-xl bg-slate-800 p-3"><label className="text-xs uppercase text-slate-400">Login Simulation</label>
        <select value={activeAccountId} onChange={(e) => setActiveAccountId(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-700 p-2">{simulatedAccounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
      </div>
      <nav className="mt-6 space-y-2">{visibleNavItems.map((item) => <button key={item} onClick={() => setPage(item)} className={`w-full rounded-lg px-3 py-2 text-left ${page === item ? 'bg-brand-orange font-semibold text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>{item}</button>)}</nav>
    </aside>

    <main className="flex-1 space-y-6">
      {page === 'Dashboard' && <section><h2 className="text-3xl font-bold">{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4"><Card title={isAdmin ? 'All Invoices' : 'My Invoices'} value={String(dashboardInvoices.length)} /><Card title="Low Stock" value={String(lowStock.length)} /><Card title={isAdmin ? 'Total Sales (Company)' : 'My Total Sales'} value={money(totalSales)} /><Card title="Today's Invoices" value={String(todaysInvoices)} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-3"> <MiniChart title={isAdmin ? 'Sales by user' : 'My productivity'} data={(isAdmin ? usersWithSales.filter((u) => u.role === 'User') : usersWithSales.filter((u) => u.id === activeAccount.id)).map((u) => ({ label: u.username, value: Math.round(u.sales / 60) }))} /><MiniChart title="Inventory overview" data={inventory.map((p) => ({ label: p.name.slice(0, 12), value: p.quantity }))} /><MiniChart title="Low stock alerts" data={lowStock.map((p) => ({ label: p.name.slice(0, 12), value: p.quantity }))} /></div>
        {isAdmin && <div className="mt-4 rounded-2xl bg-white p-5 shadow text-sm">Top selling product: <strong>{bestSellingProduct?.name}</strong>. Best performing user: <strong>{topProductivityUser?.username}</strong> ({money(topProductivityUser?.sales)}).</div>}
        {!isAdmin && <div className="mt-4 rounded-2xl bg-white p-5 shadow text-sm">Recent Activity: {dashboardInvoices.slice(0, 3).map((i) => <p key={i.id}>Created invoice {i.number} ({i.status})</p>)}</div>}
        <AlertFeed alerts={alerts.filter((a) => isAdmin || a.text.includes(activeAccount.username) || a.text.includes('Low stock'))} />
      </section>}

      {page === 'Inventory' && (isAdmin ? <InventorySection {...{ inventory, role, setInventory, setProductForm, setEditingId, saveProduct, productForm, editingId, resetProductForm }} /> : <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-3xl font-bold">Inventory</h2><p className="mt-3 text-sm text-rose-600">No access. Admin only.</p></section>)}
      {page === 'Create Invoice' && <section className="space-y-4"><h2 className="text-3xl font-bold">Create Invoice</h2>
        <div className="rounded-2xl bg-white p-5 shadow"><div className="grid gap-4 md:grid-cols-5"><Input label="FOR" value={customerName} onChange={setCustomerName} /><Input label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} /><Input label="Date/Time" type="datetime-local" value={invoiceDate} onChange={setInvoiceDate} /><Input label="Freight" type="number" value={freight} onChange={(v) => setFreight(Number(v))} /><Input label="Tax Rate %" type="number" value={taxRate} onChange={(v) => setTaxRate(Number(v))} /></div>
          <div className="mt-4 space-y-3">{draftLines.map((line, idx) => <div key={idx} className="grid gap-3 md:grid-cols-6"><select className="rounded border p-2" value={line.productId} onChange={(e) => updateLine(idx, 'productId', Number(e.target.value))}>{inventory.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input className="rounded border p-2" type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} /><div className="rounded border bg-slate-50 p-2">{money(invoiceItems[idx]?.unit)}</div><div className="rounded border bg-slate-50 p-2">Tax {taxRate}%</div><div className="rounded border bg-slate-50 p-2">{money(invoiceItems[idx]?.amount)}</div><button onClick={() => removeLine(idx)} className="rounded bg-rose-600 px-3 py-2 text-white">Remove</button></div>)}</div>
          <div className="mt-4 flex gap-2"><button onClick={addLine} className="rounded bg-slate-700 px-4 py-2 text-white">Add Product</button><button onClick={createInvoice} className="rounded bg-brand-orange px-4 py-2 text-white">Create Invoice</button></div></div>
        <InvoicePreview {...{ customerName, invoiceNumber, invoiceDate, invoiceItems, subtotal, tax, freight, total, selectedPayment, setSelectedPayment, cashReceived, setCashReceived, changeDue, isCashInsufficient, terms, taxRate, createdByName: activeAccount.username, status: 'Open' }} />
      </section>}

      {page === 'Invoices' && <section className="rounded-2xl bg-white p-5 shadow"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Invoice History</h2>{isAdmin && <select className="rounded border p-2 text-sm" value={invoiceFilterUserId} onChange={(e) => setInvoiceFilterUserId(e.target.value)}><option value="all">All users</option>{users.filter((u) => u.role === 'User').map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}</select>}</div>
        <div className="mt-3 overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Invoice #</th><th>Customer</th><th>Date/Time</th><th>Created By</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(filteredInvoicesForAdmin).map((i) => <tr className="border-b" key={i.id}><td className="p-2">{i.number}</td><td>{i.customerName}</td><td>{new Date(i.createdAt).toLocaleString()}</td><td>Created by {i.createdByName}</td><td>{i.paymentMethod}</td><td>{money(i.total)}</td><td><span className={`rounded px-2 py-1 text-xs font-semibold ${i.status === 'Void' ? 'bg-rose-100 text-rose-700' : i.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</span></td><td><div className="flex gap-1"><button className="rounded bg-slate-700 px-2 py-1 text-white">View</button><button className="rounded bg-brand-charcoal px-2 py-1 text-white" onClick={() => window.print()}>Print</button>{isAdmin && <><button className="rounded bg-rose-700 px-2 py-1 text-white" onClick={() => voidInvoice(i.id)}>Void</button><button className="rounded bg-black px-2 py-1 text-white" onClick={() => deleteInvoice(i.id)}>Delete</button></>}</div></td></tr>)}</tbody></table></div></section>}
      {page === 'Users' && <UsersSection role={role} users={users} setUsers={setUsers} />}
      {page === 'Settings' && <SettingsSection role={role} terms={terms} setTerms={setTerms} />}
    </main></div></div>;
}

function LogoBlock() { return <div><div className="flex h-14 items-center gap-3 rounded-lg border border-orange-300/30 bg-white/10 px-3"><div className="h-8 w-8 rounded bg-brand-orange" /><div><p className="text-sm font-bold text-white">Drywall Market Supply</p><p className="text-[10px] text-slate-300">Demo mode (frontend only)</p></div></div></div>; }
function Card({ title, value }) { return <div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold text-brand-charcoal">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text' }) { return <label><span className="mb-1 block text-sm text-slate-600">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border p-2" /></label>; }
function Row({ label, value, strong }) { return <div className={`flex justify-between ${strong ? 'border-t pt-1 text-base font-bold' : ''}`}><span>{label}</span><span>{value}</span></div>; }
function MiniChart({ title, data }) { return <div className="rounded-2xl bg-white p-4 shadow"><h4 className="text-sm font-semibold">{title}</h4><div className="mt-2 space-y-2">{data.length === 0 ? <p className="text-xs text-slate-400">No data</p> : data.map((d) => <div key={d.label}><div className="flex justify-between text-xs"><span>{d.label}</span><span>{d.value}</span></div><div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-brand-orange" style={{ width: `${Math.min(100, d.value)}%` }} /></div></div>)}</div></div>; }
function AlertFeed({ alerts }) { return <div className="mt-4 rounded-2xl bg-white p-4 shadow"><h4 className="font-semibold">Alerts / Notifications</h4>{alerts.length === 0 ? <p className="text-sm text-slate-500">No alerts yet.</p> : alerts.map((a) => <p key={a.id} className="mt-2 rounded bg-amber-50 p-2 text-sm">{a.text}</p>)}</div>; }

function InventorySection({ inventory, role, setInventory, setProductForm, setEditingId, saveProduct, productForm, editingId, resetProductForm }) { return <section><h2 className="text-3xl font-bold">Inventory</h2><div className="mt-3 grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-5"><Input label="Product" value={productForm.name} onChange={(v) => setProductForm((p) => ({ ...p, name: v }))} /><Input label="Category" value={productForm.category} onChange={(v) => setProductForm((p) => ({ ...p, category: v }))} /><Input label="Quantity" type="number" value={productForm.quantity} onChange={(v) => setProductForm((p) => ({ ...p, quantity: v }))} /><Input label="Min Stock" type="number" value={productForm.minStock} onChange={(v) => setProductForm((p) => ({ ...p, minStock: v }))} /><Input label="Price" type="number" value={productForm.unitPrice} onChange={(v) => setProductForm((p) => ({ ...p, unitPrice: v }))} /><label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={productForm.noReturns} onChange={(e) => setProductForm((p) => ({ ...p, noReturns: e.target.checked }))} />NO RETURNS / NO REFUNDS</label><div className="col-span-2 flex items-end gap-2">{role === 'Admin' ? <><button onClick={saveProduct} className="rounded bg-brand-orange px-4 py-2 text-white">{editingId ? 'Save Product' : 'Add Product'}</button><button onClick={resetProductForm} className="rounded border px-4 py-2">Cancel</button></> : <p className="text-sm text-slate-500">User role cannot edit inventory.</p>}</div></div>
  <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Product</th><th>Qty</th><th>Min</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{inventory.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.name}{item.noReturns && <span className="ml-2 rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">NO RETURNS / NO REFUNDS</span>}</td><td>{item.quantity}</td><td>{item.minStock}</td><td>{money(item.unitPrice)}</td><td>{item.status}</td><td>{role === 'Admin' ? <div className="flex gap-1"><button onClick={() => { setEditingId(item.id); setProductForm(item); }} className="rounded bg-slate-700 px-2 py-1 text-white">Edit</button><button onClick={() => setInventory((prev) => prev.filter((p) => p.id !== item.id))} className="rounded bg-rose-600 px-2 py-1 text-white">Delete</button></div> : 'No access'}</td></tr>)}</tbody></table></div></section>; }

function UsersSection({ role, users, setUsers }) { const [u, setU] = useState({ username: '', password: '', role: 'User' }); return <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-2xl font-bold">Users</h2>{role !== 'Admin' ? <p className="mt-2 text-sm text-slate-500">Only admin can manage users.</p> : <><div className="mt-3 grid gap-2 md:grid-cols-4"><input className="rounded border p-2" placeholder="Username" value={u.username} onChange={(e) => setU((p) => ({ ...p, username: e.target.value }))} /><input className="rounded border p-2" placeholder="Password" value={u.password} onChange={(e) => setU((p) => ({ ...p, password: e.target.value }))} /><select className="rounded border p-2" value={u.role} onChange={(e) => setU((p) => ({ ...p, role: e.target.value }))}><option>User</option><option>Admin</option></select><button onClick={() => { if (!u.username || !u.password) return; setUsers((prev) => [...prev, { ...u, id: Date.now() }]); setU({ username: '', password: '', role: 'User' }); }} className="rounded bg-brand-orange px-3 py-2 text-white">Add User</button></div><table className="mt-4 min-w-full text-sm"><thead><tr className="border-b"><th className="text-left">Username</th><th>Role</th><th>Password</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b"><td>{user.username}</td><td>{user.role}</td><td>{user.password}</td></tr>)}</tbody></table></>}</section>; }
function SettingsSection({ role, terms, setTerms }) { return <section className="rounded-2xl bg-white p-5 shadow"><h2 className="text-2xl font-bold">Invoice Disclaimer Settings</h2><p className="mt-1 text-sm text-slate-500">Edit the disclaimer / terms and conditions that appear at the bottom of printed invoices.</p>{role !== 'Admin' ? <p className="text-sm text-slate-500">Only admin can edit terms and conditions.</p> : <><textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="mt-3 h-32 w-full rounded border p-3" /><p className={`mt-2 text-sm ${terms.length > TERMS_CHAR_LIMIT ? 'text-rose-600' : 'text-slate-500'}`}>Characters: {terms.length}/{TERMS_CHAR_LIMIT}</p></>}</section>; }

function InvoicePreview({ customerName, invoiceNumber, invoiceDate, invoiceItems, subtotal, tax, freight, total, selectedPayment, setSelectedPayment, cashReceived, setCashReceived, changeDue, isCashInsufficient, terms, taxRate, createdByName, status }) {
  const isVoid = status === 'Void';
  return <section className="invoice-shell rounded-2xl p-8 shadow-lg"><div className="invoice-paper relative mx-auto bg-white p-10 text-slate-900 shadow-xl print:shadow-none">{isVoid && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-8xl font-black text-rose-200">VOID</div>}<header className="flex justify-between border-b-2 border-slate-200 pb-4"><div className="flex gap-3"><div className="h-12 w-12 rounded bg-brand-orange" /><div><h3 className="text-2xl font-extrabold text-brand-charcoal">Drywall Market Supply</h3><p className="text-sm">113 E Gardena Blvd, Gardena, CA 90248</p></div></div><div className="text-right text-sm"><p><strong>FOR:</strong> {customerName}</p><p><strong>Invoice #:</strong> {invoiceNumber}</p><p><strong>Date:</strong> {invoiceDate}</p><p><strong>Created by:</strong> {createdByName}</p><p><strong>Status:</strong> {status}</p></div></header><table className="mt-4 min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Description</th><th className="p-2">Quantity</th><th className="p-2">Unit Price</th><th className="p-2">Tax</th><th className="p-2">Amount</th></tr></thead><tbody>{invoiceItems.map((item, idx) => <tr key={idx} className="border-b"><td className="p-2">{item.product?.name}{item.product?.noReturns && <p className="mt-1 text-xs font-semibold text-rose-700">NO RETURNS / NO REFUNDS</p>}</td><td className="p-2 text-center">{item.qty}</td><td className="p-2 text-center">{money(item.unit)}</td><td className="p-2 text-center">{item.product?.taxable ? `${taxRate}%` : '0%'}</td><td className="p-2 text-center">{money(item.amount)}</td></tr>)}</tbody></table><div className="mt-4 ml-auto w-80 text-sm"><Row label="Subtotal" value={money(subtotal)} /><Row label="Tax" value={money(tax)} /><Row label="Freight" value={money(freight)} /><Row label="Total" value={money(total)} strong /></div><p className="mt-3 text-sm"><strong>Payment Method:</strong> {selectedPayment}</p>{selectedPayment === 'Cash' && <><p className="mt-1 text-sm"><strong>Cash Received:</strong> {money(cashReceived)}</p><p className="mt-1 text-sm"><strong>Change Due:</strong> {money(changeDue)}</p></>}<p className="mt-2 text-sm"><strong>Terms and conditions:</strong> {terms}</p></div><div className="mt-3 flex justify-center gap-2 print:hidden"><select className="rounded border p-2" value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>{paymentMethods.map((p) => <option key={p}>{p}</option>)}</select>{selectedPayment === 'Cash' && <div><label className="mb-1 block text-sm text-slate-600">Cash Received</label><input className="rounded border p-2" type="number" value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value || 0))} /></div>}{selectedPayment === 'Cash' && isCashInsufficient && <p className="self-center text-sm text-rose-600">Insufficient cash received</p>}<button className="rounded bg-brand-charcoal px-4 py-2 text-white" onClick={() => window.print()}>Print Invoice</button></div></section>;
}
