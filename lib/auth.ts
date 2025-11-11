export const GUEST_COLORS = ["#8b5cf6", "#ef4444", "#0ea5e9", "#14b8a6", "#f97316", "#a855f7", "#22c55e", "#ec4899"]

export const pickColorForId = (id: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return GUEST_COLORS[hash % GUEST_COLORS.length]
}
