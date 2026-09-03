const fs = require('fs');
let file = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

file = file.replace(
  `interface LoginModalProps {`,
  `import { Employee } from '../types';\ninterface LoginModalProps {\n  employees?: Employee[];`
);

file = file.replace(
  `export function LoginModal({ onLogin, companyName }: LoginModalProps) {`,
  `export function LoginModal({ onLogin, companyName, employees = [] }: LoginModalProps) {`
);

file = file.replace(
  `const accounts = [`,
  `const employeeAccounts = employees.map(emp => ({\n    name: emp.username || emp.name,\n    pass: emp.password || '',\n    role: (emp.position as UserRole) || 'Sales',\n    label: emp.position || 'Employee'\n  }));\n\n  const accounts = [\n    ...employeeAccounts,`
);

fs.writeFileSync('src/components/LoginModal.tsx', file);
