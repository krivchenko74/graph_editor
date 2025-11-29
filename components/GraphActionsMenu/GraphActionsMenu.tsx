// components/GraphActionsMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { BsChevronDown } from "react-icons/bs";
import Portal from "../Portal/Portal";
import styles from "../Select/Select.module.css";
import styles2 from "./GraphActionsMenu.module.css";
type Action = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  danger?: boolean; // для красных пунктов типа "Удалить"
  onClick: () => void;
};

type Props = {
  actions: Action[];
  label?: string; // например "Действия" или "Ещё"
};

export default function GraphActionsMenu({
  actions,
  label = "Действия",
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Закрываем меню после выбора действия
  const handleActionClick = (action: Action) => {
    action.onClick();
    setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.label}>{label}</span>
        <BsChevronDown className={styles.arrow} />
      </div>

      {open && (
        <Portal>
          <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: "fixed",
              top: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().bottom + 4
                : 0,
              left: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().left
                : 0,
              minWidth: triggerRef.current?.offsetWidth || 180,
              width: "max-content",
            }}
          >
            {actions.map((action) => (
              <div
                key={action.value}
                className={`${styles.option} ${styles2.option} ${
                  action.danger ? styles2.danger : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action);
                }}
              >
                {action.icon && (
                  <span className={styles2.optionIcon}>{action.icon}</span>
                )}
                <span>{action.label}</span>
              </div>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
