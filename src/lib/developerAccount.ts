import type { Employee, UserRole } from '../types';

/**
 * Developer / owner account.
 *
 * This account is intentionally NOT stored in the employees collection, so it
 * cannot be edited, deactivated or deleted from the employee management UI or
 * through the /api/employees endpoints. It always resolves to full
 * Administrator privileges.
 */
export const DEVELOPER_ACCOUNT = {
  name: 'IT',
  password: '1282',
  role: 'Administrator' as UserRole,
  id: 'SYS-IT-ADMIN',
  protected: true,
} as const;

export const DEVELOPER_ACCOUNT_ID = DEVELOPER_ACCOUNT.id;
export const DEVELOPER_USERNAME = DEVELOPER_ACCOUNT.name;

/** True when the given employee record refers to the protected developer account. */
export function isDeveloperAccount(employee?: Partial<Employee> | null): boolean {
  if (!employee) return false;
  return (
    employee.id === DEVELOPER_ACCOUNT_ID ||
    employee.employee_id === DEVELOPER_ACCOUNT_ID ||
    (employee.username || '').trim().toLowerCase() === DEVELOPER_USERNAME.toLowerCase()
  );
}

/** Usernames reserved for the protected developer account. */
export function isReservedDeveloperUsername(username?: string | null): boolean {
  return (username || '').trim().toLowerCase() === DEVELOPER_USERNAME.toLowerCase();
}
