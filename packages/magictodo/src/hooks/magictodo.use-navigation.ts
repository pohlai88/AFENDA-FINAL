"use client";

import { useRouter, usePathname } from "next/navigation";
import { MAGICTODO_ROUTES } from "../constant/magictodo.constant.routes";

/**
 * magictodo domain navigation hook.
 */
export function useMagictodoNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return {
    pathname,
    routes: MAGICTODO_ROUTES.ui,
    
    goToList: () => router.push(MAGICTODO_ROUTES.ui.list),
    goToDetail: (id: string) => router.push(MAGICTODO_ROUTES.ui.detail(id)),
    goToCreate: () => router.push(MAGICTODO_ROUTES.ui.create),
    goToEdit: (id: string) => router.push(MAGICTODO_ROUTES.ui.edit(id)),
  };
}
