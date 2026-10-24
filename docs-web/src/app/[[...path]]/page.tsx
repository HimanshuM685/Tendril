import { ClientShell } from "../client-shell";

type PageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function Page({ params }: PageProps) {
  const { path = [] } = await params;
  const pathname = `/${path.join("/")}`;
  return <ClientShell initialPath={pathname} />;
}
