type AuthenticatedUser = { id: string };

/** Ask the configured Supabase Auth server to validate this request's access token. */
export async function verifySupabaseAccessToken(
  getUser: (token: string) => Promise<{
    data: { user: AuthenticatedUser | null };
    error: unknown;
  }>,
  token: string,
): Promise<AuthenticatedUser> {
  const { data, error } = await getUser(token);
  if (error || !data.user?.id) throw new Error("Unauthorized: Invalid token");
  return data.user;
}
