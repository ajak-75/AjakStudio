export default function RootRedirectPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fbfaf7",
        color: "#14140f",
        fontFamily: "ui-serif, Georgia, serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <p style={{ letterSpacing: "0.24em", fontSize: "11px", textTransform: "uppercase" }}>
          Global Digital Universe
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: "1.25rem" }}>
          <a href="/ko/" style={{ borderBottom: "1px solid currentColor" }}>
            한국어
          </a>
          <span style={{ margin: "0 0.75rem", color: "#83807a" }}>/</span>
          <a href="/en/" style={{ borderBottom: "1px solid currentColor" }}>
            English
          </a>
        </p>
      </div>
    </div>
  );
}
