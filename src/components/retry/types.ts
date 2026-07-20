export type RetryProps = {
  errorMessage: string;
  retryAction: () => void | Promise<void>;
};
