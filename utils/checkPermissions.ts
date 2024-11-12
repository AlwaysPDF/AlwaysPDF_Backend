import { UnAuthenticatedError } from '../errors/index.js'

interface Admin {
  role: string;
  adminId: string;
  // Add other properties as needed
}

const checkPermissions = (requestAdmin: Admin, resourceAdminId: string) => {
  if (requestAdmin.role === 'admin') return;
  if (requestAdmin.adminId === resourceAdminId.toString()) return;

  throw new UnAuthenticatedError('Not authorized to access this route');
}

export default checkPermissions;
