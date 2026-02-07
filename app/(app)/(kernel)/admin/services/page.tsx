/**
 * Admin Service Registry Page
 * Service discovery and registry management.
 *
 * @domain admin
 * @layer page
 */

import { ServiceRegistryContent } from "./_components/ServiceRegistryContent";
import { ServiceRegistryPageContent } from "./_components/ServiceRegistryPageContent";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  return (
    <ServiceRegistryContent>
      <ServiceRegistryPageContent />
    </ServiceRegistryContent>
  );
}
