export interface AcceptError {
  code: string;
  where: string;
  got?: string;
  detail?: string;
  fix: string;
}
