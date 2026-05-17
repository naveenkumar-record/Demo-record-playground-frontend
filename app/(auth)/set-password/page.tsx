import { Suspense } from "react";
import SetPasswordClient from "../../../components/set-password/SetPasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetPasswordClient />
    </Suspense>
  );
}