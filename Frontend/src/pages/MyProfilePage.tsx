import { useProfileStore } from '@/stores/profileStore';
import Avatar from '@/components/shared/Avatar';
import DetailField from '@/components/shared/DetailField';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatDate, statusLabel } from '@/utils/formatters';

export default function MyProfilePage() {
  const profile = useProfileStore((s) => s.profile);

  if (!profile) {
    return <LoadingSpinner />;
  }

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex items-center gap-4">
        <Avatar role={profile.role} photoUrl={profile.profilePhoto} name={fullName || profile.email} size={56} />
        <div>
          <p className="text-lg font-semibold text-charcoal">{fullName || profile.email}</p>
          <p className="text-sm capitalize text-gray-500">{profile.role}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-charcoal">Account Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField label="Email" value={profile.email} />
          <DetailField label="Phone" value={profile.phone} />
        </div>
      </div>

      {profile.driver && (
        <div className="card">
          <h2 className="mb-4 font-semibold text-charcoal">Driver Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Status" value={statusLabel(profile.driver.status)} />
            <DetailField label="Driving License Number" value={profile.driver.drivingLicenseNumber} />
            <DetailField
              label="License Expiry"
              value={profile.driver.licenseExpiry ? formatDate(profile.driver.licenseExpiry) : undefined}
            />
            <DetailField label="Emergency Contact Name" value={profile.driver.emergencyContactName} />
            <DetailField label="Emergency Contact Phone" value={profile.driver.emergencyContactPhone} />
            <DetailField label="Average Rating" value={profile.driver.avgRating} />
            <DetailField label="Total Trips" value={profile.driver.totalTrips} />
            <DetailField label="Completed Trips" value={profile.driver.completedTrips} />
          </div>
          <p className="mt-4 text-xs text-gray-400">
            These details are set once and verified by your branch manager. Contact your manager if anything needs
            to change.
          </p>
        </div>
      )}

      {profile.manager && (
        <div className="card">
          <h2 className="mb-4 font-semibold text-charcoal">Manager Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Status" value={statusLabel(profile.manager.status)} />
            <DetailField label="Drivers Managed" value={profile.manager.totalDriversManaged} />
            <DetailField label="Trips Overseen" value={profile.manager.totalTripsOverseen} />
          </div>
        </div>
      )}

      {profile.role === 'admin' && (
        <p className="text-sm text-gray-500">Super admin credentials are managed via environment configuration.</p>
      )}
    </div>
  );
}
