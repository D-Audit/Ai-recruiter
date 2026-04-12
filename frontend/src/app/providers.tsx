"use client";
import { Provider } from "react-redux";
import { store } from "../store";
import { Toaster } from "react-hot-toast";
import FloatingAI from "../components/FloatingAI";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" />
      <FloatingAI />
    </Provider>
  );
}