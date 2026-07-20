import type { LoaderProps } from './type';

export const Loader = ({ loadingText }: LoaderProps) => {
  return (
    <div role="status">
      <p>{loadingText}</p>
    </div>
  );
};
