export type IcpInput = { industry: string; title: string; geography: string };
export const defaultIcpInput: IcpInput = { industry: 'consumer credit', title: 'VP Collections', geography: 'US' };

export function normalizeIcpInput(input?: Partial<IcpInput>): IcpInput {
  return {
    industry: input?.industry?.trim() || defaultIcpInput.industry,
    title: input?.title?.trim() || defaultIcpInput.title,
    geography: input?.geography?.trim().toUpperCase() || defaultIcpInput.geography
  };
}
