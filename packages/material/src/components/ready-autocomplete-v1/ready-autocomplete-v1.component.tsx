import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  SyntheticEvent,
} from "react";
import {
  Autocomplete,
  AutocompleteProps,
  ChipTypeMap,
  TextField,
  AutocompleteInputChangeReason,
} from "@mui/material";

const DEFAULT_PAGE_SIZE = 20;

interface GetOptionsParams {
  keyword: string;
  pageIndex: number;
  pageSize: number;
}

export interface GetOptionsResult<Value> {
  items: Value[];
  totalCount: number;
}

export interface ReadyAutocompleteV1Props<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
> extends AutocompleteProps<
    Value,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
  > {
  label: string;
  getOptions: (params: GetOptionsParams) => Promise<GetOptionsResult<Value>>;
  pageSize?: number;
}

export function ReadyAutocompleteV1<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
>({
  label,
  getOptions,
  pageSize = DEFAULT_PAGE_SIZE,
  ...props
}: ReadyAutocompleteV1Props<
  Value,
  Multiple,
  DisableClearable,
  FreeSolo,
  ChipComponent
>): React.ReactNode {
  const [options, setOptions] = useState<Value[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const loadingRef = useRef(false); // prevent double-fetch on scroll
  const getOptionsRef = useRef(getOptions); // store getOptions reference
  const listboxRef = useRef<HTMLUListElement>(null); // ref to the listbox element
  const scrollPositionRef = useRef(0); // store scroll position

  // Update the ref when getOptions changes
  useEffect(() => {
    getOptionsRef.current = getOptions;
  }, [getOptions]);

  // Restore scroll position after options update
  useLayoutEffect(() => {
    if (shouldRestoreScroll && listboxRef.current) {
      listboxRef.current.scrollTop = scrollPositionRef.current;
      setShouldRestoreScroll(false);
    }
  }, [options, shouldRestoreScroll]);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      loadingRef.current = true;
      try {
        const { items, totalCount } = await getOptionsRef.current({
          keyword: inputValue,
          pageIndex: 0,
          pageSize,
        });
        setOptions(items);
        setTotalCount(totalCount);
        setPageIndex(1);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadInitialData();
  }, [pageSize]); // Only depend on pageSize

  const handleInputChange = async (
    event: SyntheticEvent<Element, Event>,
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    props.onInputChange?.(event, value, reason);
    if (reason === "input") {
      setInputValue(value);
      setPageIndex(0);
      setOptions([]);
      setTotalCount(0);
      setLoading(true);
      loadingRef.current = true;

      try {
        const { items, totalCount } = await getOptionsRef.current({
          keyword: value,
          pageIndex: 0,
          pageSize,
        });
        setOptions(items);
        setTotalCount(totalCount);
        setPageIndex(1);
      } catch (error) {
        console.error("Error loading search results:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  const handleListboxScroll = async (
    event: React.UIEvent<HTMLUListElement>,
  ) => {
    const listboxNode = event.target as HTMLUListElement;

    // Store current scroll position
    scrollPositionRef.current = listboxNode.scrollTop;

    const bottomReached =
      listboxNode.scrollTop + listboxNode.clientHeight >=
      listboxNode.scrollHeight - 20;
    if (
      bottomReached &&
      !loading &&
      !loadingMore &&
      options.length < totalCount &&
      !loadingRef.current
    ) {
      setLoadingMore(true);
      loadingRef.current = true;
      try {
        const { items, totalCount } = await getOptionsRef.current({
          keyword: inputValue,
          pageIndex,
          pageSize,
        });
        setOptions((prevOptions) => [...prevOptions, ...items]);
        setTotalCount(totalCount);
        setPageIndex((prevPageIndex) => prevPageIndex + 1);
        setShouldRestoreScroll(true);
      } catch (error) {
        console.error("Error loading more data:", error);
      } finally {
        setLoadingMore(false);
        loadingRef.current = false;
      }
    }
  };

  return (
    <Autocomplete
      {...props}
      options={options}
      loading={loading || loadingMore}
      onInputChange={handleInputChange}
      ListboxProps={{
        ...props.ListboxProps,
        ref: listboxRef,
        onScroll: handleListboxScroll,
        style: {
          maxHeight: 300,
          overflow: "auto",
          ...(props.ListboxProps?.style as any),
        },
      }}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

export default ReadyAutocompleteV1;
