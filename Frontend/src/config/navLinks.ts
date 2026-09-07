import {
  LayoutDashboard,
  Users,
  UsersRound,
  Truck,
  Building2,
  UserCircle,
  Route,
  Package,
  Map,
  ClipboardCheck,
  BarChart3,
  Image as ImageIcon,
} from 'lucide-react';

export type BadgeKey =
  | 'pendingDriverCount'
  | 'pendingManagerCount'
  | 'pendingVehicleCount'
  | 'scheduledTripCount'
  // Pending Approvals covers both pending drivers and pending managers combined.
  | 'pendingApprovalsCount'
  | 'activePhotoCount';

export interface SidebarLink {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: BadgeKey;
}

// Shared by the desktop Sidebar and the mobile bottom nav so the two never drift apart.
export const linksByRole: Record<string, SidebarLink[]> = {
  driver: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/map', label: 'My Map', icon: Map },
    { to: '/dashboard/trips', label: 'My Trips', icon: Package, badgeKey: 'scheduledTripCount' },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/map', label: 'Map', icon: Map },
    { to: '/dashboard/my-drivers', label: 'My Drivers', icon: UsersRound, badgeKey: 'pendingDriverCount' },
    { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
    { to: '/dashboard/trips', label: 'Trips', icon: Route },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/map', label: 'Live Map', icon: Map },
    { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
    { to: '/dashboard/trips', label: 'Trips', icon: Route },
    { to: '/dashboard/drivers', label: 'Drivers', icon: Users },
    { to: '/dashboard/managers', label: 'Managers', icon: UsersRound },
    { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck, badgeKey: 'pendingVehicleCount' },
    { to: '/dashboard/pending', label: 'Pending Approvals', icon: ClipboardCheck, badgeKey: 'pendingApprovalsCount' },
    { to: '/dashboard/photos', label: 'Photos', icon: ImageIcon, badgeKey: 'activePhotoCount' },
    { to: '/dashboard/analytics', label: 'System Analytics', icon: BarChart3 },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
};
