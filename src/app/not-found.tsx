import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div
      className="pliego"
      style={{ paddingBlock: "clamp(6rem, 22vh, 14rem)", minHeight: "58vh" }}
    >
      <div style={{ gridColumn: "1 / span 6" }}>
        <h1 className="display" style={{ fontSize: "var(--t-l)", marginBottom: "1rem" }}>
          Nada por acá
        </h1>
        <p style={{ color: "var(--texto-medio)", marginBottom: "2rem", maxWidth: "30ch" }}>
          La página que buscabas no existe o cambió de lugar.
        </p>
        <Link
          href="/obra"
          className="versal"
          style={{
            borderBottom: "1px solid var(--acento)",
            paddingBottom: "2px",
            color: "var(--texto)",
          }}
        >
          Ir a la obra →
        </Link>
      </div>
    </div>
  );
}
