/** Re-mounts on every navigation, giving each page the same short entrance. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
