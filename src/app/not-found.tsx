"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
  const { dict } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">{dict.notFound.title}</h1>
      <p className="text-[var(--ink-soft)]">{dict.notFound.text}</p>
      <Link href="/" className="underline underline-offset-2">
        {dict.notFound.back}
      </Link>
    </main>
  );
}
