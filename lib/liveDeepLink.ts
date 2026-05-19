let pendingId: string | null = null;

export function setPendingLiveId(id: string) {
  pendingId = id;
}

export function consumePendingLiveId(): string | null {
  const id = pendingId;
  pendingId = null;
  return id;
}
