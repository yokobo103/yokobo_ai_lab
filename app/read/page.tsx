import { Suspense } from "react";
import { Header } from "../_redesign/components/Header";
import { ReadArchivePage } from "../_redesign/components/ReadArchivePage";

export default function ReadPage() {
  return (
    <>
      <Header variant="dark" showNav />
      <Suspense fallback={null}>
        <ReadArchivePage />
      </Suspense>
    </>
  );
}
