const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
app.get("/api/dashboard-stats", (req, res) => {
  const total_customers = db.customers.length;
  const active_reservations = db.reservations.filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todays_reservations = db.reservations.filter(r => r.booking_date === todayStr).length;
  const upcoming_trips = db.reservations.filter(r => r.travel_date >= todayStr).length;
  
  const total_sales = db.reservations.reduce((acc, r) => acc + (r.selling_price || 0), 0);
  const total_supplier_costs = db.reservations.reduce((acc, r) => acc + (r.cost_price || 0), 0);
  const total_expenses = db.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const net_profit = total_sales - total_supplier_costs - total_expenses;

  const outstanding_customer_payments = db.customers.reduce((acc, c) => acc + (c.outstanding_balance || 0), 0);
  const outstanding_supplier_payments = db.suppliers.reduce((acc, s) => acc + (s.outstanding_balance || 0), 0);
  const today_tasks = db.tasks.filter(t => t.status !== 'Completed').length;

  // Compute monthly data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    Sales: 0,
    Expenses: 0,
    Profit: 0
  }));

  db.reservations.forEach(r => {
    if (!r.booking_date) return;
    const date = new Date(r.booking_date);
    if (date.getFullYear() === currentYear) {
      const monthIdx = date.getMonth();
      monthlyData[monthIdx].Sales += r.selling_price || 0;
      monthlyData[monthIdx].Expenses += r.cost_price || 0;
    }
  });

  db.expenses.forEach(e => {
    if (!e.date) return;
    const date = new Date(e.date);
    if (date.getFullYear() === currentYear) {
      const monthIdx = date.getMonth();
      monthlyData[monthIdx].Expenses += e.amount || 0;
    }
  });

  monthlyData.forEach(m => {
    m.Profit = m.Sales - m.Expenses;
  });

  // Compute Destination Popularity
  const destCounts: Record<string, number> = {};
  db.reservations.forEach(r => {
    if (r.destination) {
      destCounts[r.destination] = (destCounts[r.destination] || 0) + 1;
    }
  });
  const totalDest = Object.values(destCounts).reduce((a, b) => a + b, 0);
  const destinationPopularity = Object.entries(destCounts)
    .map(([name, count]) => ({
      name,
      percentage: totalDest > 0 ? Math.round((count / totalDest) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  // Compute Top Agent
  const agentSales: Record<string, number> = {};
  db.reservations.forEach(r => {
    if (r.employee_name) {
      agentSales[r.employee_name] = (agentSales[r.employee_name] || 0) + (r.selling_price || 0);
    }
  });
  
  let topAgent = { name: "No data", sales: 0 };
  for (const [name, sales] of Object.entries(agentSales)) {
    if (sales > topAgent.sales) {
      topAgent = { name, sales };
    }
  }

  res.json({
    total_customers,
    active_reservations,
    todays_reservations,
    upcoming_trips,
    total_sales,
    total_expenses,
    net_profit,
    outstanding_customer_payments,
    outstanding_supplier_payments,
    today_tasks,
    recent_reservations: db.reservations.slice(-5).reverse(),
    recent_payments: db.customer_payments.slice(-5).reverse(),
    recent_activities: db.activity_logs.slice(-6).reverse(),
    monthlyData,
    destinationPopularity,
    topAgent
  });
});
`;

content = content.replace(/app\.get\("\/api\/dashboard-stats", \(req, res\) => \{[\s\S]*?\}\);/, replacement.trim());

fs.writeFileSync('server.ts', content);
