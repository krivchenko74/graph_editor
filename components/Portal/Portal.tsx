import { ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
};

export default function Portal({ children }: Props) {
  return typeof document !== "undefined"
    ? createPortal(children, document.body)
    : null;
}
