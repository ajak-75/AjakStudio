export default function AdminGatePage() {
  return (
    <div>
      <p style={{ letterSpacing: "0.24em", fontSize: "11px", textTransform: "uppercase" }}>AjakStudio</p>
      <p style={{ marginTop: "1rem", fontSize: "1.25rem" }}>CONTROL CENTER</p>
      <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b6862" }}>
        <a href="/ko/admin/" style={{ borderBottom: "1px solid currentColor", color: "#14140f" }}>
          한국어 관리자
        </a>
        <span style={{ margin: "0 0.75rem" }}>/</span>
        <a href="/en/admin/" style={{ borderBottom: "1px solid currentColor", color: "#14140f" }}>
          English
        </a>
      </p>
    </div>
  );
}
