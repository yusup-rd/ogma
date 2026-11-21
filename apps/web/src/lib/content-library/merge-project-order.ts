// Merge each side's changed precedence; a cycle means the requested moves conflict.
export function mergeProjectOrder(
  base: string[],
  local: string[],
  incoming: string[],
): string[] | undefined {
  const localIndex = new Map(local.map((id, index) => [id, index]));
  const incomingIndex = new Map(incoming.map((id, index) => [id, index]));
  const edges = new Map(base.map((id) => [id, new Set<string>()]));
  const degree = new Map(base.map((id) => [id, 0]));
  for (let a = 0; a < base.length; a++) {
    for (let b = a + 1; b < base.length; b++) {
      const left = base[a],
        right = base[b];
      const localBefore = localIndex.get(left)! < localIndex.get(right)!;
      const incomingBefore =
        incomingIndex.get(left)! < incomingIndex.get(right)!;
      const before = localBefore ? incomingBefore : false;
      const from = before ? left : right,
        to = before ? right : left;
      edges.get(from)!.add(to);
      degree.set(to, degree.get(to)! + 1);
    }
  }
  const result: string[] = [];
  const ready = base.filter((id) => degree.get(id) === 0);
  while (ready.length) {
    ready.sort((a, b) => localIndex.get(a)! - localIndex.get(b)!);
    const id = ready.shift()!;
    result.push(id);
    for (const next of edges.get(id)!) {
      degree.set(next, degree.get(next)! - 1);
      if (!degree.get(next)) ready.push(next);
    }
  }
  return result.length === base.length ? result : undefined;
}
