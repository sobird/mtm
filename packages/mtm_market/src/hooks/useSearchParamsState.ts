/**
 * useSearchParamsState Hook
 *
 * sobird<i@sobird.me> at 2023/10/05 10:13:44 created.
 */

import { useSearchParams } from 'react-router-dom';

export default function useSearchParamsState(
  searchParamName: string,
  defaultValue: string
): readonly [searchParamsState: string, setSearchParamsState: (newState: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const acquiredSearchParam = searchParams.get(searchParamName);
  const searchParamsState = acquiredSearchParam ?? defaultValue;

  const setSearchParamsState = (newState: string) => {
    const next = Object.assign(
      {},
      [...searchParams.entries()].reduce((o, [key, value]) => ({ ...o, [key]: value }), {}),
      { [searchParamName]: newState }
    );

    setSearchParams(next);
  };

  return [searchParamsState, setSearchParamsState];
}
