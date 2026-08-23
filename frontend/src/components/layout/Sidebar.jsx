import React from "react";
import { Moon, Sun } from "lucide-react";

export default function Sidebar({ items, tab, setTab, dark, setDark, unread = 0, onCreate, connectionStatus, Logo, PrimaryButton, tokens }) {
  return (
    <aside className="cm-sidebar" style={{ width: 220, borderRight: `1px solid ${tokens.border}`, padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
      <div style={{ padding: "0 8px 10px" }}><Logo t={tokens} /></div>
      {connectionStatus && <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px 14px", fontSize: 10.5, fontWeight: 700, color: tokens.textFaint }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: connectionStatus === "online" ? "#38BDF8" : "#F5A524" }} />{connectionStatus === "online" ? "CONNECTED" : "DEMO MODE — LOCAL DATA"}</div>}
      <PrimaryButton onClick={onCreate} icon={require("lucide-react").Plus} style={{ margin: "0 4px 14px", justifyContent: "center" }}>Create</PrimaryButton>
      {items.map((item) => { const active = tab === item.key; return <button key={item.key} onClick={() => setTab(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", background: active ? `${tokens.primary}1f` : "transparent", color: active ? tokens.primary : tokens.textMuted, fontWeight: active ? 700 : 600, fontSize: 14, position: "relative" }}><item.icon size={17} />{item.label}{item.key === "messages" && unread > 0 && <span style={{ marginLeft: "auto", background: "#FB4570", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{unread}</span>}</button>; })}
      <div style={{ marginTop: "auto" }}><button onClick={() => setDark(!dark)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{dark ? <Sun size={15} /> : <Moon size={15} />}{dark ? "Light mode" : "Dark mode"}</button></div>
    </aside>
  );
}
