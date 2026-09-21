declare module "virtual:foundry-taskgraph" {
  const meta: { available: boolean; reason?: string; recipes: { name: string; variantMap: Record<string, string[]> }[] };
  export default meta;
}
declare module "@caelos/recipes" { const recipes: Record<string, any>; export = recipes; }
declare module "@caelos/ui" { export const CaelosProvider: any; export const Surface: any; export const Heading: any; export const Text: any; export const Button: any; export const Composer: any; }
declare module "@caelos/header" { export const ApprovedChatHeader: any; }
declare module "@caelos/header-layout" { export const agentAvatarSizes: any; export const approvedHeaderLayout: any; export const approvedHeaderMotion: any; }
declare module "@caelos/styles.css";
