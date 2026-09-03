const fs = require('fs');

const files = [
  'src/components/ReservationsView.tsx',
  'src/components/InvoicesView.tsx',
  'src/components/SuppliersView.tsx',
  'src/components/TasksView.tsx',
  'src/components/DocumentsView.tsx',
  'src/components/LoginModal.tsx',
  'src/components/GlobalSearchModal.tsx',
  'src/components/CustomersView.tsx',
  'src/components/EmployeesView.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\(\s*\|\|\s*""\s*\)\.toLowerCase\(\)/g, '.toLowerCase()');
    fs.writeFileSync(file, content);
  }
}
