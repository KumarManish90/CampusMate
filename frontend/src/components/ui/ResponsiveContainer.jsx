import React from "react";

export default function ResponsiveContainer({ children, className = "", style = {} }) {
  return (
    <main className={`cm-responsive-container ${className}`} style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "0 24px", boxSizing: "border-box", ...style }}>
      {children}
      <style>{`@media (max-width: 860px){.cm-responsive-container{padding-left:14px!important;padding-right:14px!important}}@media (max-width:480px){.cm-responsive-container{padding-left:10px!important;padding-right:10px!important}}`}</style>
    </main>
  );
}
