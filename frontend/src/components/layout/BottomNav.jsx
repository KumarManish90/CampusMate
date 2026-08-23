import React from "react";
import { Plus } from "lucide-react";

export default function BottomNav({ items, tab, setTab, unread = 0, onCreate, tokens }) {
  return (
    <nav className="cm-bottomnav" aria-label="Mobile navigation">
      {items.slice(0, 2).map((item) => {
        const active = tab === item.key;
        return (
          <button key={item.key} onClick={() => setTab(item.key)} aria-current={active ? "page" : undefined} style={{ color: active ? tokens.primary : tokens.textFaint }}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button className="cm-bottomnav-create" onClick={onCreate} aria-label="Create">
        <Plus size={22} />
      </button>
      {items.slice(2).map((item) => {
        const active = tab === item.key;
        return (
          <button key={item.key} onClick={() => setTab(item.key)} aria-current={active ? "page" : undefined} style={{ color: active ? tokens.primary : tokens.textFaint }}>
            <item.icon size={19} />
            <span>{item.label}</span>
            {item.key === "messages" && unread > 0 && <i aria-label={`${unread} unread messages`} />}
          </button>
        );
      })}
    </nav>
  );
}
