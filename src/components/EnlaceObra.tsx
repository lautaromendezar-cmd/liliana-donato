"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import type { ReactNode, MouseEvent } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

type DocumentoConTransicion = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
};

/**
 * Navega con View Transitions cuando el navegador las soporta: la pintura
 * viaja de la grilla al detalle en lugar de recargarse. Si no hay soporte —o
 * el sistema pide movimiento reducido— es un Link común.
 */
export function EnlaceObra({ href, children, className, ...resto }: Props) {
  const router = useRouter();

  function alHacerClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const doc = document as DocumentoConTransicion;
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || sinMovimiento) return;

    e.preventDefault();
    doc.startViewTransition(() => {
      flushSync(() => {
        router.push(href);
      });
    });
  }

  return (
    <Link href={href} className={className} onClick={alHacerClick} {...resto}>
      {children}
    </Link>
  );
}
