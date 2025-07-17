import { processRoleRequest, testRoleRequest } from './roleRequests';
import { setRole, setAdminBatch } from './setRole';
import { setRoleHTTP, setAdminBatchHTTP } from './setRoleHTTP';
import { listUsers, syncAuthUsers } from './userManagement';
import { setCustomUserClaims, setCustomUserClaimsCallable } from './setCustomUserClaims';
import { getActualUserRoles, syncUserRoles } from './roleSyncFunctions';
import { resetPermissionSystem, updateUserPermission } from './resetPermissionSystem';

// Export all functions
export {
  processRoleRequest,
  testRoleRequest,
  setRole,
  setAdminBatch,
  setRoleHTTP,
  setAdminBatchHTTP,
  listUsers,
  syncAuthUsers,
  setCustomUserClaims,
  setCustomUserClaimsCallable,
  getActualUserRoles,
  syncUserRoles,
  resetPermissionSystem,
  updateUserPermission
};
