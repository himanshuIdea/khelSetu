/**
 * Full-page navigation after auth so Set-Cookie from the login response
 * is applied before middleware/RSC checks on the destination.
 */
export function completeAuthRedirect(redirectTo: string): void {
  if (typeof window !== "undefined") {
    window.location.assign(redirectTo);
  }
}
