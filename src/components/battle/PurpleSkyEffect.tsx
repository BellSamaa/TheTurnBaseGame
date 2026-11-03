'use client';
import { useEffect, useState } from 'react';
export default function PurpleSkyEffect({ startedAt }: { startedAt: number }) {
  const [remaining] = useState(() => Math.max(0, Math.min(3000, 3000 - (Date.now() - startedAt))));
  const [visible, setVisible] = useState(remaining > 0);
  useEffect(() => { const timer = setTimeout(() => setVisible(false), remaining); return () => clearTimeout(timer); }, [remaining]);
  if (!visible) return null;
  return <div aria-hidden="true" className="purple-sky" style={{ animationDelay: `${remaining - 3000}ms` }}><i style={{ animationDelay: `${remaining - 3000}ms` }} /></div>;
}
