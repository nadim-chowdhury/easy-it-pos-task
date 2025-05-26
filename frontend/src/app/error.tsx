"use client";

import { ErrorPageComponent } from "@/components/common/ErrorPageComponent";

export default function ErrorPage() {
  return (
    <ErrorPageComponent
      title="Oops! Something went wrong"
      message="We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
      onRetry={() => window.location.reload()}
      onGoHome={() => (window.location.href = "/")}
      onGoBack={() => window.history.back()}
    />
  );
}
