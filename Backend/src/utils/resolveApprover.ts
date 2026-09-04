import User from '../models/User';

// approvedBy/verifiedBy fields store a plain id string that's either a real User
// ObjectId (a manager) or an env-based "super_admin_N" id - never both, never a ref.
export const isSuperAdminId = (id?: string): boolean => !!id && id.startsWith('super_admin_');

export const resolveApproverNames = async (ids: (string | undefined)[]): Promise<Map<string, string>> => {
  const userIds = [...new Set(ids.filter((id): id is string => !!id && !isSuperAdminId(id)))];
  if (userIds.length === 0) return new Map();

  const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName');
  return new Map(users.map((u) => [u._id.toString(), `${u.firstName} ${u.lastName}`]));
};

export const approverDisplayName = (id: string | undefined, map: Map<string, string>): string | undefined => {
  if (!id) return undefined;
  if (isSuperAdminId(id)) return 'Super Admin';
  return map.get(id) ?? id;
};
