import React from "react";
import styles from "./GlassContainer.module.css";
export default function GlassContainer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={styles.div}>{children}</div>;
}
