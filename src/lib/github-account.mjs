export async function persistGitHubAccountCredentials(prisma, account) {
  if (
    account?.provider !== "github" ||
    !account.providerAccountId ||
    !account.access_token
  ) {
    return;
  }

  const credentialFields = [
    "access_token",
    "refresh_token",
    "expires_at",
    "token_type",
    "scope",
  ];
  const data = Object.fromEntries(
    credentialFields
      .filter((field) => account[field] !== undefined)
      .map((field) => [field, account[field]])
  );

  await prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    data,
  });
}
