'use client';

// Serialize partial writes so a slower character save cannot undo a new weapon.
let pending: Promise<void> = Promise.resolve();
let failure: Error | null = null;
export function saveProfilePatch(patch: Record<string, unknown>) {
  pending = pending.then(async () => {
    try {
      const response = await fetch('/api/auth/profile', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});
      const body = await response.json();
      if (!response.ok || !body.success) throw Error(body.error || 'Could not save equipment. Please try again.');
      failure = null;
    } catch (error) {
      failure = error instanceof Error ? error : Error('Could not save equipment.');
      window.dispatchEvent(new CustomEvent('profile-save-error',{detail:failure.message}));
    }
  });
}
export async function flushProfile() {
  await pending;
  if (failure) throw failure;
}
