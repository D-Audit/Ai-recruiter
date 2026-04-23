"use client";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store, AppDispatch } from "../store";
import { restoreUser } from "../store/slices/authSlice";
import { Toaster } from "react-hot-toast";
import FloatingAI from "../components/FloatingAI";

// Inner component that dispatches restoreUser once on mount
function AuthRestorer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    
    dispatch(restoreUser());
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthRestorer>
        {children}
        <Toaster position="top-right" />
        <FloatingAI />
      </AuthRestorer>
    </Provider>
  );
}