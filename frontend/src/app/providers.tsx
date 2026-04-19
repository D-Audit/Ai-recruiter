"use client";
import { Provider, useSelector } from "react-redux";
import { store, RootState } from "../store";
import { Toaster } from "react-hot-toast";
import FloatingAI from "../components/FloatingAI";

/** Only renders FloatingAI when the user is logged in */
function AuthGatedFloatingAI() {
  const token = useSelector((s: RootState) => s.auth.token);
  if (!token) return null;
  return <FloatingAI />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" />
      <AuthGatedFloatingAI />
    </Provider>
  );
}