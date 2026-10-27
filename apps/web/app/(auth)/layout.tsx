import type { ReactNode } from "react";
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) { return <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">{children}</main>; }
