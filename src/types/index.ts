export type InfoBranch = {
  name: string;
  repo: string;
  updatedAt?: string;
};

export type InfoCommit = {
  message: string;
  sha: string;
  branch:
    | {
        name: string;
      }
    | InfoBranch;
};
