"use client";

import { useState } from "react";

type UseDetailResourceOptions = {
  closeOnRefreshError?: boolean;
  onOpenError?: (error: unknown) => void;
  onRefreshError?: (error: unknown) => void;
};

export function useDetailResource<ResourceId extends string, ResourceValue>(
  loadResource: (resourceId: ResourceId) => Promise<ResourceValue>,
  options: UseDetailResourceOptions = {},
) {
  const [resourceId, setResourceId] = useState<ResourceId | null>(null);
  const [resource, setResource] = useState<ResourceValue | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function openResource(nextResourceId: ResourceId) {
    setResourceId(nextResourceId);
    setResource(null);
    setIsLoading(true);

    try {
      const nextResource = await loadResource(nextResourceId);

      setResource(nextResource);

      return nextResource;
    } catch (error) {
      setResourceId(null);
      setResource(null);
      options.onOpenError?.(error);

      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshResource(nextResourceId = resourceId) {
    if (!nextResourceId) {
      return null;
    }

    try {
      const nextResource = await loadResource(nextResourceId);

      setResourceId(nextResourceId);
      setResource(nextResource);

      return nextResource;
    } catch (error) {
      if (options.closeOnRefreshError ?? true) {
        setResourceId(null);
        setResource(null);
      }

      options.onRefreshError?.(error);

      return null;
    }
  }

  function closeResource() {
    setResourceId(null);
    setResource(null);
    setIsLoading(false);
  }

  return {
    closeResource,
    isLoading,
    openResource,
    refreshResource,
    resource,
    resourceId,
    setResource,
  };
}
